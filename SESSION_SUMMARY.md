# AstroAtlasI — Build Summary (2026-09-07)

## What exists now
- **[astroatlas-product-description-v3.md](astroatlas-product-description-v3.md)** — the product spec.
- **[RELEASE_PLAN.md](RELEASE_PLAN.md)** — phased build plan, target end date **30 Sep 2027**, China geo-blocked (location-only, not birthplace).
- **[mvpI/](mvpI/)** — a working clickable MVP prototype (vanilla HTML/CSS/JS, no build step, no backend).
- **GitHub**: https://github.com/CodeofForests/AstroAtlasI — `master` is fully pushed and in sync.
- **Shareable test link** (for team review / 2–5 testers): **https://claude.ai/code/artifact/68a1d4ae-1d2a-4e44-aaed-1ccb67d38dfd** — a single-file bundle of the prototype, published as a Claude Artifact.
  - Regenerate after changes with `bash mvpI/build-preview.sh`, then re-publish `mvpI/preview.html` to the **same** artifact URL.
  - *(The earlier link `…/1add39db-…` is superseded — it couldn't be updated cleanly after a long gap, so a fresh artifact was published. Use the `68a1d4ae` one.)*
  - Private until shared from the artifact page's **Share** menu (per person, or org-wide).
  - **Feedback loop**: testers can leave **comment threads directly on the page**. A comment reaches a Claude Code session (to be triaged / fixed / logged) only if they reply on the thread with **"Send to Claude"** or `@claude`. Plain comments still collect on the page and can be pulled later.
  - Each tester gets their own browser-local storage; nothing they type into the app comes back — feedback = comments only.

## Latest session — earned-surprise, gifts up front, "feel alive" pass (2026-09-07)
Everything below is built and verified in the running app; committed as `dd90fec`.

- **Earned-surprise moment.** The first time a reveal opens it now gets a one-time marked moment instead of quietly appearing.
  - *Chart step:* a newly-available tile plays a scale/glow **pop** with a gold **"Just unlocked" / "Cost revealed"** badge, staggered when several land at once, plus a **"✦ N new reveals just opened up — your journey earned it"** banner and a toast; the card scrolls itself into view.
  - *Galaxy tab:* the brightness bar glows and shows **"✦ Your sky just crossed 25/50/75/100%"** the first time it passes each quarter.
  - State: `cycle.seenUnlocks` (`["gift:Mars","cost:Venus",…]`) + `cycle.brightnessMilestone` in `storage.js` — both reset by `repeatCycle`, cleared by delete-everything, so a repeat journey replays the surprises. Fires only while its panel is on screen; honours `prefers-reduced-motion` with a static highlight.
- **All seven strength gifts show from the first visit.** Team-review feedback: gating every gift left a first visit with only a wall of padlocks and no payoff. Now every gift reading renders in full immediately; **only each pair's Week-2 cost half stays paced** (unlocks on that body's `idx + 8` day), so a limitation still never lands before its strength. The wheel and exact positions were always fully visible.
- **"Make it feel alive" pass** (kept minimalist — motion is only ever feedback or wayfinding):
  - **Interactive chart wheel.** Each planet is a focusable group; tapping / keyboard-selecting one **lights its aspect lines, dims every other planet and line**, and updates a caption under the wheel (*"Moon in Pisces 15.6° · House 5 — 5 major aspects lit above"*). Tap again or tap empty space to clear. Aspect lines carry `data-a`/`data-b`; larger invisible hit targets for mobile; the wheel assembles in once (rotate + fade).
  - **Journey sky.** The Home starfield gains one bright star for every completed cycle day (deterministic scatter so they stay put and only accumulate), the newest arriving with a flare. Progress you can see as light, no number.
  - **Step transitions.** Each step fades and lifts in when it becomes active.
  - **Tactile press.** Every tappable surface springs back slightly on `:active`.
  - All four respect `prefers-reduced-motion`.
- **Construction Site backlog additions** (`data.js`, from the explore-more discussion): second/third cycle through a new lens (outer planets / houses / tightest aspects); cycle memory (prior answers beside new); yearly solar-return check-in; transits layer (Phase 5); share one insight card; send-a-friend tightest aspect; post-Week-3 shared dynamic (no compatibility score); reflect change back to the user; team-side "did it work" signal; further motion polish.

