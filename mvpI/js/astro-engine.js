/*
 * Chart calculation engine.
 *
 * Positions for Sun..Pluto come straight from the vendored astronomy-engine
 * library (vendor/astronomy.browser.js, MIT — see Construction Site for the
 * decision to use it as a stand-in for the paid Swiss Ephemeris SDK).
 * The lunar nodes aren't in that library, so they're computed here (mean
 * node, Meeus). Chiron isn't either — its approximate two-body model was
 * too far off to ship, so it is DISABLED for MVP v1 (see computePositions).
 *
 * Method, declared per product description §6:
 *  - tropical zodiac
 *  - Placidus houses by default, Whole Sign toggle
 *  - Sun–Pluto + mean lunar nodes (Chiron and asteroids off)
 *  - Ptolemaic major aspects, orb table below
 */

const ASTRO = (function () {
  "use strict";

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;

  function norm360(x) {
    let v = x % 360;
    if (v < 0) v += 360;
    return v;
  }
  function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }

  const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  // "Chiron" intentionally omitted for MVP v1 — see computePositions().
  const BODY_ORDER = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
    "Uranus", "Neptune", "Pluto", "NorthNode", "SouthNode"
  ];

  // Ptolemaic majors, published orb table (degrees). Luminaries get a wider
  // orb, consistent with common practice — stated openly per product §6.
  const ASPECTS = [
    { name: "Conjunction", angle: 0, symbol: "☌" },
    { name: "Sextile", angle: 60, symbol: "⚹" },
    { name: "Square", angle: 90, symbol: "□" },
    { name: "Trine", angle: 120, symbol: "△" },
    { name: "Opposition", angle: 180, symbol: "☍" }
  ];
  function orbFor(bodyA, bodyB) {
    const luminaries = bodyA === "Sun" || bodyA === "Moon" || bodyB === "Sun" || bodyB === "Moon";
    return luminaries ? 8 : 6;
  }

  function signOf(lon) {
    return SIGNS[Math.floor(norm360(lon) / 30)];
  }
  function degInSign(lon) {
    return norm360(lon) % 30;
  }

  // ---------- ecliptic <-> equatorial for a point ON the ecliptic (lat=0) ----------
  // For any ecliptic point (lon=lam, lat=0), lam and its right ascension
  // relate by the same rotation used for the Midheaven — this identity is
  // what makes the Placidus solver below invertible in closed form at each
  // iteration step.
  function raOfEclipticPoint(lamDeg, oblDeg) {
    const lam = lamDeg * D2R, ob = oblDeg * D2R;
    return norm360(Math.atan2(Math.sin(lam) * Math.cos(ob), Math.cos(lam)) * R2D);
  }
  function eclLonFromRA(raDeg, oblDeg) {
    const ra = raDeg * D2R, ob = oblDeg * D2R;
    return norm360(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(ob)) * R2D);
  }
  function declinationOf(lamDeg, oblDeg) {
    const lam = lamDeg * D2R, ob = oblDeg * D2R;
    return Math.asin(clamp(Math.sin(ob) * Math.sin(lam), -1, 1)) * R2D;
  }
  // Diurnal semi-arc: half the time (in degrees of RA) a point spends above
  // the horizon at this latitude. Circumpolar/never-rises cases are clamped.
  function semiDiurnalArc(lamDeg, latDeg, oblDeg) {
    const dec = declinationOf(lamDeg, oblDeg) * D2R;
    const lat = latDeg * D2R;
    const cosH = clamp(-Math.tan(lat) * Math.tan(dec), -1, 1);
    return Math.acos(cosH) * R2D;
  }

  function meanObliquityDeg(T) {
    // Meeus, low-precision mean obliquity (arcsec terms), T = Julian centuries from J2000 TT.
    const arcsec = 46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T;
    return 23 + 26 / 60 + 21.448 / 3600 - arcsec / 3600;
  }

  /**
   * Fixed-point solver for one Placidus cusp: given a function that computes
   * the target right ascension from the current longitude guess (because the
   * semi-arc depends on the point's own declination), iterate to convergence.
   */
  function solveCusp(targetRAFn, oblDeg, initialGuessDeg) {
    let lam = initialGuessDeg;
    for (let i = 0; i < 12; i++) {
      lam = eclLonFromRA(norm360(targetRAFn(lam)), oblDeg);
    }
    return lam;
  }

  function placidusCusps(ramcDeg, latDeg, oblDeg) {
    const mc = eclLonFromRA(ramcDeg, oblDeg);
    const ic = norm360(mc + 180);
    const asc = solveCusp(
      (lam) => ramcDeg + semiDiurnalArc(lam, latDeg, oblDeg),
      oblDeg,
      norm360(ramcDeg + 90)
    );
    const c11 = solveCusp(
      (lam) => ramcDeg + semiDiurnalArc(lam, latDeg, oblDeg) / 3,
      oblDeg,
      norm360(ramcDeg + 30)
    );
    const c12 = solveCusp(
      (lam) => ramcDeg + (2 * semiDiurnalArc(lam, latDeg, oblDeg)) / 3,
      oblDeg,
      norm360(ramcDeg + 60)
    );
    // Houses 2/3 mirror 12/11 using the point's own NOCTURNAL semi-arc
    // (NSA = 180 - SA), measured back from the IC (RAMC+180) instead of the MC.
    const c3 = solveCusp(
      (lam) => ramcDeg + 180 - (180 - semiDiurnalArc(lam, latDeg, oblDeg)) / 3,
      oblDeg,
      norm360(ramcDeg + 210)
    );
    const c2 = solveCusp(
      (lam) => ramcDeg + 180 - (2 * (180 - semiDiurnalArc(lam, latDeg, oblDeg))) / 3,
      oblDeg,
      norm360(ramcDeg + 240)
    );

    const cusps = new Array(12);
    cusps[9] = mc;                  // house 10
    cusps[10] = c11;                // house 11
    cusps[11] = c12;                // house 12
    cusps[0] = asc;                 // house 1
    cusps[1] = c2;                  // house 2
    cusps[2] = c3;                  // house 3
    cusps[3] = ic;                   // house 4
    cusps[4] = norm360(c11 + 180);  // house 5
    cusps[5] = norm360(c12 + 180);  // house 6
    cusps[6] = norm360(asc + 180);  // house 7
    cusps[7] = norm360(c2 + 180);   // house 8
    cusps[8] = norm360(c3 + 180);   // house 9
    return cusps;
  }

  function wholeSignCusps(ascLon) {
    const startSign = Math.floor(norm360(ascLon) / 30) * 30;
    const cusps = new Array(12);
    for (let i = 0; i < 12; i++) cusps[i] = norm360(startSign + i * 30);
    return cusps;
  }

  function houseOfLongitude(lon, cusps) {
    const L = norm360(lon);
    for (let i = 0; i < 12; i++) {
      const start = cusps[i];
      const end = cusps[(i + 1) % 12];
      const span = norm360(end - start) || 360;
      const rel = norm360(L - start);
      if (rel < span) return i + 1;
    }
    return 12;
  }

  // ---------- Chiron: approximate two-body Keplerian propagation ----------
  // Not in the vendored library. Elements below are mean/osculating values
  // near J2000 (heliocentric ecliptic, no planetary perturbation modelled) —
  // adequate for an MVP prototype's "one thing to notice a day," NOT
  // production precision. Flagged in the UI; verify against the real
  // ephemeris once the paid Swiss Ephemeris SDK is in place.
  const CHIRON_ELEMENTS = {
    epochJD: 2451545.0, // J2000.0
    a: 13.6410,          // semi-major axis, AU
    e: 0.38276,
    i: 6.9308,            // deg
    Om: 209.2966,         // longitude of ascending node, deg
    w: 339.3928,          // argument of perihelion, deg
    M0: 143.0526,         // mean anomaly at epoch, deg
    periodDays: 18456     // ~50.5 years
  };

  function solveKepler(Mdeg, e) {
    const M = norm360(Mdeg) * D2R;
    let E = M;
    for (let i = 0; i < 30; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
  }

  function chironHeliocentricEclJ2000(jd) {
    const el = CHIRON_ELEMENTS;
    const n = 360 / el.periodDays; // deg/day mean motion
    const M = el.M0 + n * (jd - el.epochJD);
    const E = solveKepler(M, el.e);
    const xOrb = el.a * (Math.cos(E) - el.e);
    const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    const w = el.w * D2R, Om = el.Om * D2R, inc = el.i * D2R;
    const cosW = Math.cos(w), sinW = Math.sin(w);
    const cosOm = Math.cos(Om), sinOm = Math.sin(Om);
    const cosI = Math.cos(inc), sinI = Math.sin(inc);
    const xh = (cosW * cosOm - sinW * sinOm * cosI) * xOrb + (-sinW * cosOm - cosW * sinOm * cosI) * yOrb;
    const yh = (cosW * sinOm + sinW * cosOm * cosI) * xOrb + (-sinW * sinOm + cosW * cosOm * cosI) * yOrb;
    const zh = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;
    return { x: xh, y: yh, z: zh };
  }

  function chironGeocentricEclOfDate(astroTime, earthHelioEqjVec, oblDeg) {
    const jd = 2451545.0 + astroTime.tt;
    const helioEclJ2000 = chironHeliocentricEclJ2000(jd);
    // Rotate ecliptic-J2000 -> equatorial-J2000 (fixed J2000 obliquity), then
    // subtract Earth's heliocentric equatorial-J2000 vector to get geocentric,
    // then hand off to the library's Ecliptic() for ecliptic-of-date angles —
    // same convention as every other body, for consistent aspects/houses.
    const eps0 = 23.4392911 * D2R;
    const xe = helioEclJ2000.x;
    const ye = helioEclJ2000.y * Math.cos(eps0) - helioEclJ2000.z * Math.sin(eps0);
    const ze = helioEclJ2000.y * Math.sin(eps0) + helioEclJ2000.z * Math.cos(eps0);
    const gx = xe - earthHelioEqjVec.x;
    const gy = ye - earthHelioEqjVec.y;
    const gz = ze - earthHelioEqjVec.z;
    const vec = new Astronomy.Vector(gx, gy, gz, astroTime);
    return Astronomy.Ecliptic(vec);
  }

  // Mean lunar node (Meeus 22.2), degrees, T = Julian centuries from J2000 TT.
  function meanNodeLongitude(T) {
    return norm360(
      125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000
    );
  }

  /**
   * @param {Date} utcDate - JS Date, UTC instant of birth
   * @returns {{positions:object, meta:object}}
   */
  function computePositions(utcDate) {
    const time = Astronomy.MakeTime(utcDate);
    const T = time.tt / 36525;
    const positions = {};

    ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].forEach(
      (body) => {
        const vec = Astronomy.GeoVector(body, time, true);
        const ecl = Astronomy.Ecliptic(vec);
        positions[body] = { lon: norm360(ecl.elon), lat: ecl.elat };
      }
    );

    // Chiron is DISABLED for MVP v1. The two-body Keplerian propagation below
    // (chironHeliocentricEclJ2000 / chironGeocentricEclOfDate) has no planetary
    // perturbation term and was landing 60–170° from Swiss Ephemeris — a whole
    // sign-opposition wrong on real data. It adds nothing to the 21-day journey,
    // so it is not computed or shown. Re-enable together with the real
    // ephemeris (Construction Site: "Chiron precision …"). The helper functions
    // are left in place, unreferenced, for that swap.
    // const earthHelio = Astronomy.HelioVector("Earth", time);
    // const chironEcl = chironGeocentricEclOfDate(time, earthHelio);
    // positions.Chiron = { lon: norm360(chironEcl.elon), lat: chironEcl.elat, approximate: true };

    const node = meanNodeLongitude(T);
    positions.NorthNode = { lon: node, lat: 0, mean: true };
    positions.SouthNode = { lon: norm360(node + 180), lat: 0, mean: true };

    return { positions: positions, obliquity: meanObliquityDeg(T), time: time };
  }

  function computeAngles(time, latDeg, lonDeg, obliquityDeg) {
    const gastHours = Astronomy.SiderealTime(time);
    const ramc = norm360(gastHours * 15 + lonDeg);
    const mc = eclLonFromRA(ramc, obliquityDeg);
    return { ramc: ramc, mc: mc };
  }

  function computeAspects(positions) {
    const names = BODY_ORDER.filter((b) => positions[b] && b !== "SouthNode");
    const found = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i], b = names[j];
        const diff = Math.abs(norm360(positions[a].lon - positions[b].lon));
        const angle = diff > 180 ? 360 - diff : diff;
        const orb = orbFor(a, b);
        for (const asp of ASPECTS) {
          const delta = Math.abs(angle - asp.angle);
          if (delta <= orb) {
            found.push({ a: a, b: b, aspect: asp.name, symbol: asp.symbol, orb: Math.round(delta * 100) / 100 });
            break;
          }
        }
      }
    }
    return found;
  }

  return {
    SIGNS: SIGNS,
    BODY_ORDER: BODY_ORDER,
    ASPECTS: ASPECTS,
    norm360: norm360,
    signOf: signOf,
    degInSign: degInSign,
    computePositions: computePositions,
    computeAngles: computeAngles,
    placidusCusps: placidusCusps,
    wholeSignCusps: wholeSignCusps,
    houseOfLongitude: houseOfLongitude,
    computeAspects: computeAspects
  };
})();
