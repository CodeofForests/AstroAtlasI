# AstroAtlasI — Build Summary (2026-09-06)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).
- **GitHub**: https://github.com/CodeofForests/AstroAtlasI — `master` is fully pushed and in sync.

## The Home screen — designed for curiosity, not a feature menu
- **Intro** (one science-grounded line): *"What were the planets doing the moment you were born? We calculate it precisely, like an astronomer — then turn it into real insights and small daily habits, made for you."*
- **"What do you want to know about?"** — four plain-text categories, deliberately no explanation underneath: **Myself, Relationship, My job, My health**. Clicking is the only way to find out what it says about you.
  - **Myself** → the full chart (deepest payoff).
  - **Relationship / My job / My health** → a one-screen personalized reveal pulled from a real, specific chart placement (Venus+Moon / Midheaven+Saturn / Mars), with a "go deeper" button. Fixed a bug where same-sign placements repeated a sentence verbatim.
- **"Try a free 10-second reading"** — a no-commitment skeptic teaser: birth date only, no account, nothing saved. Reveals the visitor's single tightest-orb aspect (their most exact, most specific chart fact) — e.g. *"Your Mercury and Mars are in conjunction, only 0.02° from exact."* Carries the date into the full form if they continue.

## The core flow (Steps 2–4)
- **Birth data** → real chart calc: Sun–Pluto, Chiron (approx.), lunar nodes, Placidus/Whole Sign houses, Ptolemaic aspects, verified against all 4 product-spec regression cases.
- **My chart** → SVG chart wheel + collapsible "Exact degrees / Aspects" pills + flip-card Strengths/Weaknesses that **unlock progressively** as the 21-day journey advances (locked cards say "Unlocks on Day N"; the wheel and raw chart data are never locked — that's real astronomy, not withheld for suspense).
- **Journey** → the 21-day loop: Weeks 1–2 paired gift/cost, solo Week 3 (inception chart + observation mode), or Week 3 with a consenting added person.
- **My account** drawer → People (consent sim, real-time withdrawal), Galaxy (composite chart, brightness meter), Privacy (real deletion).

## Held for later (deliberately not built)
- **Named-expert "knowledge lens" per category** (Lynn Koiner + Pema Chödrön for Myself, Harville Hendrix for Relationship, a yoga teacher for Health, Naval Ravikant for Job) — genuinely good idea, but attaching a real person's name before they've agreed is a real legal/endorsement risk and would undercut the "science, not esoteric" positioning. The architecture already supports swapping a real name in per category once a partnership is signed — that'll be a content change, not a rebuild.
- The old "continue your journey" teaser (brightness %, day count) — built, parked, one line to re-enable.

## Technical notes
- Chart engine: a free MIT-licensed astronomy library (vendored, `mvpI/vendor/astronomy.browser.js`), standing in for the paid Swiss Ephemeris SDK.
- Browser-local storage only — no accounts, no real backend yet (intentional prototype scope).
- To view: start the dev server, then open in a **fresh browser tab** (aggressive caching otherwise):
  ```bash
  powershell -NoProfile -ExecutionPolicy Bypass -File "mvpI/serve.ps1" -Port 8533
  ```
  → `http://localhost:8533/`

## Picking this up next time
1. Restart the dev server (command above).
2. Check the 🔨 Construction Site tab for the current backlog — full detail on every open item lives there.
3. Say what you want next.
