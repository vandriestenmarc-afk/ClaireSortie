import test from "node:test";
import assert from "node:assert/strict";
import { validateExactPassages } from "../examples/gpt-5.6-server.example.js";

const source = "- Continuer Paracétamol 500 mg.\n- Rendez-vous dans 48 heures.";

const validPlan = {
  medications: [{ title: "Paracétamol", detail: "Continuer", uncertain: false, source: { passage: "Continuer Paracétamol 500 mg." } }],
  appointments: [{ title: "Suivi", detail: "Dans 48 heures", uncertain: false, source: { passage: "Rendez-vous dans 48 heures." } }],
  actions: [],
  warningSigns: [],
  uncertainties: []
};

test("accepts exact source passages returned by GPT-5.6", () => {
  assert.equal(validateExactPassages(validPlan, source), validPlan);
});

test("rejects a passage invented or paraphrased by GPT-5.6", () => {
  const invalidPlan = structuredClone(validPlan);
  invalidPlan.medications[0].source.passage = "Prendre du Paracétamol 500 mg.";
  assert.throws(() => validateExactPassages(invalidPlan, source), /not exact substrings/);
});
