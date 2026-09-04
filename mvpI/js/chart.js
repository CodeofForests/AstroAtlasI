/*
 * Ties together TZ + ASTRO for a birth profile, and implements the
 * unknown-birth-time rule from product description §6: houses, Ascendant
 * and Midheaven are suppressed rather than guessed, the Moon is shown as a
 * range if it could be in more than one sign that day, and the chart says
 * plainly what's missing. Never silently defaults to noon as if it were a
 * real birth time.
 */

function computeChart(profile, houseSystem) {
  const place = profile.place;

  if (profile.unknownTime) {
    // We still need SOME instant to place the slower bodies (a day's motion
    // is well under one sign for everything except the Moon), but this is
    // an internal calculation anchor only — never shown to the user as a
    // birth time, and houses/Asc/MC are not computed at all.
    const noonWall = { year: profile.wall.year, month: profile.wall.month, day: profile.wall.day, hour: 12, minute: 0 };
    const noonUtc = new Date(TZ.localToUTC(noonWall, place.zone).utcMs);
    const { positions } = ASTRO.computePositions(noonUtc);

    const startWall = { year: profile.wall.year, month: profile.wall.month, day: profile.wall.day, hour: 0, minute: 1 };
    const endWall = { year: profile.wall.year, month: profile.wall.month, day: profile.wall.day, hour: 23, minute: 59 };
    const moonStart = ASTRO.computePositions(new Date(TZ.localToUTC(startWall, place.zone).utcMs)).positions.Moon;
    const moonEnd = ASTRO.computePositions(new Date(TZ.localToUTC(endWall, place.zone).utcMs)).positions.Moon;
    const moonSignStart = ASTRO.signOf(moonStart.lon);
    const moonSignEnd = ASTRO.signOf(moonEnd.lon);
    const moonRange = moonSignStart === moonSignEnd ? null : { from: moonSignStart, to: moonSignEnd };

    return {
      unknownTime: true,
      positions: positions,
      moonSign: moonSignStart,
      moonRange: moonRange,
      houses: null,
      asc: null,
      mc: null,
      houseSystem: houseSystem,
      aspects: ASTRO.computeAspects(positions)
    };
  }

  const utc = new Date(TZ.localToUTC(profile.wall, place.zone).utcMs);
  const { positions, obliquity, time } = ASTRO.computePositions(utc);
  const angles = ASTRO.computeAngles(time, place.lat, place.lon, obliquity);
  const placidus = ASTRO.placidusCusps(angles.ramc, place.lat, obliquity);
  const ascDegree = placidus[0], mcDegree = placidus[9];
  const cusps = houseSystem === "whole-sign" ? ASTRO.wholeSignCusps(ascDegree) : placidus;

  const withHouses = {};
  Object.keys(positions).forEach((b) => {
    withHouses[b] = Object.assign({}, positions[b], {
      house: ASTRO.houseOfLongitude(positions[b].lon, cusps)
    });
  });

  return {
    unknownTime: false,
    positions: withHouses,
    houses: cusps,
    asc: ascDegree,
    mc: mcDegree,
    houseSystem: houseSystem,
    utcInstant: utc,
    aspects: ASTRO.computeAspects(positions)
  };
}

// Inception chart: cast for the moment the user began Day 1 (their own
// starting gun) — product description §3. Uses the same engine, geocentric
// for the birthplace they entered (best available location proxy — a
// production build could ask for "where you are now" separately).
function computeInceptionChart(profile, startedAtISO, houseSystem) {
  const startedAt = new Date(startedAtISO);
  const place = profile.place;
  const { positions, obliquity, time } = ASTRO.computePositions(startedAt);
  const angles = ASTRO.computeAngles(time, place.lat, place.lon, obliquity);
  const cusps = ASTRO.placidusCusps(angles.ramc, place.lat, obliquity);
  const finalCusps = houseSystem === "whole-sign" ? ASTRO.wholeSignCusps(cusps[0]) : cusps;
  return {
    positions: positions,
    houses: finalCusps,
    asc: finalCusps[0],
    mc: finalCusps[9],
    at: startedAt
  };
}

// Galaxy Chart: midpoint composite of everyone currently in it (product
// description §5/§6). Derived Ascendant, with its limitation stated in the
// UI rather than presented as a precise angle (composite Ascendants are a
// known soft spot of the technique).
function computeCompositeChart(charts) {
  const composite = {};
  ASTRO.BODY_ORDER.forEach((body) => {
    const lons = charts.map((c) => c.positions[body] && c.positions[body].lon).filter((v) => v !== undefined);
    if (lons.length === 0) return;
    // circular midpoint via unit-vector averaging, shortest-arc correct
    let sx = 0, sy = 0;
    lons.forEach((lon) => {
      const r = (lon * Math.PI) / 180;
      sx += Math.cos(r);
      sy += Math.sin(r);
    });
    const meanAngle = (Math.atan2(sy / lons.length, sx / lons.length) * 180) / Math.PI;
    composite[body] = { lon: ASTRO.norm360(meanAngle) };
  });
  return { positions: composite };
}
