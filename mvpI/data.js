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
