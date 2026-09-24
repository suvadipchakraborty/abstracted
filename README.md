# Abstracted
The bleeding edge of AI, one card at a time. Static vanilla JS PWA; no build step.

Deploy: push to GitHub, then either
- Cloudflare Pages: framework preset "None", build command empty, output directory `/`.
- Cloudflare Workers (abstracted.suvadipchakraborty.workers.dev): connect the repo, deploy command `npx wrangler deploy` (uses wrangler.jsonc).

Local preview: `python3 -m http.server 8080` (service workers need localhost or https).
After changing cached files, bump `V` in sw.js.
