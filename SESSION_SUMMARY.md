# AstroAtlasI — Build Summary (2026-09-08, end of day)

## MVP v1 — FINALIZED (2026-09-08)

`mvpI/` is the first MVP: the browser-local, no-backend clickable prototype that RELEASE_PLAN §11
scoped for the first release. It is feature-complete and verified end-to-end.

- **Regression:** all four product-spec cases pass (`mvpI/test.html`) — TZ offsets, the Zhuhai
  degeneracy pair flagged near-identical, Placidus cusps monotonic and self-consistent. Sun–Pluto +
  mean nodes match reality.
- **Full click-through:** real birth-data form → chart → How this works → journey intro → Day-1
  practice+body card → horary cast → Day-21 report + review-all → People / Galaxy / Privacy /
  Construction Site → Start over from Day 1. **Zero console errors.**
- **Chiron disabled** — its approximate model was 60–170° off real data; removed from the engine and
  every view. Re-enables with Swiss Ephemeris.
- **Shareable test link (MVP v1):** https://claude.ai/code/artifact/6f2d6437-d155-4a80-b9ce-f9adf37e0e6c
  — private; share it from the artifact page's Share menu (per person or org-wide). Rebuild with
  `bash mvpI/build-preview.sh` + re-publish `mvpI/preview.html` (details below).

**Not in MVP v1 (Phase 0+, needs decisions/purchases from Lindsey):** Swiss Ephemeris pro license
(~CHF 750) + integration, backend + accounts (replacing localStorage), China geo-block, monetization.

---

## Today's work (2026-09-08) — built, verified in the running app

**Calm pass (P0)** — design goal: the app should leave you *settled*, not stimulated. Root cause was
two emotional targets fighting (earlier "feel alive / playful" pass vs. now "peace"). A calm pass,
not a redesign:
- **Daily loop = one screen.** Journey map + horary + thought log moved off the day view into an
  opt-in **"Your journey"** overview (`Your journey →` link; `← Back to today` returns). Fresh Day 1
  on mobile ≈ 1.7 screens of scroll, one primary action, 2 accent elements.
- **Practice card.** Body note folds behind one "Note how it felt" disclosure instead of unfurling
  on selection.
- **Motion gentle by default.** `<html data-motion>` + a Gentle/Lively toggle in the account
  drawer; gentle silences the reveal/celebration layer (unlock pop, gold burst, brightness glow,
  star-arrival) and dims the sky. `prefers-reduced-motion` still wins.
- **Closing beat.** "Mark today complete" → an optional paced-breath circle + "One slow breath…" +
  **"That's today"**; lands on "▽ That's today. Come back tomorrow." — no %/star.
- **Copy.** Chart "…and the shadow each one casts" (was "…and what it costs"); "Your strengths, and
  their shadows"; progress note shortened; thought-log / horary phrasing eased.
- **A11y.** `--text-faint` lifted to clear 4.5:1; global `:focus-visible` ring; roomier touch
  targets on coarse pointers.
- Verified: regression passes; full click-through + all tabs + motion toggle, zero console errors.
  P1/P2 logged (2-screen bridge, session-end feeling check, radiogroup semantics, "just keep the
  practice" mode, collapse practice categories).

**MVP v1 finalize pass** — Chiron fully disabled (engine + wheel + degrees table + aspects +
composite); `chartCard` "Exact degrees (N)" count fixed to match rendered rows; regression suite +
full click-through run clean; `test.html` de-Chironed; Construction Site "Chiron" item updated to
"disabled, re-enable with Swiss Ephemeris".

**Reframed 21-day intro line + expanded the plain-language toolkit**
- "How this works" row 3 now reads (≤30 words): *"Your chart is your life map: planets carrying
  energy until you use it. We're here to experience, create, share love. You always choose. These
  21 days activate what's yours."* Logistics (5 min/day, never resets) still on the journey-intro
  card and the "Why 21 days" glossary entry.
- **Toolkit:** GLOSSARY's one-line "Sign"/"House" became **"The 12 signs"** and **"The 12 houses"**,
  each listing all twelve with a one-phrase gloss; new **"Horary chart"** entry. `glossaryCard()`
  renders an optional `list` as an indented sub-list — same collapsible "New here?" toolkit already
  on the Journey tab, Day-21 screen, and journey intro.

**Horary — depth pass on the Goldstein-Jacobson judgement (`js/horary.js`)**
- **Applying / separating:** instantaneous longitude rate (1-minute central difference — the
  vendored engine has no velocity term), traditional moiety-sum orbs, and days-to-perfection from
  relative speed. Reveal: "going by their speeds they'd line up in about N days".
- **Moon's next aspect:** 30-min stepping (one ephemeris sample per step) to bracket a perfection,
  then ~32× bisection to the minute; earliest-in-step wins; capped at 3.5 days. Reveal now says
  "very soon / in about N hours / N days" and names the sign a void Moon moves into.
- **Essential dignity:** domicile / exaltation / detriment / fall / peregrine per significator,
  shown as one plain sentence ("on home ground", "a guest of honour", "far from home"…).
- **Collection of light:** a slower planet both significators apply to is now detected and rendered,
  distinct from translation.
- **Retrograde + stationary** off the same instantaneous rate; also cazimi / combust / under-the-
  beams solar conditions and a void-of-course "consideration".
- ~26 ms per cast. Verified every path fires (applying, translation, collection, retro, stationary,
  cazimi, VOC) across a spread of dates; no console errors. Still descriptive only — no yes/no.

**Horary reveal in plain words + a horary intro before Day 1 + "Start over from Day 1"**
- **Plain-language horary.** The weekly reveal dropped all craft terms (querent, quesited,
  Ascendant, ruler, house numbers, applying/separating, translation of light, void of course,
  combust, via combusta, "radical"). New `HOUSE_PLAIN` / `PLANET_PLAIN` maps in `js/ui.js`; the four
  blocks are now "The star that means you" / "What happens next" / "The star that means what you
  asked about" / "How the two are getting on". Degrees are gone from the prose (the wheel still
  shows them). `js/horary.js` `radical()` notes and the retrograde/combust flags reworded the same
  way. Still descriptive only — never a yes/no.
