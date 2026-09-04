# AstroAtlas — Release Plan

*Derived from [astroatlas-product-description-v3.md](astroatlas-product-description-v3.md). Covers MVP scope, build sequence, testing, rollout, and post-launch phases.*

---

## 1. Release philosophy

AstroAtlas's MVP is defined tightly in §11 of the product description: chart engine, Weeks 1–2 solo, solo Week 3, consent-based Week 3 with a second person, a small Galaxy view, and deletion/withdrawal. Everything else (Roots cycle, larger galaxies, transits, fixed stars) is explicitly deferred.

The release plan follows that boundary and adds the connective tissue the product description doesn't specify: build order, dependency sequencing between phases, gating criteria to move from one phase to the next, and rollout strategy per generation segment (§2 of the product description).

**Guiding constraint carried through every phase:** nothing ships that violates §8–10 (wellbeing design, consent/privacy, red lines). These are treated as launch blockers, not polish items.

**Market scope decided:** AstroAtlas geo-blocks mainland China at launch. This is a location/data-residency control (blocking users physically in mainland China, or whose account region resolves there), not a restriction on birth data — a user born anywhere, including China, can use the product freely as long as they are not accessing it from a geo-blocked region. See §6 and §9 for how this is implemented.

---

## 2. Release phases overview

Target completion: **end of September 2027**. Dates below are a working schedule built backward from that deadline, spread across the phase order — they are placeholders until real engineering capacity is confirmed (see §10), but they hold the target end date fixed.

| Phase | Name | Scope | Target window | Gate to proceed |
|---|---|---|---|---|
| 0 | Foundations | Ephemeris, atlas, regression set, method config | Oct 2026 – Dec 2026 | Regression set passes, incl. the 15-minute degeneracy case |
| 1 | Alpha (internal) | Weeks 1–2 solo, practice library | Jan 2027 – Feb 2027 | Founder's own chart + regression charts read correctly and match declared method (§6) |
| 2 | Closed Beta | Solo Week 3 (inception chart + observation mode) | Mar 2027 – Apr 2027 | Drop-off at Week 3 boundary is measurably reduced vs. Phase 1 test group without solo path |
| 3 | Public Beta | Consent-based invitation, Week 3 with added chart, Galaxy view (2–3 stars) | May 2027 – Jul 2027 | Consent flow legally reviewed; withdrawal removes a star from every galaxy within the session; geo-block verified |
| 4 | v1.0 Public Launch | Full MVP (§11), deletion, repeat-cycle flow | Aug 2027 – **30 Sep 2027** | All Phase 0–3 gates hold at production scale; privacy/legal sign-off complete |
| 5 | Post-launch iteration | Roots cycle, larger galaxies, transits/timing, fixed-star layer | Oct 2027 onward | Each shipped independently, none blocks another |

---

## 3. Phase 0 — Foundations (technical bedrock)

Nothing user-facing ships before this phase is solid, because every later phase depends on chart correctness.

**Build:**
- Integrate Swiss Ephemeris Professional Edition (self-hosted; one-time CHF 700 license — procure before Phase 0 starts, since Phase 1 charts depend on it)
- Integrate GeoNames (coordinates) and IANA tzdata (historical offsets)
- Implement method config exactly as declared in §6: tropical zodiac, Placidus default with Whole Sign toggle, Sun–Pluto + Chiron + lunar nodes (asteroids off by default), Ptolemaic major aspects with a published orb table
- Implement unknown-birth-time handling: suppress houses/Ascendant/Midheaven, show Moon as a range when it changes sign that day, surface the missing-data state in the UI rather than defaulting to noon

**Test — the regression set (§12) is the acceptance criterion for this phase, not a nice-to-have:**

| Birth data | What it validates |
|---|---|
| 16 Aug 1985, 17:25, Zhuhai CN | Baseline correctness; pre-1986 China had no DST → UTC+8 |
| 16 Aug 1985, 17:40, Zhuhai CN | **Degeneracy handling** — must be flagged as near-identical to the row above, with the small difference stated explicitly, not presented as two unrelated readings |
| 9 Sep 1963, 20:20, Erding DE | Historical DST correctness — West Germany had no summer time in 1963 → CET/UTC+1 |
| 18 Nov 1981, 11:38, Ningbo CN | Second pre-1986 China historical-offset case |

**Exit criterion:** all four cases compute correctly, and the degeneracy case produces the "these two are nearly identical" behaviour described in §12 — this is treated as a trust-defining feature, not an edge case.

---

