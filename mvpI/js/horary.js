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
 *                         / collects the light between them
 *   - the Moon's next aspect = what develops next
 *   - considerations before judgement = whether the chart is fit to read
 *
 * DESCRIPTIVE ONLY. It reports what the chart of that moment holds; it does
 * not pronounce yes / no. That keeps it inside the rest of the product's
 * voice (product description §6/§8) — the reveal shows, a person reads.
 *
 * Precision is prototype-level: applying/separating and the Moon's next
 * aspect are found by stepping the real ephemeris forward, good enough to
 * name the testimony, not to time it to the hour.
 */
const HORARY = (function () {
  "use strict";

  // Traditional (pre-modern) rulerships — the ones Goldstein-Jacobson uses.
  const SIGN_RULER = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
  };
  const BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const ASPECTS = [
    { name: "conjunction", angle: 0 },
    { name: "sextile", angle: 60 },
    { name: "square", angle: 90 },
    { name: "trine", angle: 120 },
    { name: "opposition", angle: 180 }
  ];

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

  // Retrograde = ecliptic longitude decreasing over a day (the Sun and Moon
  // never retrograde).
  function retroAt(body, when) {
    if (body === "Sun" || body === "Moon") return false;
    const a = positionsAt(when)[body];
    const b = positionsAt(new Date(when.getTime() + 86400000))[body];
    if (!a || !b) return false;
    let d = b.lon - a.lon;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d < 0;
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

  // Applying / separating between two bodies right now: compare the gap to
  // the nearest aspect's exact angle now vs. one hour on.
  function pairAspect(a, b, when) {
    const p0 = positionsAt(when);
    const p1 = positionsAt(new Date(when.getTime() + 3600 * 1000));
    if (!p0[a] || !p0[b]) return null;
    const s0 = sep(p0[a].lon, p0[b].lon);
    const s1 = sep(p1[a].lon, p1[b].lon);
    for (const asp of ASPECTS) {
      const d0 = Math.abs(s0 - asp.angle);
      if (d0 <= 8) {
        const d1 = Math.abs(s1 - asp.angle);
        return {
          aspect: asp.name,
          orb: d0,
          applying: d1 < d0 - 1e-4,
          separating: d1 > d0 + 1e-4
        };
      }
    }
    return null;
  }

  // The Moon's next exact aspect to one of the other six, or a void-of-course
  // finding if it leaves its sign first. Perfection is caught either as a
  // sign change of (sep - angle) (the sextile/square/trine case) or as the
  // gap collapsing to near zero then widening (the conjunction/opposition
  // case, where folded separation can't change sign).
  function moonNextAspect(when) {
    const start = positionsAt(when);
    const startSignIdx = Math.floor(norm360(start.Moon.lon) / 30);
    let prev = start;
    const stepMs = 2 * 3600 * 1000;
    for (let i = 1; i <= 200; i++) { // up to ~16 days
      const t = new Date(when.getTime() + i * stepMs);
      const cur = positionsAt(t);
      for (const b of BODIES) {
        if (b === "Moon") continue;
        for (const asp of ASPECTS) {
          const g0 = sep(prev.Moon.lon, prev[b].lon) - asp.angle;
          const g1 = sep(cur.Moon.lon, cur[b].lon) - asp.angle;
          const crossed = Math.sign(g0) !== Math.sign(g1) && Math.abs(g0) < 14;
          const closed = Math.abs(g0) < 1.2 && Math.abs(g1) < 1.2 && Math.abs(g1) > Math.abs(g0);
          if (crossed || closed) {
            return { voidOfCourse: false, to: b, aspect: asp.name, inDays: (i * stepMs) / 86400000 };
          }
        }
      }
      if (Math.floor(norm360(cur.Moon.lon) / 30) !== startSignIdx) {
        return { voidOfCourse: true };
      }
      prev = cur;
    }
    return { voidOfCourse: true };
  }

  // A third planet, faster than both significators, separating from one and
  // applying to the other — it carries the light between them.
  function translation(rulerA, rulerB, when) {
    if (!rulerA || !rulerB || rulerA === rulerB) return null;
    for (const b of BODIES) {
      if (b === rulerA || b === rulerB) continue;
      const toA = pairAspect(b, rulerA, when);
      const toB = pairAspect(b, rulerB, when);
      if (toA && toB && (toA.applying !== toB.applying) && (toA.applying || toB.applying)) {
        return { by: b, toA: toA, toB: toB };
      }
    }
    return null;
  }

  function combust(body, chart) {
    if (body === "Sun" || !chart.positions[body]) return false;
    return sep(chart.positions[body].lon, chart.positions.Sun.lon) <= 8.5;
  }

  // The "considerations before judgement" — is the chart fit to be read?
  function radical(chart) {
    const notes = [];
    const ascDeg = ASTRO.degInSign(chart.asc);
    if (ascDeg < 3) {
      notes.push("The Ascendant is in the first 3° of its sign — traditionally 'too early': the matter may not be ripe, or not enough is yet known to judge it.");
    } else if (ascDeg > 27) {
      notes.push("The Ascendant is in the last 3° of its sign — traditionally 'too late': the matter may already be decided, or out of the querent's hands.");
    }
    const moonLon = norm360(chart.positions.Moon.lon);
    if (moonLon >= 195 && moonLon <= 225) {
      notes.push("The Moon is in the 'via combusta' (15° Libra – 15° Scorpio) — an unsettled stretch that makes the reading less reliable.");
    }
    const satHouse = houseOf(chart.positions.Saturn.lon, chart.houses);
    if (satHouse === 1) {
      notes.push("Saturn is in the 1st house — traditionally this can bind the matter or the querent themselves; read with caution.");
    } else if (satHouse === 7) {
      notes.push("Saturn is in the 7th house — the old warning that the astrologer's own judgement may be off here.");
    }
    return { ok: notes.length === 0, notes: notes };
  }

  function bodyReport(body, chart) {
    if (!body || !chart.positions[body]) return null;
    const lon = chart.positions[body].lon;
    const flags = [];
    if (retroAt(body, chart.when)) flags.push("retrograde — going back over old ground, reconsidering or undoing");
    if (combust(body, chart)) flags.push("combust the Sun — overwhelmed or hidden by the situation");
    return {
      body: body,
      at: fmtDeg(lon),
      house: houseOf(lon, chart.houses),
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

    const between = (querentRuler && quesitedRuler && querentRuler !== quesitedRuler)
      ? pairAspect(querentRuler, quesitedRuler, when)
      : null;
    const trans = (!between || (!between.applying))
      ? translation(querentRuler, quesitedRuler, when)
      : null;

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
        sameRuler: querentRuler && querentRuler === quesitedRuler ? querentRuler : null,
        translation: trans
      },
      radical: radical(chart)
    };
  }

  return {
    TOPICS: TOPICS,
    SIGN_RULER: SIGN_RULER,
    cast: cast,
    judge: judge
  };
})();
