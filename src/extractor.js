const CATEGORIES = ["medications", "appointments", "actions", "warningSigns", "uncertainties"];
const clean = line => line.replace(/^[-•]\s*/, "").trim();
const evidence = line => ({ passage: clean(line) });
const item = (title, detail, line, uncertain = false) => ({ title, detail, uncertain, source: evidence(line) });

const sectionPatterns = [
  ["medications", /^(médicaments|traitement(?: à la sortie)?|ordonnance)$/i],
  ["actions", /^(actions|à faire(?: aujourd'hui)?|consignes à domicile)$/i],
  ["appointments", /^(suivi|rendez-vous|examens?)$/i],
  ["warningSigns", /^(signes d['’]alerte|quand demander de l['’]aide|urgences?)$/i]
];

function sectionFor(line) {
  const heading = clean(line).replace(/\s*[:：]\s*$/, "");
  return sectionPatterns.find(([, pattern]) => pattern.test(heading))?.[0] || null;
}

function medicationAction(low) {
  if (/ne pas reprendre|suspendre/.test(low)) return "ne pas reprendre avant avis";
  if (/arrêter|stopper|cesser/.test(low)) return "arrêter";
  if (/commencer|débuter|initier/.test(low)) return "commencer";
  if (/continuer|poursuivre|reprendre/.test(low)) return "continuer";
  return "consigne";
}

function medicationName(line) {
  const low = line.toLocaleLowerCase("fr");
  if (low.includes("amoxicilline")) return "Amoxicilline";
  if (low.includes("paracétamol")) return "Paracétamol";
  if (low.includes("ibuprofène")) return "Ibuprofène";
  if (low.includes("anticoagulant")) return "Anticoagulant non identifié";

  const withoutVerb = clean(line)
    .replace(/^(?:commencer|débuter|initier|continuer|poursuivre|arrêter|stopper|cesser|reprendre|ne pas reprendre|suspendre)\s+/i, "")
    .replace(/^(?:le|la|les|l['’])\s*/i, "");
  const match = withoutVerb.match(/^(.+?)(?=\s+\d+(?:[.,]\d+)?\s*(?:µg|mcg|mg|g|ml|ui)\b|\s*[:;,.]|$)/i);
  const candidate = (match?.[1] || withoutVerb).replace(/\s+avant avis.*$/i, "").trim();
  return candidate || "Médicament non identifié";
}

function pushUncertainty(plan, title, detail, line) {
  const passage = clean(line);
  if (plan.uncertainties.some(entry => entry.title === title && entry.source.passage === passage)) return;
  plan.uncertainties.push(item(title, detail, line, true));
}

export function extractPlan(text) {
  if (typeof text !== "string") throw new TypeError("Le document doit être fourni sous forme de texte.");
  if (text.length > 200_000) throw new RangeError("Le document synthétique dépasse la limite de 200 000 caractères.");

  const lines = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  const plan = {
    schemaVersion: "1.0",
    generatedBy: "ClairSortie local rules",
    medications: [],
    appointments: [],
    actions: [],
    warningSigns: [],
    uncertainties: []
  };

  let section = null;
  for (const rawLine of lines) {
    const headingSection = sectionFor(rawLine);
    if (headingSection) {
      section = headingSection;
      continue;
    }

    const line = clean(rawLine);
    const low = line.toLocaleLowerCase("fr");
    if (/^(document|compte rendu|sortie du|date de sortie)/.test(low)) continue;

    const explicitlyMissing = /pas précisé|non précisé|non renseigné|inconnu|manquant/.test(low);
    const looksMedication = section === "medications" || /^(commencer|débuter|initier|continuer|poursuivre|arrêter|stopper|cesser|reprendre|ne pas reprendre|suspendre)\b/.test(low) || /amoxicilline|paracétamol|ibuprofène|anticoagulant/.test(low);

    if (looksMedication) {
      const action = medicationAction(low);
      const name = medicationName(line);
      const uncertain = explicitlyMissing || (/paracétamol/.test(low) && !/pendant|jusqu|pour \d+ jour/i.test(low));
      plan.medications.push(item(`${name} — ${action}`, line.replace(/^(?:commencer|continuer|arrêter)\s+/i, ""), rawLine, uncertain));

      if (/anticoagulant/.test(low) && explicitlyMissing) {
        pushUncertainty(plan, "Anticoagulant incomplet", "Nom, dose ou date de reprise non précisés : demander au médecin ou au pharmacien.", rawLine);
      } else if (explicitlyMissing) {
        pushUncertainty(plan, `Information incomplète — ${name}`, "Une information utile manque dans le document et doit être confirmée.", rawLine);
      }
      continue;
    }

    const looksAppointment = section === "appointments" || /rendez-vous|radiographie|scanner|consultation|contrôle|examen/.test(low);
    if (looksAppointment) {
      const title = /radiographie/.test(low) ? "Radiographie" : /scanner/.test(low) ? "Scanner" : /examen/.test(low) ? "Examen de suivi" : "Suivi médical";
      plan.appointments.push(item(title, line, rawLine, explicitlyMissing));
      if (explicitlyMissing) {
        pushUncertainty(plan, "Rendez-vous ou examen incomplet", "La date, le lieu ou une autre information doit être confirmée.", rawLine);
      }
      continue;
    }

    const looksWarning = section === "warningSigns" || /appeler|urgence|difficulté.*respirer|lèvres bleues|malaise|douleur thoracique/.test(low);
    if (looksWarning) {
      plan.warningSigns.push(item("Demander une aide urgente", line, rawLine));
      continue;
    }

    const looksAction = section === "actions" || /boire|reposer|mesurer|surveiller|pansement|marcher|peser|température/.test(low);
    if (looksAction) {
      plan.actions.push(item("Action à domicile", line, rawLine, explicitlyMissing));
      if (explicitlyMissing) pushUncertainty(plan, "Action à domicile incomplète", "La consigne doit être confirmée avant d’agir.", rawLine);
      continue;
    }

    if (explicitlyMissing) pushUncertainty(plan, "Information manquante", line, rawLine);
  }

  plan.quiz = makeQuiz(plan);
  return plan;
}

export function makeQuiz(plan) {
  const quiz = [];
  if (plan.medications?.[0]) quiz.push({
    question: "Quelle consigne concerne le premier médicament ?",
    choices: [plan.medications[0].title, "Le doubler", "Aucune consigne"],
    answer: 0,
    source: plan.medications[0].source
  });
  if (plan.appointments?.[0]) quiz.push({
    question: "Quel suivi est indiqué ?",
    choices: [plan.appointments[0].detail, "Aucun suivi", "Attendre un an"],
    answer: 0,
    source: plan.appointments[0].source
  });
  if (plan.warningSigns?.[0]) quiz.push({
    question: "Que dit le document en cas de signes d’alerte ?",
    choices: [plan.warningSigns[0].detail, "Modifier seul le traitement", "Ignorer les symptômes"],
    answer: 0,
    source: plan.warningSigns[0].source
  });
  return quiz;
}

export function allPassagesAreExact(plan, sourceDocument) {
  return CATEGORIES.every(category => (plan[category] || []).every(entry => sourceDocument.includes(entry.source.passage)));
}
