# AstroAtlasI — Session Summary (2026-09-05, end of day)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).
- **GitHub**: connected today — https://github.com/CodeofForests/AstroAtlasI. `master` tracks `origin/master`; a plain `git push` from here on just works.

## What the MVP does now — Home is life-domains, not features (reworked today)
Open `mvpI/index.html` via the local dev server (see below).

- **Home**: intro is one science-grounded, curiosity-driving line — *"What were the planets doing the moment you were born? We calculate it precisely, like an astronomer..."* Below it, **"What do you want to know about?"** with four plain-text category buttons and no explanation underneath: **Myself / Relationship / My job / My health**. Clicking one is the only way to find out what it says about you — that's deliberate.
  - **Myself** → straight to the full chart (Step 3 below) — already the deepest payoff.
  - **Relationship / My job / My health** → a one-screen personalized reveal (`CONTENT.domainReveal` in `content.js`) naming a real, specific placement from the user's own chart (Venus+Moon / Midheaven+Saturn / Mars), with a "go deeper" button. My job prompts for birth time if it's missing, since it needs the Midheaven.
  - The old "Continue your journey" teaser (brightness %, day count) is **built but parked** — not shown on Home right now, per your call to revisit later. Re-enable in `app.js`'s `showTab` (commented one-liner, search "renderHomeTeaser").
- **Birth data / My chart / Journey**: unchanged from yesterday — chart wheel, flip-card strengths (now **progressively unlock** day-by-day as the journey progresses — locked cards say "Unlocks on Day N"; the wheel and exact-degree data are never locked, since that's real computed astronomy, not something to gate for suspense), 21-day loop, consent flow, Galaxy composite, real deletion.
- **My account** / **🔨 Construction Site**: unchanged — still in the header everywhere.

## Today's fixes worth remembering
- Category cards 3 & 4 used to read as near-identical ("understand someone" vs "see our connection") — now distinct: "one person" vs "us together."
- Found and fixed a same-sign content bug: when two placements share a sign (e.g. Midheaven + Saturn both in Scorpio), the domain reveal used to repeat one sentence verbatim. Now has distinct phrasing for that case.

## Technical notes
- Chart engine runs on a **free MIT-licensed astronomy library** (vendored at `mvpI/vendor/astronomy.browser.js`), standing in for the paid Swiss Ephemeris SDK. Verified against all 4 product-description regression cases.
- Everything is **browser-local storage only** — no accounts, no real server yet (intentional prototype scope).
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
- Daily Practice and Galaxy are no longer one tap from Home now that categories are life-domains — still reachable (Myself → journey button; My account → Galaxy), just not as direct. Worth a look once there's real usage.
- Earned-surprise unlock moment and dimming not-yet-reached wheel placements — both logged as follow-ons to today's progressive-reveal work.

## Picking this up tomorrow
1. Restart the dev server (command above).
2. Check the Construction Site tab (🔨 button, top of header) for the current backlog.
3. Say what you want next — a Construction Site entry gets created for anything new before it's built, so nothing gets lost.
