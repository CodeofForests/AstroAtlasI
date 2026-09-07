/*
 * Source of truth for the Construction Site tracker.
 * Convention: new PLANNED entries are inserted at the BEGINNING of the array.
 * This file is edited by the assistant as part of the working method agreed
 * with the user — every new request becomes (or updates) a PLANNED entry here,
 * inProgress is set true while being built, then the entry moves to COMPLETED.
 *
 * User-driven state (hidden items, priority stars) is NOT stored here — it
 * lives in localStorage so it never requires a code change (see app.js).
 */

const PLANNED = [
  {
    title: "\"Today's choice\" (daily fork) — removed for now, decide if it comes back",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Parked at Lindsey's request",
    desc:
      "The per-day 'Today's choice' fork (lean with / against the grain of your chart) was " +
      "removed from the day view (see COMPLETED). Its data path still exists: STORE.recordChoice " +
      "and s.cycle.choices are untouched, and CONTENT.experimentFor / week3Fork / BODY_EXPERIMENT " +
      "/ WEEK3_FORKS are still there — re-adding is roughly: restore choiceFork() in js/ui.js and " +
      "one line in dayView, plus the 'choices you logged' card + choice-strip in divergenceView " +
      "and the reportSummaryText line. Decide whether it returns (maybe sparser — a few times a " +
      "week rather than daily) once there's feedback on the lighter day.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Horary reveal — depth pass on the Goldstein-Jacobson judgement",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "First version shipped — refine the astro logic",
    desc:
      "The weekly horary bonus is in (see COMPLETED). js/horary.js is an honest but prototype-" +
      "level implementation of the 'cast + highlight' read: significators (Asc ruler, Moon, " +
      "quesited-house ruler), applying/separating between rulers, translation of light, the " +
      "Moon's next aspect, and considerations before judgement. Known rough edges to tighten " +
      "later: (1) applying/separating is a two-sample finite difference (now vs +1h) — fine " +
      "for direction, not for exact orbs or speed; (2) the Moon's next-aspect search steps " +
      "every 2h and detects perfection by sign-change or gap-collapse — reliable for " +
      "sextile/square/trine, patched for conjunction/opposition, but not timed to the hour; " +
      "(3) no essential-dignity scoring (Goldstein-Jacobson uses it lightly — detriment/fall/" +
      "exaltation of the significators); (4) 'collection of light' by a slower planet isn't " +
      "detected, only translation; (5) retrograde is derived (lon decreasing over a day) " +
      "rather than read from the engine. All descriptive, never a yes/no — that part is by " +
      "design and stays.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Thought log — let the user see past weeks' logged thoughts",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "The 'Strong thoughts' card on the Journey tab shows only the current week's entries " +
      "(the week you'd be logging into). Once a week is done its thoughts still appear inside " +
      "that week's horary card, but there's no plain way to scroll back through everything " +
      "logged across the journey. Add a small week switcher or an 'all thoughts' view. Low " +
      "urgency — the live-logging case works.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Reduce felt repetition in the 21-day loop (deeper restructure)",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Partly done - light pass shipped, structural options open",
    desc:
      "Tester feedback: the day-to-day loop feels repetitive - same five layers every day, " +
      "some days just clicked through. A light pass shipped (see COMPLETED: per-day arc line, " +
      "quote/body-cue/body-log folded into a collapsible after day 2, journey map for " +
      "orientation). Deeper options still open for a decision: (a) a weekly rhythm where days " +
      "7/14/21 are shorter 'week close' reflections that feel different from the other days; " +
      "(b) letting the user set a lighter or fuller daily mode; (c) varying the reading " +
      "structure between Week 1 and Week 2 rather than the same gift/cost paragraph shape. " +
      "Needs a call on how far to go before more content work.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Confirm what the exported / printed report may include",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Decision for Lindsey",
    desc:
      "The Day-21 report can now be printed (print stylesheet) and copied as a plain-text " +
      "summary (see COMPLETED). The boundary currently applied, to stay inside product " +
      "description sec 8-9: the export holds only STRUCTURAL facts - the chart you were given, " +
      "the chart you made, the with-grain/against-grain choice tally, the body-pattern " +
      "summary, and the North Node direction. It deliberately excludes every free-text note, " +
      "practice note and body-log entry - those never leave the device. Confirm this is the " +
      "right line, or say if the exported report should include more (e.g. the per-day theme " +
      "list) or less. Also open: whether to offer a real PDF/image file rather than relying " +
      "on the browser's print-to-PDF.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Further motion polish (aspect lines drawing in, scroll parallax, headline reveal)",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started — leftovers from the 'make it feel alive' pass",
    desc:
      "The core feel-alive layer shipped (see COMPLETED: interactive wheel, journey sky, step " +
      "transitions, tactile press). Remaining smaller ideas from that discussion, each " +
      "optional: (1) aspect lines on the wheel literally draw themselves once on first render " +
      "(stroke-dashoffset) rather than fading in — held back because several aspect styles " +
      "already use dash patterns and would need per-line handling; (2) parallax the two " +
      "background starfield layers at slightly different speeds on scroll; (3) the key " +
      "placement line in a reveal ('Mars in Leo, 7th house') fades in word-by-word instead of " +
      "all at once — headline only, never body copy. All must respect prefers-reduced-motion.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    title: "Second/third cycle: same chart, new lens (outer planets, houses, or tightest aspects)",
    status: "open",
    effort: "large",
    inProgress: false,
    statusLabel: "Not started — the 'what's left after 21 days' question",
    desc:
      "After the 21-day journey there is currently only 'repeat the same cycle'. Idea from the " +
      "explore-more discussion: additional finite cycles that re-read the SAME birth chart " +
      "through a different cut, no new astronomy needed. Candidates: (a) the outer planets " +
      "(Uranus/Neptune/Pluto/Chiron) framed as 'the parts of you that move slowly'; (b) a " +
      "walk through the 12 houses ('your 4th - home and roots'); (c) your 3-5 tightest-orb " +
      "aspects as 'two parts of you in tension' (the engine already finds the tightest one " +
      "for the skeptic teaser). Mostly a content build (content.js) plus a cycle-picker; the " +
      "chart engine and journey scaffolding are reused. Pick one to prototype first.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Cycle memory: show your previous cycle's answers beside the new ones",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "Repeat-cycle already exists (STORE.repeatCycle bumps cycle.number and clears " +
      "completedDays/choices/practice keys). Idea: instead of wiping the slate, carry the " +
      "prior cycle's daily fork choices and body-log entries forward read-only, and on each " +
      "day of cycle 2+ show 'last time on Day 5 you leaned with the pattern - this time?'. " +
      "Makes change visible by direct comparison rather than a score. Needs the repeat flow " +
      "to archive the old cycle instead of clearing it, and the day view to render a 'last " +
      "time' strip. Ties into the measuring-change item below.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Yearly solar-return check-in",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "A light recurring touchpoint for people who finished a cycle and want an ongoing " +
      "reason to come back: once a year, around the user's birthday, cast the chart for the " +
      "exact solar-return moment and offer one short reflective session on 'the year's " +
      "theme'. Ceremonial, not a full cycle. Reuses computeChart; needs a date trigger and " +
      "one new content template. Cheaper than the transits layer and a good stepping stone " +
      "toward it.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Transits layer: what the sky is doing now vs. your birth chart",
    status: "open",
    effort: "large",
    inProgress: false,
    statusLabel: "Not started - Phase 5 (needs time-based regression work)",
    desc:
      "The birth chart is fixed; the sky keeps moving. A weekly or monthly note - 'Saturn is " +
      "sitting on your natal Moon right now; here is the tension that names' - is what turns " +
      "the product from a one-off into a habit, and is the real answer to 'is there more " +
      "after 21 days'. Already named as Phase 5 in RELEASE_PLAN.md. Not near-term: time-based " +
      "positions compound the DST / historical-offset problems Phase 0 solved for birth " +
      "charts, so it needs its own regression set, and it should wait until the real Swiss " +
      "Ephemeris is in. Logged here so the roadmap conversation has a card for it.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Share one insight card as an image or link",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started - privacy-sensitive",
    desc:
      "From the 'share my insights with others' discussion. Let a user publish ONE gift/cost " +
      "card of their choosing as an image or a link - 'this is what I learned about myself'. " +
      "Stays inside the privacy rules: Weeks 1-2 journal and all reflection text remain " +
      "private forever with no export path (product description sec 8-9); only a single card " +
      "the user deliberately chooses to share leaves the app, and only their own - never " +
      "another person's chart or a Galaxy view (enforced at the share layer, not just hidden " +
      "in the UI). Needs a card-to-image renderer and a share sheet.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    title: "Send a friend their tightest aspect (gift + referral hook)",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "The no-commitment skeptic teaser (birth date only, reveals the single tightest-orb " +
      "aspect) but pointed outward: generate it for a friend from their birth date and send " +
      "it as a small gift, with a link back into the app. Low-commitment hook that doubles as " +
      "organic referral. Reuses the teaser's engine path; needs a 'for someone else' entry " +
      "point and a shareable result page. No data stored about the friend unless they " +
      "themselves start.",
    dest: { tab: "teaser", subtab: null, scrollTo: null }
  },
  {
    title: "Post-Week-3 shared dynamic + one mutual practice (no compatibility score)",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started - needs two real consenting accounts (Phase 3)",
    desc:
      "Once two people have both completed Week 3 with each other (mutual consent already " +
      "modelled in People/Galaxy), offer a single shared reflection: the ONE dynamic both " +
      "charts point at, plus one small practice each person could do. Never a compatibility " +
      "percentage or a ranking - that is a stated red line (product description sec 8, sec 10). " +
      "One actionable thing, mutual. Depends on the real two-account backend (see the backend " +
      "item) since it needs both people's real consent state, not the local simulation.",
    dest: { tab: "galaxy", subtab: null, scrollTo: null }
  },
  {
    title: "Reflect change back to the user (before/after in their own words, cross-cycle trends)",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started - design decision needed on wording",
    desc:
      "The product's goal is 'unconscious -> conscious', so success shown to the user must be " +
      "a mirror, never a grade (no scores/rankings - product description sec 8). Pieces: (1) Day 1 " +
      "asks one open sentence - 'how do you tend to [the Sun theme]?'; Day 21 shows it back " +
      "and asks again, both on screen. (2) One repeated question at each cycle's end - 'since " +
      "starting, have you caught yourself mid-pattern and chosen differently? never / once or " +
      "twice / often' - one tap, stored, becomes a gentle line over cycles. (3) Cross-cycle " +
      "views of the existing data: the daily-fork strip and the 'what your body noticed' " +
      "trend, cycle over cycle, stated as observation not improvement. Builds on the Day-21 " +
      "divergence screen that already exists.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Team-side signal that the product actually works",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started - partly blocked on the real backend",
    desc:
      "Aggregate measurement for the team (not shown to users as a grade, so it can be more " +
      "quantitative). Strongest signal: do people start a second cycle (return rate). Then: " +
      "population-level shift in the daily-fork distribution across cycles (are people moving " +
      "toward conscious choice), Week 3 completion rate (the known drop-off), and the opt-in " +
      "Day-1/Day-21 self-description pairs as qualitative material. Optional research rigour: " +
      "a short opt-in self-report (a few items adapted from an existing self-reflection / " +
      "insight or mindfulness scale) at cycle start and end, kept out of the main flow. Needs " +
      "the real backend and an analytics decision - framing: primary success is 'people " +
      "report catching themselves more often' + they come back; do not build it as if 21 " +
      "days can prove lasting behaviour change.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Rights / attribution pass on the daily reflection quotes before launch",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started — added with the daily-quote feature",
    desc:
      "js/content.js now carries 7 PLANET_QUOTE + 7 WEEK3_QUOTE lines shown one per journey " +
      "day. Placeholder curation: some are paraphrased or commonly-misattributed short forms " +
      "(e.g. the Frankl 'space between stimulus and response' line, the Durant/Aristotle " +
      "'excellence is a habit'). Before any public release: verify each wording and " +
      "attribution against a real source, confirm short-quotation use is fine for the ones " +
      "still in copyright (Jung, C. S. Lewis, Pema Chödrön, Covey, Ram Dass), and let Lindsey " +
      "swap in her own selection — the structure (quoteForDay(day, week)) stays the same, " +
      "it's a content edit.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    title: "Trim remaining journey language for users who haven't opted in (step-nav label, Galaxy brightness)",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started — leftover edge from the first-run context work",
    desc:
      "The first-run \"How this works\" screen and the demoted journey offer on the chart " +
      "page are in (see COMPLETED). Still surfacing journey framing before a user opts in: " +
      "(1) the top step-nav always shows a 4th step \"Journey\" even for someone who has " +
      "never started one — consider hiding or greying it until aa_journey_intro_dismissed is " +
      "set; (2) the Galaxy tab leads with the brightness meter and \"21 days\" copy " +
      "regardless. Low urgency now that the two loud spots (Home teaser, chart-page CTA) are " +
      "handled — worth a pass when touching navigation next.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    title: "Named-expert \"knowledge lens\" per category (Lynn Koiner, etc.) — hold until partnerships are real",
    status: "open",
    effort: "large",
    inProgress: false,
    statusLabel: "Held — needs real agreements first",
    desc:
      "User's idea in chat: attach a named, famous guide to each category's approach — Lynn " +
      "Koiner + Pema Chödrön for Myself, Harville Hendrix for Relationship, a yoga teacher " +
      "(Travis) for Health, Naval Ravikant for Job — so the app reads as curated by known " +
      "experts, not generic. Recommended holding real names until actual partnership " +
      "agreements exist: using a living public figure's name/framework to imply endorsement " +
      "or involvement they haven't agreed to is a real legal exposure (right of publicity, " +
      "implied endorsement) and risks reading as unverified guru name-dropping — working " +
      "against the \"science, not esoteric\" positioning already built. Agreed path: build a " +
      "distinct, unnamed \"lens\" per category now (e.g. a psychodynamic lens for Relationship, " +
      "a stoic/practical lens for Job) so the structure supports swapping in a real name and " +
      "citing their specific method the moment an agreement (e.g. with Lynn Koiner, who the " +
      "user knows personally) is actually signed — a content change at that point, not an " +
      "architecture change."
  },
  {
    title: "Bring Daily Practice / Galaxy back onto Home now that categories are life-domains",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "Side effect of switching Home's four categories to life-domains (Myself / Relationship " +
      "/ My job / My health): the old direct entry points \"I want a daily practice\" and \"I " +
      "want to see us together\" (Galaxy) are gone from Home. Both are still reachable — the " +
      "21-day journey via Myself → \"Go to my 21-day journey\", Galaxy via My account → Galaxy, " +
      "or via the Relationship reveal's \"Add someone to go deeper\" once someone's added — but " +
      "neither is one tap from Home anymore. Worth a look once real usage shows whether that " +
      "matters."
  },
  {
    title: "Revisit the Home \"continue your journey\" teaser",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Parked — user said not relevant right now, revisit later",
    desc:
      'User in chat: "please remove the teaser journey one because now it\'s not relevant. ' +
      'We will be with it later." The teaser itself (Day N of 21 / brightness % / today\'s ' +
      "focus hint / Continue button) is still fully built in js/ui.js as renderHomeTeaser() " +
      "— app.js's showTab just no longer calls it on the home screen, with a comment pointing " +
      "at the one line to uncomment when it's wanted back. Nothing was deleted, so re-enabling " +
      "is a one-line change once there's a reason to revisit it."
  },
  {
    title: "Dim not-yet-reached bodies on the chart wheel itself",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Mostly superseded — revisit only for the cost-gating cue",
    desc:
      "Original idea: dim the wheel glyphs for bodies whose interpretation is still locked, " +
      "to match the strengths-tile reveal. Two things changed since: (1) all seven gift " +
      "readings now show from the first visit (see COMPLETED), so there are no locked gift " +
      "bodies to dim; (2) the wheel is now interactive (see COMPLETED) — selecting a planet " +
      "already dims every other body. What's left of this idea: a faint cue on a body whose " +
      "Week-2 cost half isn't unlocked yet. Low value now; only worth doing if the cost " +
      "gating needs to be more visible on the wheel."
  },
  {
    title: "Move from browser-local storage to a real backend + accounts",
    status: "open",
    effort: "large",
    inProgress: true,
    statusLabel: "In progress — mobile 4-step flow first, account stays local-only for now",
    desc:
      "User asked for a clear mobile-first user journey (Home tagline → birth data → chart " +
      "→ journey) with a 'My account' entry point. Built the 4-step flow with My account as a " +
      "local-only stub (People/Galaxy/Privacy behind it, no real login) — this item now tracks " +
      "the remaining real-backend work: actual accounts, cross-device persistence, and the true " +
      "two-account consent exchange (Phase 3) that a localStorage-only account can't do. Needed " +
      "before Phase 3 (real consent-based invitations between separate users) and before any " +
      "cross-device use of 'My account'."
  },
  {
    title: "Write real delineation copy (replace template-generated content)",
    status: "open",
    effort: "large",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "The MVP's Week 1/2/3 text (content.js) is template-generated for the prototype — one " +
      "gift/cost paragraph per classical body (Sun–Saturn), personalized with the user's " +
      "actual sign/house, not full hand-written sign-by-sign copy. It reads coherently and " +
      "never puts a limitation without its paired strength, but it isn't the depth-and-length " +
      "writing product description §2 says Millennial users will actually engage with. Needs " +
      "a real copywriting pass once the product direction is validated — this was a scope " +
      "trade-off made explicitly to ship a working full loop in one session rather than a " +
      "narrower slice with hand-tuned prose."
  },
  {
    title: "Verify Placidus houses against the real Swiss Ephemeris",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "The MVP's Placidus solver (astro-engine.js) was derived from first principles (the " +
      "altitude=0 horizon condition, trisected diurnal/nocturnal semi-arcs) and self-" +
      "validated in the browser: cusp 1 = Ascendant, cusp 10 = Midheaven, opposite cusps " +
      "exactly 180° apart, and all 12 cusps monotonic — but it has never been cross-checked " +
      "against a trusted reference ephemeris (e.g. swetest). Do that once the paid Swiss " +
      "Ephemeris SDK is in place (see the license item below); until then, treat Placidus " +
      "cusps as internally consistent but not externally verified."
  },
  {
    title: "Chiron precision is approximate — needs real orbital elements",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "Chiron isn't in the vendored astronomy-engine library, so the MVP computes it via a " +
      "simple two-body Keplerian propagation from mean J2000 elements, with no perturbation " +
      "modelling. Chiron's real orbit is perturbed noticeably by its proximity to Saturn and " +
      "Uranus, so this is a rough approximation, not production precision — flagged with " +
      "\"(approx.)\" in the chart display. Replace once Swiss Ephemeris is integrated, since " +
      "it includes Chiron properly."
  },
  {
    title: "Geo-block mainland China (IP/region check)",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      'User confirmed the market-scope call in chat: "geo-blocking mainland china users." ' +
      "This is a location/data-residency control only — it checks where the user currently " +
      "is (IP / account region) at signup and at the start of every session, and blocks access " +
      "if that resolves to mainland China. It does NOT restrict birth data: a user born in " +
      "Zhuhai or Ningbo (see the regression set) is served normally as long as they are not " +
      "physically accessing the app from a geo-blocked region — same as astro.com today. " +
      "Needs: IP-to-region lookup, a clear in-app message for blocked users, and a test that " +
      "confirms the check runs on every session start, not just once at signup."
  },
  {
    title: "Define monetization model",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Deferred to Phase 4 (Aug–Sep 2027)",
    desc:
      'From the release-plan discussion: "ok, we will solve the monetization model later ' +
      'closer to phase 4." Product description §5 only constrains the shape of one answer: ' +
      '"Brightness is earned through the practice, never purchasable. The moment it becomes a ' +
      'paid status symbol, the product has inverted its own purpose." So whatever the model is, ' +
      "it cannot sell Galaxy brightness directly. Nothing in Phases 0–3 depends on this being " +
      "resolved, but the Phase 4 pre-launch checklist should not close without it."
  },
  {
    title: "Procure Swiss Ephemeris Professional license",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started — blocks all chart code",
    desc:
      "Product description §12: Swiss Ephemeris Professional Edition, CHF 700 one-time, " +
      "unlimited use, valid 99 years. The free edition is AGPL and would force open-sourcing " +
      "the whole platform, so this is a hard requirement, not a cost-saving option. The MVP " +
      "runs on a free alternative in the meantime (see Construction Site completed log) — " +
      "this stays open until the real license is purchased and swapped in for production."
  }
];

const COMPLETED = [
  {
    date: "2026-09-07",
    title: "Consistent daily sequence (Quote / Practice / Body); dropped \"Today's choice\"",
    desc:
      "Lindsey: the three things a day asks (practice, choice, body) weren't treated as peers " +
      "— practice and choice were prominent cards, the body log was buried in a collapsible — " +
      "and 'Today's choice' felt like a daily chore. Decision: remove the daily fork for now, " +
      "and give the day one consistent sequence: (1) 'A line to sit with' (the quote, promoted " +
      "into its own card), (2) 'Today's practice' (Mind/Speech/Body), (3) 'How the body feels' " +
      "(the 'In the body' cue now nested inside the body-log card as context). The old " +
      "collapsible 'Quote, body cue & body log' fold is gone — all three are visible peers. " +
      "js/ui.js: choiceFork() deleted, its call removed from dayView, the day-extras <details> " +
      "removed, bodyLog(day) -> bodyLog(day, week). divergenceView: the 'The 21 choices you " +
      "logged' card + choice-strip removed; the twins statement reworked to stand alone as a " +
      "one-time capstone (no longer leaning on a choices tally), and the matching journeyIntro " +
      "twins line + 'what a day asks of you' copy updated to the new shape. reportSummaryText " +
      "and journeyReviewAll no longer reference choices (review rows now show done/not done). " +
      "s.cycle.choices and STORE.recordChoice are left in place; re-adding the fork is a small " +
      "job, logged as PLANNED. Verified in the app — new sequence, Day-21 report, review list " +
      "— no console errors.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-07",
    title: "Practices as Mind / Speech / Body; weekly horary bonus with a thought log",
    desc:
      "Two-part request. (1) PRACTICES REGROUPED into the three doors an action comes through " +
      "— Mind (thought), Speech (word), Body (deed/sensation). content.js PRACTICES trimmed " +
      "and re-tagged with a `cat`; three new Speech practices written (one true sentence, a " +
      "day without complaint, ask instead of tell, an hour of chosen silence); the per-planet " +
      "'suggested' practice still highlights wherever it sits (Mercury now suggests a Speech " +
      "practice, Week 3 too). ui.js practicePicker renders one labelled group per category. " +
      "(2) HORARY BONUS. New js/horary.js casts a chart for the moment a logged thought " +
      "struck and surfaces the factors of a descriptive Goldstein-Jacobson ('Simplified " +
      "Horary Astrology') read: the querent (Ascendant + traditional ruler + the Moon), the " +
      "quesited (the house of the chosen matter + its ruler + occupants), applying vs " +
      "separating between the two rulers, translation of light, the Moon's next aspect / " +
      "void-of-course, and the 'considerations before judgement' (Asc too early/late, via " +
      "combusta, Saturn in 1st/7th). It never returns yes/no. THOUGHT LOG: a 'Strong " +
      "thoughts' card on the Journey tab — log the moment (note, datetime, place; place " +
      "defaults to the birth place). One horary question PER WEEK, and the reveal for a week " +
      "is gated until all seven of that week's days are complete. State in storage.js: " +
      "top-level `thoughts` and `horaryAsked` ({ '<cycle>_<week>': {...} }); addThought / " +
      "updateThought / deleteThought / recordHorary. horary.js loaded in index.html and " +
      "build-preview.sh. Verified in the running app: grouped picker, thought logging, week-1 " +
      "gate, cast + reveal with wheel and factor blocks — no console errors. Depth pass on " +
      "the astro logic and a past-weeks thought view are logged as PLANNED.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-07",
    title: "People tab: make the invite an honest simulation + email field; My Journey in the drawer",
    desc:
      "Tester confusion on the People tab: no email field, and unclear whether an invite is " +
      "actually sent or the recipient must install the app first. Reality: it's a local, " +
      "no-server simulation. Changes (js/ui.js, index.html): (1) the intro is now an explicit " +
      "notice — nothing is emailed; in the finished app you'd enter their email, they'd get " +
      "an invitation, open their own account and accept there; here one browser plays both " +
      "sides via 'Accept (as them)' / 'Decline (as them)'. (2) The invite form now has an " +
      "'Their email' field (birthForm gained an opts.email flag; stored on the person record " +
      "as `email`), labelled 'Where the real invitation would go. Optional here — not sent.' " +
      "(3) Submit button relabelled 'Send invitation' -> 'Add & preview the invite'. (4) An " +
      "invited person's card now says 'invited — nothing emailed, this is a local simulation' " +
      "and shows the invite address; the preview text is reframed as 'the invitation they'd " +
      "receive would say…'. (5) Guard: adding a person whose name matches the account owner's " +
      "is rejected with a toast. (6) 'My Journey' (-> #cycle) added to the My account drawer " +
      "above People/Galaxy/Privacy. The real email-invite / two-account exchange stays " +
      "tracked under the backend PLANNED item.",
    dest: { tab: "people", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-07",
    title: "Journey overview map, one-page review, report export, and a lighter daily loop",
    desc:
      "Tester feedback after doing the 21-day journey: felt repetitive; sometimes just " +
      "clicked through to reach the end; couldn't export or review the final report; and a " +
      "'lost feeling' clicking day 1 -> day 2 -> ... with no sense of the whole shape or " +
      "where it was heading. Four changes in js/ui.js + styles.css: (1) JOURNEY MAP - a " +
      "'The whole journey' card now sits at the top of the Journey tab: three labelled weeks " +
      "(Your Gift / The Cost of the Gift / The Others) x seven day cells, showing done / " +
      "today / upcoming, each reachable cell tappable, plus a line spelling out what Day 21 " +
      "gives you. (2) PREVIEW THE DESTINATION - 'Preview where this lands' opens the shape of " +
      "the Day-21 report before finishing, with a banner noting it fills in as you go. (3) " +
      "REVIEW - 'Review all 21 days on one page' lists every day's theme + your logged choice " +
      "+ your practice on one scroll, tap any row to open it; reachable from the map and the " +
      "finished report (the old day-by-day 'Look back' stays too). (4) EXPORT - the finished " +
      "report has 'Save / print report' (print stylesheet, .report-print only) and 'Copy " +
      "summary' (plain text). Structural facts only - both charts, choice tally, body " +
      "pattern, North Node - never the free-text notes, which stay on the device (product " +
      "description sec 8-9); an on-screen note says so. (5) LIGHTER DAY - each day now opens " +
      "with a one-line arc marker ('Naming the strengths you were born with - one planet a " +
      "day. Today: Mercury.'), and the quote / body cue / body log fold into a collapsible " +
      "that is open only for days 1-2. Verified in the running app: map states, preview, " +
      "review list + row open, export buttons + privacy note, collapsed extras - no console " +
      "errors. Deeper repetition restructure and the export-boundary confirmation are logged " +
      "as PLANNED.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-07",
    title: "Make it feel alive: interactive chart wheel, journey sky, step transitions, tactile press",
    desc:
      "First pass on Lindsey's ask to move the app from 'a bit static' to 'feels like playing " +
      "and exploring', kept minimalist (motion is only ever feedback or wayfinding, never " +
      "decoration). Four pieces: (1) INTERACTIVE CHART WHEEL — each planet is now a focusable " +
      "group (js/chart-wheel.js); tapping or keyboard-selecting one lights its aspect lines, " +
      "dims every other planet and line, and updates a caption under the wheel ('Moon in " +
      "Pisces 15.6 deg, House 5 — 5 major aspects lit above'); tap again or tap empty space to " +
      "clear. Aspect lines carry data-a/data-b; larger invisible hit targets for mobile. The " +
      "wheel also assembles in once (rotate+fade). (2) JOURNEY SKY — the Home starfield gains " +
      "one bright star for every completed cycle day (app.js renderJourneySky, deterministic " +
      "scatter so they stay put and only accumulate), the newest one arriving with a flare. " +
      "Progress you can see as light, no number. (3) STEP TRANSITIONS — each tabpanel fades " +
      "and lifts in when it becomes active, so moving through the flow reads as travel. (4) " +
      "TACTILE PRESS — every tappable surface springs back slightly on :active. All four " +
      "honour prefers-reduced-motion. Verified in the running app: wheel select/clear + " +
      "caption, 12-star sky, no console errors.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-07",
    title: "Show all 7 strength gifts up front; gate only the Week-2 cost halves",
    desc:
      "From the first round of Wednesday team review: a tester (the second person to hit it) " +
      "commented on the demo that on 'Viewing my chart' every strength card was locked on a " +
      "first visit, leaving 'Start the 21-day journey' as the only action — no interpretive " +
      "payoff before committing. Lindsey's call: stop gating the gift readings entirely. All " +
      "seven gift tiles now render fully on the first visit; only the COST half of each pair " +
      "stays paced to that body's Week 2 day (idx + 8), so a limitation still never lands " +
      "before its strength (product description §3). Removed the giftUnlocked / locked-tile " +
      "branch in js/ui.js strengthsWeaknessesCard and the dead .sw-tile.locked CSS; intro copy " +
      "now reads 'All seven strengths are here from the start… the cost half unlocks as your " +
      "journey reaches Week 2.' The earned-surprise pop now fires only for the 7 cost reveals " +
      "(Days 8–14) plus the Galaxy brightness thresholds. Replied in the artifact comment " +
      "thread; demo link rebuilt.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-07",
    title: "Earned-surprise moment when a new reveal / brightness threshold unlocks",
    desc:
      "Deferred from the curiosity roadmap: an unlocked strength tile used to just quietly " +
      "become clickable. Now the FIRST time each reveal opens it gets a one-time marked moment. " +
      "(1) Chart step (My chart → 'Viewing my chart'): a newly-available tile plays a scale/glow " +
      "pop with a gold 'Just unlocked' (or 'Cost revealed') badge, staggered when several land " +
      "at once, plus a '✦ N new reveals just opened up — your journey earned it' banner above " +
      "the grid and a toast; the card scrolls itself into view. (2) Galaxy tab: the brightness " +
      "bar glows and shows '✦ Your sky just crossed 25/50/75/100%' the first time it passes " +
      "each quarter. State lives in cycle.seenUnlocks (['gift:Mars','cost:Venus',…]) and " +
      "cycle.brightnessMilestone in storage.js — both reset by repeatCycle and cleared by " +
      "delete-everything, so a repeat journey replays the surprises. The moment only fires while " +
      "its panel is actually on screen (renderAll can rebuild off-screen), and honours " +
      "prefers-reduced-motion with a static highlight instead of animation.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "Body log: free-text \"something else\" on both rows + an in-place \"why the body?\" explainer",
    desc:
      "Follow-up to the somatic layer, from Lindsey's chat. (1) The six quality words and the " +
      "seven places are a starting point, not the whole range a body can feel — both rows now " +
      "carry a 'something else…' chip that reveals a free-text input, stored as " +
      "quality:'other' + qualityOther:'<text>' (and place/placeOther). Day-21 bodyPatternCard " +
      "renders an 'other' top value as 'something you named yourself' / 'somewhere you named " +
      "yourself'. Row labels also reworded from Quality/Where to 'What it feels like' / 'Where " +
      "in the body'. (2) NEW EXPLAINER answering 'what has this got to do with my body / where " +
      "do the stars connect to me / why feel the sensation at all': a 'Why notice the body?' " +
      "expandable on the body-log card, plus a matching GLOSSARY entry (content.js " +
      "BODY_RATIONALE, one string reused in both places). The answer stays non-mystical: the " +
      "chart doesn't act on the body, it names tendencies; each tendency has a felt signature " +
      "that precedes the thought; catching that signature is the earliest choice point, and " +
      "watching it pass is how you stop being run by it. Verified live on 8541: 'something " +
      "else' + text persistence on both rows, the explainer inline and in the glossary, " +
      "Day-21 'other' phrasing — no console errors.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "Somatic layer: body cue per day, one-tap body log, Day-21 body pattern",
    desc:
      "From Lindsey's chat vision — each practice should build felt, bodily awareness of the " +
      "strength/cost being explored, and land the point that sensations are impermanent " +
      "(they come and go, gift and cost often share one sensation a notch apart, neither is " +
      "the self). Three pieces. (1) BODY CUE per day (content.js PLANET_BODY_CUE + " +
      "WEEK3_BODY_CUE, ui.js bodyCueCard) — a short phenomenological line under the quote " +
      "saying where that planet tends to be felt and reminding the reader it rises and " +
      "passes; written 'you might notice', no medical/anatomical claim, disclaimer discipline " +
      "kept. (2) BODY LOG (ui.js bodyLog) — an optional one-tap card after the practice: one " +
      "QUALITY chip (tight/open/heavy/buzzing/calm/numb) + one WHERE chip " +
      "(chest/gut/throat/jaw/shoulders/hands/legs), tap again to clear, stored as JSON in " +
      "localStorage aa_body_day_N (matching the practice-key pattern), editable in review " +
      "mode too. (3) DAY-21 PATTERN (ui.js bodyPatternCard, shown on the divergence screen " +
      "between the choices card and the North Node) — aggregates the notes by phase and " +
      "reports the most common quality+place for gift days vs cost days vs Week 3, closing " +
      "with 'same you, different weather... noticing the shift while it happens is the whole " +
      "practice.' Falls back to a gentle 'not enough logged yet' line under 3 entries. " +
      "storage.js deleteEverything/repeatCycle also clear the body keys. Verified live on " +
      "8541: cue per planet + Week 3, log persistence, Day-21 aggregation with a seeded set, " +
      "low-data fallback, review-mode editing — no console errors. NOTE on Lindsey's fuller " +
      "vision (the chart as a blueprint chosen for this lifetime, seeing impermanence to find " +
      "the middle way): the contemplative/equanimity framing is carried in the copy " +
      "('weather', 'comes and goes', 'neither is the real you'); the stronger metaphysical " +
      "claim (soul-choice / lifetime blueprint) was deliberately NOT put in product copy — it " +
      "would collide with the 'science, not esoteric' positioning and the skeptic teaser. " +
      "Revisit if Lindsey wants that frame made explicit somewhere optional.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "Journey day view: plain-language houses, suggested + custom practice, day navigation, daily quote",
    desc:
      "Five changes to a journey day, from user chat. (1) PLAIN-LANGUAGE HOUSES — personalize() " +
      "in content.js was appending a bare \"— most visibly in your 7th house\" with no " +
      "explanation; now it reads \"...and it shows up most in close one-to-one relationships " +
      "and partnerships (7th house)\" from a new 12-entry HOUSE_MEANING map, number kept in " +
      "parens; omitted entirely for unknown-birth-time charts. (2) SUGGESTED PRACTICE — the " +
      "picker was a fixed list of 9 with zero tie to the day; now one practice per body is " +
      "highlighted (CONTENT.practiceSuggestion) with a 'why this, today' line (Sun→Journaling, " +
      "Moon→Breath, Mercury→Journaling, Venus→Cooking, Mars→Movement, Jupiter→Reading, " +
      "Saturn→Tidying; Week 3→Reading). Other 8 stay available — a nudge, not a lock. (3) " +
      "CUSTOM PRACTICE — a 'Something else…' chip sits alongside the list and opens a textarea " +
      "saved to aa_practice_note_day_N. (4) DAY NAVIGATION — new dayNav + viewDay/reviewMode " +
      "UI state lets the user move between any day already reached and today (days ahead stay " +
      "out of reach so the gift/cost pacing and chart-page tile unlocks are unaffected); past " +
      "days show a 'completed, still editable' note instead of the complete button; the " +
      "Day-21 summary gets a 'Look back at any day' button into a review mode with a 'Back to " +
      "summary' link. Shared dayView(day, mode) renders both the live and review paths. (5) " +
      "DAILY QUOTE — dayQuoteCard shows one reflection line per day (CONTENT.quoteForDay), 7 " +
      "planet quotes + 7 Week-3 quotes; rights/attribution pass tracked as a PLANNED item. " +
      "storage.js deleteEverything/repeatCycle now also clear the per-day practice keys. " +
      "Verified live on 8541: house phrasing, suggested+custom practice persistence, back/forth " +
      "nav incl. jump-to-today, Week 3 day, unknown-time omission, and post-21 review — no " +
      "console errors.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "First-run context: \"How this works\" screen + demote the journey on the chart page",
    desc:
      "Follow-up to parking the Home teaser — user asked to build the two smallest pieces of " +
      "the onboarding gap. (1) \"HOW THIS WORKS\" first-run screen (ui.js howItWorksIntro, " +
      "shown by renderChartStep the first time the chart is reached, gated on localStorage " +
      "aa_howitworks_seen, cleared by deleteEverything): three plain lines — we calculate " +
      "your chart like an astronomer / it names what you're good at and what it costs / a " +
      "21-day journey is there if you want it (~5 min/day, 3 weeks, missing a day never " +
      "resets, entirely optional) — with \"See my chart\" as the ONLY button; the journey is " +
      "named but not offered as an action here. (2) DEMOTED THE JOURNEY on the chart screen: " +
      "removed the old full-width primary \"Start my 21-day journey\" button and the \"that's " +
      "the map\" bridge; replaced with a quiet .journey-offer card at the bottom — outline " +
      "button, time commitment stated up front, headed \"One optional next step\" (not " +
      "started) or \"Your 21-day journey / Day N of 21 — pick up where you left off\" " +
      "(started). The chart itself is now the only prominent thing on the page. Voice kept " +
      "consistent with the journeyIntro() bridge copy. Verified live on port 8541: fresh " +
      "user hits How-this-works → See my chart → chart with no primary button, just the " +
      "outline offer; returning mid-journey user skips the intro and sees the Continue " +
      "variant; no console errors. Leftover edges tracked in a new small PLANNED item " +
      "(step-nav \"Journey\" label, Galaxy brightness).",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "Fully park the Home \"Continue my journey\" teaser (it had crept back)",
    desc:
      "User in chat: remove \"Continue my journey\" from the Home screen — a first-time " +
      "astrology user meets \"Day N of 21 / your sky is X% bright / Continue my journey\" " +
      "before anything has told them what the tool is or how the 21 days work, so it reads " +
      "as being dropped into something they never opted into. app.js already skipped calling " +
      "renderHomeTeaser() on the Home tab (parked once before), but it was still reachable: " +
      "renderAll() calls it (repeat-journey and delete flows) and this session's new " +
      "choiceFork handler had added two more renderHomeTeaser() calls, so making a daily " +
      "choice re-injected the card into #home-teaser and it showed on the next Home visit. " +
      "Fix: renderHomeTeaser() now clears its host and returns immediately (early return + a " +
      "comment marking where to re-enable once a real onboarding path exists); removed the " +
      "two choiceFork calls. Verified: mid-journey user, make a choice, run renderAll(), go " +
      "Home — #home-teaser is empty, no \"Continue my journey\" anywhere, no console errors. " +
      "Open follow-up (see PLANNED): the chart page still presents \"Start my 21-day " +
      "journey\" as the main next step with only the one-line bridge as context — needs a " +
      "proper \"how this works\" explainer before the journey is offered.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "Bridge screen between \"My chart\" and Day 1 of the journey",
    desc:
      "User in chat (three times, rephrased): after reviewing the birth chart the only thing " +
      "between it and the 21-day journey was a bare button that dropped you straight onto Day " +
      "1 — no sense of what the journey is or why it follows from the chart. Added a proper " +
      "transition in two places. (1) On the My chart step (ui.js renderChartStep), a short " +
      "left-bordered bridge block above the CTA: \"That's the map. The 21-day journey is where " +
      "you walk it\" + one line naming the three weeks. Also fixed the button label logic " +
      "while there — it keyed on `startedAtISO`, which setMe() always sets, so a brand-new " +
      "user still saw \"Go to my 21-day journey\"; now keyed on completedDays.length, so it's " +
      "\"Start\" for new users and \"Continue\" once underway. (2) A full bridge screen " +
      "(ui.js journeyIntro), shown the first time the Journey tab is opened with nothing " +
      "completed and no dismiss flag: heading \"From your chart to your journey\", a " +
      "chart→journey framing line, a Week 1/2/3 breakdown, a \"what a day asks of you\" card " +
      "(read → practice → one real choice, ~5 min, missing a day never resets), the twins " +
      "line, the plain-language glossary, and a single \"Begin Day 1\" button that sets " +
      "localStorage aa_journey_intro_dismissed and renders Day 1. Returning users on journey " +
      "2+ skip straight to the day; STORE.deleteEverything() also clears the flag so a fresh " +
      "start sees the intro again. Verified live on port 8541: fresh user sees the bridge on " +
      "both screens, Begin Day 1 lands on \"Day 1 — Week 1\", re-render doesn't re-show it, " +
      "no console errors.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "Journey: daily choice-fork + Day-21 \"divergence\" screen + plain-language toolkit",
    desc:
      "User's framing in chat: the birth chart is a map of the ground you start on, but every " +
      "choice is you turning the wheel — which is why twins with near-identical charts live " +
      "totally different lives. Wanted that made concrete in the 21-day journey, plus a " +
      "toolkit so a newcomer with zero astrology knowledge isn't blocked by words like " +
      "\"inception chart\". Built three things: (1) a daily CHOICE FORK — after each day's " +
      "gift/cost reading, one real either/or, with the grain of your chart or deliberately " +
      "against it (CONTENT.BODY_EXPERIMENT per body for Weeks 1-2, CONTENT.WEEK3_FORKS for " +
      "Week 3), stored in cycle.choices in localStorage via STORE.recordChoice(day, choice); " +
      "tapping the active option again clears it; nothing is \"right\", the point is it's " +
      "logged. (2) DAY-21 DIVERGENCE SCREEN (ui.js divergenceView) shown once all 21 days are " +
      "complete, replacing the old dead \"go repeat it\" notice (its `day > 21` guard was " +
      "unreachable — currentDay() caps at 21; now keyed on completedDays.length >= 21): the " +
      "natal chart (\"the chart you were given\") vs. the inception chart (\"the chart you " +
      "made by turning up\"), a 21-dot strip of the choices logged with a with-grain / " +
      "against-grain tally, the twins line as copy, and the North Node as \"the direction " +
      "you're growing toward\" leading into Start journey N+1. (3) TOOLKIT — CONTENT.GLOSSARY, " +
      "12 terms each with a five-year-old \"plain\" line and a one-line \"real\" line tying " +
      "back to the astronomy, rendered as a collapsed <details> at the top of the Journey tab " +
      "and on the divergence screen. Verified live on port 8541: fork records/toggles per " +
      "body (Day 3 = Mercury options), divergence screen renders with a seeded 21-day state, " +
      "no console errors.",
    dest: { tab: "cycle", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-06",
    title: "No-commitment skeptic teaser: one real chart fact from just a birth date",
    desc:
      "User's idea for winning over skeptics on first contact: let them try the app before " +
      "committing to anything. Added a \"Not sure yet? Try a free 10-second reading\" link on " +
      "Home, leading to a screen that asks for ONLY a birth date — no time, no place, no " +
      "account, and nothing saved to STORE. Works because a body's zodiac sign and the aspects " +
      "between bodies don't depend on birth time or location — only houses and the Ascendant " +
      "do, and those aren't used here (CONTENT.teaserReveal in content.js computes positions " +
      "at noon UTC on the given date and picks the visitor's single tightest-orb aspect — the " +
      "most exact, most \"real\" fact in their chart — rather than a generic sun-sign line). " +
      "Verified live: a 16 Aug 1985 test date surfaced \"Your Mercury and Mars are in " +
      "conjunction, only 0.02° from exact\" — specific and sharp, not a horoscope-column line. " +
      "Clicking through carries the entered date into the full birth-data form (added an " +
      "optional prefillDate param to ui.js's birthForm) so trying it never means re-typing " +
      "anything. Also discussed and deliberately deferred: attaching named real experts (Lynn " +
      "Koiner, Pema Chödrön, Harville Hendrix, Naval Ravikant) to each category — see the held " +
      "PLANNED item for the legal/positioning reasoning.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-05",
    title: "Home: life-domain categories (Myself/Relationship/Job/Health) with per-domain reveals",
    desc:
      'User in chat: change the question to "What do you want to know about?", make the four ' +
      "categories text-only (no explanation) — Myself / Relationship / My job / My health — " +
      "and make clicking one feel like \"wow, this is about me\", not a generic explainer, so " +
      "the user feels curious, has a sense of choice, and wants to keep playing. Rebuilt the " +
      "category grid as plain topic words with no description line (styled bigger/bolder, a " +
      "hover glow) so clicking is the only way to find out what it says about you. Added a new " +
      "domain-reveal screen (CONTENT.domainReveal in content.js) that pulls a real, specific " +
      "placement straight from the user's own chart for each topic — Relationship reads Venus " +
      "+ Moon, My job reads Midheaven + Saturn (prompts for birth time if missing, since MC " +
      "needs one), My health reads Mars, each with a short \"go deeper\" CTA into the relevant " +
      "part of the app. Myself still goes straight to the full chart (already the deepest " +
      "payoff). Caught and fixed a real bug while testing: when two placements land in the " +
      "same sign (e.g. Midheaven and Saturn both in Scorpio), the reveal read as a verbatim " +
      "repeated sentence — added same-sign phrasing (\"Both your Midheaven and Saturn are in " +
      "Scorpio — that isn't just the face you bring to work, it's the discipline you've built " +
      "your career around\") so it still reads as insight, not a template glitch.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-05",
    title: "Progressive reveal + Home \"continue your journey\" teaser (Alice-in-Wonderland curiosity)",
    desc:
      'User asked to execute the full curiosity roadmap proposed in chat: "always want to ' +
      'explore more and more... like Alice in Wonderland." Built the two highest-value pieces: ' +
      "(1) Home now shows a \"Day N of 21 — your sky is X% bright\" teaser plus a one-line, " +
      "non-spoiling focus hint (\"Today's focus involves Mars in Leo\") whenever a journey is " +
      "in progress, surfacing the brightness meter that was previously buried in the Galaxy " +
      "tab — a \"Continue my journey\" button underneath; (2) the strengths/weaknesses tiles " +
      "on the chart step now unlock progressively: each body's strength tile unlocks on the " +
      "journey day that covers it, and its cost half unlocks separately on that body's Week 2 " +
      "day, so a fresh chart shows locked \"Unlocks on Day N\" cards waiting to open rather " +
      "than the whole 21 days of insight at once. Deliberately did NOT lock the chart wheel or " +
      "the exact-degrees/aspects data — that's real computed astronomy, and hiding actual facts " +
      "to manufacture suspense would work against the \"this is science, not esoteric\" " +
      "positioning from earlier today; only the paced INTERPRETATION is gated, mirroring the " +
      "product's own Week 1/Week 2 structure. Factored brightness math into one shared " +
      "brightnessPercent() helper so Home and Galaxy always agree (verified both read 29% for " +
      "the same test profile). Deferred for now: a visual \"new star unlocked\" surprise moment " +
      "and dimming not-yet-reached wheel placements — flagged as open follow-ons below.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-05",
    title: "Clarify category cards 3 and 4 — one person vs. everyone together",
    desc:
      'User in chat: "help me to understand the difference from the fourth box and the ' +
      'third? Because this seems to be the same." They were genuinely different underneath ' +
      "(box 3 -> People tab, add one person and see their own individual chart; box 4 -> " +
      "Galaxy tab, a midpoint composite chart merging everyone added) but the wording didn't " +
      "make that obvious. Reworded: \"I want to understand someone else\" -> \"I want to " +
      "understand one person\" (desc now says \"Add them, and see their own chart\"), and " +
      "\"I want to see our connection\" -> \"I want to see us together\" (desc now says \"One " +
      "combined chart made from everyone you've added — your shared dynamic\"). The one/" +
      "everyone-together distinction is now in the label itself, not just the description.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-05",
    title: "Intro: curiosity-driven question + science framing, not esoteric",
    desc:
      'User asked in chat: "I would like the customer to feel very curious to want to explore ' +
      'more... I do not want them to feel esoteric. but I want them to feel its science." ' +
      "Replaced the flat statement headline (\"What is AstroAtlas?\" / \"Your birth date " +
      "creates a unique pattern...\") with an actual question as the hook — \"What were the " +
      "planets doing the moment you were born?\" — answered by \"We calculate it precisely, " +
      "like an astronomer — then turn it into real insights and small daily habits, made for " +
      "you.\" The word \"pattern\" (reads soft/astrology-vague) is gone; \"calculate\" and " +
      "\"astronomer\" anchor it as a real, precise computation rather than a vibe. Kept it to " +
      "two short lines so it's still readable in seconds.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-05",
    title: "Shrink intro to ~20 words; reframe categories as needs, not features",
    desc:
      "Voice-message follow-up: intro needed to be readable in about ten seconds, and the " +
      "category cards needed to feel like they matched the user's actual need rather than " +
      "reading as a feature list — with a clear sense that answers come from their own unique " +
      "chart, not a generic horoscope. Cut the intro from two paragraphs to one 20-word line " +
      "(\"Your birth date creates a unique pattern. We turn it into clear insights and small " +
      "daily habits, made for you.\"). Reworded the question from \"What do you want to " +
      "explore?\" to \"What do you need right now?\" and every category label to a first-person " +
      "need statement (\"I want to know myself better\", \"I want a daily practice\", \"I want " +
      "to understand someone else\", \"I want to see our connection\"), with each description " +
      "now naming the personalization explicitly (\"your exact chart\", \"chosen from your own " +
      "chart\", \"their one-of-a-kind chart\", \"everyone's own charts\").",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-05",
    title: "Home screen: plain-language intro + \"what do you want to explore\" categories",
    desc:
      'Tester feedback relayed in chat: needed an intro an elementary student could follow, ' +
      'the home page changed from a single vague CTA to a real question with categories, and ' +
      'a general check that the app doesn\'t read as "ungrounded." Replaced the old hero line ' +
      '("Are you ready to dive into your universe?") — flagged as the main ungrounded phrase — ' +
      "with a \"What is AstroAtlas?\" intro card explaining the mechanism in plain terms (birth " +
      "date/time/place → a calculated map, read as a mirror not a prediction, paired with real " +
      "everyday practices), explicitly stating \"it's not magic and it doesn't tell the future.\" " +
      "Below that, \"What do you want to explore?\" now shows four concrete category cards " +
      "(Understand myself / Start my 21-day journey / Understand someone I care about / See my " +
      "Galaxy) instead of one CTA button — each routes straight to the right place, falling back " +
      "to the birth-data step first if there's no chart yet. Checked the rest of the app's copy " +
      "for similar ungrounded language (universe/cosmic/destiny/fate/magical) — nothing else " +
      "turned up.",
    dest: { tab: "home", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-04",
    title: "Collapsible degrees/aspects, flip-card strengths, and an Edit-chart button",
    desc:
      "Three follow-up requests done together: (1) the exact-degrees table and the aspects " +
      "list are now two pill buttons (\"Exact degrees (N)\" / \"Aspects (N)\") that reveal one " +
      "panel at a time, instead of everything listed below the wheel by default; (2) the " +
      "Strengths/Cost-of-each section is now a grid of colour-coded tiles, one per body, each " +
      "showing the strength by default — tapping a tile flips it to reveal that same body's " +
      "cost (title changes to \"<Body> — the cost\", caret flips), replacing the two long " +
      "text columns; (3) added an \"✏️ Edit\" button in the top-right corner of the chart " +
      "card that reopens the birth-data form pre-filled with the current values (name, date, " +
      "time, unknown-time checkbox, coordinates, timezone) so the user can correct or update " +
      "their data without starting over, with a Cancel button to back out unchanged. Verified " +
      "in the browser: panel switching, tile flip, and edit/save/cancel all work.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-04",
    title: "Visualize the chart as an SVG wheel instead of a text list",
    desc:
      'User asked: "is it possible to make the chart as lively visualise chart instead of ' +
      'wording?" Added js/chart-wheel.js: a natal-chart wheel (zodiac ring with sign glyphs, ' +
      "house cusps with numbers — Ascendant/Midheaven cusps highlighted and labelled AS/MC, " +
      "coloured planet glyphs at their real positions with simple collision avoidance for " +
      "crowded stelliums, and coloured aspect lines connecting bodies by aspect type) built " +
      "from the same computed chart data as before — no new astronomy, purely a visual layer. " +
      "Used on the main chart card, the People tab's per-person cards, and the Galaxy tab's " +
      "composite chart (which correctly omits house lines and aspects, since a midpoint " +
      "composite doesn't have real houses). The old text table of exact degrees is kept, " +
      "collapsed behind a \"Show exact degrees\" toggle, for anyone who wants precise numbers. " +
      "Verified in the browser for Placidus, Whole Sign, the no-angles composite chart, and an " +
      "unknown-birth-time chart (no house lines) — all render without error.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-04",
    title: "Chart tab: clearer input fields, strengths/weaknesses summary, Milky Way background",
    desc:
      "Three requests from chat, done together: (1) added visible labels and example " +
      "placeholder text to every birth-data field (Name, Date of birth, Time of birth, Place " +
      "of birth, Manual coordinates), replacing the old bare inputs; (2) added a \"Viewing my " +
      "chart\" section below the chart card with a Strengths / Cost-of-each two-column list, " +
      "generated from the same gift/cost content used in the 21-day journey — every cost item " +
      "sits next to the exact strength it belongs to, so the user journey is now: enter data " +
      "→ see chart → see strengths/weaknesses → \"Go to my 21-day journey\"; (3) renamed all " +
      "user-facing \"cycle\" wording to \"journey\" per the follow-up message (tab label, " +
      "headings, buttons, progress text) — internal routing/storage keys (#cycle, STORE.cycle) " +
      "left unchanged since they're not user-visible. Also added a CSS-only Milky Way " +
      "background (layered star dots + a soft blurred diagonal nebula band) across the whole " +
      "app, no external image dependency.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-04",
    title: "Build the first clickable MVP (chart engine + 21-day cycle)",
    desc:
      "Built the full release-plan §11 loop as a clickable prototype: chart calculation " +
      "(Sun–Pluto, Chiron approx., mean lunar nodes, Placidus/Whole Sign houses, Ptolemaic " +
      "aspects) on a vendored MIT-licensed astronomy library standing in for the paid Swiss " +
      "Ephemeris SDK; historical timezone resolution via the browser's built-in IANA tzdata " +
      "(verified against all four product description §12 regression cases, including the " +
      "15-minute degeneracy pair — bodies differ by well under 1°, only the fast-moving " +
      "Ascendant/Midheaven shift meaningfully, which the app states out loud rather than " +
      "hiding); unknown-birth-time handling (houses/Asc/MC suppressed, Moon shown as a range); " +
      "Weeks 1–2 with paired gift/cost content; solo Week 3 (inception chart + observation " +
      "mode, the latter storing nothing about the observed person); a consent/invite flow " +
      "simulating both sides in one browser, with real-time withdrawal; a Galaxy view with a " +
      "midpoint composite chart (composite angles deliberately not shown, per their known " +
      "imprecision); and real deletion. Runs on browser-local storage only, per the lighter-" +
      "weight prototype scope agreed in chat. Found and fixed two bugs during manual browser " +
      "testing: a null-Ascendant display bug on the Galaxy composite card, and broken " +
      "third-person grammar in the Week 3 \"noticing someone else\" content generator.",
    dest: { tab: "mychart", subtab: null, scrollTo: null }
  },
  {
    date: "2026-09-04",
    title: "Build the Construction Site tracking tab",
    desc:
      "Added the Construction Site tab to AstroAtlasI: an in-progress section, a planned " +
      "list sortable by recency / priority / effort, a completed log with jump-back links, " +
      "hide-and-restore for planned items (localStorage only, no code changes), and " +
      "per-item plus collective “Copy prompt” buttons. Built per the spec given in chat, " +
      "including the escaping requirement so titles/descriptions containing quotes or HTML-" +
      "like text can never break the page.",
    dest: { tab: "construction", subtab: null, scrollTo: null }
  }
];
