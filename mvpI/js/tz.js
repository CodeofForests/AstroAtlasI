/*
 * Historical timezone resolution.
 *
 * Browsers ship the full IANA tzdata (including historical rules — pre-1986
 * China, 1963 West Germany, etc.) inside their ICU implementation. We don't
 * need to vendor a separate tzdata copy: Intl.DateTimeFormat already knows,
 * for any IANA zone name and any date, what the correct UTC offset was.
 *
 * localToUTC() takes wall-clock birth data (as entered by the user, in the
 * birthplace's own local time) plus an IANA zone name, and finds the UTC
 * instant that produces those exact wall-clock numbers in that zone. This is
 * the standard "zoned time -> UTC" trick: guess, read back what the guess
 * displays as local time in that zone, correct by the difference, repeat
 * until stable (two iterations is enough because civil offsets only change
 * at whole-minute boundaries).
 */

const TZ = (function () {
  "use strict";

  function partsAt(utcMs, zone) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = {};
    fmt.formatToParts(new Date(utcMs)).forEach((p) => {
      if (p.type !== "literal") parts[p.type] = parseInt(p.value, 10);
    });
    // as-if-UTC ms for the wall-clock time the zone is currently showing
    return Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
  }

  /**
   * @param {{year,month,day,hour,minute}} wall - local wall-clock birth data (month 1-12)
   * @param {string} zone - IANA zone name, e.g. "Asia/Shanghai"
   * @returns {{utcMs:number, offsetMinutes:number}}
   */
  function localToUTC(wall, zone) {
    const wallAsUTC = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      wall.minute,
      0
    );
    let guess = wallAsUTC;
    for (let i = 0; i < 3; i++) {
      const shown = partsAt(guess, zone);
      const delta = wallAsUTC - shown;
      if (delta === 0) break;
      guess += delta;
    }
    const offsetMinutes = (guess - wallAsUTC) / 60000 * -1;
    return { utcMs: guess, offsetMinutes: offsetMinutes };
  }

  function offsetLabel(offsetMinutes) {
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return "UTC" + sign + h + (m ? ":" + String(m).padStart(2, "0") : "");
  }

  return { localToUTC: localToUTC, offsetLabel: offsetLabel };
})();
