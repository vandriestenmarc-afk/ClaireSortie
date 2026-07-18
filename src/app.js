import { extractPlan, makeQuiz } from "./extractor.js";
import { SAMPLE } from "./sample.js";

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const categoryLabels = {
  medications: "Médicaments",
  appointments: "Rendez-vous & examens",
  actions: "Actions à domicile",
  warningSigns: "Signes d’alerte",
  uncertainties: "À faire confirmer"
};

let currentPlan;
let gpt56Available = false;

function setStatus(message, kind = "") {
  const status = $("#status");
  status.textContent = message;
  status.className = `status${kind ? ` ${kind}` : ""}`;
}

function setBusy(busy) {
  const button = $("#analyze-button");
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
  button.innerHTML = busy ? "Analyse en cours…" : 'Créer mon plan <span aria-hidden="true">→</span>';
}

function normalizePlan(plan) {
  const normalized = { ...plan };
  for (const key of Object.keys(categoryLabels)) normalized[key] = Array.isArray(plan?.[key]) ? plan[key] : [];
  normalized.quiz = Array.isArray(plan?.quiz) ? plan.quiz : makeQuiz(normalized);
  normalized.schemaVersion ||= "1.0";
  normalized.generatedBy ||= "ClairSortie local rules";
  return normalized;
}

function renderItems(items) {
  if (!items.length) return '<p class="empty">Aucune information explicitement détectée.</p>';
  return items.map(entry => `
    <article class="item">
      <div class="item-title">
        <strong>${escapeHtml(entry.title)}</strong>
        ${entry.uncertain ? '<span class="tag uncertain">À confirmer</span>' : '<span class="tag">Extrait</span>'}
      </div>
      <p>${escapeHtml(entry.detail)}</p>
      <blockquote class="source">${escapeHtml(entry.source?.passage || "Source manquante")}</blockquote>
    </article>`).join("");
}

function renderQuiz(plan) {
  if (!plan.quiz.length) return '<p class="empty">Aucune question n’a pu être créée à partir de ce document.</p>';
  return `<form id="quiz-form"><h3>Vérifiez ce que vous avez retenu</h3>${plan.quiz.map((question, index) => `
    <div class="quiz-question">
      <fieldset>
        <legend>${index + 1}. ${escapeHtml(question.question)}</legend>
        ${question.choices.map((choice, choiceIndex) => `<label><input type="radio" name="q${index}" value="${choiceIndex}"> ${escapeHtml(choice)}</label>`).join("")}
      </fieldset>
      <p class="feedback" id="feedback-${index}" aria-live="polite"></p>
    </div>`).join("")}
    <div class="quiz-actions"><button class="button primary" type="submit">Vérifier mes réponses</button></div>
  </form>`;
}