- **Horary intro before Day 1.** `journeyIntro()` gains an "Once a week: a strong thought" card so a
  first-timer knows the weekly bonus exists and what it does.
- **Restart.** New `STORE.restartJourney()` — zeroes the journey (completed days, practice/body
  notes, this cycle's thought log + horary question) but keeps the birth chart and the cycle number.
  Surfaced as a quiet "Start over from Day 1" button under "Continue the journey" on the My chart
  page, behind a confirm.
- **Chased the "reading 'year'" console error — no bug.** Injected a top-level `window.onerror` and
  loaded the app in a fresh tab (bare, and with a mid-journey state reloaded straight onto `#cycle`):
  zero console output, every tab renders. The error was a **stale console-buffer entry** from an
  earlier debug seed that passed a malformed profile (`{date,time}` instead of `{wall}`) to
  `computeChart` — one legitimate throw that stuck in the readout. Real form-entered data always
  builds `{wall:{year,…}}`, so the user flow was never affected. Nothing changed in app code.

**Practice + body merged into one card; the practice is a choice; Trungpa line as the spirit**
- First-time-user problem: "Today's practice" and "How the body feels" sat side by side with no
  stated link, no shared vocabulary, and an ambiguous "fill this in when?" The cue was keyed to the
  day's planet, not the practice you picked.
- **Merge (Tier 3).** The standalone "How the body feels" card is gone. The body note is now the
  second half of the **Today's practice** card and only appears **once a practice is chosen**: a
  "then" connector ("Do it today — now, or whenever it fits. Then come back and note what your body
  did…"), a practice-keyed cue ("While you do it"), the one-tap quality/place rows, the optional
  note, and "Why notice the body?". `dayView` is now two cards (quote, practice), not three.
- **Practice is a choice.** The per-planet "Suggested — X" line is demoted to a soft nudge ("Your
  chart leans toward Speech today — … Follow it, or pick your own"). Still nothing pre-selected.
- **Cue follows the practice**, not the planet: new `content.js` `practiceBodyCue()` / `PRACTICE_BODY_CUE`
  (Mind = head/jaw/breath, Speech = throat/chest, Body = wherever it lands) + a Week-3 variant.
  `bodyCueForDay` / `PLANET_BODY_CUE` still exported, no longer shown.
- **The spirit.** New `PRACTICE_SPIRIT` (the Chögyam Trungpa "complete acceptance and openness…"
  passage + a one-line gloss). Full quote on a "The practice behind all of it" card in the journey
  intro; the gloss echoed at the top of the practice card. "Why notice the body?" glossary text
  rewritten to name all three links: chart names a tendency → practice engages it → body shows the
  signature.
- **Day-21.** `bodyPatternCard` now pairs the most-chosen practice door with the body reading per
  phase ("On your gift days you leaned on Body practices, and the body most often felt 'tight',
  around the chest"); heading → "What you practised, what your body did". `journeyReviewAll` rows
  show the practice **label** (not the raw key) + "· felt <quality>".
- Storage keys unchanged (`aa_practice_day_N`, `aa_body_day_N`), so past journeys and the review
  list still read. Verified end-to-end in the running app — pick/deselect a practice, Day-21 report,
  review list — no console errors.

---

# AstroAtlasI — Build Summary (2026-09-07, end of day)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).
- **GitHub**: https://github.com/CodeofForests/AstroAtlasI — `master` fully pushed and in sync (last commit `f31a5d0`).
- **Shareable test link** (team review / 2–5 testers): **https://claude.ai/code/artifact/6f2d6437-d155-4a80-b9ce-f9adf37e0e6c** — MVP v1 single-file bundle of the prototype, published as a Claude Artifact (2026-09-08).
  - Regenerate after changes: `bash mvpI/build-preview.sh`, then re-publish `mvpI/preview.html`. From THIS session, republishing the same file keeps this URL. From a fresh session, pass this URL as `url` (and be ready to read the prior bundle — mostly the vendored astronomy lib — to clear the safety gate), or publish a new artifact and supersede this link here.
  - *(Superseded: `…/1add39db-…` and `…/68a1d4ae-…` — use `6f2d6437`.)*
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
- **Journey** — the 21-day loop. Landing view is the **journey map**; then the **horary bonus** for any finished week, the **strong-thoughts** log, then today's day view (Quote → Practice, where Practice now carries its own "then notice the body" step — see 2026-09-08 above). Weeks 1–2 paired gift/cost, solo Week 3 (inception chart + observation mode) or Week 3 with a consenting added person. A newly-unlocked cost reveal triggers the earned-surprise moment.
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
