# AstroAtlasI — Build Summary (2026-09-06)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).
- **GitHub**: https://github.com/CodeofForests/AstroAtlasI — `master` is fully pushed and in sync.
- **Shareable test link** (for 2–5 user testers): https://claude.ai/code/artifact/1add39db-6224-43e5-b802-39b071e33f63 — a single-file bundle of the prototype, published as a Claude Artifact. Regenerate after changes with `bash mvpI/build-preview.sh`, then re-publish that file to the same artifact. It's private until shared from the artifact page's Share menu. Each tester gets their own browser-local storage; nothing comes back automatically.

## Latest session — the 21-day journey, deepened (2026-09-06)
Everything below is built and verified in the running app.
- **Chart → journey onboarding.** First run shows a one-screen *"How this works"* (3 plain lines, "See my chart" the only button); the chart page demotes the journey to a quiet optional offer, not a big CTA; the Home *"Continue my journey"* teaser is fully parked (`renderHomeTeaser` returns immediately). A first-time astrology user is never dropped into "your journey" before anything explains it.
- **The journey day view now has five layers, all pointing at the same planet:** the gift/cost reading (houses now written in plain language — *"…shows up most in close one-to-one relationships (7th house)"*); a **reflection quote**; an **"In the body" cue** (where that planet tends to be felt, worded so the sensation reads as passing weather); a **practice picker** with one *suggested* practice per planet + a *"Something else…"* free-text option alongside the list; a **body log** — one-tap *what it feels like* / *where in the body* chips, each with *"something else…"* free text, plus a *"Why notice the body?"* explainer (chart names tendencies → each has a felt signature that precedes the thought → catching it is the earliest choice point).
- **Move back and forth between days** (day navigator; past days stay editable; can't skip ahead of today).
- **Day 21 payoff** = the divergence screen: the chart you were given vs. the one you made, your 21 logged choices as a dot-strip, **"what your body noticed"** (most common sensation on gift days vs. cost days vs. Week 3), the twins line, and the North Node as the direction you're growing toward. Plus *"Look back at any day"* review mode.
- **Open follow-ups** live in the 🔨 Construction Site (PLANNED): rights/attribution pass on the reflection quotes; a reading-level switch for experienced vs. new astrology users; trimming journey language for people who haven't opted in; write real hand-authored copy for one full path (start with the Sun, 12 signs × gift/cost).

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
- Journey state uses `localStorage` keys: `aa_state_v1` (chart + progress + choices), `aa_practice_day_N` / `aa_practice_note_day_N` (practice + custom text), `aa_body_day_N` (body log JSON), `aa_journey_intro_dismissed`, `aa_howitworks_seen`. Privacy → Delete everything clears them all.

## Picking this up next time
1. **Double-click `start.ps1`** (repo root) — or run it from a terminal. It pulls latest, starts the dev server on port 8533 in its own minimized window, and opens the app with a cache-busting URL.
   - Manual fallback: `powershell -NoProfile -ExecutionPolicy Bypass -File "mvpI/serve.ps1" -Port 8533` then open `http://localhost:8533/` in a **fresh tab**.
2. Check the 🔨 Construction Site tab for the current backlog — full detail on every open item lives there.
3. Say what you want next.
