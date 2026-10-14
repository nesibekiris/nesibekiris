# Nesibe Kırış Can personal website

Latest bilingual website, prepared for Vercel. Turkish at `/`; English at `/en/`. Middleware redirects visitors outside Türkiye to English, remembers deliberate language choices and retains old `/tr/` links. Unknown country defaults to Turkish.

Vercel: import this repository, framework Other, root directory `.`, build `npm run build`, output `output`. Configuration is tracked in `vercel.json`. No dependencies are required. Set `SITE_URL` only for a custom canonical origin; otherwise the Vercel production URL is used at build.

`public/` contains the editable site. `middleware.js` performs language routing with Vercel country headers. `node scripts/test-middleware.mjs` checks routing.
