/*
 * Renders a natal chart wheel as SVG: zodiac ring, house cusps (when known),
 * planet glyphs at their real positions, and aspect lines — instead of a
 * plain text table. Pure rendering: takes a computed chart object (from
 * chart.js) and returns an <svg> element. No user text is ever placed with
 * anything but textContent/SVG <text> nodes built the same safe way as the
 * rest of the app.
 */

const CHART_WHEEL = (function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const D2R = Math.PI / 180;

  const ZODIAC_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  const ZODIAC_COLOR = ["#e0645f", "#c98a3e", "#e8b34c", "#4caf7d", "#e0645f", "#c98a3e", "#e8b34c", "#4caf7d", "#e0645f", "#c98a3e", "#e8b34c", "#4caf7d"];

  const BODY_GLYPH = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
    Chiron: "⚷", NorthNode: "☊", SouthNode: "☋"
  };
  const BODY_COLOR = {
    Sun: "#e8b34c", Moon: "#c9cbe0", Mercury: "#8fb8e8", Venus: "#e88fb8",
    Mars: "#e0645f", Jupiter: "#e8a34c", Saturn: "#a89a7a", Uranus: "#6bd0d8",
    Neptune: "#7a9ae8", Pluto: "#9a7ae8", Chiron: "#7ae8a3", NorthNode: "#e8e08f", SouthNode: "#8a8a9a"
  };

  const ASPECT_STYLE = {
    Conjunction: { stroke: "#6a708a", dash: "2,2" },
    Sextile: { stroke: "#4caf7d", dash: null },
    Square: { stroke: "#e0645f", dash: null },
    Trine: { stroke: "#5b9ee8", dash: null },
    Opposition: { stroke: "#c14ee0", dash: "5,3" }
  };

  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    return node;
  }
  function svgText(x, y, text, attrs) {
    const node = svgEl("text", Object.assign({ x: x, y: y }, attrs));
    node.textContent = text;
    return node;
  }

  function polar(cx, cy, r, lon, ascOffset) {
    const theta = (180 + (lon - ascOffset)) * D2R;
    return { x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) };
  }

  // Turn the static SVG into something you poke at: clicking (or keyboard-
  // selecting) a planet lights its aspect lines, dims everything else, and
  // fires opts.onSelect(body). Clicking it again, or the empty background,
  // clears. Pure DOM class toggling — the geometry above is untouched.
  function wireInteractions(svg, opts) {
    function clear() {
      svg.classList.remove("cw-active");
      svg.querySelectorAll(".cw-planet.is-sel").forEach((n) => n.classList.remove("is-sel"));
      svg.querySelectorAll(".cw-aspect.is-lit").forEach((n) => n.classList.remove("is-lit"));
      if (typeof opts.onSelect === "function") opts.onSelect(null);
    }
    function select(body) {
      svg.querySelectorAll(".cw-planet.is-sel").forEach((n) => n.classList.remove("is-sel"));
      svg.querySelectorAll(".cw-aspect.is-lit").forEach((n) => n.classList.remove("is-lit"));
      svg.classList.add("cw-active");
      svg.querySelectorAll('.cw-planet[data-body="' + body + '"]').forEach((n) => n.classList.add("is-sel"));
      svg.querySelectorAll('.cw-aspect[data-a="' + body + '"], .cw-aspect[data-b="' + body + '"]')
        .forEach((n) => n.classList.add("is-lit"));
      if (typeof opts.onSelect === "function") opts.onSelect(body);
    }
    svg.addEventListener("click", (e) => {
      const g = e.target.closest ? e.target.closest(".cw-planet") : null;
      if (!g) { clear(); return; }
      if (g.classList.contains("is-sel")) clear();
      else select(g.getAttribute("data-body"));
    });
    svg.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest ? e.target.closest(".cw-planet") : null;
      if (!g) return;
      e.preventDefault();
      if (g.classList.contains("is-sel")) clear();
      else select(g.getAttribute("data-body"));
    });
  }

  function build(chart, opts) {
    opts = opts || {};
    const size = opts.size || 440;
    const cx = size / 2, cy = size / 2;
    const outerR = size * 0.40;
    const zodiacInnerR = size * 0.345;
    const aspectR = size * 0.185;
    const planetBaseR = size * 0.275;

    const ascOffset = chart.unknownTime || chart.asc === null || chart.asc === undefined ? 0 : chart.asc;

    const svg = svgEl("svg", { viewBox: "0 0 " + size + " " + size, width: "100%", class: "chart-wheel cw-enter" });

    // background
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: outerR, fill: "#12141d", stroke: "#2c3142" }));

    // zodiac ring wedges + glyphs
    for (let i = 0; i < 12; i++) {
      const lonStart = i * 30;
      const p1 = polar(cx, cy, outerR, lonStart, ascOffset);
      const p2 = polar(cx, cy, zodiacInnerR, lonStart, ascOffset);
      svg.appendChild(
        svgEl("line", { x1: p2.x, y1: p2.y, x2: p1.x, y2: p1.y, stroke: "#2c3142", "stroke-width": 1 })
      );
      const mid = polar(cx, cy, (outerR + zodiacInnerR) / 2, lonStart + 15, ascOffset);
      const glyph = svgText(mid.x, mid.y, ZODIAC_GLYPH[i], {
        fill: ZODIAC_COLOR[i],
        "font-size": size * 0.032,
        "text-anchor": "middle",
        "dominant-baseline": "central"
      });
      svg.appendChild(glyph);
    }
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: zodiacInnerR, fill: "none", stroke: "#2c3142" }));
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: aspectR, fill: "none", stroke: "#2c3142" }));

    // house cusps
    if (chart.houses) {
      chart.houses.forEach((cuspLon, idx) => {
        const isAngle = idx === 0 || idx === 3 || idx === 6 || idx === 9; // ASC/IC/DESC/MC
        const p1 = polar(cx, cy, zodiacInnerR, cuspLon, ascOffset);
        const p2 = polar(cx, cy, aspectR, cuspLon, ascOffset);
        svg.appendChild(
          svgEl("line", {
            x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
            stroke: isAngle ? "#8b7cf6" : "#3a3f52",
            "stroke-width": isAngle ? 1.6 : 1
          })
        );
        const labelPos = polar(cx, cy, zodiacInnerR - size * 0.028, cuspLon + 3, ascOffset);
        svg.appendChild(
          svgText(labelPos.x, labelPos.y, String(idx + 1), {
            fill: "#6a708a",
            "font-size": size * 0.022,
            "text-anchor": "middle",
            "dominant-baseline": "central"
          })
        );
      });
    }

    // aspect lines (drawn on the inner aspect circle)
    if (chart.aspects) {
      chart.aspects.forEach((asp) => {
        const pa = chart.positions[asp.a], pb = chart.positions[asp.b];
        if (!pa || !pb) return;
        const p1 = polar(cx, cy, aspectR, pa.lon, ascOffset);
        const p2 = polar(cx, cy, aspectR, pb.lon, ascOffset);
        const style = ASPECT_STYLE[asp.aspect] || { stroke: "#6a708a", dash: null };
        const line = svgEl("line", {
          x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
          stroke: style.stroke, "stroke-width": 1,
          class: "cw-aspect", "data-a": asp.a, "data-b": asp.b
        });
        if (style.dash) line.setAttribute("stroke-dasharray", style.dash);
        svg.appendChild(line);
      });
    }

    // planets — simple collision avoidance: bodies within 6 deg of a
    // previously placed one get nudged onto an inner ring instead of
    // overlapping it.
    const bodies = ASTRO.BODY_ORDER.filter((b) => chart.positions[b]);
    const sorted = bodies.slice().sort((a, b) => chart.positions[a].lon - chart.positions[b].lon);
    const placedLons = [];
    sorted.forEach((body) => {
      const lon = ASTRO.norm360(chart.positions[body].lon);
      const crowded = placedLons.some((l) => {
        const d = Math.abs(l - lon);
        return Math.min(d, 360 - d) < 6;
      });
      placedLons.push(lon);
      const r = crowded ? planetBaseR - size * 0.05 : planetBaseR;

      // tick from the zodiac ring to the exact degree
      const tickOuter = polar(cx, cy, zodiacInnerR, lon, ascOffset);
      const tickInner = polar(cx, cy, r + size * 0.03, lon, ascOffset);
      const pos = polar(cx, cy, r, lon, ascOffset);
      const color = BODY_COLOR[body] || "#e7e9f0";

      // one focusable group per planet, so it can be highlighted and tapped
      const g = svgEl("g", { class: "cw-planet", "data-body": body, tabindex: "0", role: "button" });
      g.setAttribute("aria-label", body + " — tap to see its aspects");
      g.appendChild(
        svgEl("line", { x1: tickOuter.x, y1: tickOuter.y, x2: tickInner.x, y2: tickInner.y, stroke: "#3a3f52", "stroke-width": 1, class: "cw-planet-tick" })
      );
      // invisible larger hit target for comfortable tapping on mobile
      g.appendChild(svgEl("circle", { cx: pos.x, cy: pos.y, r: size * 0.055, fill: "transparent", class: "cw-planet-hit" }));
      g.appendChild(svgEl("circle", { cx: pos.x, cy: pos.y, r: size * 0.024, fill: "#1e2230", stroke: color, "stroke-width": 1.2, class: "cw-planet-dot" }));
      const glyph = svgText(pos.x, pos.y, BODY_GLYPH[body] || body[0], {
        fill: color,
        "font-size": size * 0.028,
        "text-anchor": "middle",
        "dominant-baseline": "central"
      });
      glyph.appendChild(svgEl("title")).textContent =
        body + " — " + ASTRO.signOf(chart.positions[body].lon) + " " + ASTRO.degInSign(chart.positions[body].lon).toFixed(1) + "°" +
        (chart.positions[body].house ? ", House " + chart.positions[body].house : "");
      g.appendChild(glyph);
      svg.appendChild(g);
    });

    // ASC/MC labels
    if (!chart.unknownTime && chart.asc !== null && chart.asc !== undefined) {
      const ascPos = polar(cx, cy, outerR + size * 0.05, chart.asc, ascOffset);
      svg.appendChild(svgText(ascPos.x, ascPos.y, "AS", { fill: "#8b7cf6", "font-size": size * 0.024, "text-anchor": "middle", "dominant-baseline": "central" }));
      const mcPos = polar(cx, cy, outerR + size * 0.05, chart.mc, ascOffset);
      svg.appendChild(svgText(mcPos.x, mcPos.y, "MC", { fill: "#8b7cf6", "font-size": size * 0.024, "text-anchor": "middle", "dominant-baseline": "central" }));
    }

    wireInteractions(svg, opts);
    return svg;
  }

  return { build: build, BODY_GLYPH: BODY_GLYPH, BODY_COLOR: BODY_COLOR };
})();
