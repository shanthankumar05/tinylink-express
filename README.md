# TinyLink — Express + MongoDB

Quick start:
1. `npm install`
2. Copy `.env.example` to `.env` and fill `MONGODB_URI`, `MONGODB_DB`, `BASE_URL`
3. `node app.js` (or `npm run dev`)
4. Open http://localhost:3000

Autograder endpoints:
- GET  /healthz
- POST /api/links
- GET  /api/links
- GET  /api/links/:code
- DELETE /api/links/:code
- GET  /:code -> 302 redirect