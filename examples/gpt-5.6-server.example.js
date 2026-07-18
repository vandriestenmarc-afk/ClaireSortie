/** OPTIONAL SERVER-SIDE EXAMPLE — not loaded by the GitHub Pages demo.
 * Install `openai` on a trusted server and set OPENAI_API_KEY in its environment.
 * Validate model output against a schema and keep a human review step before use.
 */
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractWithGPT56(syntheticDocument) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required on the server");
  return client.responses.create({
    model: "gpt-5.6",
    input: `Extract only facts explicitly present. Every item must contain an exact source passage. Mark missing information; never infer it. Document:\n${syntheticDocument}`
  });
}
