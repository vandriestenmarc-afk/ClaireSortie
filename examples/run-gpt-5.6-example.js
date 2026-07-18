import { readFile } from "node:fs/promises";
import { extractWithGPT56 } from "./gpt-5.6-server.example.js";

const documentPath = process.argv[2] || "examples/sample-discharge.txt";

try {
  const document = await readFile(documentPath, "utf8");
  const plan = await extractWithGPT56(document);
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
