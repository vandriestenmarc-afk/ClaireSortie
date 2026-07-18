# Judge quick path

## 45-second public-demo path

1. Open the [live demo](https://vandriestenmarc-afk.github.io/ClaireSortie/).
2. Select **Lancer la démo interactive**.
3. Inspect the five categories, exact supporting passages, and explicit uncertainties.
4. Open **Quiz** and answer one question incorrectly to see source-based feedback.
5. Use **Copier**, **Imprimer**, or **Exporter JSON**.

The separate **Voir la vidéo de présentation · 1 min 59** link opens the public YouTube presentation. No account, installation, API key, or real data is required.

## GPT-5.6 path

The public GitHub Pages deployment cannot safely hold an API key. The same interface supports a secure GPT-5.6 server mode when run from the repository:

```bash
npm ci
export OPENAI_API_KEY="your-secret-key"
npm run serve:gpt56
# open http://127.0.0.1:8000
```

The UI detects `/api/health` and enables **GPT-5.6 — serveur sécurisé**. The server uses the Responses API, strict JSON Schema, `store: false`, prompt-injection resistance, a request-size limit, and exact-substring validation for every cited passage.

## Judging-criteria map

- **Technological implementation:** Codex-built modular app, deterministic fallback, end-to-end GPT-5.6 server route, strict schema, fail-closed quote validation, automated tests, CI, and JSON export.
- **Design:** clearly separated interactive demo and presentation video, mobile-first interface, keyboard-operable tabs, visible focus, reduced motion, and print view.
- **Potential impact:** focuses on medicines, follow-up, home actions, warning signs, and comprehension during the hospital-to-home transition.
- **Quality of idea:** evidence-first output, uncertainty as a first-class category, and teach-back-inspired comprehension checks rather than an untraceable summary.

## Honest scope

ClairSortie uses synthetic text only. It does not validate clinical correctness, interactions, allergies, urgency, or treatment appropriateness. Any production path requires clinician review and formal validation.