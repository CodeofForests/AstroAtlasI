# AstroAtlasI — Build Summary (2026-09-07, end of day)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).
- **GitHub**: https://github.com/CodeofForests/AstroAtlasI — `master` fully pushed and in sync (last commit `f31a5d0`).
- **Shareable test link** (team review / 2–5 testers): **https://claude.ai/code/artifact/68a1d4ae-1d2a-4e44-aaed-1ccb67d38dfd** — a single-file bundle of the prototype, published as a Claude Artifact.
  - Regenerate after changes: `bash mvpI/build-preview.sh`, then re-publish `mvpI/preview.html` to the **same** artifact URL.
  - *(The earlier `…/1add39db-…` link is superseded — use `68a1d4ae`.)*
  - Private until shared from the artifact page's **Share** menu (per person, or org-wide).
  - **Feedback loop**: testers leave **comment threads on the page**. A comment reaches a Claude Code session (to triage / fix / log) only if they reply with **"Send to Claude"** or `@claude`; plain comments still collect and can be pulled later. Nothing typed into the app comes back — feedback = comments only.

## Today's work (2026-09-07) — all built, verified in the running app, pushed

Roughly five passes, each its own commit:

**1. Earned-surprise + gifts up front + "feel alive"** (`dd90fec`)
- **Earned-surprise moment.** First time a reveal opens it gets a one-time marked moment: on the chart step a tile plays a scale/glow **pop** + gold badge (staggered for several at once) + a *"✦ N new reveals just opened up"* banner + toast; on the Galaxy tab the brightness bar glows the first time it crosses 25/50/75/100%. State: `cycle.seenUnlocks` + `cycle.brightnessMilestone`, reset on repeat, cleared on delete. Fires only while its panel is on screen; honours `prefers-reduced-motion`.
- **All seven strength gifts show from the first visit** (team feedback: gating them all left a wall of padlocks). Only each pair's **Week-2 cost half** stays paced (`idx + 8`).
- **Interactive chart wheel** — tap/keyboard-select a planet → its aspect lines light, every other planet + line dims, a caption under the wheel names it (*"Moon in Pisces 15.6° · House 5 — 5 major aspects lit above"*). Wheel assembles in once.
- **Journey sky** — the Home starfield gains one bright star per completed cycle day (deterministic; accumulates).
- **Step transitions** + **tactile press** on every tap target. All motion respects reduced-motion.

**2. Journey overview + review + export + lighter day** (`8b0eb93`)
- **Journey map** — a *"The whole journey"* card at the top of the Journey tab: three labelled weeks × seven day cells (done / today / upcoming), tappable, + what Day 21 gives you.
- **Preview the destination** — *"Preview where this lands"* opens the shape of the Day-21 report before finishing.
- **One-page review** — *"Review all 21 days"*: every day's theme + status + practice on one scroll; tap a row to open it.
- **Export** — the finished report has *"Save / print report"* (print stylesheet) and *"Copy summary"* (plain text). **Structural facts only** — both charts, days complete, North Node — **never the free-text notes** (§8–9). On-screen note says so.

**3. People honesty + My Journey in the drawer** (`1dd162d`)
- The People tab now states plainly it's a **local, no-server simulation** — nothing is emailed. Invite form gains a **"Their email"** field (stored, not sent); button relabelled *"Add & preview the invite"*; invited card shows *"nothing emailed, this is a local simulation"*. Guard: can't add a person whose name matches the account owner.
- **"My Journey"** (→ `#cycle`) added to the My account drawer, above People / Galaxy / Privacy.

**4. Practices as Mind / Speech / Body + weekly horary bonus** (`4337cd4`)
- **Practices regrouped** into the three doors — Mind (thought), Speech (word), Body (deed/sensation). Trimmed set, four new Speech practices; per-planet "suggested" still highlights. `practicePicker` renders one labelled group per category.
- **Horary bonus** (new `js/horary.js`). A **"Strong thoughts"** card on the Journey tab: log the moment a strong thought strikes (note, datetime, place — defaults to birth place). Once a week's seven days are all complete, one logged moment can be put — as a question — to a **horary chart cast for that exact moment**, read in the descriptive **Goldstein-Jacobson** style: querent (Asc + traditional ruler + Moon), quesited (house of the chosen matter + its ruler + occupants), applying vs separating, translation of light, the Moon's next aspect / void-of-course, considerations before judgement. **Never a yes/no.** One question per week. State: top-level `thoughts` + `horaryAsked` in `storage.js`.

**5. Consistent daily sequence; dropped "Today's choice"** (`f31a5d0`)
- Each day now has one fixed sequence: **1. A line to sit with** (the quote, its own card) → **2. Today's practice** (Mind/Speech/Body) → **3. How the body feels** (the *"In the body"* cue nested inside the body-log card). The old *"Quote, body cue & body log"* collapsible is gone — all three are visible peers.
- **The daily choice-fork is removed.** Its Day-21 payoff (*"the 21 choices you logged"* card + dot-strip) is removed too.
- **Twins argument is now a one-time statement**, not a daily nag: on the pre-Day-1 bridge screen, and reworked as a standalone capstone on Day 21 (no longer leaning on a choices tally).
- `s.cycle.choices` / `STORE.recordChoice` / `CONTENT.experimentFor` left in place — re-adding the fork (perhaps sparser) is a small job, logged as PLANNED.

