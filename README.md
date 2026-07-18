# ClairSortie

ClairSortie is a mobile-first healthcare **prototype** that turns a synthetic hospital discharge document into a readable, traceable action plan. Every extracted medication, appointment, home action, warning sign, and uncertainty includes the exact supporting passage.

> **Safety:** this is not a medical device or medical advice. It uses simple deterministic rules, can miss or misclassify content, and must never guide treatment without review by a qualified clinician or pharmacist. Never enter real patient data. The bundled example is wholly fictional.

## Run locally

No build step or dependency is required for the demo:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

It can be deployed directly from the repository root with GitHub Pages. Relative asset URLs and browser-native APIs keep the application compatible with static hosting.

## Use

1. Select **Charger l’exemple**, or paste synthetic text.
2. Select **Créer mon plan**.
3. Review each item and its **Source exacte**, then inspect uncertainties.
4. Use the keyboard-accessible tabs to take the comprehension quiz or view structured data.
5. Select **Exporter JSON** to download the current plan.

## Architecture

- `index.html` contains semantic application structure and accessible tab relationships.
- `styles.css` provides the responsive visual system, visible focus states, reduced-motion support, and mobile-first layout.
- `src/sample.js` contains the synthetic discharge example.
- `src/extractor.js` is a deliberately conservative, deterministic rules engine. It returns five traced categories and quiz data. It does not call a remote service.
- `src/app.js` renders escaped content, controls keyboard tabs and quiz feedback, and performs client-side JSON export.
- `tests/extractor.test.js` checks category extraction, source traceability, and non-invention.

The JSON format is intentionally small: category arrays contain `title`, `detail`, `uncertain`, and `source.passage`; metadata identifies the schema and local rules generator. Exact passages are copied from the input line after removal of a list bullet only.

## Testing

Requires Node.js 20 or newer:

```bash
npm test
```

For a manual accessibility review, navigate without a mouse: the skip link, controls, quiz choices, and tabs must all be reachable. Left/right arrow, Home, and End keys move among tabs. Also test at 320 px width and with reduced-motion enabled.

## Safety and privacy limitations

- The parser recognizes a narrow set of French phrases; absence from the plan does **not** mean absence from the source.
- It does not validate medication appropriateness, interactions, allergies, dosage, urgency, or clinical accuracy.
- It never fills a missing dose, duration, date, place, or drug name. Explicit gaps in the sample become uncertainties.
- Data stays in browser memory in this static demo, except when the user explicitly downloads JSON. There is no analytics or network extraction.
- Use synthetic data only. Production use would require clinical validation, security/privacy review, consent, audit logging, robust document processing, regulatory assessment, and human oversight.

## Optional GPT-5.6 integration (separate from the demo)

`examples/gpt-5.6-server.example.js` is an illustrative **server-side-only** starting point. It is not imported by the application, is not deployed as a live API route on GitHub Pages, and the static demo makes no OpenAI calls. Never put an API key in browser JavaScript or commit one. A real integration should keep the key in a server environment variable, use schema-constrained output, validate every quote against the input, minimize retention, and require human review.

The example intentionally is not included in the app's dependencies, so the zero-install static demo remains self-contained.

## How Codex was used

Codex rebuilt the original single-file prototype into this static modular architecture. It authored the semantic HTML and responsive CSS, separated the sample/rules/UI modules, implemented evidence-preserving extraction and uncertainty handling, added keyboard tab behavior, the comprehension quiz and JSON download, wrote the Node test suite, and prepared this documentation and optional isolated integration example. Codex also ran the automated tests and local static-server checks. No patient material, external dataset, or generated medical recommendation was used; a human reviewer should inspect all code and clinical wording before any further use.

## License and review status

This repository is a proof of concept prepared for review. Add an appropriate license and governance process before redistribution or clinical research.
