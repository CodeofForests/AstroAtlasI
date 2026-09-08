/*
 * Horary layer — casts a chart for the moment a question first struck (a
 * logged "strong thought") and surfaces the factors a traditional reading
 * leans on, in the systematic style of Ivy M. Goldstein-Jacobson's
 * "Simplified Horary Astrology":
 *
 *   - the querent      = the Ascendant, its ruler, and the Moon
 *   - the quesited      = the house of the matter, its ruler, and whoever
 *                         sits in that house
 *   - the connection    = whether the two significators are applying or
 *                         separating, or whether a third planet translates
 *                         or collects the light between them
 *   - the Moon's next aspect = what develops next
 *   - essential dignity = how much standing each significator has
 *   - considerations before judgement = whether the chart is fit to read
 *
 * DESCRIPTIVE ONLY. It reports what the chart of that moment holds; it does
 * not pronounce yes / no. That keeps it inside the rest of the product's
 * voice (product description §6/§8) — the reveal shows, a person reads.
 *
 * Precision (depth pass, 2026-09-08):
 *  - applying / separating uses an instantaneous longitude rate (a 1-minute
 *    central difference), traditional moiety-sum orbs, and estimates the
 *    time to perfection from the relative speed.
 *  - the Moon's next aspect is found by 20-minute stepping to bracket a
 *    perfection, then bisected to the minute; the earliest perfection in a
 *    step wins; leaving the sign first = void of course.
 *  - essential dignity: domicile / exaltation / detriment / fall / peregrine
 *    for each significator (used lightly, as Goldstein-Jacobson does).
 *  - collection of light (a slower planet both significators apply to) is
 *    detected alongside translation.
 *  - retrograde and "stationary" read off the same instantaneous rate,
 *    not a one-day chord.
 * Still a prototype standing in for the paid Swiss Ephemeris SDK — the
 * vendored astronomy-engine has no native speed term, hence the finite
 * difference. Good to the minute for the Moon, well inside a degree for
 * everything else.
 */
