# Abstracted
The bleeding edge of AI, one card at a time. Static vanilla JS PWA; no build step.

Deploy: push to GitHub and connect the repo to Cloudflare Workers.
Deploy command: `npx wrangler deploy` (uses wrangler.jsonc). `src/worker.js` proxies arXiv at `/api/papers`; this is required because arXiv sends no CORS headers.

Local preview: `python3 -m http.server 8080` (service workers need localhost or https).
After changing cached files, bump `V` in sw.js.
