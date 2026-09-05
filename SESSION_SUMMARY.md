# AstroAtlasI — Session Summary (2026-09-05, evening pickup at 19:00)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).

## What the MVP does now — mobile-first 4-step flow (rebuilt today)
Open `mvpI/index.html` via the local dev server (see below). The old flat tab bar is gone —
it's now a linear journey with a step progress nav:
- **Step 1 — Home**: full-screen hero, "Are you ready to dive into your universe?" + CTA button. Only **My account** (and the 🔨 Construction Site button) show in the header here — deliberately minimal.
- **Step 2 — Birth data**: the entry form (pre-fills for editing if you already have a chart).
- **Step 3 — My chart**: real chart calc (Sun–Pluto, Chiron approx., lunar nodes, Placidus/Whole Sign houses, aspects) → **SVG chart wheel** → "Viewing my chart" flip-card strengths/weaknesses → "Go to my 21-day journey". **✏️ Edit** button goes back to Step 2.
- **Step 4 — Journey**: the 21-day loop (Weeks 1–2 paired gift/cost, solo Week 3 inception chart + observation mode, or Week 3 with a consenting added person).
- **My account** (top-right, every screen): opens a drawer with **People** (consent sim, real-time withdrawal), **Galaxy** (midpoint composite, brightness meter, repeat-journey), and **Privacy** (real deletion) — each has a "← Back" link into the flow. Explicitly labeled local-only, no real login yet.
- **🔨 Construction Site** (header button, next to My account, every screen): the running build tracker (planned/in-progress/completed, sortable, hide/restore, copy-prompt buttons) — kept visible everywhere on purpose, it's our shared build-tracking tool, not an end-user feature.

Returning users who already have birth data skip straight from the Home CTA to Step 3 (My chart).

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
All work is committed locally (6 commits, `git log` in the project root — not pushed anywhere, no remote configured).

## Picking this up tonight at 19:00
1. Restart the dev server (command above).
2. Check the Construction Site tab (🔨 button, top of header) for the current backlog — top item is the real-backend/accounts work, flagged in-progress since the mobile flow shipped a local-only stub of "My account".
3. Say what you want next — a Construction Site entry gets created for anything new before it's built, so nothing gets lost.
