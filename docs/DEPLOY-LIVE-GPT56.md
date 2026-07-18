# Deploy the live GPT-5.6 judge demo

This deployment runs the complete ClairSortie interface and the GPT-5.6 server on the same HTTPS origin. The OpenAI API key remains a server-side Render secret and is never sent to the browser or committed to GitHub.

## One-click deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/vandriestenmarc-afk/ClaireSortie)

1. Sign in to Render and connect GitHub.
2. Review the `clairsortie-gpt56` web service defined in `render.yaml`.
3. Enter `OPENAI_API_KEY` directly in Render when prompted. Never paste the key into GitHub, Devpost, the public app, or a chat.
4. Deploy the Blueprint.
5. Open the generated `https://...onrender.com` URL.
6. Confirm the page says GPT-5.6 is connected, then select **Créer avec GPT-5.6**.

## What judges can verify

- `/api/health` reports the configured model alias and whether the live server is connected.
- The interface automatically selects the GPT-5.6 mode on the hosted service.
- The result includes an OpenAI Responses API response ID, model metadata, and generation time.
- Every returned source passage is checked as an exact substring of the synthetic source document before display.
- The public judge endpoint accepts only the bundled synthetic example and caches a successful result, reducing abuse and API cost.

## Public-demo safety

The Render Blueprint sets `PUBLIC_GPT56_DEMO=true`. In this mode:

- real patient information is not accepted;
- only the bundled synthetic document can reach the OpenAI API;
- the first successful result is cached in memory;
- the API key remains in the Render environment;
- OpenAI storage is disabled in the request with `store: false`.

For private development with arbitrary synthetic documents, run the server without `PUBLIC_GPT56_DEMO=true`.