## Prior session — the 21-day journey, deepened (2026-09-06)
- **Chart → journey onboarding.** First run shows a one-screen *"How this works"* (3 plain lines, "See my chart" the only button); the chart page demotes the journey to a quiet optional offer, not a big CTA; the Home *"Continue my journey"* teaser is parked (`renderHomeTeaser` returns immediately).
- **The journey day view has five layers, all pointing at the same planet:** the gift/cost reading (houses in plain language); a **reflection quote**; an **"In the body" cue**; a **practice picker** with one suggested practice per planet + a *"Something else…"* free-text option; a **body log** — one-tap *what it feels like* / *where in the body* chips, each with *"something else…"* free text, plus a *"Why notice the body?"* explainer.
- **Move back and forth between days** (day navigator; past days stay editable; can't skip ahead of today).
- **Day 21 payoff** = the divergence screen: the chart you were given vs. the one you made, your 21 logged choices as a dot-strip, **"what your body noticed"** (gift days vs. cost days vs. Week 3), the twins line, and the North Node as the direction you're growing toward. Plus *"Look back at any day"* review mode.
- **Open follow-ups** in the 🔨 Construction Site (PLANNED): rights/attribution pass on the reflection quotes; reading-level switch for experienced vs. new astrology users; trimming journey language for people who haven't opted in; write real hand-authored delineation copy.

## The Home screen — designed for curiosity, not a feature menu
- **Intro** (one science-grounded line): *"What were the planets doing the moment you were born? We calculate it precisely, like an astronomer — then turn it into real insights and small daily habits, made for you."*
- **"What do you want to know about?"** — four plain-text categories, no explanation underneath: **Myself, Relationship, My job, My health**. Clicking is the only way to find out what it says about you.
  - **Myself** → the full chart (deepest payoff).
  - **Relationship / My job / My health** → a one-screen personalized reveal pulled from a real, specific chart placement (Venus+Moon / Midheaven+Saturn / Mars), with a "go deeper" button.
- **"Try a free 10-second reading"** — a no-commitment skeptic teaser: birth date only, no account, nothing saved. Reveals the visitor's single tightest-orb aspect. Carries the date into the full form if they continue.
- **Journey sky** (new 2026-09-07): completed-day stars accumulate in the hero background.

## The core flow (Steps 2–4)
- **Birth data** → real chart calc: Sun–Pluto, Chiron (approx.), lunar nodes, Placidus/Whole Sign houses, Ptolemaic aspects, verified against all 4 product-spec regression cases.
- **My chart** → **interactive** SVG chart wheel (tap a planet to light its aspects) + collapsible "Exact degrees / Aspects" pills + flip-card Strengths/Weaknesses: **all seven gift readings show from the start; only the Week-2 cost half of each pair is paced** to that body's journey day. The wheel and raw chart data are never locked — that's real astronomy, not withheld for suspense.
- **Journey** → the 21-day loop: Weeks 1–2 paired gift/cost, solo Week 3 (inception chart + observation mode), or Week 3 with a consenting added person. A newly-unlocked cost reveal triggers the earned-surprise moment.
- **My account** drawer → People (consent sim, real-time withdrawal), Galaxy (composite chart, brightness meter with threshold-crossing celebration), Privacy (real deletion).

## Held for later (deliberately not built)
- **Named-expert "knowledge lens" per category** (Lynn Koiner + Pema Chödrön for Myself, Harville Hendrix for Relationship, a yoga teacher for Health, Naval Ravikant for Job) — good idea, but attaching a real person's name before they've agreed is a legal/endorsement risk and would undercut the "science, not esoteric" positioning. The architecture supports swapping a real name in per category once a partnership is signed — a content change, not a rebuild.
- The old "continue your journey" teaser (brightness %, day count) — built, parked, one line to re-enable.

## Technical notes
- Chart engine: a free MIT-licensed astronomy library (vendored, `mvpI/vendor/astronomy.browser.js`), standing in for the paid Swiss Ephemeris SDK.
- Browser-local storage only — no accounts, no real backend yet (intentional prototype scope).
- Journey state uses `localStorage` keys: `aa_state_v1` (chart + progress + choices + `cycle.seenUnlocks` + `cycle.brightnessMilestone`), `aa_practice_day_N` / `aa_practice_note_day_N` (practice + custom text), `aa_body_day_N` (body log JSON), `aa_journey_intro_dismissed`, `aa_howitworks_seen`, `aa_house_system`. Privacy → Delete everything clears them all.
- `window.APP_TOAST` is exposed from `app.js` so `js/ui.js` (a separate IIFE) can raise the shared toast for earned-surprise moments.

## Picking this up next time
1. **Double-click `start.ps1`** (repo root) — or run it from a terminal. It pulls latest, starts the dev server on port 8533 in its own minimized window, and opens the app with a cache-busting URL.
   - Manual fallback: `powershell -NoProfile -ExecutionPolicy Bypass -File "mvpI/serve.ps1" -Port 8533` then open `http://localhost:8533/` in a **fresh tab**.
2. Check the 🔨 Construction Site tab for the current backlog — full detail on every open item lives there.
3. After code changes, regenerate the shareable bundle: `bash mvpI/build-preview.sh`, then re-publish `mvpI/preview.html` to the artifact link above.
4. Say what you want next.
