# ClairSortie

ClairSortie is a mobile-first healthcare **prototype** that turns a synthetic hospital discharge document into a readable, traceable action plan. Every extracted medication, appointment, home action, warning sign, and uncertainty includes the exact supporting passage.

> **Safety:** this is not a medical device or medical advice. It can miss or misclassify content and must never guide treatment without review by a qualified clinician or pharmacist. Never enter real patient data. The bundled example is wholly fictional.

## Live demo

https://vandriestenmarc-afk.github.io/ClaireSortie/

The GitHub Pages demo is intentionally local and deterministic so it can be reviewed without credentials and without sending medical text to a network service.

## Run the static demo locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step is required. Relative asset URLs and browser-native APIs keep the application compatible with static hosting.

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
- `src/extractor.js` is a deliberately conservative deterministic fallback engine. It returns five traced categories and quiz data.
- `src/app.js` renders escaped content, controls keyboard tabs and quiz feedback, and performs client-side JSON export.
- `examples/gpt-5.6-server.example.js` contains the executable GPT-5.6 server-side extraction path.
- `tests/extractor.test.js` checks category extraction, source traceability, and non-invention.
- `tests/gpt56-validation.test.js` checks that GPT-5.6 source passages are exact substrings of the supplied document.

The JSON format is intentionally small: category arrays contain `title`, `detail`, `uncertain`, and `source.passage`. Exact passages must be copied from the input rather than reconstructed.

## Testing

Requires Node.js 20 or newer:

```bash
npm install
npm test
```

For a manual accessibility review, navigate without a mouse: the skip link, controls, quiz choices, and tabs must all be reachable. Left/right arrow, Home, and End keys move among tabs. Also test at 320 px width and with reduced-motion enabled.

## GPT-5.6 implementation

ClairSortie includes a real, runnable **server-side GPT-5.6 extraction component** in `examples/gpt-5.6-server.example.js`. It uses the OpenAI Responses API with model alias `gpt-5.6`, medium reasoning effort, and a strict JSON Schema. The prompt requires evidence-only extraction and forbids inferred drugs, doses, dates, durations, locations, diagnoses, urgency levels, or recommendations.

The model output is not trusted automatically. After schema validation, `validateExactPassages` verifies that every `source.passage` is an exact substring of the original synthetic document. Any invented or paraphrased quotation causes the result to be rejected. This safety boundary has automated tests.

To run the GPT-5.6 path on a trusted server or local development machine:

```bash
npm install
export OPENAI_API_KEY="your-key-in-a-secret-environment-variable"
npm run gpt56:demo -- path/to/synthetic-document.txt
```

The API key must never be placed in browser JavaScript or committed to GitHub. The public GitHub Pages build cannot safely hold a secret, so it continues to use the deterministic local engine. The GPT-5.6 component is therefore reviewable and executable from the repository, but it is not hosted by GitHub Pages and no claim is made that the public static demo sends requests to OpenAI.

## How Codex was used

Codex rebuilt the original single-file prototype into this modular architecture. It authored the semantic HTML and responsive CSS, separated the sample, rules, and UI modules, implemented evidence-preserving extraction and uncertainty handling, added keyboard tab behavior, the comprehension quiz and JSON download, wrote the Node test suite, and prepared the documentation. Codex also produced the GPT-5.6 server integration, strict schema, exact-quotation validator, CLI runner, and validation tests, and ran the original automated tests and static-server checks.

Primary Codex work is documented in the merged pull request and the submitted `/feedback` session.

## Safety and privacy limitations

- The deterministic parser recognizes a narrow set of French phrases; absence from the plan does **not** mean absence from the source.
- Neither path validates medication appropriateness, interactions, allergies, dosage, urgency, or clinical accuracy.
- Missing information must remain missing and be surfaced as an uncertainty.
- The static demo keeps data in browser memory except when the user explicitly downloads JSON.
- Use synthetic data only. Production use would require clinical validation, security and privacy review, consent, audit logging, regulatory assessment, robust document processing, and human oversight.

## License

Released under the [MIT License](LICENSE).
