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

    const formCard = birthForm(
      (profile) => {
        STORE.setMe(profile);
        location.hash = "#mychart";
      },
      s.me ? "Update your birth details" : "Enter your birth details",
      s.me ? "Save changes" : "Calculate my chart",
      s.me
    );
    if (s.me) {
      const cancelBtn = el("button", { type: "button", class: "cancel-btn", text: "Cancel" });
      cancelBtn.addEventListener("click", () => { location.hash = "#mychart"; });
      formCard.appendChild(cancelBtn);
    }
    root.appendChild(formCard);
  }

  // ================= STEP 3: MY CHART =================

  function renderChartStep() {
    const root = document.getElementById("panel-mychart");
    root.innerHTML = "";
    const s = STORE.get();

    if (!s.me) {
      location.hash = "#birthdata";
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

    const startBtn = el("button", {
      class: "primary-btn",
      type: "button",
      text: s.cycle.completedDays.length > 0 || s.cycle.startedAtISO ? "Go to my 21-day journey" : "Start my 21-day journey"
    });
    startBtn.addEventListener("click", () => location.hash = "#cycle");
    root.appendChild(startBtn);
  }

  // A same-chart preview of the 21-day journey's own gift/cost pairing —
  // one flip-card per body. Front shows the strength; clicking reveals its
  // exact cost underneath, so a limitation never appears without the
  // strength it belongs to (product description §3's structural rule).
  //
  // Progressive reveal: the chart wheel and exact-degree/aspect data stay
  // fully visible always — that's computed astronomical fact, and hiding
  // real data to manufacture suspense would undercut the "this is science,
  // not esoteric" positioning. What's genuinely paced, the way a guided
  // program legitimately is, is the INTERPRETATION: a body's strength tile
  // unlocks on the journey day that covers it, and its cost half unlocks on
  // that same body's Week 2 day — mirroring the real Week 1/Week 2 pacing
  // instead of dumping all 21 days of insight on day one.
  function strengthsWeaknessesCard(chart) {
    const wrap = el("div", { class: "card sw-card" });
    if (chart.unknownTime) {
      wrap.appendChild(
        el("p", { class: "small-note", text: "Strengths and weaknesses use house placements where available; with an unknown birth time, these are based on sign alone." })
      );
    }
    wrap.appendChild(
      el("p", { class: "small-note", text: "Tap a card to see the cost of that same strength — never a separate list of flaws. Locked cards unlock as your journey reaches that day." })
    );

    const s = STORE.get();
    const completed = s.cycle.completedDays.length;
    const grid = el("div", { class: "sw-grid" });

    CONTENT.WEEK_BODIES.forEach((body, idx) => {
      const p = chart.positions[body];
      if (!p) return;
      const giftDay = idx + 1;
      const costDay = idx + 8;
      const giftUnlocked = completed >= giftDay;
      const costUnlocked = completed >= costDay;

      const sign = ASTRO.signOf(p.lon);
      const color = CHART_WHEEL.BODY_COLOR[body] || "#8b7cf6";
      const glyph = CHART_WHEEL.BODY_GLYPH[body] || body[0];

      const tile = el("div", { class: "sw-tile" + (giftUnlocked ? "" : " locked"), style: "--tile-color:" + color });

      if (!giftUnlocked) {
        tile.appendChild(
          el("div", { class: "sw-tile-header" }, [
            el("span", { class: "sw-tile-glyph", text: "🔒" }),
            el("span", { class: "sw-tile-name", text: body }),
            el("span", { class: "sw-tile-sign", text: "Day " + giftDay })
          ])
        );
        tile.appendChild(el("p", { class: "sw-tile-text", text: "Unlocks on Day " + giftDay + " of your journey." }));
        grid.appendChild(tile);
        return;
      }

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
      grid.appendChild(tile);
    });

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

  function birthForm(onSubmit, title, submitLabel, existing) {
    const wrap = el("div", { class: "card form-card" });
    wrap.appendChild(el("h3", { text: title }));
    wrap.appendChild(
      el("p", { class: "small-note", text: "Fill in each field below — your own birth details, exactly as you'd enter them for any birth chart calculator." })
    );

    const nameInput = el("input", { type: "text", placeholder: "e.g. Lindsey" });
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
      onSubmit({
        name: nameInput.value.trim(),
        wall: { year: y, month: m, day: d, hour: hh, minute: mm },
        place: { lat: lat, lon: lon, zone: zoneInput.value.trim() },
        unknownTime: unknownCheck.checked
      });
    });

    wrap.appendChild(labeledField("Name", null, [nameInput]));
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
    wheelWrap.appendChild(CHART_WHEEL.build(chart));
    wrap.appendChild(wheelWrap);

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

  function weekOf(day) {
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    return 3;
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

    const day = STORE.currentDay();
    const week = weekOf(day);
    const hs = getHouseSystemPref();

    root.appendChild(el("h2", { text: "21-Day Journey — Journey " + s.cycle.number }));
    root.appendChild(
      el("div", { class: "progress-note", text: s.cycle.completedDays.length + " of 21 days complete. Missing a day never resets your journey — come back whenever." })
    );

    if (day > 21) {
      root.appendChild(el("div", { class: "notice", text: "You've completed this journey. Head to the Galaxy tab to repeat it." }));
      return;
    }

    root.appendChild(el("h3", { text: "Day " + day + " — Week " + week + (week === 1 ? " (Your Gift)" : week === 2 ? " (The Cost of the Gift)" : " (The Others)") }));

    if (week === 1 || week === 2) {
      const body = CONTENT.WEEK_BODIES[(day - 1) % 7];
      const chart = computeChart(s.me, hs);
      const placement = chart.positions[body];
      const kind = week === 1 ? "gift" : "cost";
      const text = CONTENT.dayContent(kind, body, ASTRO.signOf(placement.lon), placement.house);
      root.appendChild(dayCard(body + " — " + (kind === "gift" ? "the gift" : "the cost of the gift"), text, day));
    } else {
      root.appendChild(week3Content(day, s, hs));
    }

    root.appendChild(practicePicker(day));

    const doneBtn = el("button", {
      class: "primary-btn",
      type: "button",
      text: s.cycle.completedDays.indexOf(day) === -1 ? "Mark today complete" : "Today already complete ✓"
    });
    doneBtn.disabled = s.cycle.completedDays.indexOf(day) !== -1;
    doneBtn.addEventListener("click", () => {
      STORE.completeDay(day);
      renderCycleTab();
    });
    root.appendChild(doneBtn);
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

  function practicePicker(day) {
    const wrap = el("div", { class: "card practice-picker" });
    wrap.appendChild(el("h4", { text: "Pick today's practice" }));
    const key = "aa_practice_day_" + day;
    const saved = localStorage.getItem(key);
    const grid = el("div", { class: "practice-grid" });
    CONTENT.PRACTICES.forEach((p) => {
      const btn = el("button", {
        type: "button",
        class: "practice-chip" + (saved === p.key ? " active" : ""),
        title: p.desc,
        text: p.label
      });
      btn.addEventListener("click", () => {
        localStorage.setItem(key, p.key);
        renderCycleTab();
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
    if (saved) {
      const p = CONTENT.PRACTICES.find((x) => x.key === saved);
      if (p) wrap.appendChild(el("p", { class: "small-note", text: p.desc }));
    }
    return wrap;
  }

  // ================= PEOPLE TAB (consent / invite / withdraw) =================

  function renderPeopleTab() {
    const root = document.getElementById("panel-people");
    root.innerHTML = "";
    const s = STORE.get();

    root.appendChild(backButton());
    root.appendChild(el("h2", { text: "People" }));
    root.appendChild(
      el("p", { class: "small-note", text:
        "This prototype simulates both sides of consent in one browser: adding someone shows what they'd see " +
        "before accepting, and accepting is a separate explicit step — the same shape a real two-account invite " +
        "would take."
      })
    );

    if (s.others.length === 0) {
      root.appendChild(el("div", { class: "empty-hint", text: "No one added yet." }));
    }

    s.others.forEach((p) => {
      const card = el("div", { class: "card" });
      card.appendChild(el("h4", { text: p.name || "(unnamed)" }));
      card.appendChild(el("div", { class: "small-note", text: "Consent status: " + p.consent }));
      if (p.consent === "invited") {
        card.appendChild(
          el("div", { class: "notice" }, [
            document.createTextNode(
              "Invitation preview — what " + (p.name || "this person") + " would see: “" +
              (s.me && s.me.name ? s.me.name : "Someone") + " wants to add your chart to their Week 3 and Galaxy. " +
              "Your Weeks 1–2 stay private to you always; only your chart placements are shared, and you can withdraw at any time.”"
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
        STORE.addOther(profile);
        renderPeopleTab();
      }, "Their birth details", "Send invitation")
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

    root.appendChild(el("h2", { text: "Your Galaxy" }));
    root.appendChild(
      el("div", { class: "brightness-bar-wrap" }, [
        el("div", { class: "small-note", text: "Brightness: " + brightness + "% — earned by taking in gift and cost together, never purchasable." }),
        el("div", { class: "brightness-bar" }, [el("div", { class: "brightness-fill", style: "width:" + brightness + "%" })])
      ])
    );

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
