/*
 * The regression set from product description §12. This is the Phase 0 exit
 * gate: correctness of the four cases, and — critically — the two Zhuhai
 * charts 15 minutes apart must be flagged as near-identical rather than
 * presented as two unrelated readings.
 */

const REGRESSION_CASES = [
  {
    label: "Founder's baseline — Zhuhai CN",
    wall: { year: 1985, month: 8, day: 16, hour: 17, minute: 25 },
    place: { name: "Zhuhai, China", lat: 22.2769, lon: 113.5678, zone: "Asia/Shanghai" },
    expectOffsetMinutes: 480,
    note: "Pre-1986 China had no DST → UTC+8"
  },
  {
    label: "Degeneracy pair — Zhuhai CN, 15 min later",
    wall: { year: 1985, month: 8, day: 16, hour: 17, minute: 40 },
    place: { name: "Zhuhai, China", lat: 22.2769, lon: 113.5678, zone: "Asia/Shanghai" },
    expectOffsetMinutes: 480,
    note: "Must be flagged as near-identical to case 1, not a separate reading"
  },
  {
    label: "Erding, West Germany",
    wall: { year: 1963, month: 9, day: 9, hour: 20, minute: 20 },
    place: { name: "Erding, Germany", lat: 48.3086, lon: 11.9034, zone: "Europe/Berlin" },
    expectOffsetMinutes: 60,
    note: "West Germany had no summer time in 1963 → CET, UTC+1"
  },
  {
    label: "Ningbo CN",
    wall: { year: 1981, month: 11, day: 18, hour: 11, minute: 38 },
    place: { name: "Ningbo, China", lat: 29.8683, lon: 121.5440, zone: "Asia/Shanghai" },
    expectOffsetMinutes: 480,
    note: "Second pre-1986 China historical-offset case"
  }
];

function runRegressionSet() {
  const results = REGRESSION_CASES.map((c) => {
    const tz = TZ.localToUTC(c.wall, c.place.zone);
    const utcDate = new Date(tz.utcMs);
    const { positions, obliquity, time } = ASTRO.computePositions(utcDate);
    const angles = ASTRO.computeAngles(time, c.place.lat, c.place.lon, obliquity);
    const cusps = ASTRO.placidusCusps(angles.ramc, c.place.lat, angles.mc !== undefined ? obliquity : obliquity);
    const offsetOk = tz.offsetMinutes === c.expectOffsetMinutes;
    return {
      case: c,
      utcDate: utcDate,
      offsetMinutes: tz.offsetMinutes,
      offsetOk: offsetOk,
      positions: positions,
      mc: angles.mc,
      asc: cusps[0]
    };
  });

  // Degeneracy check: cases[0] and cases[1] are the same chart 15 minutes
  // apart. Bodies (Sun..Pluto, Chiron, Node) barely move in 15 minutes — if
  // they DID move a lot, that would signal a bug. Ascendant/MC/houses move
  // roughly 1 degree every 4 minutes at moderate latitudes, so a several-
  // degree shift there over 15 minutes is correct astronomy, not noise —
  // it's the specific "small thing that differs" the product description
  // asks the tool to name out loud, rather than either hiding it or
  // presenting the two charts as unrelated.
  const a = results[0], b = results[1];
  let maxBodyDelta = 0;
  ASTRO.BODY_ORDER.forEach((body) => {
    if (a.positions[body] && b.positions[body]) {
      const d = Math.abs(ASTRO.norm360(a.positions[body].lon - b.positions[body].lon));
      maxBodyDelta = Math.max(maxBodyDelta, Math.min(d, 360 - d));
    }
  });
  const ascDeltaRaw = Math.abs(ASTRO.norm360(a.asc - b.asc));
  const ascDelta = Math.min(ascDeltaRaw, 360 - ascDeltaRaw);
  const mcDeltaRaw = Math.abs(ASTRO.norm360(a.mc - b.mc));
  const mcDelta = Math.min(mcDeltaRaw, 360 - mcDeltaRaw);
  const bodiesEssentiallyUnchanged = maxBodyDelta < 1; // degrees
  const degeneracyFlagged = bodiesEssentiallyUnchanged;

  return {
    results: results,
    maxBodyDelta: maxBodyDelta,
    ascDelta: ascDelta,
    mcDelta: mcDelta,
    degeneracyFlagged: degeneracyFlagged
  };
}
