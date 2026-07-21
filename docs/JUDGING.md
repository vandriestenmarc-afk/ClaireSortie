# Judge quick path

## 60-second public-demo path

1. Open the [live demo](https://vandriestenmarc-afk.github.io/ClaireSortie/).
2. Select **Charger l’exemple**.
3. Select **Créer mon plan**.
4. Inspect the five categories, exact supporting passages, and explicit uncertainties.
5. Open **Quiz** and answer one question incorrectly to see source-based feedback.
6. Use **Copier**, **Imprimer**, or **Exporter JSON**.

No account, installation, API key, or real data is required. The separate **Regarder la vidéo de présentation** link opens the public YouTube video; it is not an application demo control.

## Codex evidence

Codex rebuilt the initial single-file prototype into the modular, mobile-first foundation used by the submission: semantic interface, responsive CSS, evidence-preserving extraction, uncertainty handling, accessible tabs, comprehension quiz, JSON export, tests, and documentation.

- [Merged Codex pull request #1](https://github.com/vandriestenmarc-afk/ClaireSortie/pull/1)
- The `/feedback` Codex Session ID is supplied in the Devpost submission.

## GPT-5.6 path

The public GitHub Pages deployment cannot safely hold an API key. The same interface supports a secure GPT-5.6 server mode when run from the repository:

```bash
npm ci
export OPENAI_API_KEY="your-secret-key"
npm run serve:gpt56
# open http://127.0.0.1:8000
```

The UI detects `/api/health` and enables **GPT-5.6 — serveur sécurisé**. The server uses the Responses API, strict JSON Schema, `store: false`, prompt-injection resistance, a request-size limit, and exact-substring validation for every cited passage.

- [GPT-5.6 request and validation boundary](../examples/gpt-5.6-server.example.js)
- [Integrated same-origin server](../server/gpt56-server.js)
- [GPT-5.6 validation tests](../tests/gpt56-validation.test.js)

## Judging-criteria map

- **Technological implementation:** Codex-built modular app, deterministic fallback, end-to-end GPT-5.6 server route, strict schema, fail-closed quote validation, automated tests, CI, and JSON export.
- **Design:** mobile-first interface, clear two-step synthetic demo, keyboard-operable tabs, visible focus, reduced motion, print view, and explicit safety states.
- **Potential impact:** focuses on medicines, follow-up, home actions, warning signs, and comprehension during the hospital-to-home transition.
- **Quality of idea:** evidence-first output, uncertainty as a first-class category, and teach-back-inspired comprehension checks rather than an untraceable summary.

## Honest scope

ClairSortie uses synthetic text only. It does not validate clinical correctness, interactions, allergies, urgency, or treatment appropriateness. Any production path requires clinician review and formal validation.
