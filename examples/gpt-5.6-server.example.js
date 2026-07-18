import OpenAI from "openai";

const MODEL = "gpt-5.6";

const itemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "detail", "uncertain", "source"],
  properties: {
    title: { type: "string" },
    detail: { type: "string" },
    uncertain: { type: "boolean" },
    source: {
      type: "object",
      additionalProperties: false,
      required: ["passage"],
      properties: { passage: { type: "string" } }
    }
  }
};

export const clairSortieSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "generatedBy", "medications", "appointments", "actions", "warningSigns", "uncertainties"],
  properties: {
    schemaVersion: { type: "string", const: "1.0" },
    generatedBy: { type: "string", const: "GPT-5.6 server companion" },
    medications: { type: "array", items: itemSchema },
    appointments: { type: "array", items: itemSchema },
    actions: { type: "array", items: itemSchema },
    warningSigns: { type: "array", items: itemSchema },
    uncertainties: { type: "array", items: itemSchema }
  }
};

const categories = ["medications", "appointments", "actions", "warningSigns", "uncertainties"];

export function validateExactPassages(plan, sourceDocument) {
  const invalid = [];
  for (const category of categories) {
    for (const [index, entry] of (plan[category] || []).entries()) {
      const passage = entry?.source?.passage;
      if (!passage || !sourceDocument.includes(passage)) {
        invalid.push({ category, index, passage: passage || "" });
      }
    }
  }
  if (invalid.length) {
    const error = new Error("GPT-5.6 returned one or more source passages that are not exact substrings of the input document.");
    error.invalidPassages = invalid;
    throw error;
  }
  return plan;
}

export async function extractWithGPT56(syntheticDocument, { client = new OpenAI() } = {}) {
  if (typeof syntheticDocument !== "string" || syntheticDocument.trim().length < 20) {
    throw new TypeError("A non-empty synthetic discharge document is required.");
  }
  if (!process.env.OPENAI_API_KEY && client instanceof OpenAI) {
    throw new Error("OPENAI_API_KEY is required on the trusted server.");
  }

  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: "medium" },
    instructions: [
      "You are the evidence-preserving extraction engine for ClairSortie.",
      "Use only facts explicitly present in the supplied synthetic hospital discharge document.",
      "Never infer a drug, dose, date, duration, location, urgency level, diagnosis, or recommendation.",
      "Every item must include source.passage copied verbatim from the document.",
      "Put missing or ambiguous information in uncertainties and set uncertain to true.",
      "This output is for review and is not medical advice."
    ].join(" "),
    input: syntheticDocument,
    text: {
      format: {
        type: "json_schema",
        name: "clairsortie_plan",
        strict: true,
        schema: clairSortieSchema
      }
    }
  });

  if (!response.output_text) {
    throw new Error("GPT-5.6 returned no structured output.");
  }

  const plan = JSON.parse(response.output_text);
  return validateExactPassages(plan, syntheticDocument);
}
