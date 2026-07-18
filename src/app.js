import { extractPlan } from "./extractor.js";
import { SAMPLE } from "./sample.js";

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let currentPlan;
const labels = { medications: "Médicaments", appointments: "Rendez-vous & examens", actions: "Actions à domicile", warningSigns: "Signes d’alerte", uncertainties: "À faire confirmer" };

function renderItems(items) {
  if (!items.length) return '<p class="empty">Aucune information explicitement détectée.</p>';
  return items.map(x => `<article class="item"><div class="item-title"><strong>${escapeHtml(x.title)}</strong>${x.uncertain ? '<span class="tag uncertain">À confirmer</span>' : '<span class="tag">Extrait</span>'}</div><p>${escapeHtml(x.detail)}</p><blockquote class="source">${escapeHtml(x.source.passage)}</blockquote></article>`).join("");
}

function render(plan) {
  const keys = Object.keys(labels);
  const total = keys.reduce((n, key) => n + plan[key].length, 0);
  $("#result-summary").innerHTML = `<strong>${total} éléments repérés</strong><p>Tout élément ci-dessous affiche le passage exact qui le justifie. Les champs absents restent absents.</p>`;
  $("#plan-content").innerHTML = keys.map(key => `<section class="category ${key === "uncertainties" ? "category-wide" : ""}" aria-labelledby="heading-${key}"><h3 id="heading-${key}">${labels[key]} <span class="count">${plan[key].length}</span></h3>${renderItems(plan[key])}</section>`).join("");
  $("#panel-quiz").innerHTML = `<form id="quiz-form"><h3>Vérifiez ce que vous avez retenu</h3>${plan.quiz.map((q, i) => `<div class="quiz-question"><fieldset><legend>${i + 1}. ${escapeHtml(q.question)}</legend>${q.choices.map((choice, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${escapeHtml(choice)}</label>`).join("")}</fieldset><p class="feedback" id="feedback-${i}" aria-live="polite"></p></div>`).join("")}<div class="quiz-actions"><button class="button primary" type="submit">Vérifier mes réponses</button></div></form>`;
  $("#quiz-form").addEventListener("submit", event => { event.preventDefault(); plan.quiz.forEach((q, i) => { const chosen = new FormData(event.currentTarget).get(`q${i}`); const out = $(`#feedback-${i}`); out.textContent = chosen === null ? "Choisissez une réponse." : Number(chosen) === q.answer ? "Correct — confirmé par la source." : `À revoir. Source exacte : « ${q.source.passage} »`; }); });
  $("#json-output").textContent = JSON.stringify(plan, null, 2);
  $("#results").hidden = false;
}

$("#sample-button").addEventListener("click", () => { $("#medical-text").value = SAMPLE; $("#status").textContent = "Exemple fictif chargé. Vous pouvez maintenant créer le plan."; $("#medical-text").focus(); });
$("#analyze-button").addEventListener("click", () => { const text = $("#medical-text").value.trim(); if (!text) { $("#status").textContent = "Ajoutez un texte synthétique avant de continuer."; $("#status").className = "status error"; return; } currentPlan = extractPlan(text); render(currentPlan); $("#status").className = "status"; $("#status").textContent = "Plan créé localement. Vérifiez toujours le document original."; $("#results-title").focus?.(); $("#results").scrollIntoView({ behavior: "smooth" }); });
$("#export-button").addEventListener("click", () => { if (!currentPlan) return; const url = URL.createObjectURL(new Blob([JSON.stringify(currentPlan, null, 2)], { type: "application/json" })); const link = Object.assign(document.createElement("a"), { href: url, download: "clairsortie-plan.json" }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 500); });

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) { tabs.forEach(t => { const selected = t === tab; t.setAttribute("aria-selected", selected); t.tabIndex = selected ? 0 : -1; $("#" + t.getAttribute("aria-controls")).hidden = !selected; }); tab.focus(); }
tabs.forEach((tab, i) => { tab.addEventListener("click", () => selectTab(tab)); tab.addEventListener("keydown", e => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return; e.preventDefault(); const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; selectTab(tabs[next]); }); });
