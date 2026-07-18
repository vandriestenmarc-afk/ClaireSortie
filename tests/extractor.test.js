import test from "node:test";
import assert from "node:assert/strict";
import { extractPlan } from "../src/extractor.js";
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
  const plan = extractPlan(SAMPLE);
  for (const key of ["medications", "appointments", "actions", "warningSigns", "uncertainties"])
    for (const entry of plan[key]) assert.ok(SAMPLE.includes(entry.source.passage), `${key}: ${entry.source.passage}`);
});

test("does not invent a dose, date, or location when none exists", () => {
  const plan = extractPlan("- Prendre rendez-vous avec le médecin.\n- Continuer Paracétamol.");
  const json = JSON.stringify(plan);
  assert.equal(plan.appointments.length, 1);
  assert.equal(plan.medications.length, 1);
  assert.doesNotMatch(json, /\bmg\b|\bg\b|202\d|hôpital/i);
});