## 4. Phase 1 — Alpha (internal, solo Weeks 1–2)

**Build:**
- Chart calculation UI (read-only, from Phase 0 engine)
- 21-day cycle scaffolding: one focus per day, forgiving streaks (a missed day never resets a cycle — §8)
- Week 1 (Gift) and Week 2 (Cost of the Gift) content structure, with the structural rule enforced in the content model itself: **no limitation entry can be published without a linked strength entry** (§3)
- Practice library (§4): Breath, Meditation/sitting, Movement/yoga, Journaling, Cooking, Tidying, Reading, Music, Changing surroundings — gentle-breathwork only, with the medical-disclaimer and no breath-holding-near-water constraints enforced in copy, not just documented
- Language pass against §8: no deficit language, no scores/rankings, no compatibility percentages, never diagnostic, no mental-health naming or therapy framing
- Voice pass against §6: every delineation framed as "here is the tension," never "here is what will happen/what you are"

**Test:** internal team + founder's own chart (the regression baseline) go through a full Weeks 1–2 cycle. Check for accidental scoring language, accidental determinism in copy, and that every Week 2 entry traces to a Week 1 strength.

**Exit criterion:** a person with zero astrology background can complete Weeks 1–2 and describe the Week 2 content as "the cost of a strength," unprompted, not as "my flaws."

---

## 5. Phase 2 — Closed Beta (solo Week 3)

This phase exists specifically to attack the drop-off point the product description names directly: *"Most people won't have a second person ready — that's the biggest drop-off point in the whole product"* (§3).

**Build:**
- Inception chart: auto-cast for the moment the user began Day 1, read through the lens of "how am I meeting change / what am I willing to move"
- Observation-without-data mode: user picks a real person, practices accurate seeing for 7 days, **zero data collected about the observed person** — verify this at the data-model level (no field exists to store it), not just at the UI level
- Both run together as the default solo Week 3, not as a fallback UI state

**Test:** recruit a closed beta group weighted toward users unlikely to have a ready second person (per §2, this skews Gen X/Boomer and anyone testing solo). Track Week 3 completion rate for solo users specifically.

**Exit criterion:** solo Week 3 completion rate is not meaningfully worse than Weeks 1–2 completion rate — i.e., the solo path actually closes the drop-off gap rather than just existing.

---

## 6. Phase 3 — Public Beta (others, consent, Galaxy)

Highest legal and trust surface area in the product — sequence last among beta phases and gate hardest.

**Build:**
- Consent-based invitation flow: invitee sees exactly what will be generated before accepting, can decline (§9)
- Withdrawal: any participant can leave, and their star is removed from every galaxy immediately (§9) — this needs to be tested as a real-time propagation guarantee, not eventual consistency
- Week 3 with an added chart: one quality of the other person per day, ending in something actionable (§3)
- Galaxy Chart: midpoint composite, derived Ascendant with its limitations stated in-product (§6), capped at 2–3 stars for MVP
- Sharing constraint: only the user's own chart is shareable; Galaxy views and others' charts are never shareable, enforced at the export/share layer, not just hidden in the UI (§8)
- Privacy: Weeks 1–2 and all journal content stay private to their owner permanently, no export path, no team view (§9)

**Legal/compliance gate before this phase opens beyond internal testers:**
- GDPR compliance review (baseline for all markets per §9)
- **Geo-block mainland China at the infrastructure level** (IP-based region check at signup and session start) — this replaces the earlier open question about a China market; the product is not withheld from anyone based on *birthplace* in their chart data (a user born in Zhuhai or Ningbo is served normally, same as astro.com would), only from users physically located in, or whose account resolves to, mainland China. Build this as a standard geo-block, not a data-architecture project.
- Confirm consent flow and withdrawal mechanics satisfy legal review, not just product review

**Test:** paired beta users (mutual consent) plus a withdrawal drill — one user withdraws mid-cycle, verify their star disappears from all counterpart galaxies without delay, and their data is actually removed, not soft-deleted.

