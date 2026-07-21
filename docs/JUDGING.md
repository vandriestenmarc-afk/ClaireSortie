# Judge quick path

## 60-second live GPT-5.6 path

1. Open the [live Render demo](https://clairsortie-gpt56.onrender.com/).
2. Wait briefly if the free Render service is waking up.
3. Confirm the page says GPT-5.6 is connected.
4. Select **Créer avec GPT-5.6**.
5. Inspect the five categories, exact supporting passages, and explicit uncertainties.
6. Open **Quiz** and answer one question incorrectly to see source-based feedback.
7. Use **Copier**, **Imprimer**, or **Exporter JSON**.

No judge account, installation, API key, or real patient data is required. The public endpoint accepts only the bundled synthetic example. The project owner’s API key remains on the Render server and is never sent to the browser.

The public video is available here: https://youtu.be/-oq7drrrEZk

## Credential-free fallback

If the Render service is temporarily unavailable, open the [GitHub Pages fallback](https://vandriestenmarc-afk.github.io/ClaireSortie/). It demonstrates the same evidence-linked plan, uncertainty handling, quiz, and exports with the deterministic local engine and no API call.

## Codex evidence

Codex rebuilt the initial single-file prototype into the modular, mobile-first foundation used by the submission: semantic interface, responsive CSS, evidence-preserving extraction, uncertainty handling, accessible tabs, comprehension quiz, JSON export, tests, and documentation.

- [Merged Codex pull request #1](https://github.com/vandriestenmarc-afk/ClaireSortie/pull/1)
- The `/feedback` Codex Session ID is supplied in the Devpost submission.

## GPT-5.6 evidence

The Render deployment serves the interface and the secure API from the same HTTPS origin. The UI detects `/api/health`, selects GPT-5.6 automatically, and calls `/api/extract` with the bundled synthetic sample.

The server uses the Responses API, strict JSON Schema, `store: false`, prompt-injection resistance, request-size limits, and exact-substring validation for every cited passage. The result displays the model metadata, response ID, generation time, and cache status returned by the real server path.

- [GPT-5.6 request and validation boundary](../examples/gpt-5.6-server.example.js)
- [Integrated same-origin server](../server/gpt56-server.js)
- [Render deployment configuration](../render.yaml)
- [GPT-5.6 validation tests](../tests/gpt56-validation.test.js)

## Judging-criteria map

- **Technological implementation:** Codex-built modular app, end-to-end GPT-5.6 server route, strict schema, fail-closed quote validation, automated tests, CI, and a reproducible Render deployment.
- **Design:** mobile-first interface, one-action synthetic GPT-5.6 demo, keyboard-operable tabs, visible focus, reduced motion, print view, and explicit safety states.
- **Potential impact:** focuses on medicines, follow-up, home actions, warning signs, and comprehension during the hospital-to-home transition.
- **Quality of idea:** evidence-first output, uncertainty as a first-class category, and teach-back-inspired comprehension checks rather than an untraceable summary.

## Honest scope

ClairSortie uses synthetic text only. It does not validate clinical correctness, interactions, allergies, urgency, or treatment appropriateness. Any production path requires clinician review and formal validation.