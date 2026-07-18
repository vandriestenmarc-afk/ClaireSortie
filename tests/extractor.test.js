import test from "node:test";
import assert from "node:assert/strict";
import { allPassagesAreExact, extractPlan } from "../src/extractor.js";
import { SAMPLE } from "../src/sample.js";

test("extracts every required category from the synthetic example", () => {
  const plan = extractPlan(SAMPLE);
  assert.equal(plan.medications.length, 4);
  assert.equal(plan.appointments.length, 2);
  assert.equal(plan.actions.length, 2);
  assert.equal(plan.warningSigns.length, 1);
  assert.equal(plan.uncertainties.length, 2);
});

test("every extracted item contains an exact passage from the input", () => {
  assert.equal(allPassagesAreExact(extractPlan(SAMPLE), SAMPLE), true);
});

test("does not invent a dose, date, or location when none exists", () => {
  const plan = extractPlan("- Prendre rendez-vous avec le médecin.\n- Continuer Paracétamol.");
  const json = JSON.stringify(plan);
  assert.equal(plan.appointments.length, 1);
  assert.equal(plan.medications.length, 1);
  assert.doesNotMatch(json, /\bmg\b|\bg\b|202\d|hôpital/i);
});

test("recognizes a medication name that is not hard-coded", () => {
  const source = "MÉDICAMENTS\n- Commencer Doxycycline 100 mg : un comprimé le soir pendant 5 jours.";
  const plan = extractPlan(source);
  assert.equal(plan.medications.length, 1);
  assert.match(plan.medications[0].title, /Doxycycline — commencer/);
  assert.equal(plan.medications[0].source.passage, "Commencer Doxycycline 100 mg : un comprimé le soir pendant 5 jours.");
});

test("rejects non-text input and oversized documents", () => {
  assert.throws(() => extractPlan(null), /forme de texte/);
  assert.throws(() => extractPlan("x".repeat(200_001)), /200 000/);
});