**Exit criterion:** legal sign-off on consent/withdrawal/privacy flows; withdrawal propagation verified under test; sharing boundary verified (attempt to export/screenshot a Galaxy view or another person's chart is blocked or watermarked as private, per product intent).

---

## 7. Phase 4 — v1.0 Public Launch

**Scope:** the full MVP list from §11, assembled from Phases 0–3:
1. Chart calculation with correct historical atlas
2. Cycle 1: Weeks 1–2, solo and private, with practice library
3. Solo Week 3: inception chart + observation mode
4. Consent-based invitation and Week 3 with an added chart
5. Galaxy view with 2–3 stars; repeat-cycle flow
6. Deletion and withdrawal

**Pre-launch checklist:**
- [ ] Regression set (§12) passing in production environment, not just staging
- [ ] Deletion verified as real deletion (data actually removed, not flagged) — §9
- [ ] Red lines (§10) checked against actual product surface: confirm no feature could be repurposed for hiring/promotion/pay/termination/team-assignment use, no compatibility scores exist anywhere
- [ ] GDPR baseline live for all launch markets; mainland China geo-block active and tested (region check at signup and session start, not a one-time check)
- [ ] Gen Z framing check: nothing in onboarding, marketing, or in-app copy frames the product as a workplace/productivity tool (§2) — this is a stated rejection trigger for that segment
- [ ] Boomer/Gen X accessibility check: unknown-birth-time flow is smooth, interface doesn't assume high app fluency (§2, §6)
- [ ] Repeat-cycle flow tested: same people, new circle, or solo again, without data corruption across cycles

**Rollout sequencing by audience (per §2 segment notes):**
1. Millennials first — stated as most likely first paying users and the primary audience for the relational (Week 3) layer
2. Gen Z — ensure structured, non-"journey"-branded framing is what they see first; the 21-day fixed-focus structure is the fit, open-ended framing is not
3. Gen X / Boomers — often enter as the person being *added* to someone else's Week 3 rather than as primary sign-ups; make sure the invitation flow reads well for someone who didn't initiate the product themselves

---

## 8. Phase 5 — Post-launch (explicitly "later" in §3/§6/§11)

Not sequenced tightly relative to each other — each is independently shippable once demand and legal review support it:

- **Roots cycle** — parent/grandparent chart, consent-gated, with the hard guardrail from §3: never used to explain or characterise harm done to the user, never comments on mental health, routes to real human support if something heavy surfaces. Build the guardrail as a content-review gate before any Roots content ships, not as a retrofit.
- **Larger galaxies** — beyond 2–3 stars; revisit performance and UI legibility of the composite chart at scale
- **Transits and timing** — new technical surface, needs its own regression thinking (time-based charts compound the DST/historical-offset issues Phase 0 solved for birth charts)
- **Fixed stars and parans** — kept as a separate layer, not blended into core delineation (§6) — build as an opt-in overlay, not a default-on feature

---

## 9. Cross-cutting risks to track through every phase

| Risk | Where it bites | Mitigation |
|---|---|---|
| Silent noon-defaulting on unknown birth time | Phase 0/1 | Explicit UI state for missing data; regression-tested |
| Two near-identical charts read as meaningfully different | Phase 0 | Degeneracy case in regression set is a hard gate |
| Week 3 drop-off without a second person | Phase 2 | Solo Week 3 must ship before public Week 3, not alongside it |
| Withdrawal not propagating immediately | Phase 3 | Real-time propagation test, not eventual consistency |
| Feature creep into scoring/compatibility percentages | All phases | §8/§10 checked at every phase exit, not just at launch |
| Mainland China access | Phase 3 launch scope | Geo-blocked by IP/region at signup and session start (birthplace data is unaffected — only current location is checked) |
| Gen Z workplace-framing rejection | Marketing + onboarding copy | Explicit copy review pass before Phase 4 |
| Ephemeris licensing | Phase 0 | Procure Swiss Ephemeris Professional license before any chart code is written against it |

---

## 10. Open questions for the team

Resolved since the first draft of this plan:
- **Market scope:** mainland China is geo-blocked at launch (§1, §6). Birthplace data from anywhere, including China, is unaffected — this is a current-location check, not a data-origin restriction.
- **Timeline:** target end date is **30 September 2027**, with phase windows in §2 built backward from it.

Still open:
- **Monetization model** — deferred to be resolved closer to Phase 4 (Aug–Sep 2027), per team decision. Nothing in Phases 0–3 depends on it, but Phase 4's exit checklist should not close without it.
- **Engineering capacity** — the dates in §2 assume a working pace but aren't yet tied to a known team size. If actual capacity turns out smaller or larger than assumed, the phase *order* stays the same but the window widths in §2 should be adjusted — worth revisiting once a team is staffed, so the Sep 2027 target is confirmed as realistic rather than aspirational.
- **Non-EU markets beyond the GDPR baseline** — which markets outside the EU (US, UK, etc.) need their own compliance review before Phase 3/4, distinct from the China question which is now settled.
