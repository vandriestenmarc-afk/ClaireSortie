# Security and clinical-safety policy

ClairSortie is a hackathon prototype, not a medical device. Do not use it with real patient data or to make treatment decisions.

## Secrets

- Keep `OPENAI_API_KEY` only in a trusted server environment variable.
- Never place a key in browser JavaScript, GitHub Pages, screenshots, logs, or commits.
- The public static demo sends no document text to a network service.

## Data handling

The reference server processes one request in memory and does not intentionally persist document text. Production use would still require a full privacy, security, retention, consent, regulatory, and clinical-governance review.

## Reporting

Report a security or safety concern through a private GitHub security advisory when available. Do not include patient information, credentials, or other sensitive data in a report.
