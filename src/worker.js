// Same-origin proxy for the arXiv API (browsers can't call it directly: no CORS headers).
// Everything else is served from the static assets.
const ARXIV = 'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:stat.ML&sortBy=submittedDate&sortOrder=descending&max_results=50';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/papers') {
      try {
        const r = await fetch(ARXIV, {
          headers: { 'User-Agent': 'Abstracted/1.0 (https://abstracted.suvadipchakraborty.workers.dev; mailto:suvadipchakraborty@gmail.com)' },
          cf: { cacheTtl: 900, cacheEverything: true }
        });
        if (!r.ok) return new Response('arXiv returned ' + r.status, { status: 502 });
        return new Response(r.body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
      } catch {
        return new Response('Could not reach arXiv', { status: 502 });
      }
    }
    return env.ASSETS.fetch(req);
  }
};
