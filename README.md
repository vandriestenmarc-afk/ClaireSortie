# ClairSortie

[![CI](https://github.com/vandriestenmarc-afk/ClaireSortie/actions/workflows/ci.yml/badge.svg)](https://github.com/vandriestenmarc-afk/ClaireSortie/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-live-123f3b)](https://vandriestenmarc-afk.github.io/ClaireSortie/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**ClairSortie turns a synthetic hospital discharge document into an evidence-linked action plan.** It separates medications, follow-up, home actions, warning signs, and missing information; every result includes the exact passage that supports it.

> **Safety:** this is a hackathon prototype, not a medical device or medical advice. Never enter real patient data or change treatment based on this software. A clinician or pharmacist must review any real-world use.

- **Live demo:** https://vandriestenmarc-afk.github.io/ClaireSortie/
- **Public video:** https://youtu.be/sGNNWfXMEEw
- **Judge quick path:** [docs/JUDGING.md](docs/JUDGING.md)

## Why this problem matters

Hospital-to-home transitions combine medication changes, follow-up, warning signs, and self-care instructions. The World Health Organization identifies medication safety during transitions of care as a priority, while AHRQ discharge guidance emphasizes medicines, warning signs, follow-up, plain language, and teach-back.

- [WHO — Medication safety in transitions of care](https://www.who.int/publications/i/item/WHO-UHC-SDS-2019.9)
- [AHRQ — IDEAL discharge planning](https://www.ahrq.gov/patient-safety/patients-families/engagingfamilies/strategy4/index.html)
- [AHRQ — Teach-back](https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/teachback.html)

ClairSortie is intentionally not a generic summary chatbot. Its product thesis is: **a discharge explanation is useful only when the user can see its evidence, its uncertainty, and what they understood.**

## Public demo

1. Open the live demo.
2. Select **Charger l’exemple**.
3. Select **Créer mon plan**.
4. Inspect each category and its **Source exacte**.
5. Open **Quiz** to test comprehension.
6. Copy, print, or export the structured plan.

The public demo runs locally in the browser, needs no credentials, sends no document to a network service, and uses synthetic data only. The separate video link opens the public YouTube presentation.

## Product experience

- five clear categories: medications, appointments, home actions, warning signs, uncertainties;
- exact source passage on every item;
- uncertainty is displayed, never silently filled;
- teach-back-inspired comprehension quiz with source-based correction;
- clear two-step sample flow, keyboard-operable tabs, reduced-motion support, mobile-first layout;
- copy, print, and JSON export;
- two engines behind one interface: deterministic local fallback and secure GPT-5.6 server mode.

## Architecture

```text
Synthetic document
       │
       ├── Public GitHub Pages ──> deterministic local extractor
       │                            no network / no credentials
       │
       └── Trusted Node server ──> GPT-5.6 Responses API
                                    strict JSON Schema
                                    store: false
                                    exact-quote validation
       │
       └──────────────> shared evidence-linked plan UI
                         quiz / copy / print / JSON
```

Key files:

- `src/extractor.js` — conservative local fallback with generic medication recognition;
- `src/app.js` — engine selection, rendering, quiz, accessibility, copy/print/export;
- `server/gpt56-server.js` — same-origin static server plus `/api/health` and `/api/extract`;
- `examples/gpt-5.6-server.example.js` — GPT-5.6 request, strict schema, validation boundary;
- `tests/` — local extraction, non-invention, request construction, injected-client end-to-end path;
- `.github/workflows/ci.yml` — syntax checks and automated tests.

## Run locally without an API key

Requires any simple static server:

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000
```

The local fallback works immediately. No npm install is required for the static demo.

## Run the integrated GPT-5.6 mode

Requires Node.js 20+ and an OpenAI API key stored only on a trusted machine:

```bash
npm ci
export OPENAI_API_KEY="your-key-in-a-secret-environment-variable"
npm run serve:gpt56
# open http://127.0.0.1:8000
```

PowerShell:

```powershell
npm ci
$env:OPENAI_API_KEY="your-key-in-a-secret-environment-variable"
npm run serve:gpt56
```

The browser calls the same-origin Node route; the key is never exposed to the browser. The UI enables the GPT-5.6 option only when `/api/health` confirms that the trusted server is configured.

For a command-line run:

```bash
npm run gpt56:demo -- examples/sample-discharge.txt
```

## How GPT-5.6 is used

The integrated server path calls the OpenAI Responses API with the `gpt-5.6` alias and medium reasoning effort. It is meaningful to the product because it performs the evidence-preserving extraction that creates the plan, rather than generating decoration or marketing copy.

The safety boundary is fail-closed:

1. the request treats the document as untrusted data and forbids following instructions inside it;
2. the model must return a strict JSON Schema;
3. every result must include a verbatim `source.passage`;
4. `validateExactPassages` rejects any quote that is not an exact substring of the original document;
5. uncertainty entries must be explicitly marked;
6. `store: false` is requested and the reference server does not intentionally retain documents.

The GitHub Pages deployment cannot safely contain an API key, so its default engine remains local. This is an intentional privacy and judge-access decision, not a claim that the public static page itself calls OpenAI.

## How Codex was used

The primary Codex build thread rebuilt the initial single-file concept into the current product foundation. Codex:

- designed the semantic, mobile-first interface and responsive CSS;
- separated sample data, extraction logic, and UI rendering into modules;
- implemented evidence-preserving extraction and visible uncertainty handling;
- added accessible tabs, the comprehension quiz, and JSON export;
- wrote the initial automated tests and documentation;
- created the initial server-side GPT-5.6 integration direction and ran the original test/static-server checks.

The connection is explicit: **Codex built the product foundation and the initial GPT-5.6 integration direction; GPT-5.6 is the secure server-side extraction engine that produces the evidence-linked plan.** The public demo remains local only because a secret API key must never be embedded in GitHub Pages.

The key human product decisions were to prioritize evidence over fluent summaries, make uncertainty a first-class output, keep the public demo credential-free, keep GPT-5.6 server-side, use synthetic data only, and require human clinical review. The final repository hardening adds the integrated server route, stricter request validation, injected-client tests, CI, and the judge path.

Evidence of the Build Week work is visible in the [merged Codex pull request](https://github.com/vandriestenmarc-afk/ClaireSortie/pull/1), timestamped commit history, and the `/feedback` Session ID supplied in Devpost.

## Tests

```bash
npm ci
npm run check
npm test
```

The suite verifies category coverage, exact source traceability, non-invention, generic medication handling, input limits, GPT-5.6 request configuration, quote rejection, uncertainty validation, and the complete model-client call path without making a network request.

## Scope and limitations

- The deterministic fallback recognizes a limited range of French discharge patterns.
- Neither engine validates clinical correctness, interactions, allergies, dosage appropriateness, or urgency.
- Absence from the plan never means absence from the document.
- The project is not validated for real patients.
- Production use requires clinical evaluation, privacy/security review, consent, audit logging, retention controls, accessibility testing, regulatory assessment, and human oversight.

See [SECURITY.md](SECURITY.md) for secret and data-handling guidance.

## License

Released under the [MIT License](LICENSE).