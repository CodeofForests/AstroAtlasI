# AstroAtlasI — Session Summary (2026-09-04)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).

## What the MVP does
Open `mvpI/index.html` via the local dev server (see below) and it has 7 tabs:
- **Chart** — enter birth data → real chart calc (Sun–Pluto, Chiron approx., lunar nodes, Placidus/Whole Sign houses, aspects) → **visual SVG chart wheel** → "Viewing my chart" flip-card strengths/weaknesses → "Go to my 21-day journey". Has an **✏️ Edit** button (top-right) to update your data.
- **21-Day Journey** — Weeks 1–2 (paired gift/cost per body), solo Week 3 (inception chart + observation mode), or Week 3 with a consenting added person.
- **People** — add someone, simulated consent (accept/decline), real-time withdrawal.
- **Galaxy** — midpoint composite chart, brightness meter, repeat-journey options.
- **Privacy** — real deletion (clears localStorage).
- **🔨 Construction Site** — the running build tracker itself (planned/in-progress/completed, sortable, hide/restore, copy-prompt buttons). **This is the log of everything built and everything left to do** — check it first tomorrow.

## Technical notes
- Chart engine runs on a **free MIT-licensed astronomy library** (vendored at `mvpI/vendor/astronomy.browser.js`) standing in for the paid Swiss Ephemeris SDK. Verified against all 4 product-description regression cases.
- Everything is **browser-local storage only** — no accounts, no server yet (intentional prototype scope).
- To view it: a local static server needs to be running. Restart it with:
  ```bash
  powershell -NoProfile -ExecutionPolicy Bypass -File "mvpI/serve.ps1" -Port 8533
  ```
  then open `http://localhost:8533/` — **use a fresh browser tab**, the dev server serves aggressively-cached files otherwise.

## Known open items (full detail on the Construction Site tab)
- Content is template-generated, not final copywriting.
- Placidus houses and Chiron precision haven't been checked against a real ephemeris yet.
- No backend/accounts — needed before real two-person consent (Phase 3) is possible.
- Geo-blocking, monetization model, and the real Swiss Ephemeris license are still open.

## Git
All work is committed locally (5 commits, `git log` in the project root — not pushed anywhere, no remote configured).

## Picking this up tomorrow
1. Restart the dev server (command above).
2. Check the Construction Site tab for the current backlog.
3. Say what you want next — a Construction Site entry gets created for anything new before it's built, so nothing gets lost.