function render(plan) {
  const keys = Object.keys(categoryLabels);
  const total = keys.reduce((sum, key) => sum + plan[key].length, 0);
  const isGPT56 = /gpt-5\.6/i.test(plan.generatedBy);

  $("#engine-note").innerHTML = isGPT56
    ? '<strong>GPT-5.6 · serveur sécurisé</strong><span>Sortie structurée puis citations vérifiées mot pour mot.</span>'
    : '<strong>Moteur local · sans réseau</strong><span>Règles prudentes pour une démonstration immédiate et privée.</span>';
  $("#result-summary").innerHTML = `<strong>${total} éléments repérés</strong><p>Chaque élément affiche le passage exact qui le justifie. Les champs absents restent absents.</p>`;
  $("#plan-content").innerHTML = keys.map(key => `
    <section class="category ${key === "uncertainties" ? "category-wide" : ""}" aria-labelledby="heading-${key}">
      <h3 id="heading-${key}">${categoryLabels[key]} <span class="count">${plan[key].length}</span></h3>
      ${renderItems(plan[key])}
    </section>`).join("");
  $("#panel-quiz").innerHTML = renderQuiz(plan);
  $("#json-output").textContent = JSON.stringify(plan, null, 2);
  $("#results").hidden = false;

  const quizForm = $("#quiz-form");
  if (quizForm) {
    quizForm.addEventListener("submit", event => {
      event.preventDefault();
      plan.quiz.forEach((question, index) => {
        const chosen = new FormData(event.currentTarget).get(`q${index}`);
        const output = $(`#feedback-${index}`);
        output.textContent = chosen === null
          ? "Choisissez une réponse."
          : Number(chosen) === question.answer
            ? "Correct — confirmé par la source."
            : `À revoir. Source exacte : « ${question.source.passage} »`;
      });
    });
  }

  $("#results-title").focus();
  $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadSample() {
  $("#medical-text").value = SAMPLE;
  setStatus("Exemple fictif chargé. Vous pouvez maintenant créer le plan.", "ok");
  $("#medical-text").focus();
}

async function extractWithServer(document) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch("api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Le serveur GPT-5.6 n’a pas pu analyser ce document.");
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function analyze() {
  const text = $("#medical-text").value.trim();
  if (!text) {
    setStatus("Ajoutez un texte synthétique avant de continuer.", "error");
    return;
  }

  const mode = $("#analysis-mode").value;
  setBusy(true);
  setStatus(mode === "gpt56" ? "Analyse sécurisée avec GPT-5.6…" : "Analyse locale en cours…");
  try {
    const rawPlan = mode === "gpt56" ? await extractWithServer(text) : extractPlan(text);
    currentPlan = normalizePlan(rawPlan);
    render(currentPlan);
    setStatus(mode === "gpt56" ? "Plan créé avec GPT-5.6 et citations vérifiées." : "Plan créé localement. Vérifiez toujours le document original.", "ok");
  } catch (error) {
    const message = error?.name === "AbortError" ? "Le serveur GPT-5.6 a dépassé le délai d’attente." : error.message;
    setStatus(message || "Une erreur est survenue pendant l’analyse.", "error");
  } finally {
    setBusy(false);
  }
}

function planAsText(plan) {
  const sections = Object.entries(categoryLabels).map(([key, label]) => {
    const entries = plan[key].map(entry => `- ${entry.title}: ${entry.detail}\n  Source: “${entry.source.passage}”`).join("\n");
    return `${label}\n${entries || "- Aucune information explicitement détectée."}`;
  });
  return `ClairSortie — plan traçable\nMoteur: ${plan.generatedBy}\n\n${sections.join("\n\n")}\n\nPrototype — ne remplace pas un professionnel de santé.`;
}

async function copyPlan() {
  if (!currentPlan) return;
  const text = planAsText(currentPlan);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  setStatus("Plan copié dans le presse-papiers.", "ok");
}

function exportJson() {
  if (!currentPlan) return;
  const blob = new Blob([JSON.stringify({ ...currentPlan, sourceDocumentIncluded: false }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: "clairsortie-plan.json" });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function detectGPT56Server() {
  try {
    const response = await fetch("api/health", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.gpt56) return;
    gpt56Available = true;
    const option = $('#analysis-mode option[value="gpt56"]');
    option.disabled = false;
    option.textContent = `GPT-5.6 — serveur sécurisé (${data.model})`;
    $("#mode-help").textContent = "Le serveur sécurisé est connecté. Les sorties GPT-5.6 sont structurées et chaque citation est vérifiée mot pour mot avant affichage.";
  } catch {
    // Expected on the public GitHub Pages deployment.
  }
}

$("#sample-button").addEventListener("click", loadSample);
$("#analyze-button").addEventListener("click", analyze);
$("#demo-button").addEventListener("click", async () => {
  $("#analysis-mode").value = "local";
  $("#medical-text").value = SAMPLE;
  $("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  await analyze();
});
$("#copy-button").addEventListener("click", copyPlan);
$("#print-button").addEventListener("click", () => window.print());
$("#export-button").addEventListener("click", exportJson);
$("#analysis-mode").addEventListener("change", event => {
  if (event.target.value === "gpt56" && !gpt56Available) event.target.value = "local";
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach(candidate => {
    const selected = candidate === tab;
    candidate.setAttribute("aria-selected", selected);
    candidate.tabIndex = selected ? 0 : -1;
    $("#" + candidate.getAttribute("aria-controls")).hidden = !selected;
  });
  tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next]);
  });
});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
detectGPT56Server();