const HORARY = (function () {
  "use strict";

  const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  // Traditional (pre-modern) rulerships — the ones Goldstein-Jacobson uses.
  const SIGN_RULER = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
  };
  // Sign of exaltation for each of the seven.
  const EXALTATION = {
    Sun: "Aries", Moon: "Taurus", Mercury: "Virgo", Venus: "Pisces",
    Mars: "Capricorn", Jupiter: "Cancer", Saturn: "Libra"
  };
  const BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

  // Traditional whole orbs (degrees). The operative orb between two bodies
  // is the sum of their moieties (half-orbs) — the Lilly / Goldstein-Jacobson
  // rule for whether an aspect "counts".
  const WHOLE_ORB = { Sun: 15, Moon: 12, Mercury: 7, Venus: 7, Mars: 8, Jupiter: 9, Saturn: 9 };
  function moiety(b) { return (WHOLE_ORB[b] || 8) / 2; }
  function pairOrbLimit(a, b) { return moiety(a) + moiety(b); }

  // Rough typical daily motion (deg/day); a body is called "stationary" when
  // it is crawling at under a tenth of this.
  const TYPICAL_SPEED = { Sun: 0.99, Moon: 13.2, Mercury: 1.4, Venus: 1.2, Mars: 0.52, Jupiter: 0.083, Saturn: 0.034 };

  const ASPECTS = [
    { name: "conjunction", angle: 0 },
    { name: "sextile", angle: 60 },
    { name: "square", angle: 90 },
    { name: "trine", angle: 120 },
    { name: "opposition", angle: 180 }
  ];
  // The signed separations (a.lon - b.lon, wrapped to 0..360) at which each
  // aspect perfects. Conjunction/opposition have one; the rest have two.
  function aspectTargets(angle) {
    return (angle === 0 || angle === 180) ? [angle] : [angle, 360 - angle];
  }

  // The twelve houses, phrased as a horary "matter" rather than a natal theme.
  const TOPICS = [
    { key: "self", house: 1, label: "Myself / how this will go for me", hint: "a general 'how does this turn out' question" },
    { key: "money", house: 2, label: "Money, income, a possession", hint: "earning, a purchase, something owned" },
    { key: "family", house: 4, label: "Home, family, property, a parent", hint: "the house, moving, where you come from" },
    { key: "creative", house: 5, label: "A child, a romance, a creative project", hint: "dating, pregnancy, something you're making" },
    { key: "work_health", house: 6, label: "Day-to-day work, health, a coworker", hint: "a job task, an illness, a pet" },
    { key: "relationship", house: 7, label: "A partner, an opponent, an open enemy", hint: "marriage, a business partner, a dispute" },
    { key: "shared", house: 8, label: "Shared money, a loan, a deep change", hint: "debt, inheritance, other people's resources" },
    { key: "belief_travel", house: 9, label: "Study, travel, a legal or belief matter", hint: "a course, a long trip, a court case" },
    { key: "career", house: 10, label: "Career, reputation, a boss", hint: "a promotion, public standing, authority" },
    { key: "hopes", house: 11, label: "A friend, a group, something hoped for", hint: "a wish, a community, an ally" }
  ];

  function norm360(x) { return ((x % 360) + 360) % 360; }
  function wrapPm180(x) { const v = norm360(x); return v > 180 ? v - 360 : v; }
  function sep(a, b) {
    const d = Math.abs(norm360(a) - norm360(b)) % 360;
    return d > 180 ? 360 - d : d;
  }
  function fmtDeg(lon) {
    return ASTRO.signOf(lon) + " " + ASTRO.degInSign(lon).toFixed(1) + "°";
  }
  function positionsAt(date) {
    return ASTRO.computePositions(date).positions;
  }

  // Instantaneous ecliptic-longitude rate, deg/day, from a 1-minute central
  // difference on the real ephemeris. Negative = retrograde. The vendored
  // engine exposes no velocity term, so this is the honest substitute — and
  // at a 1-minute step it is accurate to well under an arcsecond per day.
  function lonRate(body, when) {
    const dtMs = 60 * 1000;
    const before = positionsAt(new Date(when.getTime() - dtMs))[body];
    const after = positionsAt(new Date(when.getTime() + dtMs))[body];
    if (!before || !after) return 0;
    const dLon = wrapPm180(after.lon - before.lon);
    return dLon / (2 * dtMs / 86400000);
  }

  function isRetro(body, when) {
    if (body === "Sun" || body === "Moon") return false;
    return lonRate(body, when) < 0;
  }
  function isStationary(body, when) {
    if (body === "Sun" || body === "Moon") return false;
    const typ = TYPICAL_SPEED[body] || 1;
    return Math.abs(lonRate(body, when)) < 0.1 * typ;
  }

  // Cast the chart for the thought's moment and place. Horary is read on
  // Placidus regardless of the natal house-system preference.
  function cast(thought) {
    const when = new Date(thought.atISO);
    const place = thought.place;
    const { positions, obliquity, time } = ASTRO.computePositions(when);
    const angles = ASTRO.computeAngles(time, place.lat, place.lon, obliquity);
    const cusps = ASTRO.placidusCusps(angles.ramc, place.lat, obliquity);
    return {
      when: when,
      positions: positions,
      houses: cusps,
      asc: cusps[0],
      mc: cusps[9],
      unknownTime: false,
      aspects: []
    };
  }

  function houseOf(lon, cusps) {
    return ASTRO.houseOfLongitude(lon, cusps);
  }

  // Which of the 7 visible bodies sit in a given house.
  function occupantsOf(house, chart) {
    return BODIES.filter((b) => chart.positions[b] && houseOf(chart.positions[b].lon, chart.houses) === house);
  }

  // ---------- essential dignity (used lightly) ----------
  function domicileSignsOf(body) {
    return Object.keys(SIGN_RULER).filter((s) => SIGN_RULER[s] === body);
  }
  function oppositeSign(sign) {
    return SIGNS[(SIGNS.indexOf(sign) + 6) % 12];
  }
  function dignityOf(body, lon) {
    const sign = ASTRO.signOf(lon);
    const homes = domicileSignsOf(body);
    if (homes.indexOf(sign) !== -1) return { status: "domicile" };
    if (EXALTATION[body] === sign) return { status: "exaltation" };
    if (homes.map(oppositeSign).indexOf(sign) !== -1) return { status: "detriment" };
    if (EXALTATION[body] && oppositeSign(EXALTATION[body]) === sign) return { status: "fall" };
    return { status: "peregrine" };
  }

  // ---------- solar condition ----------
  // cazimi (heart of the Sun, 17'), combust (<=8.5°), under the beams (<=15°).
  function solarConditionOf(body, chart) {
    if (body === "Sun" || !chart.positions[body]) return null;
    const d = sep(chart.positions[body].lon, chart.positions.Sun.lon);
    if (d <= 17 / 60) return "cazimi";
    if (d <= 8.5) return "combust";
    if (d <= 15) return "under-beams";
    return null;
  }

  // ---------- applying / separating between two bodies ----------
  // Uses the instantaneous relative rate. Returns the tightest Ptolemaic
  // aspect within the moiety-sum orb, whether it is applying (the signed gap
  // to exact is shrinking) or separating, the current orb, and — when
  // applying — an estimate of days to perfection from the relative speed.
  function pairAspect(a, b, when) {
    const p = positionsAt(when);
    if (!p[a] || !p[b]) return null;
    const s = norm360(p[a].lon - p[b].lon);        // 0..360
    const vRel = lonRate(a, when) - lonRate(b, when); // deg/day, how s changes
    const limit = pairOrbLimit(a, b);
    let best = null;
    for (const asp of ASPECTS) {
      for (const target of aspectTargets(asp.angle)) {
        const gap = wrapPm180(s - target);          // signed degrees to exact
        const orb = Math.abs(gap);
        if (orb > limit) continue;
        // |gap| shrinks when gap and vRel have opposite signs.
        const closing = (gap > 0 && vRel < 0) || (gap < 0 && vRel > 0);
        const rate = Math.abs(vRel);
        const perfectsInDays = (closing && rate > 1e-9) ? orb / rate : null;
        if (!best || orb < best.orb) {
          best = {
            aspect: asp.name,
            orb: orb,
            exact: orb <= 1e-3,
            applying: closing && orb > 1e-3,
            separating: !closing && orb > 1e-3,
            perfectsInDays: perfectsInDays
          };
        }
      }
    }
    return best;
  }

  // ---------- the Moon's next aspect ----------
  // Step 30 minutes at a time (one ephemeris sample per step, reused between
  // steps); when the signed gap to an aspect's exact value changes sign,
  // bisect that interval to the minute. The earliest perfection in a step
  // wins. If the Moon leaves its sign first — it can't stay void longer than
  // it takes to cross one — it is void of course. Capped at 3.5 days: the
  // Moon always aspects something, or changes sign, well inside that.
  function moonNextAspect(when) {
    const startP = positionsAt(when);
    const startSignIdx = Math.floor(norm360(startP.Moon.lon) / 30);
    const stepMs = 30 * 60 * 1000;
    const maxSteps = Math.ceil((3.5 * 24 * 60) / 30);

    function gapFromPos(pos, body, target) {
      return wrapPm180(norm360(pos.Moon.lon - pos[body].lon) - target);
    }

    let prevMs = when.getTime();
    let prevP = startP;
    for (let i = 1; i <= maxSteps; i++) {
      const curMs = when.getTime() + i * stepMs;
      const curP = positionsAt(new Date(curMs));

      if (Math.floor(norm360(curP.Moon.lon) / 30) !== startSignIdx) {
        return { voidOfCourse: true, intoSign: ASTRO.signOf(curP.Moon.lon) };
      }

      let earliest = null;
      for (const b of BODIES) {
        if (b === "Moon") continue;
        for (const asp of ASPECTS) {
          for (const target of aspectTargets(asp.angle)) {
            const g0 = gapFromPos(prevP, b, target);
            const g1 = gapFromPos(curP, b, target);
            if (Math.sign(g0) === Math.sign(g1)) continue;
            if (Math.abs(g0) > 20 || Math.abs(g1) > 20) continue; // wrap-seam guard
            let lo = prevMs, hi = curMs, gLo = g0;
            for (let k = 0; k < 32; k++) {
              const mid = (lo + hi) / 2;
              const gm = gapFromPos(positionsAt(new Date(mid)), b, target);
              if (Math.sign(gm) === Math.sign(gLo)) { lo = mid; gLo = gm; }
              else { hi = mid; }
            }
            const perfMs = (lo + hi) / 2;
            if (!earliest || perfMs < earliest.perfMs) {
              earliest = { perfMs: perfMs, to: b, aspect: asp.name };
            }
          }
        }
      }
      if (earliest) {
        const perfDate = new Date(earliest.perfMs);
        return {
          voidOfCourse: false,
          to: earliest.to,
          aspect: earliest.aspect,
          perfectsAt: perfDate,
          inDays: (earliest.perfMs - when.getTime()) / 86400000,
          exactLon: positionsAt(perfDate).Moon.lon
        };
      }
      prevMs = curMs;
      prevP = curP;
    }
    return { voidOfCourse: true };
  }

  // ---------- translation of light ----------
  // A third planet, faster than the significator it is applying to,
  // separating from the other and applying to the one — it carries the
  // light between them.
  function translation(rulerA, rulerB, when) {
    if (!rulerA || !rulerB || rulerA === rulerB) return null;
    const vA = Math.abs(lonRate(rulerA, when));
    const vB = Math.abs(lonRate(rulerB, when));
    for (const c of BODIES) {
      if (c === rulerA || c === rulerB) continue;
      const vC = Math.abs(lonRate(c, when));
      const toA = pairAspect(c, rulerA, when);
      const toB = pairAspect(c, rulerB, when);
      if (!toA || !toB) continue;
      if (toA.applying && toB.separating && vC > vA) return { by: c, from: rulerB, to: rulerA };
      if (toB.applying && toA.separating && vC > vB) return { by: c, from: rulerA, to: rulerB };
    }
    return null;
  }

  // ---------- collection of light ----------
  // A slower planet that BOTH significators are applying to — it gathers
  // their light and brings the matter together through itself.
  function collection(rulerA, rulerB, when) {
    if (!rulerA || !rulerB || rulerA === rulerB) return null;
    const vA = Math.abs(lonRate(rulerA, when));
    const vB = Math.abs(lonRate(rulerB, when));
    for (const c of BODIES) {
      if (c === rulerA || c === rulerB) continue;
      const vC = Math.abs(lonRate(c, when));
      if (!(vC < vA && vC < vB)) continue;
      const toA = pairAspect(c, rulerA, when);
      const toB = pairAspect(c, rulerB, when);
      if (toA && toB && toA.applying && toB.applying) {
        return { by: c, toA: toA, toB: toB };
      }
    }
    return null;
  }

  // ---------- considerations before judgement ----------
  function radical(chart, moonNext) {
    const notes = [];
    const ascDeg = ASTRO.degInSign(chart.asc);
    if (ascDeg < 3) {
      notes.push("The picture looks very fresh — like walking in right at the start of a film. It may be too soon to tell how this one goes.");
    } else if (ascDeg > 27) {
      notes.push("The picture looks nearly finished — like walking in at the end of a film. This may already be decided.");
    }
    const moonLon = norm360(chart.positions.Moon.lon);
    if (moonLon >= 195 && moonLon <= 225) {
      notes.push("The fast Moon is crossing a bumpy patch of sky right now. Read the picture gently — it's a bit wobbly.");
    }
    const satHouse = houseOf(chart.positions.Saturn.lon, chart.houses);
    if (satHouse === 1) {
      notes.push("A big, slow, heavy star (Saturn) is sitting right at the front of the picture. It can make things stick or go slowly — take it gently.");
    } else if (satHouse === 7) {
      notes.push("A big, slow, heavy star (Saturn) is sitting across from you in the picture. An old rule says: be extra careful reading this one.");
    }
    if (moonNext && moonNext.voidOfCourse) {
      notes.push("The Moon has finished making contacts for now — an old sign that the matter may just not come to much, whatever anyone does.");
    }
    return { ok: notes.length === 0, notes: notes };
  }

  function bodyReport(body, chart) {
    if (!body || !chart.positions[body]) return null;
    const lon = chart.positions[body].lon;
    const rate = lonRate(body, chart.when);
    const retro = isRetro(body, chart.when);
    const stationary = isStationary(body, chart.when);
    const dignity = dignityOf(body, lon);
    const solar = solarConditionOf(body, chart);

    const flags = [];
    if (retro) flags.push("walking backwards — going back over something already done");
    else if (stationary) flags.push("almost at a standstill — about to change direction");
    if (solar === "cazimi") flags.push("right in the heart of the Sun — unusually strong, 'in the king's seat'");
    else if (solar === "combust") flags.push("so close to the Sun it's dazzled — hard to see clearly");
    else if (solar === "under-beams") flags.push("close to the Sun's glare — a little washed out");

    return {
      body: body,
      at: fmtDeg(lon),
      house: houseOf(lon, chart.houses),
      speedPerDay: rate,
      retro: retro,
      stationary: stationary,
      dignity: dignity,
      solar: solar,
      flags: flags
    };
  }

  // Full descriptive reading. `topicHouse` is the house of the matter (from
  // TOPICS). Returns structured factors; the UI lays them out.
  function judge(thought, topicHouse) {
    const chart = cast(thought);
    const when = chart.when;

    const ascSign = ASTRO.signOf(chart.asc);
    const querentRuler = SIGN_RULER[ascSign];

    const cuspLon = chart.houses[topicHouse - 1];
    const quesitedSign = ASTRO.signOf(cuspLon);
    const quesitedRuler = SIGN_RULER[quesitedSign];

    const sameRuler = (querentRuler && querentRuler === quesitedRuler) ? querentRuler : null;
    const between = (querentRuler && quesitedRuler && !sameRuler)
      ? pairAspect(querentRuler, quesitedRuler, when)
      : null;
    const directlyApplying = between && between.applying;
    const trans = (!directlyApplying) ? translation(querentRuler, quesitedRuler, when) : null;
    const coll = (!directlyApplying && !trans) ? collection(querentRuler, quesitedRuler, when) : null;

    const moon = moonNextAspect(when);
    const moonHouse = houseOf(chart.positions.Moon.lon, chart.houses);

    return {
      chart: chart,
      when: when,
      querent: {
        ascSign: ascSign,
        ruler: bodyReport(querentRuler, chart),
        moon: {
          at: fmtDeg(chart.positions.Moon.lon),
          house: moonHouse,
          speedPerDay: Math.abs(lonRate("Moon", when)),
          next: moon
        }
      },
      quesited: {
        house: topicHouse,
        cuspSign: quesitedSign,
        ruler: bodyReport(quesitedRuler, chart),
        occupants: occupantsOf(topicHouse, chart).filter((b) => b !== querentRuler)
      },
      connection: {
        between: between,
        sameRuler: sameRuler,
        translation: trans,
        collection: coll
      },
      radical: radical(chart, moon)
    };
  }

  return {
    TOPICS: TOPICS,
    SIGN_RULER: SIGN_RULER,
    cast: cast,
    judge: judge
  };
})();
