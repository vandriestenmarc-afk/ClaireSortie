# ClairSortie

[![CI](https://github.com/vandriestenmarc-afk/ClaireSortie/actions/workflows/ci.yml/badge.svg)](https://github.com/vandriestenmarc-afk/ClaireSortie/actions/workflows/ci.yml)
[![Live GPT-5.6 demo](https://img.shields.io/badge/demo-GPT--5.6%20live-123f3b)](https://clairsortie-gpt56.onrender.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**ClairSortie turns a synthetic hospital discharge document into an evidence-linked action plan.** It separates medications, follow-up, home actions, warning signs, and missing information; every result includes the exact passage that supports it.

> **Safety:** this is a hackathon prototype, not a medical device or medical advice. Never enter real patient data or change treatment based on this software. A clinician or pharmacist must review any real-world use.

- **Live GPT-5.6 judge demo:** https://clairsortie-gpt56.onrender.com/
- **Credential-free local fallback:** https://vandriestenmarc-afk.github.io/ClaireSortie/
- **Public video:** https://youtu.be/sGNNWfXMEEw
- **Judge quick path:** [docs/JUDGING.md](docs/JUDGING.md)

## Why this problem matters

Hospital-to-home transitions combine medication changes, follow-up, warning signs, and self-care instructions. The World Health Organization identifies medication safety during transitions of care as a priority, while AHRQ discharge guidance emphasizes medicines, warning signs, follow-up, plain language, and teach-back.

- [WHO — Medication safety in transitions of care](https://www.who.int/publications/i/item/WHO-UHC-SDS-2019.9)
- [AHRQ — IDEAL discharge planning](https://www.ahrq.gov/patient-safety/patients-families/engagingfamilies/strategy4/index.html)
- [AHRQ — Teach-back](https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/teachback.html)

ClairSortie is intentionally not a generic summary chatbot. Its product thesis is: **a discharge explanation is useful only when the user can see its evidence, its uncertainty, and what they understood.**

## 60-second judge path

1. Open the [live Render demo](https://clairsortie-gpt56.onrender.com/).
2. Wait for the service to wake if Render shows a loading screen.
3. Confirm the interface says GPT-5.6 is connected.
4. Select **Créer avec GPT-5.6**.
5. Inspect the five categories, exact supporting passages, and visible uncertainties.
6. Open **Quiz**, then inspect the OpenAI response metadata in the result.

The public Render endpoint accepts only the bundled synthetic example. The API key stays in the server environment and is never exposed to the browser.

If the hosted service is temporarily unavailable, the [GitHub Pages fallback](https://vandriestenmarc-afk.github.io/ClaireSortie/) demonstrates the complete interface with the deterministic local engine and no credentials.

## Product experience

- five clear categories: medications, appointments, home actions, warning signs, uncertainties;
- exact source passage on every item;
- uncertainty is displayed, never silently filled;
- teach-back-inspired comprehension quiz with source-based correction;
- mobile-first and keyboard-operable interface;
- copy, print, and JSON export;
- two engines behind one interface: deterministic local fallback and secure GPT-5.6 server mode.

## Architecture

```text
Bundled synthetic discharge document
              │
              ├── Render HTTPS service ──> GPT-5.6 Responses API
              │                           strict JSON Schema
              │                           store: false
              │                           exact-quote validation
              │                           public sample only
              │
              └── GitHub Pages fallback ─> deterministic local extractor
                                          no API key / no network extraction
              │
              └──────────────> shared evidence-linked plan UI
                                quiz / copy / print / JSON
```

Key files:

- `src/extractor.js` — conservative local fallback with generic medication recognition;
- `src/app.js` — engine detection, rendering, quiz, accessibility, copy/print/export;
- `server/gpt56-server.js` — same-origin static server plus `/api/health` and `/api/extract`;
- `examples/gpt-5.6-server.example.js` — GPT-5.6 request, strict schema, validation boundary;
- `render.yaml` — reproducible Render deployment configuration;
- `tests/` — local extraction, non-invention, request construction, and injected-client end-to-end coverage;
- `.github/workflows/ci.yml` — syntax checks and automated tests.

## How GPT-5.6 is used

The trusted server calls the OpenAI Responses API with the `gpt-5.6` alias and medium reasoning effort. GPT-5.6 performs the evidence-preserving extraction that creates the plan; it is not used merely for decoration or marketing copy.

The safety boundary is fail-closed:

1. the request treats the document as untrusted data and forbids following instructions inside it;
2. the model must return a strict JSON Schema;
3. every result must include a verbatim `source.passage`;
4. `validateExactPassages` rejects any quote that is not an exact substring of the original document;
5. uncertainty entries must be explicitly marked;
6. `store: false` is requested;
7. the public endpoint accepts only the bundled synthetic sample;
8. the first successful public result is cached in memory to reduce repeated cost and abuse.

## How Codex was used

The primary Codex build thread rebuilt the initial single-file concept into the current product foundation. Codex:

- designed the semantic, mobile-first interface and responsive CSS;
- separated sample data, extraction logic, and UI rendering into modules;
- implemented evidence-preserving extraction and visible uncertainty handling;
- added accessible tabs, the comprehension quiz, and JSON export;
- wrote the initial automated tests and documentation;
- created the initial server-side GPT-5.6 integration direction and ran the original test/static-server checks.

The connection is explicit: **Codex built the product foundation; GPT-5.6 is the secure server-side extraction engine that produces the evidence-linked plan.**

Evidence of the Build Week work is visible in the [merged Codex pull request](https://github.com/vandriestenmarc-afk/ClaireSortie/pull/1), the timestamped commit history, and the `/feedback` Session ID supplied in Devpost.

## Run locally without an API key

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000
```

The deterministic fallback works immediately and requires no npm installation.

## Run the integrated GPT-5.6 mode

Requires Node.js 20+ and an OpenAI API key stored only on a trusted machine:

```bash
npm ci
export OPENAI_API_KEY="your-key-in-a-secret-environment-variable"
npm start
# open http://127.0.0.1:8000
```

Never place the API key in browser JavaScript, GitHub, Devpost, screenshots, or chat messages.

## Tests

```bash
npm ci
npm run check
npm test
```

The suite verifies category coverage, exact source traceability, non-invention, generic medication handling, input limits, GPT-5.6 request configuration, quote rejection, uncertainty validation, and the complete model-client call path without making a live network request.

## Scope and limitations

- The deterministic fallback recognizes a limited range of French discharge patterns.
- Neither engine validates clinical correctness, interactions, allergies, dosage appropriateness, or urgency.
- Absence from the plan never means absence from the document.
- The project is not validated for real patients.
- Production use requires clinical evaluation, privacy/security review, consent, audit logging, retention controls, accessibility testing, regulatory assessment, and human oversight.

See [SECURITY.md](SECURITY.md) for secret and data-handling guidance.

## License

Released under the [MIT License](LICENSE).
