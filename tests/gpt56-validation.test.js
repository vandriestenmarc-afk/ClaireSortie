import test from "node:test";
import assert from "node:assert/strict";
import { buildGPT56Request, extractWithGPT56, extractWithGPT56Detailed, validateExactPassages } from "../examples/gpt-5.6-server.example.js";

const source = "- Médicament Alpha indiqué.\n- Suivi dans 48 heures.";
const validPlan = {
  schemaVersion: "1.0",
  generatedBy: "GPT-5.6 server companion",
  medications: [{ title: "Médicament Alpha", detail: "Indiqué", uncertain: false, source: { passage: "Médicament Alpha indiqué." } }],
  appointments: [{ title: "Suivi", detail: "Dans 48 heures", uncertain: false, source: { passage: "Suivi dans 48 heures." } }],
  actions: [],
  warningSigns: [],
  uncertainties: []
};

function injectedClient(extra = {}) {
  return {
    responses: {
      create: async request => ({
        output_text: JSON.stringify(validPlan),
        id: "resp_build_week_test",
        model: "gpt-5.6-sol",
        request,
        ...extra
      })
    }
  };
}

test("builds a strict, private GPT-5.6 Responses API request", () => {
  const request = buildGPT56Request(source);
  assert.equal(request.model, "gpt-5.6");
  assert.equal(request.store, false);
  assert.equal(request.reasoning.effort, "medium");
  assert.equal(request.text.format.strict, true);
  assert.equal(request.text.format.type, "json_schema");
  assert.match(request.instructions, /untrusted data/);
  assert.match(request.instructions, /verbatim/);
});

test("accepts exact source passages returned by GPT-5.6", () => {
  assert.equal(validateExactPassages(validPlan, source), validPlan);
});

test("rejects an invented or paraphrased passage", () => {
  const invalidPlan = structuredClone(validPlan);
  invalidPlan.medications[0].source.passage = "Médicament Alpha modifié.";
  assert.throws(() => validateExactPassages(invalidPlan, source), /not exact substrings/);
});

test("runs the complete GPT-5.6 path with an injected client", async () => {
  let receivedRequest;
  const client = {
    responses: {
      create: async request => {
        receivedRequest = request;
        return { output_text: JSON.stringify(validPlan) };
      }
    }
  };
  const plan = await extractWithGPT56(source, { client });
  assert.equal(receivedRequest.model, "gpt-5.6");
  assert.deepEqual(plan, validPlan);
});

test("returns verifiable Responses API metadata for the live judge path", async () => {
  const result = await extractWithGPT56Detailed(source, { client: injectedClient() });
  assert.deepEqual(result.plan, validPlan);
  assert.equal(result.verification.provider, "OpenAI Responses API");
  assert.equal(result.verification.model, "gpt-5.6-sol");
  assert.equal(result.verification.responseId, "resp_build_week_test");
  assert.equal(result.verification.storedByOpenAI, false);
  assert.match(result.verification.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("requires uncertainty entries to be explicitly marked", () => {
  const invalidPlan = structuredClone(validPlan);
  invalidPlan.uncertainties.push({ title: "Information", detail: "Absente", uncertain: false, source: { passage: "Médicament Alpha indiqué." } });
  assert.throws(() => validateExactPassages(invalidPlan, source), /invalid output/);
});