## Earlier sessions (context)
- **2026-09-06** — the 21-day journey deepened: chart→journey onboarding (*"How this works"* first-run, journey demoted on the chart page); the somatic layer (body cue, one-tap body log, *"why notice the body?"*, Day-21 body pattern); day navigation (back/forth, past days editable, can't skip ahead); Day-21 divergence screen; *"Look back at any day"* review mode.
- **2026-09-05** — mobile-first 4-step flow rebuild; curiosity Home (question hook, life-domain categories with per-domain personalised reveals, science-not-esoteric framing); no-commitment skeptic teaser (birth date only → your single tightest-orb aspect).

## The Home screen — designed for curiosity, not a feature menu
- **Intro line:** *"What were the planets doing the moment you were born? We calculate it precisely, like an astronomer — then turn it into real insights and small daily habits, made for you."*
- **"What do you want to know about?"** — four plain-text categories, no explanation: **Myself, Relationship, My job, My health**. Clicking is the only way to find out what it says about you. *Myself* → full chart; the other three → a one-screen personalised reveal from a real placement (Venus+Moon / Midheaven+Saturn / Mars).
- **"Try a free 10-second reading"** — skeptic teaser, birth date only, nothing saved. Reveals the visitor's tightest-orb aspect; carries the date into the full form.
- **Journey sky** — completed-day stars accumulate in the hero background.

## The core flow (Steps 2–4)
- **Birth data** → real chart calc: Sun–Pluto, Chiron (approx.), lunar nodes, Placidus/Whole Sign houses, Ptolemaic aspects; verified against all 4 product-spec regression cases.
- **My chart** → **interactive** SVG wheel (tap a planet to light its aspects) + collapsible *"Exact degrees / Aspects"* + flip-card strengths: **all seven gift readings show from the start; only the Week-2 cost half is paced**. The wheel and raw data are never locked.
- **Journey** — the 21-day loop. Landing view is the **journey map**; then the **horary bonus** for any finished week, the **strong-thoughts** log, then today's day view (Quote → Practice → Body). Weeks 1–2 paired gift/cost, solo Week 3 (inception chart + observation mode) or Week 3 with a consenting added person. A newly-unlocked cost reveal triggers the earned-surprise moment.
- **My account** drawer → **My Journey**, People (consent sim, real-time withdrawal), Galaxy (composite chart, brightness meter with threshold celebration), Privacy (real deletion).

## Held for later (deliberately not built)
- **Named-expert "knowledge lens" per category** (Lynn Koiner + Pema Chödrön / Harville Hendrix / a yoga teacher / Naval Ravikant) — legal/endorsement risk before a signed partnership; architecture already supports swapping a real name in per category (content change, not rebuild).
- The old *"continue your journey"* Home teaser — built, parked, one line to re-enable.

## Technical notes
- Chart engine: free MIT-licensed `mvpI/vendor/astronomy.browser.js`, standing in for the paid Swiss Ephemeris SDK.
- Browser-local storage only — no accounts, no backend (intentional prototype scope).
- `localStorage`: `aa_state_v1` (chart + progress + `cycle.choices` [unused for now] + `cycle.seenUnlocks` + `cycle.brightnessMilestone` + top-level `thoughts` + `horaryAsked`); `aa_practice_day_N` / `aa_practice_note_day_N`; `aa_body_day_N` (JSON); `aa_journey_intro_dismissed`, `aa_howitworks_seen`, `aa_house_system`. Privacy → *Delete everything* clears them all.
- `js/horary.js` — new module; loaded in `index.html` and `build-preview.sh` after `chart-wheel.js`.
- `window.APP_TOAST` exposed from `app.js` for `js/ui.js` (separate IIFE).
- Git identity **is** configured (`user.name = Lindsey`, `user.email = lindsey.lin.germany@gmail.com`).

## Backlog — where to start tomorrow
Full detail on every item is in the 🔨 **Construction Site** tab (`mvpI/data.js`, `PLANNED` array, newest first). Near-term, roughly in priority order:
1. **Decide if "Today's choice" comes back** (parked at your request — maybe sparser, a few times a week).
2. **Horary depth pass** — tighten applying/separating, the Moon's next-aspect timing, add essential-dignity, "collection of light". All descriptive framing stays.
3. **Thought log — see past weeks' entries** (currently only the current week is shown in the card).
4. **Reduce felt repetition (deeper)** — weekly rhythm where days 7/14/21 are shorter "week close" reflections, or a user-set lighter/fuller mode.
5. **Confirm the export boundary** — is "structural facts only, no notes" the right line? Offer a real PDF/image instead of browser print?
6. **Further motion polish** — aspect lines drawing themselves in, scroll parallax, word-by-word headline reveal.

Then the "explore more" batch (new-lens cycles, cycle memory, solar return, transits, sharing ×3, measuring change ×2), then the older content/infra items (real delineation copy, quote rights pass), then Phase-0 blockers (Swiss Ephemeris license, backend + accounts, China geo-block, monetization).

## Picking this up next time
1. **Double-click `start.ps1`** (repo root) — pulls latest, starts the dev server on port 8533 in its own minimised window, opens the app with a cache-busting URL.
   - Manual fallback: `powershell -NoProfile -ExecutionPolicy Bypass -File "mvpI/serve.ps1" -Port 8533` then open `http://localhost:8533/` in a **fresh tab**.
2. Check the 🔨 Construction Site tab (or the list above) for the backlog.
3. After code changes: `bash mvpI/build-preview.sh`, then re-publish `mvpI/preview.html` to the artifact link above.
4. Say what you want next.
