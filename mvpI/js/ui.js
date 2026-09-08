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
      ["It shows your strengths — and the shadow each one casts",
       "Every strength has a flip side. We always show the two together, side by side — never a separate list of flaws."],
      ["A 21-day journey is there if you want it",
       "Your chart is your life map: planets carrying energy until you use it. We're here to experience, create, share love. You always choose. These 21 days activate what's yours."],
      ["A weekly extra: a strong thought",
       "When a question won't leave you alone, note the moment it struck. At the end of the week the app draws the sky for that exact moment and reads it back in plain words — an old practice called horary. Never a yes or a no. One a week."]
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

    root.appendChild(el("h2", { text: "Your strengths, and their shadows" }));
    root.appendChild(strengthsWeaknessesCard(chart));

    // The journey is an optional next step, not the headline. Kept as a
    // quiet outline-button offer with the time commitment stated up front,
    // so the chart itself stays the main thing on this screen.
    const started = s.cycle.completedDays.length > 0;
    const offer = el("div", { class: "card journey-offer" });
    if (started) {
      offer.appendChild(el("h4", { text: "Your 21-day journey" }));
      offer.appendChild(el("p", { class: "offer-text", text:
        "Day " + STORE.currentDay() + ". Pick up where you left off — nothing was lost." }));
      const b = el("button", { class: "offer-btn", type: "button", text: "Continue the journey →" });
      b.addEventListener("click", () => location.hash = "#cycle");
      offer.appendChild(b);

      // Start the 21 days again from Day 1. Keeps this chart; clears only the
      // journey (completed days, practice + body notes, this cycle's thought
      // log and horary question).
      const restart = el("button", { class: "offer-btn offer-btn-quiet", type: "button", text: "Start over from Day 1" });
      restart.style.marginTop = "8px";
      restart.addEventListener("click", () => {
        const ok = window.confirm(
          "Start the 21 days over from Day 1?\n\n" +
          "Your birth chart stays. This clears your completed days, your practice and body notes, " +
          "and this journey's strong-thoughts log. It can't be undone."
        );
        if (!ok) return;
        STORE.restartJourney();
        try { localStorage.setItem("aa_journey_intro_dismissed", "1"); } catch (e) {}
        if (window.APP_TOAST) window.APP_TOAST("Back to Day 1");
        location.hash = "#cycle";
        renderCycleTab();
      });
      offer.appendChild(restart);
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
      el("p", { class: "small-note", text: "All seven strengths are here from the start. Tap one to see the shadow it casts — the same trait, seen from its cost. The shadow half opens as your journey reaches Week 2." })
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
    const shownBodies = ASTRO.BODY_ORDER.filter((b) => b !== "SouthNode" && chart.positions[b]);
    shownBodies.forEach((body) => {
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
      { label: "Exact degrees (" + shownBodies.length + ")", panel: table },
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
  let journeyOverview = false; // P0: the day screen shows only today; map/horary/log live here
  let practiceNoteOpenDay = null; // P0: which day's "Note how it felt" fold is open (survives re-render)
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
        let theme;
        if (w === 3) {
          theme = "the people in your life";
        } else {
          const body = CONTENT.WEEK_BODIES[i];
          const p = chart.positions[body];
          theme = body + (p ? " in " + ASTRO.signOf(p.lon) : "") + (w === 1 ? " — the gift" : " — the cost");
        }
        let practiceKey = null;
        try { practiceKey = localStorage.getItem("aa_practice_day_" + d); } catch (e) {}
        let practiceLabel = null;
        if (practiceKey === "custom") practiceLabel = "your own";
        else if (practiceKey) {
          const pp = CONTENT.PRACTICES.find((x) => x.key === practiceKey);
          practiceLabel = pp ? pp.label : practiceKey;
        }
        let bodyNote = {};
        try {
          const raw = localStorage.getItem("aa_body_day_" + d);
          bodyNote = raw ? JSON.parse(raw) : {};
        } catch (e) {}
        const bodyBit = bodyNote.quality && bodyNote.quality !== "other" ? " · felt " + bodyNote.quality : "";
        const done = s.cycle.completedDays.indexOf(d) !== -1;
        const row = el("button", { type: "button", class: "review-row" }, [
          el("span", { class: "review-row-day", text: "Day " + d }),
          el("span", { class: "review-row-theme", text: theme }),
          el("span", { class: "review-row-meta", text:
            (done ? "done" : "not done") + (practiceLabel ? " · " + practiceLabel : "") + bodyBit })
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

  // ============ HORARY THOUGHT LOG + WEEKLY REVEAL ============
  // During each week the user logs the moment any strong thought strikes
  // (date, time, place). Once that week's seven days are all complete, one
  // of those moments can be put — as a question — to a horary chart cast
  // for exactly that moment, read in the descriptive Goldstein-Jacobson
  // style: significators, applying/separating, the Moon's next aspect,
  // considerations before judgement. It never returns a yes/no.

  let thoughtFormOpen = false;
  let horaryDraft = { thoughtId: null, topicKey: null, question: "" };

  function weekComplete(s, w) {
    for (let d = (w - 1) * 7 + 1; d <= w * 7; d++) {
      if (s.cycle.completedDays.indexOf(d) === -1) return false;
    }
    return true;
  }
  function thoughtsFor(s, w) {
    return (s.thoughts || []).filter((t) => t.cycle === s.cycle.number && t.week === w);
  }
  function ordinalWord(n) {
    return ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][n] || (n + "th");
  }

  // Plain-language stand-ins for the horary reveal, so it reads like a story
  // and not a textbook. Each house becomes an everyday area of life; each
  // planet becomes "what it's about". The chart wheel above still shows the
  // real signs and degrees for anyone who wants them.
  const HOUSE_PLAIN = {
    1: "you, and how this goes for you",
    2: "money and the things you own",
    3: "talking, messages, and short trips",
    4: "home and family",
    5: "fun, romance, children, and making things",
    6: "everyday work and health",
    7: "the other person — a partner, or someone you're up against",
    8: "shared money and big changes",
    9: "learning, travel, and big questions",
    10: "your work out in the world, and your name",
    11: "friends, groups, and things you hope for",
    12: "quiet, hidden, behind-the-scenes things"
  };
  const PLANET_PLAIN = {
    Sun: "being seen, and whoever's in charge",
    Moon: "feelings and day-to-day life",
    Mercury: "talking, messages, and paperwork",
    Venus: "people you like, money, and nice things",
    Mars: "action, a push, or a bit of a fight",
    Jupiter: "luck, growth, and someone helpful",
    Saturn: "rules, waiting, and hard work"
  };
  function housePlain(h) { return HOUSE_PLAIN[h] || ("area " + h + " of life"); }
  function planetPlain(p) { return PLANET_PLAIN[p] || p; }

  // Essential dignity, in the same plain voice — "how much of a say this
  // star has where it's standing".
  const DIGNITY_PHRASE = {
    domicile: "It's on home ground there — settled, with a real say in how things go.",
    exaltation: "It's a guest of honour there — well thought of, and given room to act.",
    detriment: "It's far from home there — working against the grain.",
    fall: "It's on the back foot there — not much underfoot to draw on.",
    peregrine: "It's just passing through — no special standing either way."
  };
  function dignityPhrase(d) { return d && DIGNITY_PHRASE[d.status] ? DIGNITY_PHRASE[d.status] : null; }

  // Days -> a rough, friendly stretch of time.
  function phraseDuration(days) {
    if (days == null || !isFinite(days) || days < 0) return null;
    if (days < 1 / 24) return "very soon";
    if (days < 1) { const h = Math.max(1, Math.round(days * 24)); return "in about " + h + " hour" + (h === 1 ? "" : "s"); }
    if (days < 14) { const d = Math.round(days); return "in about " + d + " day" + (d === 1 ? "" : "s"); }
    return "further off — a few weeks away";
  }

  function thoughtLogCard(s) {
    const wrap = el("div", { class: "card thought-log" });
    const curWeek = weekOf(Math.min(STORE.currentDay(), 21));
    wrap.appendChild(el("h3", { text: "Strong thoughts — Week " + curWeek }));
    wrap.appendChild(el("p", { class: "small-note", text:
      "Whenever a strong thought comes up this week, log the moment it struck — date, time, place. " +
      "Once the seven days are done, you can put one of them as a question to a horary chart cast for that exact moment." }));

    const list = thoughtsFor(s, curWeek).slice().sort((a, b) => (a.atISO < b.atISO ? -1 : 1));
    if (list.length === 0) {
      wrap.appendChild(el("div", { class: "empty-hint", text: "Nothing here yet — and that's fine. Log a moment only if one comes." }));
    } else {
      list.forEach((t) => {
        const when = new Date(t.atISO);
        const row = el("div", { class: "thought-row" }, [
          el("div", { class: "thought-body" }, [
            el("div", { class: "thought-when", text:
              when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) +
              (t.place && t.place.label ? " · " + t.place.label : "") }),
            el("div", { class: "thought-note", text: t.note || "(no note)" })
          ])
        ]);
        const del = el("button", { type: "button", class: "thought-del", title: "Remove", text: "✕" });
        del.addEventListener("click", () => { STORE.deleteThought(t.id); renderCycleTab(); });
        row.appendChild(del);
        wrap.appendChild(row);
      });
    }

    if (!thoughtFormOpen) {
      const add = el("button", { type: "button", class: "offer-btn", text: "＋ Log a strong thought" });
      add.addEventListener("click", () => { thoughtFormOpen = true; renderCycleTab(); });
      wrap.appendChild(add);
    } else {
      wrap.appendChild(thoughtForm(s, curWeek));
    }
    return wrap;
  }

  function thoughtForm(s, week) {
    const box = el("div", { class: "thought-form" });
    const pad = (n) => String(n).padStart(2, "0");

    const noteTa = el("textarea", { rows: "2", class: "practice-custom", placeholder: "The thought, in a few words." });
    const dtInput = el("input", { type: "datetime-local" });
    const now = new Date();
    dtInput.value = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) +
      "T" + pad(now.getHours()) + ":" + pad(now.getMinutes());

    let place = s.me && s.me.place
      ? { lat: s.me.place.lat, lon: s.me.place.lon, zone: s.me.place.zone, label: "where you were born" }
      : null;
    const placeSearch = el("input", { type: "text", placeholder: "A city — leave blank to use your birth place" });
    const placeResults = el("div", { class: "place-results" });
    const placeNote = el("div", { class: "small-note", text: place ? "Using: " + place.label : "Pick a place." });
    placeSearch.addEventListener("input", () => {
      placeResults.innerHTML = "";
      findPlaces(placeSearch.value).forEach((p) => {
        const b = el("button", { type: "button", class: "place-result", text: p.name });
        b.addEventListener("click", () => {
          place = { lat: p.lat, lon: p.lon, zone: p.zone, label: p.name };
          placeSearch.value = p.name;
          placeResults.innerHTML = "";
          placeNote.textContent = "Using: " + p.name;
        });
        placeResults.appendChild(b);
      });
    });

    const err = el("div", { class: "form-error" });
    const save = el("button", { type: "button", class: "primary-btn", text: "Save this moment" });
    save.addEventListener("click", () => {
      err.textContent = "";
      if (!noteTa.value.trim()) { err.textContent = "Write the thought in a few words."; return; }
      if (!dtInput.value) { err.textContent = "Set the date and time it struck."; return; }
      if (!place) { err.textContent = "Pick where you were."; return; }
      STORE.addThought({
        atISO: new Date(dtInput.value).toISOString(),
        place: place,
        note: noteTa.value.trim(),
        cycle: s.cycle.number,
        week: week
      });
      thoughtFormOpen = false;
      renderCycleTab();
    });
    const cancel = el("button", { type: "button", class: "cancel-btn", text: "Cancel" });
    cancel.addEventListener("click", () => { thoughtFormOpen = false; renderCycleTab(); });

    box.appendChild(labeledField("The thought", null, [noteTa]));
    box.appendChild(labeledField("When it struck", "As close as you can.", [dtInput]));
    box.appendChild(labeledField("Where you were", "Defaults to your birth place — change it if you were somewhere else.", [placeSearch]));
    box.appendChild(placeResults);
    box.appendChild(placeNote);
    box.appendChild(err);
    box.appendChild(el("div", { class: "field-row" }, [save, cancel]));
    return box;
  }

  // The weekly horary section: one card per completed week that has at least
  // one logged thought and no question asked yet.
  function horarySection(s) {
    const frag = document.createDocumentFragment();
    if (typeof HORARY === "undefined") return frag;
    for (let w = 1; w <= 3; w++) {
      if (!weekComplete(s, w)) continue;
      if (thoughtsFor(s, w).length === 0) continue;
      const key = s.cycle.number + "_" + w;
      const asked = (s.horaryAsked || {})[key];
      const card = el("div", { class: "card horary-card" });
      card.appendChild(el("h3", { text: "Horary bonus — Week " + w }));
      card.appendChild(asked ? horaryReveal(s, asked) : horaryAskForm(s, w, key));
      frag.appendChild(card);
    }
    return frag;
  }

  function horaryAskForm(s, w, key) {
    const box = el("div");
    box.appendChild(el("p", { class: "small-note", text:
      "Week " + w + " is done. Pick one moment you wrote down and what it was about. We'll draw the sky " +
      "exactly as it looked at that minute and read it back to you in plain words — what the picture holds, " +
      "never a yes or a no." }));

    box.appendChild(el("div", { class: "horary-label", text: "Which moment" }));
    const tGrid = el("div", { class: "horary-picks" });
    thoughtsFor(s, w).forEach((t) => {
      const when = new Date(t.atISO);
      const b = el("button", { type: "button",
        class: "horary-pick" + (horaryDraft.thoughtId === t.id ? " active" : ""),
        text: when.toLocaleString([], { dateStyle: "short", timeStyle: "short" }) + " — " + (t.note || "(no note)") });
      b.addEventListener("click", () => { horaryDraft.thoughtId = t.id; renderCycleTab(); });
      tGrid.appendChild(b);
    });
    box.appendChild(tGrid);

    box.appendChild(el("div", { class: "horary-label", text: "What it concerns" }));
    const topicGrid = el("div", { class: "horary-picks" });
    HORARY.TOPICS.forEach((tp) => {
      const b = el("button", { type: "button",
        class: "horary-pick" + (horaryDraft.topicKey === tp.key ? " active" : ""),
        title: tp.hint, text: tp.label });
      b.addEventListener("click", () => { horaryDraft.topicKey = tp.key; renderCycleTab(); });
      topicGrid.appendChild(b);
    });
    box.appendChild(topicGrid);

    box.appendChild(el("div", { class: "horary-label", text: "Your question (optional, for your own record)" }));
    const q = el("textarea", { rows: "2", class: "practice-custom", placeholder: "e.g. Should I take the offer in Berlin?" });
    q.value = horaryDraft.question || "";
    q.addEventListener("input", () => { horaryDraft.question = q.value; });
    box.appendChild(q);

    const err = el("div", { class: "form-error" });
    box.appendChild(err);
    const cast = el("button", { type: "button", class: "primary-btn", text: "Cast the chart" });
    cast.addEventListener("click", () => {
      err.textContent = "";
      if (!horaryDraft.thoughtId) { err.textContent = "Pick one of your logged moments."; return; }
      if (!horaryDraft.topicKey) { err.textContent = "Pick what the question concerns."; return; }
      STORE.recordHorary(key, {
        thoughtId: horaryDraft.thoughtId,
        topicKey: horaryDraft.topicKey,
        question: (horaryDraft.question || "").trim(),
        askedISO: new Date().toISOString()
      });
      horaryDraft = { thoughtId: null, topicKey: null, question: "" };
      renderCycleTab();
    });
    box.appendChild(cast);
    box.appendChild(el("p", { class: "small-note", text: "One a week. Once it's drawn, it stays as it is." }));
    return box;
  }

  function factorBlock(title, lines) {
    const b = el("div", { class: "horary-factor" });
    b.appendChild(el("div", { class: "horary-label", text: title }));
    lines.filter(Boolean).forEach((l) => b.appendChild(el("p", { class: "day-text", text: l })));
    return b;
  }

  function horaryReveal(s, asked) {
    const box = el("div");
    const thought = (s.thoughts || []).find((t) => t.id === asked.thoughtId);
    if (!thought) {
      box.appendChild(el("p", { class: "small-note", text: "The logged moment for this question is no longer available." }));
      return box;
    }
    const topic = HORARY.TOPICS.find((t) => t.key === asked.topicKey) || HORARY.TOPICS[0];
    const when = new Date(thought.atISO);

    if (asked.question) box.appendChild(el("p", { class: "horary-question", text: "“" + asked.question + "”" }));
    box.appendChild(el("p", { class: "small-note", text:
      "This is a picture of the sky at the very minute that thought came to you — " +
      when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) +
      (thought.place && thought.place.label ? ", " + thought.place.label : "") +
      ". You wanted to know about: " + topic.label.toLowerCase() + "." }));

    let j;
    try { j = HORARY.judge(thought, topic.house); }
    catch (e) {
      box.appendChild(el("p", { class: "form-error", text: "Could not draw this picture from the moment you saved." }));
      return box;
    }

    const wheelWrap = el("div", { class: "chart-wheel-wrap" });
    wheelWrap.appendChild(CHART_WHEEL.build(j.chart));
    box.appendChild(wheelWrap);

    if (!j.radical.ok) {
      const r = el("div", { class: "notice" });
      r.appendChild(el("div", { class: "horary-label", text: "Worth noticing first" }));
      j.radical.notes.forEach((n) => r.appendChild(el("p", { class: "small-note", text: "• " + n })));
      box.appendChild(r);
    }

    const f = el("div", { class: "horary-factors" });

    const youRuler = j.querent.ruler ? j.querent.ruler.body : null;
    const youDig = j.querent.ruler ? dignityPhrase(j.querent.ruler.dignity) : null;
    f.appendChild(factorBlock("The star that means you", [
      youRuler
        ? "In this picture, you are shown by " + youRuler + " — the part about " + planetPlain(youRuler) + "."
        : "In this picture, you are shown by the star that rules the edge of the sky where you sit.",
      j.querent.ruler ? (youRuler + " is sitting in the part of the sky about " +
        housePlain(j.querent.ruler.house) +
        (j.querent.ruler.flags.length ? ". Right now it's " + j.querent.ruler.flags.join("; and it's ") : "") + ".") : null,
      youDig,
      "The Moon stands for you too — and for the way the whole thing is moving. It's in the part about " +
        housePlain(j.querent.moon.house) + "."
    ]));

    let moonLine;
    if (j.querent.moon.next.voidOfCourse) {
      moonLine = "The Moon isn't going to bump into any other star before it moves along" +
        (j.querent.moon.next.intoSign ? " into " + j.querent.moon.next.intoSign : "") +
        ". Often that means: not much changes either way — the thing kind of drifts.";
    } else {
      const when = phraseDuration(j.querent.moon.next.inDays) || "soon";
      moonLine = "The next star the Moon reaches is " + j.querent.moon.next.to + ", " + when + ". " +
        "So what comes into this next is about " + planetPlain(j.querent.moon.next.to) + ".";
    }
    f.appendChild(factorBlock("What happens next", [moonLine]));

    const itRuler = j.quesited.ruler ? j.quesited.ruler.body : null;
    const itDig = j.quesited.ruler ? dignityPhrase(j.quesited.ruler.dignity) : null;
    f.appendChild(factorBlock("The star that means what you asked about", [
      itRuler
        ? "What you asked about is shown by " + itRuler + " — the part about " + planetPlain(itRuler) + "."
        : "What you asked about is shown by the star that rules that part of the sky.",
      j.quesited.ruler ? (itRuler + " is sitting in the part of the sky about " +
        housePlain(j.quesited.ruler.house) +
        (j.quesited.ruler.flags.length ? ". Right now it's " + j.quesited.ruler.flags.join("; and it's ") : "") + ".") : null,
      itDig,
      j.quesited.occupants.length
        ? ("Sitting in the part about " + housePlain(j.quesited.house) + " itself: " + j.quesited.occupants.join(", ") + ".")
        : null
    ]));

    const conn = [];
    if (j.connection.sameRuler) {
      conn.push("Here's the big thing: the very same star (" + j.connection.sameRuler +
        ") stands for both you and what you asked about. You two are already holding hands — tied tightly together.");
    } else if (j.connection.between) {
      const b = j.connection.between;
      if (b.applying) {
        const meet = phraseDuration(b.perfectsInDays);
        conn.push("Your star and the other star are moving toward each other — the story is still coming together" +
          (meet ? ", and going by their speeds they'd line up " + meet : "") + ".");
      } else if (b.separating) {
        conn.push("Your star and the other star are moving apart. The main moment may have already happened.");
      } else {
        conn.push("Your star and the other star are touching right now.");
      }
    } else {
      conn.push("Your star and the other star aren't reaching each other directly.");
    }
    if (j.connection.translation) {
      conn.push("A quicker star (" + j.connection.translation.by + ") is carrying the light from one to the other — " +
        "often a go-between: a person, a message, or a turn of events that passes the matter along.");
    }
    if (j.connection.collection) {
      conn.push("A slower star (" + j.connection.collection.by + ") is gathering up both threads at once — " +
        "often one person or thing that pulls the separate pieces together through itself.");
    }
    f.appendChild(factorBlock("How the two are getting on", conn));

    box.appendChild(f);
    box.appendChild(el("p", { class: "small-note", text:
      "None of this is a yes or a no. It's just a picture of the moment, laid out in the open, so you can " +
      "look at it and see which part feels true." }));
    return box;
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
      const item = el("div", { class: "gloss-item" }, [
        el("strong", { class: "gloss-term", text: g.term }),
        el("p", { class: "gloss-plain", text: g.plain })
      ]);
      if (g.real) item.appendChild(el("p", { class: "gloss-real", text: g.real }));
      if (g.list && g.list.length) {
        const listBox = el("div", { class: "gloss-list" });
        g.list.forEach((row) => {
          listBox.appendChild(el("p", { class: "gloss-list-row" }, [
            el("span", { class: "gloss-list-name", text: row.name }),
            el("span", { class: "gloss-list-gloss", text: " — " + row.gloss })
          ]));
        });
        item.appendChild(listBox);
      }
      box.appendChild(item);
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

    const spirit = el("div", { class: "card practice-spirit-card" }, [
      el("h4", { text: "The practice behind all of it" }),
      el("blockquote", { class: "day-quote" }, [
        el("p", { class: "day-quote-text", text: "“" + CONTENT.PRACTICE_SPIRIT.quote + "”" }),
        el("cite", { class: "day-quote-who", text: "— " + CONTENT.PRACTICE_SPIRIT.who })
      ]),
      el("p", { class: "day-text", text:
        "Nothing to believe, nothing to get right. Each day you choose one small way to practise that " +
        "openness — through the mind, through speech, or through the body — and then notice what your " +
        "body did while you did it. The chart just points at where you tend to close." })
    ]);
    frag.appendChild(spirit);

    frag.appendChild(
      el("div", { class: "card" }, [
        el("h4", { text: "What a day asks of you" }),
        el("p", { class: "day-text", text:
          "A short read, a line to sit with, and one practice you choose and carry through the day — " +
          "then a quick note on what your body did. About five minutes. Miss a day and nothing resets — " +
          "come back whenever." })
      ])
    );

    frag.appendChild(
      el("div", { class: "card" }, [
        el("h4", { text: "Once a week: a strong thought" }),
        el("p", { class: "day-text", text:
          "Some weeks a thought keeps tugging at you — a worry, a question, a decision you can't put down. " +
          "When one strikes, write down the moment it hit: the day, the time, and where you were. At the " +
          "end of that week — once all seven days are done — you can pick one of those moments, and the app " +
          "draws the sky exactly as it looked then and reads it back to you in plain words." }),
        el("p", { class: "day-text", text:
          "It's an old practice called horary. It never gives a yes or a no — it just lays the moment out " +
          "in the open so you can see its shape more clearly. One a week, and only if you have a thought " +
          "worth asking about." })
      ])
    );

    const twins = el("div", { class: "notice" });
    twins.textContent =
      "Identical twins share a birth chart to the minute — and still live different lives. " +
      "The chart is the ground you start on; what you do with it, day to day, is yours. " +
      "That is what the next 21 days are for.";
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

  // Day-21 payoff: the chart you were handed vs. the one you made by showing
  // up, the string of 21 choices only you produced, and the North Node as
  // "who you're growing toward". Replaces the old bare "go repeat it" notice.
  // ---- the somatic layer ----
  // The body note is the earliest, pre-verbal sign the day's tendency fired
  // under the practice — weather, not identity: it comes, it goes, it isn't
  // the self. One quality + one place per day, both optional, one JSON key
  // per day (aa_body_day_N). The input UI now lives inside practicePicker
  // (it only makes sense once a practice is chosen); these two helpers and
  // bodyPatternCard below are still shared. The old standalone "How the body
  // feels" card is gone, and the "in the body" cue is now keyed to the
  // chosen practice (CONTENT.practiceBodyCue) rather than the day's planet
  // (CONTENT.bodyCueForDay, still exported, no longer shown) — see data.js.
  function readBodyNote(day) {
    try {
      const raw = localStorage.getItem("aa_body_day_" + day);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function writeBodyNote(day, note) {
    try { localStorage.setItem("aa_body_day_" + day, JSON.stringify(note)); } catch (e) {}
  }

  // Day-21: what you practised and what the body reported, per phase, side by
  // side — so the loop (choose a door → the body answers) is legible in
  // hindsight. The contrast between phases is the point: same person,
  // different weather.
  function bodyPatternCard() {
    const phases = [
      { key: "gift", name: "gift", days: [1, 2, 3, 4, 5, 6, 7] },
      { key: "cost", name: "cost", days: [8, 9, 10, 11, 12, 13, 14] },
      { key: "others", name: "Week 3", days: [15, 16, 17, 18, 19, 20, 21] }
    ];
    const catLabel = {};
    (CONTENT.PRACTICE_CATEGORIES || []).forEach((c) => { catLabel[c.key] = c.label; });
    let totalLogged = 0;
    const rows = phases.map((ph) => {
      const q = {}, p = {}, cat = {};
      ph.days.forEach((d) => {
        const n = readBodyNote(d);
        if (n.quality) { q[n.quality] = (q[n.quality] || 0) + 1; totalLogged++; }
        if (n.place) { p[n.place] = (p[n.place] || 0) + 1; }
        let pk = null;
        try { pk = localStorage.getItem("aa_practice_day_" + d); } catch (e) {}
        if (pk && pk !== "custom") {
          const pp = CONTENT.PRACTICES.find((x) => x.key === pk);
          if (pp) cat[pp.cat] = (cat[pp.cat] || 0) + 1;
        } else if (pk === "custom") {
          cat.custom = (cat.custom || 0) + 1;
        }
      });
      const top = (o) => Object.keys(o).sort((a, b) => o[b] - o[a])[0] || null;
      return { name: ph.name, quality: top(q), place: top(p), cat: top(cat) };
    });

    const card = el("div", { class: "card" });
    card.appendChild(el("h4", { text: "What you practised, what your body did" }));

    if (totalLogged < 3) {
      card.appendChild(el("p", { class: "day-text", text:
        "You logged body notes on only a few days — not enough for a pattern yet. If you run " +
        "another cycle, try a quick note most days: the contrast between the weeks is where it gets interesting." }));
      return card;
    }

    const qWord = (q) => q === "other" ? "something you named yourself" : "“" + q + "”";
    const pWord = (p) => p === "other" ? "somewhere you named yourself" : "around the " + p;
    const cWord = (c) => c === "custom" ? "your own practices" : (catLabel[c] || c) + " practices";
    rows.forEach((r) => {
      const feltBit = (r.quality || r.place)
        ? (r.quality
            ? "the body most often felt " + qWord(r.quality) + (r.place ? ", " + pWord(r.place) : "")
            : "the body most often spoke up " + pWord(r.place))
        : null;
      let txt;
      if (r.cat && feltBit) txt = "On your " + r.name + " days you leaned on " + cWord(r.cat) + ", and " + feltBit + ".";
      else if (r.cat) txt = "On your " + r.name + " days you leaned on " + cWord(r.cat) + " — no body note.";
      else if (feltBit) txt = "On your " + r.name + " days, " + feltBit + ".";
      else txt = "On your " + r.name + " days — nothing logged.";
      card.appendChild(el("p", { class: "day-text body-pattern-line", text: txt }));
    });
    card.appendChild(el("p", { class: "day-text", text:
      "Same you, different weather. Neither reading is more “the real you” than the other — " +
      "both arrived, both passed. Noticing the shift while it happens is the whole practice." }));
    return card;
  }

  // Plain-text version of the report for "Copy summary" — structural facts
  // only (both charts, days complete, the growth direction). Deliberately
  // excludes every free-text note and journal entry: those never leave the
  // device (product description §8–9).
  function reportSummaryText(s, hs) {
    const natal = computeChart(s.me, hs);
    const inc = computeInceptionChart(s.me, s.cycle.startedAtISO, hs);
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
        "): Sun in " + ASTRO.signOf(inc.positions.Sun.lon) + ", Moon in " + ASTRO.signOf(inc.positions.Moon.lon)
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

    report.appendChild(bodyPatternCard());

    const twins = el("div", { class: "notice" });
    twins.textContent =
      "Identical twins share a birth chart to the minute — and still live different lives. " +
      "What separates them is 21 days like these: the showing up, the attention, the small turns " +
      "taken in real moments. The chart was the map. This part was yours.";
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
      root.appendChild(el("h2", { text: "Your 21 days" }));
      root.appendChild(glossaryCard());
      root.appendChild(journeyMap(s, hs, today));
      root.appendChild(horarySection(s));
      root.appendChild(thoughtLogCard(s));
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

    clampViewDay(today);

    // P0 — the day screen shows only today. The whole-journey map, the horary
    // bonus and the thought log moved into an opt-in "Your journey" overview,
    // so the daily loop is one calm scroll, not a dashboard.
    if (journeyOverview) {
      const back = el("button", { type: "button", class: "back-link", text: "← Back to today" });
      back.addEventListener("click", () => { journeyOverview = false; renderCycleTab(); });
      root.appendChild(back);
      root.appendChild(el("h2", { text: "Your journey" }));
      root.appendChild(el("div", { class: "progress-note", text:
        "Day " + today + ". Miss one and nothing is lost — come back when you can." }));
      root.appendChild(journeyMap(s, hs, today));
      root.appendChild(horarySection(s));
      root.appendChild(thoughtLogCard(s));
      root.appendChild(glossaryCard());
      return;
    }

    const justDone = s.cycle.completedDays.indexOf(viewDay) !== -1 && viewDay === today - 1;
    const topbar = el("div", { class: "day-topbar" });
    topbar.appendChild(el("span", { class: "day-where", text:
      viewDay === today ? "Today" : justDone ? "Today — done" : "Looking back" }));
    const jump = el("button", { type: "button", class: "day-jump", text: "Your journey →" });
    jump.addEventListener("click", () => { journeyOverview = true; renderCycleTab(); });
    topbar.appendChild(jump);
    root.appendChild(topbar);

    if (today > 1) {
      root.appendChild(
        dayNav(viewDay, today, viewDay !== today ? function () { viewDay = null; renderCycleTab(); } : null)
      );
    }
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

  // The day's one activity: pick a practice, carry it through the day, then
  // note what the body did. The body half only appears once a practice is
  // chosen — the practice is the experiment, the body note is the result you
  // read off it. (Merged here from a former standalone "How the body feels"
  // card; see data.js for the reasoning.)
  function practicePicker(day, week) {
    const wrap = el("div", { class: "card practice-picker" });
    wrap.appendChild(el("h4", { text: "Today's practice" }));
    wrap.appendChild(el("p", { class: "practice-spirit", text: CONTENT.PRACTICE_SPIRIT.gloss }));

    const suggestion = CONTENT.practiceSuggestion(day, week);
    if (suggestion) {
      const sug = CONTENT.PRACTICES.find((x) => x.key === suggestion.key);
      const sugCat = sug && (CONTENT.PRACTICE_CATEGORIES || []).find((c) => c.key === sug.cat);
      wrap.appendChild(el("p", { class: "practice-nudge", text:
        "Your chart leans toward " + (sugCat ? sugCat.label : "one door") +
        " today — " + suggestion.why + " Follow it, or pick your own." }));
    }

    const key = "aa_practice_day_" + day;
    const noteKey = "aa_practice_note_day_" + day;
    let saved = null;
    try { saved = localStorage.getItem(key); } catch (e) {}

    // Grouped into Mind / Speech / Body — the three doors an action comes
    // through. The nudged practice is outlined wherever it sits; nothing is
    // pre-selected — choosing is the user's move.
    (CONTENT.PRACTICE_CATEGORIES || []).forEach((catDef) => {
      const inCat = CONTENT.PRACTICES.filter((p) => p.cat === catDef.key);
      if (inCat.length === 0) return;
      wrap.appendChild(el("div", { class: "practice-cat" }, [
        el("span", { class: "practice-cat-name", text: catDef.label }),
        el("span", { class: "practice-cat-blurb", text: catDef.blurb })
      ]));
      const grid = el("div", { class: "practice-grid" });
      inCat.forEach((p) => {
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
      wrap.appendChild(grid);
    });
    // "My own" sits below the three categories, never replacing them.
    const customGrid = el("div", { class: "practice-grid" });
    const customChip = el("button", {
      type: "button",
      class: "practice-chip" + (saved === "custom" ? " active" : ""),
      text: "Something else…"
    });
    customChip.addEventListener("click", () => {
      try { localStorage.setItem(key, saved === "custom" ? "" : "custom"); } catch (e) {}
      renderCycleTab();
    });
    customGrid.appendChild(customChip);
    wrap.appendChild(customGrid);

    if (saved === "custom") {
      const ta = el("textarea", { rows: "2", class: "practice-custom", placeholder: "Your own practice for today — a few words is enough." });
      try { ta.value = localStorage.getItem(noteKey) || ""; } catch (e) {}
      ta.addEventListener("input", () => { try { localStorage.setItem(noteKey, ta.value); } catch (e) {} });
      wrap.appendChild(ta);
    } else if (saved) {
      const p = CONTENT.PRACTICES.find((x) => x.key === saved);
      if (p) wrap.appendChild(el("p", { class: "small-note", text: p.desc }));
    }

    // ---- the somatic half: folded away until the user asks for it ----
    // (P0) Selecting a practice should not unfurl ten more sub-sections. The
    // body note lives behind one "Note how it felt" fold; open state survives
    // the re-render on each chip tap. One quality + one place, both optional,
    // stored one JSON key per day (aa_body_day_N), unchanged so past journeys
    // and the Day-21 pattern still read.
    if (saved) {
      const noteFold = el("details", { class: "practice-note" });
      noteFold.open = (practiceNoteOpenDay === day);
      noteFold.addEventListener("toggle", () => {
        practiceNoteOpenDay = noteFold.open ? day : null;
      });
      noteFold.appendChild(el("summary", { text: "Note how it felt" }));
      noteFold.appendChild(el("p", { class: "practice-then-text", text:
        "Do it today — now or later. Then notice what your body was doing while it happened." }));

      const catKey = saved === "custom"
        ? null
        : (CONTENT.PRACTICES.find((x) => x.key === saved) || {}).cat;
      const cue = CONTENT.practiceBodyCue(catKey, week);
      if (cue) {
        noteFold.appendChild(el("div", { class: "body-cue" }, [
          el("span", { class: "body-cue-label", text: "Where it might show up" }),
          el("p", { class: "body-cue-text", text: cue })
        ]));
      }

      // field: "quality" | "place". A free-text "something else" always sits
      // alongside the presets — the words are a starting point, not the whole
      // range of what a body can feel.
      function bodyRow(items, field, placeholder) {
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

      noteFold.appendChild(el("p", { class: "body-log-sub", text: "What your body did" }));
      noteFold.appendChild(bodyRow(CONTENT.BODY_QUALITIES, "quality", "in your own words"));
      noteFold.appendChild(el("p", { class: "body-log-sub", text: "Where you felt it" }));
      noteFold.appendChild(bodyRow(CONTENT.BODY_PLACES, "place", "somewhere else — name it"));
      noteFold.appendChild(el("p", { class: "small-note", text:
        "Optional. A snapshot, not a verdict — it'll have changed by tomorrow." }));

      const why = el("details", { class: "body-why" });
      why.appendChild(el("summary", { text: "Why notice the body?" }));
      why.appendChild(el("p", { class: "body-why-text", text: CONTENT.BODY_RATIONALE.plain }));
      noteFold.appendChild(why);

      wrap.appendChild(noteFold);
    }

    return wrap;
  }

  // A short line to sit with for the day — tied to the day's planet (Weeks
  // 1–2) or the "seeing other people" theme (Week 3).
  function dayQuoteCard(day, week) {
    const q = CONTENT.quoteForDay(day, week);
    if (!q) return document.createComment("no quote");
    return el("div", { class: "card quote-card" }, [
      el("h4", { text: "A line to sit with" }),
      el("blockquote", { class: "day-quote" }, [
        el("p", { class: "day-quote-text", text: "“" + q.text + "”" }),
        el("cite", { class: "day-quote-who", text: "— " + q.who })
      ])
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

    // Two beats in a fixed order: a line to sit with, then the practice —
    // which carries its own folded "note how it felt" step.
    frag.appendChild(dayQuoteCard(day, week));
    frag.appendChild(practicePicker(day, week));

    const done = s.cycle.completedDays.indexOf(day) !== -1;

    if (mode === "active" && !done) {
      // P0 — the "land" beat: an optional paced breath, then a quiet close.
      // No achievement verb, no confetti, no progress meter at this moment.
      const land = el("div", { class: "land" });
      const reduced = prefersReducedMotion();
      if (!reduced) land.appendChild(el("div", { class: "land-breath", "aria-hidden": "true" }));
      land.appendChild(el("p", { class: "land-cue", text: reduced
        ? "Take one slow breath before you close the day."
        : "One slow breath — in as the circle grows, out as it settles." }));
      const doneBtn = el("button", { class: "primary-btn", type: "button", text: "That's today" });
      doneBtn.addEventListener("click", () => {
        STORE.completeDay(day);
        viewDay = day;            // stay on the day just finished for its closing moment
        renderCycleTab();
      });
      land.appendChild(doneBtn);
      frag.appendChild(land);
    } else {
      const isLatestDone = done && day === STORE.currentDay() - 1;
      frag.appendChild(el("div", { class: "day-settled" }, [
        el("div", { class: "day-settled-mark", "aria-hidden": "true", text: done ? "▽" : "○" }),
        el("p", { class: "day-settled-text", text: isLatestDone
          ? "That's today. Come back tomorrow."
          : done ? "That's this day." : "Not done yet." })
      ]));
      frag.appendChild(el("p", { class: "day-done-note", text:
        "You can still change the practice or the note above — nothing here is locked." }));
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
