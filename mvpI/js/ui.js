/*
 * UI rendering for the Chart / Cycle / People / Galaxy / Privacy tabs.
 * All user-supplied text (names) goes through textContent — same escaping
 * discipline as the Construction Site tab.
 */

const UI = (function () {
  "use strict";

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html_UNSAFE_NEVER_USE") throw new Error("no");
        else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }
  function fmtDeg(d) {
    return d.toFixed(1) + "°";
  }
  function houseSystemLabel(hs) {
    return hs === "whole-sign" ? "Whole Sign" : "Placidus";
  }
  function backButton() {
    return el("button", {
      type: "button",
      class: "back-link",
      text: "← Back",
      onclick: () => { if (window.APP_BACK) window.APP_BACK(); }
    });
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function panelIsActive(tab) {
    const p = document.querySelector('.tabpanel[data-tab="' + tab + '"]');
    return !!p && p.classList.contains("active");
  }

  // ---------- state helpers ----------
  function getHouseSystemPref() {
    return localStorage.getItem("aa_house_system") || "placidus";
  }
  function setHouseSystemPref(v) {
    localStorage.setItem("aa_house_system", v);
  }

  // ================= STEP 2: BIRTH DATA =================

  function renderBirthDataStep() {
    const root = document.getElementById("panel-birthdata");
    root.innerHTML = "";
    const s = STORE.get();

    // A date entered on the no-commitment teaser (see app.js) carries over
    // once, so trying it doesn't mean re-typing the same date again.
    const prefill = !s.me ? window.teaserPrefillWall || null : null;
    window.teaserPrefillWall = null;

    const formCard = birthForm(
      (profile) => {
        STORE.setMe(profile);
        location.hash = "#mychart";
      },
      s.me ? "Update your birth details" : "Enter your birth details",
      s.me ? "Save changes" : "Calculate my chart",
      s.me,
      prefill
    );
    if (s.me) {
      const cancelBtn = el("button", { type: "button", class: "cancel-btn", text: "Cancel" });
      cancelBtn.addEventListener("click", () => { location.hash = "#mychart"; });
      formCard.appendChild(cancelBtn);
    }
    root.appendChild(formCard);
  }

  // ================= STEP 3: MY CHART =================

  // One-screen orientation the first time the chart is reached: what the tool
  // does, in three plain lines, before any of it is shown. "See my chart" is
  // the only action — the 21-day journey is named but not offered as a button
  // here, so a first-time user isn't asked to commit to something they can't
  // yet place. Shown once (localStorage flag), cleared on full deletion.
  function howItWorksSeen() {
    try { return localStorage.getItem("aa_howitworks_seen") === "1"; }
    catch (e) { return false; }
  }
  function howItWorksIntro() {
    const frag = document.createDocumentFragment();
    frag.appendChild(el("h2", { text: "How this works" }));
    const card = el("div", { class: "card howitworks" });
    [
      ["We calculate your chart like an astronomer",
       "From the date, time and place you gave — where the Sun, Moon and planets actually were the minute you were born."],
      ["It names what you're good at — and what it costs",
       "Every strength in a chart carries a price. We always show the two together, never a separate list of flaws."],
      ["A 21-day journey is there if you want it",
       "It turns one strength into a small daily practice — about five minutes a day for three weeks, and missing a day never resets anything. Entirely optional."]
    ].forEach(function (row) {
      card.appendChild(
        el("div", { class: "hiw-row" }, [
          el("strong", { class: "hiw-title", text: row[0] }),
          el("p", { class: "hiw-desc", text: row[1] })
        ])
      );
    });
    frag.appendChild(card);
    const btn = el("button", { class: "primary-btn", type: "button", text: "See my chart" });
    btn.addEventListener("click", function () {
      try { localStorage.setItem("aa_howitworks_seen", "1"); } catch (e) {}
      renderChartStep();
      window.scrollTo(0, 0);
    });
    frag.appendChild(btn);
    return frag;
  }

  function renderChartStep() {
    const root = document.getElementById("panel-mychart");
    root.innerHTML = "";
    const s = STORE.get();

    if (!s.me) {
      location.hash = "#birthdata";
      return;
    }

    if (!howItWorksSeen()) {
      root.appendChild(howItWorksIntro());
      return;
    }

    const hs = getHouseSystemPref();
    const chart = computeChart(s.me, hs);
    root.appendChild(el("h2", { text: "Your chart" }));
    root.appendChild(
      chartCard(s.me.name || "You", chart, hs, true, () => { location.hash = "#birthdata"; })
    );

    root.appendChild(el("h2", { text: "Viewing my chart" }));
    root.appendChild(strengthsWeaknessesCard(chart));

    // The journey is an optional next step, not the headline. Kept as a
    // quiet outline-button offer with the time commitment stated up front,
    // so the chart itself stays the main thing on this screen.
    const started = s.cycle.completedDays.length > 0;
    const offer = el("div", { class: "card journey-offer" });
    if (started) {
      offer.appendChild(el("h4", { text: "Your 21-day journey" }));
      offer.appendChild(el("p", { class: "offer-text", text:
        "Day " + STORE.currentDay() + " of 21 — pick up where you left off." }));
      const b = el("button", { class: "offer-btn", type: "button", text: "Continue the journey →" });
      b.addEventListener("click", () => location.hash = "#cycle");
      offer.appendChild(b);
    } else {
      offer.appendChild(el("h4", { text: "One optional next step" }));
      offer.appendChild(el("p", { class: "offer-text", text:
        "The 21-day journey takes one strength from your chart and turns it into a small daily " +
        "practice — about five minutes a day for three weeks. Miss a day and nothing resets." }));
      const b = el("button", { class: "offer-btn", type: "button", text: "Start the 21-day journey →" });
      b.addEventListener("click", () => location.hash = "#cycle");
      offer.appendChild(b);
    }
    root.appendChild(offer);
  }

  // A same-chart preview of the 21-day journey's own gift/cost pairing —
  // one flip-card per body. Front shows the strength; clicking reveals its
  // exact cost underneath, so a limitation never appears without the
  // strength it belongs to (product description §3's structural rule).
  //
  // Progressive reveal: the chart wheel and exact-degree/aspect data stay
  // fully visible always — that's computed astronomical fact, and hiding
  // real data to manufacture suspense would undercut the "this is science,
  // not esoteric" positioning. All seven strength (gift) readings are also
  // shown from the start — team review found that gating them too left a
  // first-time visitor with a wall of padlocks and nothing to read. What's
  // still paced, mirroring the real Week 1/Week 2 structure, is only the
  // COST half of each pair: it unlocks on that body's Week 2 day (idx + 8),
  // so a limitation never lands before the strength it belongs to has been
  // sat with (product description §3's structural rule).
  function strengthsWeaknessesCard(chart) {
    const wrap = el("div", { class: "card sw-card" });
    if (chart.unknownTime) {
      wrap.appendChild(
        el("p", { class: "small-note", text: "Strengths and weaknesses use house placements where available; with an unknown birth time, these are based on sign alone." })
      );
    }
    wrap.appendChild(
      el("p", { class: "small-note", text: "All seven strengths are here from the start. Tap a card to see the cost of that same strength — never a separate list of flaws. The cost half unlocks as your journey reaches Week 2." })
    );

    const s = STORE.get();
    const completed = s.cycle.completedDays.length;
    const grid = el("div", { class: "sw-grid" });

    // Earned-surprise moment: the first time a tile (or its cost half)
    // becomes available, mark it with a one-time "just unlocked" animation
    // instead of letting it quietly appear. Keys already celebrated live in
    // s.cycle.seenUnlocks; anything new this render goes in freshKeys and is
    // marked seen once, so a later revisit of the chart stays calm.
    const seen = s.cycle.seenUnlocks || [];
    const freshKeys = [];
    // Only run the reveal (animation + mark-as-seen) when the chart step is
    // actually on screen — renderAll() can rebuild this card off-screen, and
    // we don't want the moment spent while nobody's looking.
    const revealLive = panelIsActive("mychart");
    let freshOrder = 0;
    function markFresh(tile, key, label) {
      if (seen.indexOf(key) !== -1) return;
      freshKeys.push(key);
      if (!revealLive || tile.__celebrated) return;
      tile.__celebrated = true;
      tile.classList.add("just-unlocked");
      tile.style.setProperty("--unlock-delay", (freshOrder++ * 140) + "ms");
      tile.appendChild(el("span", { class: "sw-unlock-badge", text: label }));
    }

    CONTENT.WEEK_BODIES.forEach((body, idx) => {
      const p = chart.positions[body];
      if (!p) return;
      const costDay = idx + 8;
      const costUnlocked = completed >= costDay;

      const sign = ASTRO.signOf(p.lon);
      const color = CHART_WHEEL.BODY_COLOR[body] || "#8b7cf6";
      const glyph = CHART_WHEEL.BODY_GLYPH[body] || body[0];

      const tile = el("div", { class: "sw-tile", style: "--tile-color:" + color });

      const giftText = CONTENT.dayContent("gift", body, sign, p.house);
      const costText = costUnlocked ? CONTENT.dayContent("cost", body, sign, p.house) : null;

      const header = el("div", { class: "sw-tile-header" }, [
        el("span", { class: "sw-tile-glyph", text: glyph }),
        el("span", { class: "sw-tile-name", text: body }),
        el("span", { class: "sw-tile-sign", text: sign }),
        el("span", { class: "sw-tile-caret", text: "▾" })
      ]);
      const front = el("p", { class: "sw-tile-text sw-tile-gift", text: giftText });
      const back = el("p", {
        class: "sw-tile-text sw-tile-cost",
        text: costUnlocked ? costText : "🔒 The cost unlocks on Day " + costDay + " of your journey."
      });
      back.hidden = true;

      header.addEventListener("click", () => {
        const open = tile.classList.toggle("open");
        front.hidden = open;
        back.hidden = !open;
        header.querySelector(".sw-tile-caret").textContent = open ? "▴" : "▾";
        header.querySelector(".sw-tile-name").textContent = open ? body + (costUnlocked ? " — the cost" : "") : body;
      });

      tile.appendChild(header);
      tile.appendChild(front);
      tile.appendChild(back);

      if (costUnlocked) markFresh(tile, "cost:" + body, "Cost revealed");

      grid.appendChild(tile);
    });

    if (revealLive && freshKeys.length) {
      const n = freshKeys.length;
      wrap.appendChild(
        el("div", { class: "sw-reveal-burst" }, [
          el("span", { class: "sw-reveal-burst-spark", text: "✦" }),
          el("span", { text: n === 1
            ? "A new reveal just opened up — your journey earned it."
            : n + " new reveals just opened up — your journey earned them." })
        ])
      );
      STORE.markUnlocksSeen(freshKeys);
      if (window.APP_TOAST) {
        window.APP_TOAST(n === 1 ? "✦ New reveal unlocked" : "✦ " + n + " new reveals unlocked");
      }
      requestAnimationFrame(() => {
        try { wrap.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" }); } catch (e) {}
      });
    }

    wrap.appendChild(grid);
    return wrap;
  }

  function labeledField(labelText, hint, inputEls) {
    const group = el("div", { class: "field-group" });
    group.appendChild(el("label", { class: "field-label", text: labelText }));
    group.appendChild(el("div", { class: "field-row" }, inputEls));
    if (hint) group.appendChild(el("div", { class: "field-hint", text: hint }));
    return group;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function birthForm(onSubmit, title, submitLabel, existing, prefillDate, opts) {
    opts = opts || {};
    const wrap = el("div", { class: "card form-card" });
    wrap.appendChild(el("h3", { text: title }));
    wrap.appendChild(
      el("p", { class: "small-note", text: opts.email
        ? "Their birth details are what the chart needs. The email is only here to show the real invite flow — nothing is sent from this prototype."
        : "Fill in each field below — your own birth details, exactly as you'd enter them for any birth chart calculator." })
    );

    const nameInput = el("input", { type: "text", placeholder: "e.g. Lindsey" });
    const emailInput = opts.email
      ? el("input", { type: "email", placeholder: "e.g. andreas@example.com" })
      : null;
    if (emailInput && existing && existing.email) emailInput.value = existing.email;
    const dateInput = el("input", { type: "date" });
    const timeInput = el("input", { type: "time" });
    const unknownCheck = el("input", { type: "checkbox", id: "unknown-time-" + Math.random().toString(36).slice(2) });
    const unknownLabel = el("label", { class: "inline-check", for: unknownCheck.id }, [
      unknownCheck,
      document.createTextNode(" I don't know the exact birth time")
    ]);

    const placeSearch = el("input", { type: "text", placeholder: "e.g. Berlin, or Zhuhai" });
    const placeResults = el("div", { class: "place-results" });
    let selectedPlace = null;

    placeSearch.addEventListener("input", () => {
      selectedPlace = null;
      placeResults.innerHTML = "";
      findPlaces(placeSearch.value).forEach((p) => {
        const btn = el("button", { type: "button", class: "place-result", text: p.name });
        btn.addEventListener("click", () => {
          selectedPlace = p;
          placeSearch.value = p.name;
          placeResults.innerHTML = "";
          latInput.value = p.lat;
          lonInput.value = p.lon;
          zoneInput.value = p.zone;
        });
        placeResults.appendChild(btn);
      });
    });

    const latInput = el("input", { type: "number", step: "0.0001", placeholder: "e.g. 52.5200" });
    const lonInput = el("input", { type: "number", step: "0.0001", placeholder: "e.g. 13.4050" });
    const zoneInput = el("input", { type: "text", placeholder: "e.g. Asia/Shanghai" });

    if (existing) {
      nameInput.value = existing.name || "";
      dateInput.value = existing.wall.year + "-" + pad2(existing.wall.month) + "-" + pad2(existing.wall.day);
      unknownCheck.checked = !!existing.unknownTime;
      if (!existing.unknownTime) timeInput.value = pad2(existing.wall.hour) + ":" + pad2(existing.wall.minute);
      latInput.value = existing.place.lat;
      lonInput.value = existing.place.lon;
      zoneInput.value = existing.place.zone;
      timeInput.disabled = !!existing.unknownTime;
    } else if (prefillDate) {
      dateInput.value = prefillDate.year + "-" + pad2(prefillDate.month) + "-" + pad2(prefillDate.day);
    }

    timeInput.disabled = false;
    unknownCheck.addEventListener("change", () => {
      timeInput.disabled = unknownCheck.checked;
      if (unknownCheck.checked) timeInput.value = "";
    });

    const error = el("div", { class: "form-error" });

    const submit = el("button", { class: "primary-btn", type: "button", text: submitLabel || "Calculate chart" });
    submit.addEventListener("click", () => {
      error.textContent = "";
      if (!dateInput.value) { error.textContent = "Birth date is required."; return; }
      if (!unknownCheck.checked && !timeInput.value) { error.textContent = "Enter a time, or check “I don't know the exact birth time.”"; return; }
      const lat = parseFloat(latInput.value), lon = parseFloat(lonInput.value);
      if (isNaN(lat) || isNaN(lon) || !zoneInput.value.trim()) {
        error.textContent = "Pick a place from the search, or fill in latitude, longitude and timezone manually.";
        return;
      }
      const [y, m, d] = dateInput.value.split("-").map(Number);
      let hh = 12, mm = 0;
      if (!unknownCheck.checked) {
        const [h2, m2] = timeInput.value.split(":").map(Number);
        hh = h2; mm = m2;
      }
      const profile = {
        name: nameInput.value.trim(),
        wall: { year: y, month: m, day: d, hour: hh, minute: mm },
        place: { lat: lat, lon: lon, zone: zoneInput.value.trim() },
        unknownTime: unknownCheck.checked
      };
      if (emailInput) profile.email = emailInput.value.trim();
      onSubmit(profile);
    });

    wrap.appendChild(labeledField("Name", null, [nameInput]));
    if (emailInput) wrap.appendChild(labeledField("Their email", "Where the real invitation would go. Optional here — not sent.", [emailInput]));
    wrap.appendChild(labeledField("Date of birth", null, [dateInput]));
    const timeGroup = labeledField("Time of birth", "As exact as you have it — even a rough guess is better than nothing, or check the box if it's genuinely unknown.", [timeInput]);
    timeGroup.appendChild(el("div", { class: "field-row" }, [unknownLabel]));
    wrap.appendChild(timeGroup);
    wrap.appendChild(labeledField("Place of birth", "Search for a city, or fill in the exact coordinates and timezone below.", [placeSearch]));
    wrap.appendChild(placeResults);
    wrap.appendChild(
      labeledField("Manual coordinates (optional)", "Only needed if your city didn't come up in the search above.", [latInput, lonInput, zoneInput])
    );
    wrap.appendChild(error);
    wrap.appendChild(submit);
    return wrap;
  }

  function chartCard(label, chart, hs, showHouseToggle, onEdit) {
    const wrap = el("div", { class: "card" });
    const heading = el("div", { class: "card-header-row" }, [
      el("h3", { text: label }),
      onEdit ? el("button", { type: "button", class: "edit-btn", text: "✏️ Edit", onclick: onEdit }) : null
    ]);
    wrap.appendChild(heading);

    if (showHouseToggle) {
      const toggle = el("div", { class: "toggle-row" }, [
        el("span", { class: "toggle-label", text: "House system: " }),
        el("button", {
          type: "button",
          class: "chip" + (hs === "placidus" ? " active" : ""),
          text: "Placidus",
          onclick: () => { setHouseSystemPref("placidus"); renderChartStep(); }
        }),
        el("button", {
          type: "button",
          class: "chip" + (hs === "whole-sign" ? " active" : ""),
          text: "Whole Sign",
          onclick: () => { setHouseSystemPref("whole-sign"); renderChartStep(); }
        })
      ]);
      wrap.appendChild(toggle);
    }

    if (chart.unknownTime) {
      wrap.appendChild(
        el("div", { class: "notice" }, [
          document.createTextNode(
            "Birth time unknown — houses, Ascendant and Midheaven are not shown rather than guessed. "
          ),
          el("br"),
          document.createTextNode(
            chart.moonRange
              ? "The Moon could be in " + chart.moonRange.from + " or " + chart.moonRange.to + " depending on the exact time — shown as a range."
              : "The Moon stays in " + chart.moonSign + " for the whole day regardless of exact time."
          )
        ])
      );
    } else if (chart.asc !== null && chart.asc !== undefined) {
      wrap.appendChild(
        el("div", { class: "angles-row" }, [
          el("span", { text: "Ascendant: " + ASTRO.signOf(chart.asc) + " " + fmtDeg(ASTRO.degInSign(chart.asc)) }),
          el("span", { text: "Midheaven: " + ASTRO.signOf(chart.mc) + " " + fmtDeg(ASTRO.degInSign(chart.mc)) }),
          el("span", { class: "small-note", text: "(" + houseSystemLabel(hs) + ")" })
        ])
      );
    }

    const wheelWrap = el("div", { class: "chart-wheel-wrap" });
    const wheelCaption = el("p", { class: "wheel-caption", text: "Tap a planet to see how it connects to the rest of your chart." });
    wheelWrap.appendChild(CHART_WHEEL.build(chart, {
      onSelect: (body) => {
        if (!body) {
          wheelCaption.textContent = "Tap a planet to see how it connects to the rest of your chart.";
          wheelCaption.classList.remove("is-active");
          return;
        }
        const p = chart.positions[body];
        const n = (chart.aspects || []).filter((a) => a.a === body || a.b === body).length;
        wheelCaption.textContent =
          body + " in " + ASTRO.signOf(p.lon) + " " + fmtDeg(ASTRO.degInSign(p.lon)) +
          (p.house ? " · House " + p.house : "") +
          " — " + (n === 0 ? "no major aspects" : n + " major aspect" + (n === 1 ? "" : "s") + " lit above");
        wheelCaption.classList.add("is-active");
      }
    }));
    wrap.appendChild(wheelWrap);
    wrap.appendChild(wheelCaption);

    const table = el("div", { class: "positions-table detail-panel" });
    ASTRO.BODY_ORDER.filter((b) => b !== "SouthNode").forEach((body) => {
      const p = chart.positions[body];
      if (!p) return;
      table.appendChild(
        el("div", { class: "position-row" }, [
          el("span", { class: "body-name", text: body }),
          el("span", { text: ASTRO.signOf(p.lon) + " " + fmtDeg(ASTRO.degInSign(p.lon)) + (p.approximate ? " (approx.)" : "") }),
          p.house ? el("span", { class: "house-tag", text: "House " + p.house }) : null
        ])
      );
    });

    const aspWrap = el("div", { class: "aspects detail-panel" });
    (chart.aspects || []).forEach((a) => {
      aspWrap.appendChild(
        el("span", { class: "aspect-chip", text: a.a + " " + a.symbol + " " + a.b + " (orb " + a.orb + "°)" })
      );
    });
    if (!chart.aspects || !chart.aspects.length) {
      aspWrap.appendChild(el("span", { class: "small-note", text: "No aspects within orb." }));
    }

    wrap.appendChild(detailToggleGroup([
      { label: "Exact degrees (" + Object.keys(chart.positions).length + ")", panel: table },
      { label: "Aspects (" + (chart.aspects ? chart.aspects.length : 0) + ")", panel: aspWrap }
    ]));

    return wrap;
  }

  // Two (or more) mutually-exclusive detail panels behind pill buttons —
  // click a pill to reveal that panel, click again (or another pill) to
  // switch; nothing shown by default so the wheel stays the focus.
  function detailToggleGroup(items) {
    const wrap = el("div", { class: "detail-toggle-wrap" });
    const btnRow = el("div", { class: "detail-toggle-row" });
    const panelHost = el("div", { class: "detail-panel-host" });
    let openIndex = -1;

    function render() {
      btnRow.innerHTML = "";
      panelHost.innerHTML = "";
      items.forEach((item, i) => {
        const btn = el("button", {
          type: "button",
          class: "chip detail-toggle-btn" + (openIndex === i ? " active" : ""),
          text: item.label
        });
        btn.addEventListener("click", () => {
          openIndex = openIndex === i ? -1 : i;
          render();
        });
        btnRow.appendChild(btn);
      });
      if (openIndex !== -1) panelHost.appendChild(items[openIndex].panel);
    }
    render();

    wrap.appendChild(btnRow);
    wrap.appendChild(panelHost);
    return wrap;
  }

  // ================= CYCLE TAB =================

  // Which day the user is currently looking at, independent of how far
  // they've progressed. null = "follow today". reviewMode = browsing a past
  // day from the Day-21 summary. Both are transient UI state, not persisted.
  let viewDay = null;
  let reviewMode = false;
  let previewReport = false; // browsing the shape of the Day-21 report before finishing
  let reviewAll = false;     // the one-page "all 21 days" review
  function clampViewDay(maxDay) {
    if (viewDay == null || viewDay > maxDay) viewDay = maxDay;
    if (viewDay < 1) viewDay = 1;
  }

  function weekOf(day) {
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    return 3;
  }
  const WEEK_TITLE = { 1: "Your Gift", 2: "The Cost of the Gift", 3: "The Others" };
  const WEEK_BLURB = {
    1: "Naming the strengths you were born with — one planet a day.",
    2: "The same seven planets, seen from the price each strength carries.",
    3: "Turning the same seeing onto the people around you."
  };

  // The whole 21-day shape on one screen: three weeks, seven days each, with
  // what's done, where today is, and what Day 21 gives you. This is the
  // answer to "where am I / what is this heading toward" — shown above the
  // day itself so the journey never feels like an undifferentiated march.
  function journeyMap(s, hs, today) {
    const complete = s.cycle.completedDays.length >= 21;
    const wrap = el("div", { class: "card journey-map" });
    wrap.appendChild(el("h3", { text: "The whole journey" }));

    for (let w = 1; w <= 3; w++) {
      const row = el("div", { class: "jm-week" });
      row.appendChild(el("div", { class: "jm-week-head" }, [
        el("span", { class: "jm-week-name", text: "Week " + w + " · " + WEEK_TITLE[w] }),
        el("span", { class: "jm-week-blurb", text: WEEK_BLURB[w] })
      ]));
      const cells = el("div", { class: "jm-cells" });
      for (let i = 0; i < 7; i++) {
        const d = (w - 1) * 7 + i + 1;
        const done = s.cycle.completedDays.indexOf(d) !== -1;
        const isToday = d === today && !complete;
        const reached = d <= today;
        const label = (w === 3) ? "the people in your life"
          : CONTENT.WEEK_BODIES[i] + (w === 1 ? " — the gift" : " — the cost");
        const cell = el("button", {
          type: "button",
          class: "jm-cell" + (done ? " is-done" : "") + (isToday ? " is-today" : "") + (!reached ? " is-future" : ""),
          title: "Day " + d + " · " + label
        }, [
          el("span", { class: "jm-cell-day", text: done ? "✓" : String(d) })
        ]);
        if (reached) {
          cell.addEventListener("click", () => {
            previewReport = false; reviewAll = false; reviewMode = complete;
            viewDay = d; renderCycleTab();
            document.getElementById("panel-cycle").scrollIntoView({ block: "start" });
          });
        } else {
          cell.disabled = true;
        }
        cells.appendChild(cell);
      }
      row.appendChild(cells);
      wrap.appendChild(row);
    }

    wrap.appendChild(el("p", { class: "jm-destination", text:
      "Day 21 gives you your report: the chart you were given vs. the one you made by turning up, " +
      "your 21 daily choices as one picture, and the direction you're growing toward." }));

    const links = el("div", { class: "jm-links" });
    if (complete) {
      const rep = el("button", { type: "button", class: "offer-btn", text: "See the report →" });
      rep.addEventListener("click", () => { previewReport = false; reviewAll = false; reviewMode = false; viewDay = null; renderCycleTab(); });
      links.appendChild(rep);
      const all = el("button", { type: "button", class: "offer-btn", text: "Review all 21 days on one page" });
      all.addEventListener("click", () => { reviewAll = true; reviewMode = false; previewReport = false; renderCycleTab(); document.getElementById("panel-cycle").scrollIntoView({ block: "start" }); });
      links.appendChild(all);
    } else {
      const prev = el("button", { type: "button", class: "offer-btn", text: "Preview where this lands →" });
      prev.addEventListener("click", () => { previewReport = true; reviewAll = false; renderCycleTab(); document.getElementById("panel-cycle").scrollIntoView({ block: "start" }); });
      links.appendChild(prev);
    }
    wrap.appendChild(links);
    return wrap;
  }

  // Every day on one scrollable page: the theme, your logged choice, your
  // practice pick — so the journey can be taken in as a whole, not only
  // clicked through one day at a time.
  function journeyReviewAll(s, hs) {
    const frag = document.createDocumentFragment();
    const chart = computeChart(s.me, hs);
    frag.appendChild(el("h3", { text: "All 21 days" }));
    frag.appendChild(el("p", { class: "small-note", text:
      "The shape of the whole journey. Tap any day to open it in full." }));

    for (let w = 1; w <= 3; w++) {
      frag.appendChild(el("h4", { class: "review-week-head", text: "Week " + w + " · " + WEEK_TITLE[w] }));
      for (let i = 0; i < 7; i++) {
        const d = (w - 1) * 7 + i + 1;
        const choices = s.cycle.choices || {};
        const k = choices[d];
        const choiceTxt = k === "lean" ? "with the grain" : k === "counter" ? "against the grain" : "no choice logged";
        let theme;
        if (w === 3) {
          theme = "the people in your life";
        } else {
          const body = CONTENT.WEEK_BODIES[i];
          const p = chart.positions[body];
          theme = body + (p ? " in " + ASTRO.signOf(p.lon) : "") + (w === 1 ? " — the gift" : " — the cost");
        }
        let practice = null;
        try { practice = localStorage.getItem("aa_practice_day_" + d); } catch (e) {}
        const row = el("button", { type: "button", class: "review-row" }, [
          el("span", { class: "review-row-day", text: "Day " + d }),
          el("span", { class: "review-row-theme", text: theme }),
          el("span", { class: "review-row-meta", text: choiceTxt + (practice ? " · " + practice : "") })
        ]);
        row.addEventListener("click", () => {
          reviewAll = false; reviewMode = true; viewDay = d; renderCycleTab();
          document.getElementById("panel-cycle").scrollIntoView({ block: "start" });
        });
        frag.appendChild(row);
      }
    }
    return frag;
  }

  // Shared with the Galaxy tab so "how bright is my sky" means the same
  // thing everywhere it's shown.
  function brightnessPercent(s) {
    const selfAwareDays = s.cycle.completedDays.filter((d) => d <= 14).length;
    return Math.round((selfAwareDays / 14) * 100);
  }

  // One-line, non-spoiling teaser naming today's specific placement —
  // enough to make someone curious about what it means, not enough to
  // replace actually opening the journey.
  function todaysFocusLabel(s, hs) {
    const day = STORE.currentDay();
    if (day > 21) return null;
    const week = weekOf(day);
    if (week === 3) return "the people in your life";
    const chart = computeChart(s.me, hs);
    const body = CONTENT.WEEK_BODIES[(day - 1) % 7];
    const p = chart.positions[body];
    if (!p) return null;
    return body + " in " + ASTRO.signOf(p.lon);
  }

  // "Continue your journey" teaser on the Home screen — only shown once
  // there's a chart and a journey in motion. Surfaces the brightness meter
  // (previously buried in the Galaxy tab) and today's specific focus, so
  // there's a concrete, changing reason to come back rather than a static
  // homepage that looks the same every visit.
  function renderHomeTeaser() {
    const host = document.getElementById("home-teaser");
    if (!host) return;
    host.innerHTML = "";

    // PARKED. A first-time visitor should never meet "your journey" / "Day N
    // of 21" language on the Home screen before anything has explained what
    // the tool is or how the 21 days work — it reads as being dropped into
    // something they never opted into. The card below stays built for when
    // there's a real onboarding path in front of it; until then this function
    // only clears its host and returns. Re-enable by deleting this block.
    return;
    /* eslint-disable no-unreachable */

    const s = STORE.get();
    if (!s.me) return;

    const hs = getHouseSystemPref();
    const day = STORE.currentDay();
    const brightness = brightnessPercent(s);
    const card = el("div", { class: "teaser-card" });

    if (day > 21) {
      card.appendChild(el("p", { class: "teaser-line", text: "Your journey is complete. Your sky is " + brightness + "% bright." }));
      const btn = el("button", { type: "button", class: "primary-btn teaser-btn", text: "See my Galaxy" });
      btn.addEventListener("click", () => location.hash = "#galaxy");
      card.appendChild(btn);
    } else {
      const focus = todaysFocusLabel(s, hs);
      card.appendChild(
        el("p", { class: "teaser-line", text: "Day " + day + " of 21 — your sky is " + brightness + "% bright." })
      );
      if (focus) {
        card.appendChild(el("p", { class: "teaser-focus", text: "Today's focus involves " + focus + "." }));
      }
      const btn = el("button", { type: "button", class: "primary-btn teaser-btn", text: "Continue my journey" });
      btn.addEventListener("click", () => location.hash = "#cycle");
      card.appendChild(btn);
    }
    host.appendChild(card);
  }

  // Plain-language toolkit, collapsed by default so it never gets in the way
  // of someone who already knows the words. Rendered at the top of the
  // Journey tab and again on the Day-21 divergence screen.
  function glossaryCard() {
    const box = el("details", { class: "glossary" });
    box.appendChild(el("summary", { text: "New here? What these words mean" }));
    CONTENT.GLOSSARY.forEach((g) => {
      box.appendChild(
        el("div", { class: "gloss-item" }, [
          el("strong", { class: "gloss-term", text: g.term }),
          el("p", { class: "gloss-plain", text: g.plain }),
          el("p", { class: "gloss-real", text: g.real })
        ])
      );
    });
    return box;
  }

  // Bridge screen between "My chart" and Day 1 — shown once, the first time
  // someone opens the Journey tab with nothing completed yet. Answers the
  // question the raw Day-1 view skips: what IS this, why does it follow from
  // my chart, and what am I agreeing to. "Begin Day 1" dismisses it for good
  // (a returning user on journey 2+ goes straight to the day).
  function journeyIntroSeen() {
    try { return localStorage.getItem("aa_journey_intro_dismissed") === "1"; }
    catch (e) { return false; }
  }
  function journeyIntro() {
    const frag = document.createDocumentFragment();
    frag.appendChild(el("h2", { text: "From your chart to your journey" }));
    frag.appendChild(el("p", { class: "progress-note", text:
      "Your chart showed you the ground you started on — your gifts, and what they cost. " +
      "The next 21 days are where you do something with it." }));

    const weeks = el("div", { class: "card journey-weeks" });
    weeks.appendChild(el("h4", { text: "How the three weeks go" }));
    [
      ["Week 1 — your gifts", "One a day. The thing each planet in your chart is naturally built for."],
      ["Week 2 — what they cost", "The same seven strengths, seen from the price they carry. Never a separate list of flaws."],
      ["Week 3 — the people around you", "Your chart pointed outward — at someone real, with their say-so."]
    ].forEach(function (row) {
      weeks.appendChild(
        el("div", { class: "jw-row" }, [
          el("strong", { class: "jw-title", text: row[0] }),
          el("p", { class: "jw-desc", text: row[1] })
        ])
      );
    });
    frag.appendChild(weeks);

    frag.appendChild(
      el("div", { class: "card" }, [
        el("h4", { text: "What a day asks of you" }),
        el("p", { class: "day-text", text:
          "A short read, then pick a practice, then make one real choice — go with the grain of your " +
          "chart, or deliberately against it. About five minutes. Miss a day and nothing resets — come back whenever." })
      ])
    );

    const twins = el("div", { class: "notice" });
    twins.textContent =
      "Identical twins share a birth chart. Their lives still diverge — because of choices like these. " +
      "The chart is the map; this is the part that's yours.";
    frag.appendChild(twins);

    frag.appendChild(glossaryCard());

    const begin = el("button", { class: "primary-btn", type: "button", text: "Begin Day 1" });
    begin.addEventListener("click", function () {
      try { localStorage.setItem("aa_journey_intro_dismissed", "1"); } catch (e) {}
      renderCycleTab();
      window.scrollTo(0, 0);
    });
    frag.appendChild(begin);
    return frag;
  }

  // The daily fork: after reading the day's gift/cost, pick one real move —
  // with the grain of your chart, or deliberately against it. Logged either
  // way. Tapping the active option again clears it.
  function choiceFork(day, week) {
    const fork = week === 3
      ? CONTENT.week3Fork(day)
      : CONTENT.experimentFor(CONTENT.WEEK_BODIES[(day - 1) % 7]);
    if (!fork) return document.createComment("no fork");

    const s = STORE.get();
    const chosen = (s.cycle.choices || {})[day] || null;
    const wrap = el("div", { class: "card fork" });
    wrap.appendChild(el("h4", { text: "Today's choice" }));
    wrap.appendChild(el("p", { class: "day-text", text: fork.prompt }));

    const opts = el("div", { class: "fork-opts" });
    [["lean", fork.lean], ["counter", fork.counter]].forEach(([key, label]) => {
      const b = el("button", {
        type: "button",
        class: "fork-opt" + (chosen === key ? " active" : ""),
        text: label
      });
      b.addEventListener("click", () => {
        STORE.recordChoice(day, chosen === key ? null : key);
        renderCycleTab();
      });
      opts.appendChild(b);
    });
    wrap.appendChild(opts);
    wrap.appendChild(el("p", { class: "small-note", text:
      "Neither is right. Whichever you pick, it goes in your log — that's the part no birth chart decided." }));
    return wrap;
  }

  // Day-21 payoff: the chart you were handed vs. the one you made by showing
  // up, the string of 21 choices only you produced, and the North Node as
  // "who you're growing toward". Replaces the old bare "go repeat it" notice.
  // ---- the somatic layer ----
  // Each practice is framed as a way to feel the day's strength/cost in the
  // body, on the principle that gift and cost often share one sensation a
  // notch apart, and that the sensation is weather — it comes, it goes, it
  // isn't the self. One quality + one place per day, both optional, stored
  // one JSON key per day (matching the practice-key pattern).
  function readBodyNote(day) {
    try {
      const raw = localStorage.getItem("aa_body_day_" + day);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function writeBodyNote(day, note) {
    try { localStorage.setItem("aa_body_day_" + day, JSON.stringify(note)); } catch (e) {}
  }

  function bodyCueCard(day, week) {
    const cue = CONTENT.bodyCueForDay(day, week);
    if (!cue) return document.createComment("no body cue");
    return el("div", { class: "body-cue" }, [
      el("span", { class: "body-cue-label", text: "In the body" }),
      el("p", { class: "body-cue-text", text: cue })
    ]);
  }

  function bodyLog(day) {
    const wrap = el("div", { class: "card body-log" });
    wrap.appendChild(el("h4", { text: "How the body feels" }));
    wrap.appendChild(el("p", { class: "small-note", text:
      "Optional. A snapshot, not a verdict — and it will have changed by tomorrow." }));

    // "What has this got to do with my body?" — the answer, in place.
    const why = el("details", { class: "body-why" });
    why.appendChild(el("summary", { text: "Why notice the body?" }));
    why.appendChild(el("p", { class: "body-why-text", text: CONTENT.BODY_RATIONALE.plain }));
    wrap.appendChild(why);

    // field: "quality" | "place". A free-text "something else" always sits
    // alongside the presets — the six words are a starting point, not the
    // whole range of what a body can feel.
    function row(items, field, placeholder) {
      const grid = el("div", { class: "practice-grid" });
      const note = readBodyNote(day);
      items.forEach((it) => {
        const chip = el("button", {
          type: "button",
          class: "practice-chip" + (note[field] === it ? " active" : ""),
          text: it
        });
        chip.addEventListener("click", () => {
          const n = readBodyNote(day);
          if (n[field] === it) delete n[field]; else n[field] = it;
          writeBodyNote(day, n);
          renderCycleTab();
        });
        grid.appendChild(chip);
      });
      const otherChip = el("button", {
        type: "button",
        class: "practice-chip" + (note[field] === "other" ? " active" : ""),
        text: "something else…"
      });
      otherChip.addEventListener("click", () => {
        const n = readBodyNote(day);
        if (n[field] === "other") { delete n[field]; delete n[field + "Other"]; }
        else n[field] = "other";
        writeBodyNote(day, n);
        renderCycleTab();
      });
      grid.appendChild(otherChip);

      const box = el("div");
      box.appendChild(grid);
      if (note[field] === "other") {
        const input = el("input", { type: "text", class: "body-other", placeholder: placeholder });
        try { input.value = note[field + "Other"] || ""; } catch (e) {}
        input.addEventListener("input", () => {
          const n = readBodyNote(day);
          n[field + "Other"] = input.value;
          writeBodyNote(day, n);
        });
        box.appendChild(input);
      }
      return box;
    }

    wrap.appendChild(el("p", { class: "body-log-sub", text: "What it feels like" }));
    wrap.appendChild(row(CONTENT.BODY_QUALITIES, "quality", "in your own words"));
    wrap.appendChild(el("p", { class: "body-log-sub", text: "Where in the body" }));
    wrap.appendChild(row(CONTENT.BODY_PLACES, "place", "somewhere else — name it"));
    return wrap;
  }

  // Day-21: what the body reported across the three weeks. The contrast
  // between phases is the point — same person, different weather.
  function bodyPatternCard() {
    const phases = [
      { key: "gift", name: "gift", days: [1, 2, 3, 4, 5, 6, 7] },
      { key: "cost", name: "cost", days: [8, 9, 10, 11, 12, 13, 14] },
      { key: "others", name: "Week 3", days: [15, 16, 17, 18, 19, 20, 21] }
    ];
    let totalLogged = 0;
    const rows = phases.map((ph) => {
      const q = {}, p = {};
      ph.days.forEach((d) => {
        const n = readBodyNote(d);
        if (n.quality) { q[n.quality] = (q[n.quality] || 0) + 1; totalLogged++; }
        if (n.place) { p[n.place] = (p[n.place] || 0) + 1; }
      });
      const top = (o) => Object.keys(o).sort((a, b) => o[b] - o[a])[0] || null;
      return { name: ph.name, quality: top(q), place: top(p) };
    });

    const card = el("div", { class: "card" });
    card.appendChild(el("h4", { text: "What your body noticed" }));

    if (totalLogged < 3) {
      card.appendChild(el("p", { class: "day-text", text:
        "You logged body notes on only a few days — not enough for a pattern yet. If you run " +
        "another cycle, try a quick note most days: the contrast between the weeks is where it gets interesting." }));
      return card;
    }

    const qWord = (q) => q === "other" ? "something you named yourself" : "“" + q + "”";
    const pWord = (p) => p === "other" ? "somewhere you named yourself" : "around the " + p;
    rows.forEach((r) => {
      const txt = (!r.quality && !r.place)
        ? "On your " + r.name + " days — nothing logged."
        : "On your " + r.name + " days, most often " +
          (r.quality ? qWord(r.quality) : "something") +
          (r.place ? ", " + pWord(r.place) : "") + ".";
      card.appendChild(el("p", { class: "day-text body-pattern-line", text: txt }));
    });
    card.appendChild(el("p", { class: "day-text", text:
      "Same you, different weather. Neither reading is more “the real you” than the other — " +
      "both arrived, both passed. Noticing the shift while it happens is the whole practice." }));
    return card;
  }

  // Plain-text version of the report for "Copy summary" — structural facts
  // only (both charts, the choice tally, the growth direction). Deliberately
  // excludes every free-text note and journal entry: those never leave the
  // device (product description §8–9).
  function reportSummaryText(s, hs) {
    const natal = computeChart(s.me, hs);
    const inc = computeInceptionChart(s.me, s.cycle.startedAtISO, hs);
    const choices = s.cycle.choices || {};
    let lean = 0, counter = 0;
    for (let d = 1; d <= 21; d++) {
      if (choices[d] === "lean") lean++;
      else if (choices[d] === "counter") counter++;
    }
    const done = s.cycle.completedDays.length;
    const nn = natal.positions.NorthNode;
    const lines = [
      "AstroAtlasI — Journey " + s.cycle.number + " report",
      done + " of 21 days complete",
      "",
      "The chart you were given: Sun in " + ASTRO.signOf(natal.positions.Sun.lon) +
        ", Moon in " + ASTRO.signOf(natal.positions.Moon.lon) +
        (natal.asc != null ? ", rising " + ASTRO.signOf(natal.asc) : ""),
      "The chart you made (pressed Start " +
        (s.cycle.startedAtISO ? new Date(s.cycle.startedAtISO).toLocaleDateString() : "—") +
        "): Sun in " + ASTRO.signOf(inc.positions.Sun.lon) + ", Moon in " + ASTRO.signOf(inc.positions.Moon.lon),
      "",
      "Your 21 choices: with the grain " + lean + " · against the grain " + counter +
        " · not logged " + (21 - lean - counter)
    ];
    if (nn) lines.push("", "Growing toward: North Node in " + ASTRO.signOf(nn.lon));
    lines.push("", "Your day-by-day notes stay private on your device and are not included here.");
    return lines.join("\n");
  }

  function divergenceView(s, hs, opts) {
    opts = opts || {};
    const wrap = document.createDocumentFragment();
    const natal = computeChart(s.me, hs);

    const report = el("div", { class: "report-print" });
    report.appendChild(el("h3", { text: "Your 21 days" }));

    const givenSun = ASTRO.signOf(natal.positions.Sun.lon);
    const givenMoon = ASTRO.signOf(natal.positions.Moon.lon);
    report.appendChild(
      el("div", { class: "card" }, [
        el("h4", { text: "The chart you were given" }),
        el("p", { class: "day-text", text:
          "Sun in " + givenSun + ", Moon in " + givenMoon +
          (natal.asc != null ? ", rising " + ASTRO.signOf(natal.asc) : "") +
          ". Fixed the minute you were born — the ground you started on." })
      ])
    );

    const inc = computeInceptionChart(s.me, s.cycle.startedAtISO, hs);
    const startedTxt = s.cycle.startedAtISO
      ? new Date(s.cycle.startedAtISO).toLocaleDateString()
      : "the day you began";
    report.appendChild(
      el("div", { class: "card" }, [
        el("h4", { text: "The chart you made" }),
        el("p", { class: "day-text", text:
          "Cast for the moment you pressed Start (" + startedTxt + "): Sun in " +
          ASTRO.signOf(inc.positions.Sun.lon) + ", Moon in " + ASTRO.signOf(inc.positions.Moon.lon) +
          ". Nobody handed you this one — you made it by turning up." })
      ])
    );

    const choices = s.cycle.choices || {};
    let lean = 0, counter = 0;
    for (let d = 1; d <= 21; d++) {
      if (choices[d] === "lean") lean++;
      else if (choices[d] === "counter") counter++;
    }
    const skipped = 21 - lean - counter;
    const dots = el("div", { class: "choice-dots" });
    for (let d = 1; d <= 21; d++) {
      const k = choices[d];
      dots.appendChild(el("span", {
        class: "choice-dot " + (k === "lean" ? "is-lean" : k === "counter" ? "is-counter" : "is-skip"),
        title: "Day " + d + ": " + (k === "lean" ? "with the grain" : k === "counter" ? "against the grain" : "no choice logged")
      }));
    }
    report.appendChild(
      el("div", { class: "card" }, [
        el("h4", { text: "The 21 choices you logged" }),
        dots,
        el("p", { class: "day-text", text:
          "With the grain " + lean + " · against the grain " + counter + " · " +
          skipped + " not logged. That string of choices is yours alone — no chart produced it." })
      ])
    );

    report.appendChild(bodyPatternCard());

    const twins = el("div", { class: "notice" });
    twins.textContent =
      "Identical twins share a birth chart to the minute. Their lives aren't identical. " +
      "The difference is 21 days like these, repeated for years.";
    report.appendChild(twins);

    const nn = natal.positions.NorthNode;
    if (nn) {
      const nnSign = ASTRO.signOf(nn.lon);
      report.appendChild(
        el("div", { class: "card" }, [
          el("h4", { text: "The direction you're growing toward" }),
          el("p", { class: "day-text", text:
            "North Node in " + nnSign + " — " + CONTENT.signFlavor(nnSign) +
            ". Not where you already are; where the stretch is. Another 21 days is how you walk toward it." })
        ])
      );
    }

    wrap.appendChild(report);

    if (opts.preview) return wrap;

    // Take the report with you — structural summary only, never the notes.
    const exportRow = el("div", { class: "report-export" });
    const printBtn = el("button", { type: "button", class: "offer-btn", text: "Save / print report" });
    printBtn.addEventListener("click", () => {
      document.body.classList.add("printing-report");
      window.print();
      setTimeout(() => document.body.classList.remove("printing-report"), 500);
    });
    const copyBtn = el("button", { type: "button", class: "offer-btn", text: "Copy summary" });
    copyBtn.addEventListener("click", () => {
      const text = reportSummaryText(s, hs);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => window.APP_TOAST && window.APP_TOAST("Summary copied"),
          () => window.APP_TOAST && window.APP_TOAST("Copy failed")
        );
      } else if (window.APP_TOAST) {
        window.APP_TOAST("Copy not available here");
      }
    });
    exportRow.appendChild(printBtn);
    exportRow.appendChild(copyBtn);
    wrap.appendChild(exportRow);
    wrap.appendChild(el("p", { class: "small-note", text:
      "The saved report holds the chart comparison, your choice pattern and your growth direction. " +
      "Your day-by-day notes stay private on this device and are never part of it." }));

    wrap.appendChild(glossaryCard());

    const look = el("button", { type: "button", class: "offer-btn", text: "Look back at any day" });
    look.addEventListener("click", () => { reviewMode = true; viewDay = 1; renderCycleTab(); });
    wrap.appendChild(look);
    const allBtn = el("button", { type: "button", class: "offer-btn", text: "Review all 21 days on one page" });
    allBtn.style.marginTop = "8px";
    allBtn.addEventListener("click", () => { reviewAll = true; renderCycleTab(); });
    wrap.appendChild(allBtn);

    const again = el("button", { class: "primary-btn", type: "button", text: "Start journey " + (s.cycle.number + 1) });
    again.style.marginTop = "8px";
    again.addEventListener("click", () => { reviewMode = false; viewDay = null; STORE.repeatCycle("same"); renderAll(); location.hash = "#cycle"; });
    wrap.appendChild(again);
    const gx = el("button", { class: "primary-btn", type: "button", text: "See my Galaxy" });
    gx.style.marginTop = "8px";
    gx.addEventListener("click", () => { location.hash = "#galaxy"; });
    wrap.appendChild(gx);

    return wrap;
  }

  function renderCycleTab() {
    const root = document.getElementById("panel-cycle");
    root.innerHTML = "";
    const s = STORE.get();

    if (!s.me) {
      const hint = el("div", { class: "empty-hint", text: "Set up your chart first." });
      const goBtn = el("button", { type: "button", class: "primary-btn", text: "Enter my birth data" });
      goBtn.addEventListener("click", () => location.hash = "#birthdata");
      root.appendChild(hint);
      root.appendChild(goBtn);
      return;
    }

    const today = STORE.currentDay();
    const hs = getHouseSystemPref();

    // First time in, nothing done yet: show the bridge from chart → journey
    // instead of dropping straight onto Day 1.
    if (s.cycle.completedDays.length === 0 && !journeyIntroSeen()) {
      root.appendChild(journeyIntro());
      return;
    }

    root.appendChild(el("h2", { text: "21-Day Journey — Journey " + s.cycle.number }));
    root.appendChild(
      el("div", { class: "progress-note", text: s.cycle.completedDays.length + " of 21 days complete. Missing a day never resets your journey — come back whenever." })
    );
    root.appendChild(glossaryCard());

    const complete = s.cycle.completedDays.length >= 21;
    if (!complete) reviewMode = false;

    // One-page review of every day (reachable from the map, and from the
    // finished report).
    if (reviewAll) {
      const back = el("button", { type: "button", class: "back-link", text: complete ? "← Back to report" : "← Back to journey" });
      back.addEventListener("click", () => { reviewAll = false; renderCycleTab(); });
      root.appendChild(back);
      root.appendChild(journeyReviewAll(s, hs));
      return;
    }

    // Preview the shape of the Day-21 report before finishing it.
    if (previewReport && !complete) {
      const back = el("button", { type: "button", class: "back-link", text: "← Back to journey" });
      back.addEventListener("click", () => { previewReport = false; renderCycleTab(); });
      root.appendChild(back);
      root.appendChild(el("div", { class: "notice", text:
        "This is the shape of your Day 21 report — it fills in as you go. Right now it reflects " +
        s.cycle.completedDays.length + " of 21 days." }));
      root.appendChild(divergenceView(s, hs, { preview: true }));
      return;
    }

    if (complete && !reviewMode) {
      root.appendChild(journeyMap(s, hs, today));
      root.appendChild(divergenceView(s, hs));
      return;
    }

    if (complete && reviewMode) {
      clampViewDay(21);
      const back = el("button", { type: "button", class: "back-link", text: "← Back to summary" });
      back.addEventListener("click", () => { reviewMode = false; viewDay = null; renderCycleTab(); });
      root.appendChild(back);
      root.appendChild(dayNav(viewDay, 21, null));
      root.appendChild(dayView(viewDay, s, hs, "review"));
      return;
    }

    // Journey in progress: the whole-journey map first (orientation), then
    // the day itself, browsable from Day 1 up to today.
    clampViewDay(today);
    root.appendChild(journeyMap(s, hs, today));
    root.appendChild(
      dayNav(viewDay, today, viewDay !== today ? function () { viewDay = null; renderCycleTab(); } : null)
    );
    root.appendChild(dayView(viewDay, s, hs, viewDay === today ? "active" : "past"));
  }

  function dayCard(title, text, day) {
    return el("div", { class: "card" }, [
      el("h4", { text: title }),
      el("p", { class: "day-text", text: text })
    ]);
  }

  function week3Content(day, s, hs) {
    const wrap = document.createDocumentFragment();
    const accepted = s.others.filter((p) => p.consent === "accepted");

    if (accepted.length > 0) {
      accepted.forEach((person) => {
        const chart = computeChart(person, hs);
        const bodyIdx = (day - 15) % CONTENT.WEEK_BODIES.length;
        const body = CONTENT.WEEK_BODIES[bodyIdx];
        const placement = chart.positions[body];
        const text = CONTENT.noticeContent(body, person.name, ASTRO.signOf(placement.lon));
        const card = document.createElement("div");
        card.className = "card";
        card.appendChild(el("h4", { text: "Noticing " + person.name }));
        card.appendChild(el("p", { class: "day-text", text: text }));
        wrap.appendChild(card);
      });
    } else {
      // Solo Week 3: inception chart + observation mode, run together.
      const inception = computeInceptionChart(s.me, s.cycle.startedAtISO, hs);
      const sunSign = ASTRO.signOf(inception.positions.Sun.lon);
      const moonSign = ASTRO.signOf(inception.positions.Moon.lon);
      const inceptionCard = document.createElement("div");
      inceptionCard.className = "card";
      inceptionCard.appendChild(el("h4", { text: "Your Inception Chart" }));
      inceptionCard.appendChild(
        el("p", { class: "day-text", text:
          "Cast for the moment you began Day 1. Its Sun is in " + sunSign + ", its Moon in " + moonSign +
          ". Read here as: how are you meeting change right now? What are you actually willing to move? " +
          "This isn't a chart about who you are — it's a mirror on how you begin things."
        })
      );
      wrap.appendChild(inceptionCard);

      const obsCard = document.createElement("div");
      obsCard.className = "card";
      obsCard.appendChild(el("h4", { text: "Observation without data" }));
      obsCard.appendChild(el("p", { class: "day-text", text:
        "Pick a real person in your life — no birth data, no chart, nothing collected about them here. " +
        "Today, practise seeing them accurately: what are they protecting? What are they good at that you've " +
        "discounted because it isn't your way? (Nothing you type below is saved — this is just for your own reflection right now.)"
      }));
      const obsInput = el("textarea", { rows: "3", placeholder: "Jot a thought here if it helps — this field isn't saved." });
      obsCard.appendChild(obsInput);
      wrap.appendChild(obsCard);

      const inviteHint = document.createElement("div");
      inviteHint.className = "notice";
      inviteHint.textContent = "Have someone ready to add instead? Go to My account → People to send a consent-based invitation.";
      wrap.appendChild(inviteHint);
    }
    return wrap;
  }

  function practicePicker(day, week) {
    const wrap = el("div", { class: "card practice-picker" });
    wrap.appendChild(el("h4", { text: "Today's practice" }));

    const suggestion = CONTENT.practiceSuggestion(day, week);
    if (suggestion) {
      const sug = CONTENT.PRACTICES.find((x) => x.key === suggestion.key);
      wrap.appendChild(el("p", { class: "practice-why", text:
        "Suggested — " + (sug ? sug.label : suggestion.key) + ". " + suggestion.why }));
    }

    const key = "aa_practice_day_" + day;
    const noteKey = "aa_practice_note_day_" + day;
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) {}

    const grid = el("div", { class: "practice-grid" });
    CONTENT.PRACTICES.forEach((p) => {
      const isSuggested = suggestion && suggestion.key === p.key;
      const btn = el("button", {
        type: "button",
        class: "practice-chip" + (saved === p.key ? " active" : "") + (isSuggested ? " suggested" : ""),
        title: p.desc,
        text: p.label
      });
      btn.addEventListener("click", () => {
        try { localStorage.setItem(key, saved === p.key ? "" : p.key); } catch (e) {}
        renderCycleTab();
      });
      grid.appendChild(btn);
    });
    // "My own" sits alongside the suggestions, never replacing them.
    const customChip = el("button", {
      type: "button",
      class: "practice-chip" + (saved === "custom" ? " active" : ""),
      text: "Something else…"
    });
    customChip.addEventListener("click", () => {
      try { localStorage.setItem(key, saved === "custom" ? "" : "custom"); } catch (e) {}
      renderCycleTab();
    });
    grid.appendChild(customChip);
    wrap.appendChild(grid);

    if (saved === "custom") {
      const ta = el("textarea", { rows: "2", class: "practice-custom", placeholder: "Your own practice for today — a few words is enough." });
      try { ta.value = localStorage.getItem(noteKey) || ""; } catch (e) {}
      ta.addEventListener("input", () => { try { localStorage.setItem(noteKey, ta.value); } catch (e) {} });
      wrap.appendChild(ta);
    } else if (saved) {
      const p = CONTENT.PRACTICES.find((x) => x.key === saved);
      if (p) wrap.appendChild(el("p", { class: "small-note", text: p.desc }));
    }
    return wrap;
  }

  // A short line to sit with for the day — tied to the day's planet (Weeks
  // 1–2) or the "seeing other people" theme (Week 3).
  function dayQuoteCard(day, week) {
    const q = CONTENT.quoteForDay(day, week);
    if (!q) return document.createComment("no quote");
    return el("blockquote", { class: "day-quote" }, [
      el("p", { class: "day-quote-text", text: "“" + q.text + "”" }),
      el("cite", { class: "day-quote-who", text: "— " + q.who })
    ]);
  }

  // Move between any day already reached and today, without changing
  // progress. Days ahead of today stay out of reach (the gift/cost pacing
  // and the chart-page tile unlocks key off how many days are complete).
  function dayNav(day, maxDay, onJumpToday) {
    const nav = el("div", { class: "day-nav" });
    const prev = el("button", { type: "button", class: "day-nav-arrow", text: "‹" });
    prev.setAttribute("aria-label", "Previous day");
    prev.disabled = day <= 1;
    prev.addEventListener("click", () => { viewDay = day - 1; renderCycleTab(); });
    const next = el("button", { type: "button", class: "day-nav-arrow", text: "›" });
    next.setAttribute("aria-label", "Next day");
    next.disabled = day >= maxDay;
    next.addEventListener("click", () => { viewDay = day + 1; renderCycleTab(); });
    nav.appendChild(prev);
    nav.appendChild(el("span", { class: "day-nav-label", text: "Day " + day + " of 21 · Week " + weekOf(day) }));
    nav.appendChild(next);
    if (onJumpToday) {
      const j = el("button", { type: "button", class: "day-nav-today", text: "Jump to today →" });
      j.addEventListener("click", onJumpToday);
      nav.appendChild(j);
    }
    return nav;
  }

  // One day's content, shared by the in-progress view and the post-21
  // "look back at any day" review. mode: "active" (today, not done) shows
  // the complete button; "past"/"review" show a completed note instead,
  // with practice and choice still editable.
  function dayView(day, s, hs, mode) {
    const frag = document.createDocumentFragment();
    const week = weekOf(day);
    frag.appendChild(el("h3", { text: "Day " + day + " — Week " + week +
      (week === 1 ? " (Your Gift)" : week === 2 ? " (The Cost of the Gift)" : " (The Others)") }));

    // One line naming where this day sits in the arc, so 21 days don't read
    // as one undifferentiated stretch.
    let progressionLine;
    if (week === 1 || week === 2) {
      const body = CONTENT.WEEK_BODIES[(day - 1) % 7];
      progressionLine = WEEK_BLURB[week] + " Today: " + body + ".";
    } else {
      progressionLine = WEEK_BLURB[3] + " Day " + (day - 14) + " of 7.";
    }
    frag.appendChild(el("p", { class: "day-progression", text: progressionLine }));

    if (week === 1 || week === 2) {
      const body = CONTENT.WEEK_BODIES[(day - 1) % 7];
      const chart = computeChart(s.me, hs);
      const placement = chart.positions[body];
      const kind = week === 1 ? "gift" : "cost";
      const text = CONTENT.dayContent(kind, body, ASTRO.signOf(placement.lon), placement.house);
      frag.appendChild(dayCard(body + " — " + (kind === "gift" ? "the gift" : "the cost of the gift"), text, day));
    } else {
      frag.appendChild(week3Content(day, s, hs));
    }

    frag.appendChild(practicePicker(day, week));
    frag.appendChild(choiceFork(day, week));

    // Reflection quote, body cue and body log are the deeper, optional part
    // of the daily ritual — kept open for the first couple of days, then
    // folded away by default so a returning day feels lighter (all still
    // one tap away).
    const extras = el("details", { class: "day-extras" });
    if (day <= 2) extras.open = true;
    extras.appendChild(el("summary", { text: "Quote, body cue & body log" }));
    extras.appendChild(dayQuoteCard(day, week));
    extras.appendChild(bodyCueCard(day, week));
    extras.appendChild(bodyLog(day));
    frag.appendChild(extras);

    if (mode === "active") {
      const done = s.cycle.completedDays.indexOf(day) !== -1;
      const doneBtn = el("button", { class: "primary-btn", type: "button",
        text: done ? "Today already complete ✓" : "Mark today complete" });
      doneBtn.disabled = done;
      doneBtn.addEventListener("click", () => { STORE.completeDay(day); viewDay = null; renderCycleTab(); });
      frag.appendChild(doneBtn);
    } else {
      frag.appendChild(el("p", { class: "day-done-note", text:
        "Completed. You can still revise the practice or choice above — nothing here is locked." }));
    }
    return frag;
  }

  // ================= PEOPLE TAB (consent / invite / withdraw) =================

  function renderPeopleTab() {
    const root = document.getElementById("panel-people");
    root.innerHTML = "";
    const s = STORE.get();

    root.appendChild(backButton());
    root.appendChild(el("h2", { text: "People" }));
    root.appendChild(
      el("div", { class: "notice" }, [
        document.createTextNode(
          "There's no server yet, so nothing is actually emailed. In the finished app you'd enter the other " +
          "person's email; they'd get an invitation, open their own account, and accept it there — their chart " +
          "never becomes part of your Galaxy without that yes. Here, one browser stands in for both people: " +
          "enter their birth details below, then use “Accept (as them)” / “Decline (as them)” to play their side."
        )
      ])
    );

    if (s.others.length === 0) {
      root.appendChild(el("div", { class: "empty-hint", text: "No one added yet." }));
    }

    s.others.forEach((p) => {
      const card = el("div", { class: "card" });
      card.appendChild(el("h4", { text: p.name || "(unnamed)" }));
      const statusLine = p.consent === "invited"
        ? "Consent status: invited — nothing emailed, this is a local simulation"
        : "Consent status: " + p.consent;
      card.appendChild(el("div", { class: "small-note", text: statusLine }));
      if (p.email) card.appendChild(el("div", { class: "small-note", text: "Invite address: " + p.email }));
      if (p.consent === "invited") {
        card.appendChild(
          el("div", { class: "notice" }, [
            document.createTextNode(
              "The invitation they'd receive would say: “" +
              (s.me && s.me.name ? s.me.name : "Someone") + " wants to add your chart to their Week 3 and Galaxy. " +
              "Your Weeks 1–2 stay private to you always; only your chart placements are shared, and you can withdraw at any time.” " +
              "In this prototype, click below to stand in for their reply."
            )
          ])
        );
        card.appendChild(
          el("div", { class: "card-actions" }, [
            el("button", { type: "button", text: "Accept (as them)", onclick: () => { STORE.setConsent(p.id, "accepted"); renderPeopleTab(); renderGalaxyTab(); } }),
            el("button", { type: "button", class: "danger", text: "Decline (as them)", onclick: () => { STORE.setConsent(p.id, "declined"); renderPeopleTab(); } })
          ])
        );
      } else if (p.consent === "accepted") {
        card.appendChild(
          el("div", { class: "card-actions" }, [
            el("button", { type: "button", class: "danger", text: "Withdraw", onclick: () => { STORE.withdraw(p.id); renderPeopleTab(); renderGalaxyTab(); } })
          ])
        );
      }
      root.appendChild(card);
    });

    root.appendChild(el("h3", { text: "Invite someone" }));
    root.appendChild(
      birthForm((profile) => {
        if (s.me && s.me.name && profile.name &&
            profile.name.trim().toLowerCase() === s.me.name.trim().toLowerCase()) {
          window.APP_TOAST && window.APP_TOAST("That's your own name — add the other person");
          return;
        }
        STORE.addOther(profile);
        renderPeopleTab();
        document.getElementById("panel-people").scrollIntoView({ block: "start" });
      }, "Their birth details", "Add & preview the invite", null, null, { email: true })
    );
  }

  // ================= GALAXY TAB =================

  function renderGalaxyTab() {
    const root = document.getElementById("panel-galaxy");
    root.innerHTML = "";
    const s = STORE.get();
    const hs = getHouseSystemPref();

    root.appendChild(backButton());

    if (!s.me) {
      const hint = el("div", { class: "empty-hint", text: "Set up your chart first." });
      const goBtn = el("button", { type: "button", class: "primary-btn", text: "Enter my birth data" });
      goBtn.addEventListener("click", () => location.hash = "#birthdata");
      root.appendChild(hint);
      root.appendChild(goBtn);
      return;
    }

    const accepted = s.others.filter((p) => p.consent === "accepted");
    const stars = [{ name: s.me.name || "You", chart: computeChart(s.me, hs) }].concat(
      accepted.map((p) => ({ name: p.name, chart: computeChart(p, hs) }))
    );

    const brightness = brightnessPercent(s);

    // Earned-surprise moment: mark the first time brightness crosses each
    // quarter threshold rather than letting the bar creep up unremarked.
    const THRESHOLDS = [25, 50, 75, 100];
    const prevMilestone = s.cycle.brightnessMilestone || 0;
    const reached = THRESHOLDS.filter((t) => brightness >= t);
    const topReached = reached.length ? reached[reached.length - 1] : 0;
    const crossedNow = brightness >= 25 && topReached > prevMilestone && panelIsActive("galaxy");

    root.appendChild(el("h2", { text: "Your Galaxy" }));
    const barWrap = el("div", { class: "brightness-bar-wrap" + (crossedNow ? " just-brightened" : "") }, [
      el("div", { class: "small-note", text: "Brightness: " + brightness + "% — earned by taking in gift and cost together, never purchasable." }),
      el("div", { class: "brightness-bar" }, [el("div", { class: "brightness-fill", style: "width:" + brightness + "%" })])
    ]);
    if (crossedNow) {
      barWrap.appendChild(el("div", { class: "brightness-burst", text:
        "✦ Your sky just crossed " + topReached + "% — the light is holding." }));
      STORE.setBrightnessMilestone(topReached);
      if (window.APP_TOAST) window.APP_TOAST("✦ Sky brightness " + topReached + "%");
    }
    root.appendChild(barWrap);

    root.appendChild(el("div", { class: "small-note", text: stars.length + " star" + (stars.length === 1 ? "" : "s") + " in this galaxy (2–3 max for this MVP)." }));

    if (stars.length > 1) {
      const composite = computeCompositeChart(stars.map((st) => st.chart));
      root.appendChild(chartCard("Galaxy Chart (midpoint composite)", { positions: composite.positions, unknownTime: false, asc: null, mc: null, aspects: [] }, hs, false));
      root.appendChild(el("div", { class: "notice", text: "Composite Ascendant/houses aren't shown — derived angles for a midpoint chart are a known soft spot of the technique, stated here rather than presented as precise." }));
    }

    stars.forEach((st) => root.appendChild(chartCard(st.name, st.chart, hs, false)));

    root.appendChild(el("h3", { text: "Repeat the journey" }));
    root.appendChild(
      el("div", { class: "card-actions" }, [
        el("button", { type: "button", text: "Same people, new journey", onclick: () => { STORE.repeatCycle("same"); renderAll(); location.hash = "#cycle"; } }),
        el("button", { type: "button", text: "New circle", onclick: () => { STORE.repeatCycle("new-circle"); renderAll(); location.hash = "#people"; } }),
        el("button", { type: "button", text: "Solo again", onclick: () => { STORE.repeatCycle("new-circle"); renderAll(); location.hash = "#cycle"; } })
      ])
    );
  }

  // ================= PRIVACY TAB =================

  function renderPrivacyTab() {
    const root = document.getElementById("panel-privacy");
    root.innerHTML = "";
    root.appendChild(backButton());
    root.appendChild(el("h2", { text: "Privacy & deletion" }));
    root.appendChild(
      el("div", { class: "card" }, [
        el("p", { class: "day-text", text:
          "Everything you see here lives only in this browser's local storage — no account, no server. " +
          "Weeks 1 and 2 content and any journal-style notes never leave this device and are never exported. " +
          "Observation-mode notes (Week 3 solo) aren't saved at all, anywhere."
        }),
        el("p", { class: "day-text", text:
          "Deletion below is real deletion: it clears local storage immediately, not a soft flag."
        })
      ])
    );
    const btn = el("button", { class: "primary-btn danger", type: "button", text: "Delete everything" });
    btn.addEventListener("click", () => {
      if (confirm("This permanently deletes your chart, journey progress, and everyone added. Continue?")) {
        STORE.deleteEverything();
        renderAll();
        location.hash = "#home";
      }
    });
    root.appendChild(btn);
  }

  function renderAll() {
    renderHomeTeaser();
    renderBirthDataStep();
    renderChartStep();
    renderCycleTab();
    renderPeopleTab();
    renderGalaxyTab();
    renderPrivacyTab();
  }

  return {
    renderAll: renderAll,
    renderHomeTeaser: renderHomeTeaser,
    renderBirthDataStep: renderBirthDataStep,
    renderChartStep: renderChartStep,
    renderCycleTab: renderCycleTab,
    renderPeopleTab: renderPeopleTab,
    renderGalaxyTab: renderGalaxyTab,
    renderPrivacyTab: renderPrivacyTab
  };
})();
