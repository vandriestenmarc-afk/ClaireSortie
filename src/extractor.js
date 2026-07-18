const clean = line => line.replace(/^[-•]\s*/, "").trim();
const evidence = line => ({ passage: clean(line) });
const item = (title, detail, line, uncertain = false) => ({ title, detail, uncertain, source: evidence(line) });

export function extractPlan(text) {
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const plan = { schemaVersion: "1.0", generatedBy: "ClairSortie local rules", medications: [], appointments: [], actions: [], warningSigns: [], uncertainties: [] };
  for (const line of lines) {
    const low = line.toLocaleLowerCase("fr");
    if (/^(médicaments|actions|suivi|signes d'alerte)$/.test(low) || /^(document|sortie du)/.test(low)) continue;
    if (/amoxicilline/.test(low)) plan.medications.push(item("Amoxicilline — commencer", clean(line).replace(/^Commencer\s+/i, ""), line));
    else if (/paracétamol/.test(low)) plan.medications.push(item("Paracétamol — continuer", clean(line).replace(/^Continuer\s+/i, ""), line, !/pendant|jusqu|pour \d+ jour/i.test(low)));
    else if (/ibuprofène/.test(low)) plan.medications.push(item("Ibuprofène — arrêter", clean(line).replace(/^Arrêter\s+/i, ""), line));
    else if (/anticoagulant/.test(low)) {
      plan.medications.push(item("Anticoagulant non identifié — ne pas reprendre avant avis", clean(line), line, true));
      plan.uncertainties.push(item("Anticoagulant incomplet", "Nom, dose et date de reprise non précisés : demander au médecin ou au pharmacien.", line, true));
    } else if (/rendez-vous|radiographie|scanner|consultation/.test(low)) {
      plan.appointments.push(item(/radiographie/.test(low) ? "Radiographie du thorax" : "Suivi médical", clean(line), line, /pas précisé|non précisé/.test(low)));
      if (/pas précisé|non précisé/.test(low)) plan.uncertainties.push(item("Lieu du rendez-vous ou examen", "Le document ne donne pas le lieu : le faire confirmer.", line, true));
    } else if (/appeler|urgence|difficulté.*respirer|lèvres bleues|malaise/.test(low)) {
      plan.warningSigns.push(item("Demander une aide urgente", clean(line), line));
    } else if (/boire|reposer|mesurer|surveiller|pansement|marcher/.test(low)) {
      plan.actions.push(item("Action à domicile", clean(line), line));
    } else if (/pas précisé|non précisé|inconnu/.test(low)) {
      plan.uncertainties.push(item("Information manquante", clean(line), line, true));
    }
  }
  plan.quiz = makeQuiz(plan);
  return plan;
}

function makeQuiz(plan) {
  const quiz = [];
  if (plan.medications[0]) quiz.push({ question: "Quelle consigne concerne le premier médicament ?", choices: [plan.medications[0].title, "Le doubler", "Aucune consigne"], answer: 0, source: plan.medications[0].source });
  if (plan.appointments[0]) quiz.push({ question: "Quel suivi est indiqué ?", choices: [plan.appointments[0].detail, "Aucun suivi", "Attendre un an"], answer: 0, source: plan.appointments[0].source });
  if (plan.warningSigns[0]) quiz.push({ question: "Que dit le document en cas de signes d’alerte ?", choices: [plan.warningSigns[0].detail, "Modifier seul le traitement", "Ignorer les symptômes"], answer: 0, source: plan.warningSigns[0].source });
  return quiz;
}
