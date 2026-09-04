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
      "the whole platform, so this is a hard requirement, not a cost-saving option. Release " +
      "plan §3 flags this as a Phase 0 blocker: procure before any ephemeris integration " +
      "code is written against it, since Phase 1 charts depend on it being in place."
  },
  {
    title: "Integrate Swiss Ephemeris (self-hosted chart engine)",
    status: "open",
    effort: "large",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "Core chart calculation engine, self-hosted with no runtime dependency on a third " +
      "party's website (product description §12). Must implement the method exactly as " +
      "declared in §6: tropical zodiac, Placidus houses by default with a Whole Sign toggle, " +
      "Sun through Pluto plus Chiron and the lunar nodes (asteroids off by default), and " +
      "Ptolemaic major aspects with a published orb table. This is the foundation every later " +
      "phase depends on — release plan Phase 0 exit gate."
  },
  {
    title: "Integrate GeoNames + IANA tzdata (historical offsets)",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "Atlas layer named in product description §12: GeoNames for birthplace coordinates, " +
      "IANA tzdata for historical timezone offsets. This is what makes the pre-1986 China " +
      "cases and the 1963 West Germany case in the regression set resolve correctly — " +
      "neither country observed the DST rules a naive timezone library would assume."
  },
  {
    title: "Build the regression test set",
    status: "open",
    effort: "small",
    inProgress: false,
    statusLabel: "Not started — Phase 0 exit gate",
    desc:
      "The four birth-data cases from product description §12: the founder's Zhuhai " +
      "baseline, a second Zhuhai chart 15 minutes later to test degeneracy handling, a 1963 " +
      "Erding DE case (no West German summer time that year), and a second pre-1986 China " +
      "case in Ningbo. The 15-minute pair is the one that matters: \"Two charts fifteen " +
      "minutes apart are functionally the same chart. If AstroAtlas produces two visibly " +
      "different readings, it's generating noise.\" Correct behaviour is to say so out loud " +
      "instead of presenting two unrelated readings."
  },
  {
    title: "Implement unknown-birth-time handling",
    status: "open",
    effort: "medium",
    inProgress: false,
    statusLabel: "Not started",
    desc:
      "Product description §6: when birth time is unknown, houses, Ascendant and " +
      "Midheaven are suppressed rather than guessed, the Moon is shown as a range across the " +
      "sign(s) it could occupy that day, and the interface says plainly what's missing. " +
      "\"Silently defaulting someone to noon is lying to them.\" §2 flags this as load-" +
      "bearing rather than a nice-to-have, since birth times are far more often unknown or " +
      "unrecorded for the Boomer generation."
  }
];

const COMPLETED = [
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
