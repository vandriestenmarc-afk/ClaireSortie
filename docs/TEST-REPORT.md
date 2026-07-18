# Verification report

Verified locally with Node.js 22.16.0 and npm 10.9.2.

```text
npm ci             PASS — 0 vulnerabilities reported
npm run check      PASS — application, extractor, GPT-5.6 component and server syntax
npm test           PASS — 10 tests, 0 failures
server smoke test  PASS — static page and /api/health
```

The automated suite covers deterministic category extraction, exact evidence passages, non-invention, generic medication recognition, input limits, GPT-5.6 request construction, strict structured output, fail-closed quote validation, uncertainty validation, and the complete injected-client request path.

No live OpenAI API request was executed during this verification because no API key was placed in the test environment.
