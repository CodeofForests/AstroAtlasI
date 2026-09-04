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

  // ---------- state helpers ----------
  function getHouseSystemPref() {
    return localStorage.getItem("aa_house_system") || "placidus";
  }
  function setHouseSystemPref(v) {
    localStorage.setItem("aa_house_system", v);
  }

  // ================= CHART TAB =================

  function renderChartTab() {
    const root = document.getElementById("panel-chart");
    root.innerHTML = "";
    const s = STORE.get();

    if (!s.me) {
      root.appendChild(birthForm((profile) => {
        STORE.setMe(profile);
        renderChartTab();
      }, "Enter your birth details"));
      return;
    }

    const hs = getHouseSystemPref();
    const chart = computeChart(s.me, hs);
    root.appendChild(el("h2", { text: "Your chart" }));
    root.appendChild(chartCard(s.me.name || "You", chart, hs, true));

    const startBtn = el("button", {
      class: "primary-btn",
      type: "button",
      text: s.cycle.completedDays.length > 0 || s.cycle.startedAtISO ? "Go to my 21-day cycle" : "Start my 21-day cycle"
    });
    startBtn.addEventListener("click", () => location.hash = "#cycle");
    root.appendChild(startBtn);
  }

  function birthForm(onSubmit, title, submitLabel) {
    const wrap = el("div", { class: "card form-card" });
    wrap.appendChild(el("h3", { text: title }));

    const nameInput = el("input", { type: "text", placeholder: "Name (just for display)" });
    const dateInput = el("input", { type: "date" });
    const timeInput = el("input", { type: "time" });
    const unknownCheck = el("input", { type: "checkbox", id: "unknown-time-" + Math.random().toString(36).slice(2) });
    const unknownLabel = el("label", { class: "inline-check", for: unknownCheck.id }, [
      unknownCheck,
      document.createTextNode(" I don't know the exact birth time")
    ]);

    const placeSearch = el("input", { type: "text", placeholder: "Search a city (or enter manually below)" });
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

    const latInput = el("input", { type: "number", step: "0.0001", placeholder: "Latitude" });
    const lonInput = el("input", { type: "number", step: "0.0001", placeholder: "Longitude" });
    const zoneInput = el("input", { type: "text", placeholder: "IANA timezone, e.g. Asia/Shanghai" });

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

    wrap.appendChild(el("div", { class: "field-row" }, [nameInput]));
    wrap.appendChild(el("div", { class: "field-row" }, [dateInput, timeInput]));
    wrap.appendChild(el("div", { class: "field-row" }, [unknownLabel]));
    wrap.appendChild(el("div", { class: "field-row" }, [placeSearch]));
    wrap.appendChild(placeResults);
    wrap.appendChild(el("div", { class: "field-row small-note", text: "Manual entry (used automatically once filled in):" }));
    wrap.appendChild(el("div", { class: "field-row" }, [latInput, lonInput, zoneInput]));
    wrap.appendChild(error);
    wrap.appendChild(submit);
    return wrap;
  }

  function chartCard(label, chart, hs, showHouseToggle) {
    const wrap = el("div", { class: "card" });
    wrap.appendChild(el("h3", { text: label }));

    if (showHouseToggle) {
      const toggle = el("div", { class: "toggle-row" }, [
        el("span", { class: "toggle-label", text: "House system: " }),
        el("button", {
          type: "button",
          class: "chip" + (hs === "placidus" ? " active" : ""),
          text: "Placidus",
          onclick: () => { setHouseSystemPref("placidus"); renderChartTab(); }
        }),
        el("button", {
          type: "button",
          class: "chip" + (hs === "whole-sign" ? " active" : ""),
          text: "Whole Sign",
          onclick: () => { setHouseSystemPref("whole-sign"); renderChartTab(); }
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

    const table = el("div", { class: "positions-table" });
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
    wrap.appendChild(table);

    if (chart.aspects && chart.aspects.length) {
      const aspWrap = el("div", { class: "aspects" });
      aspWrap.appendChild(el("div", { class: "small-note", text: "Aspects:" }));
      chart.aspects.forEach((a) => {
        aspWrap.appendChild(
          el("span", { class: "aspect-chip", text: a.a + " " + a.symbol + " " + a.b + " (orb " + a.orb + "°)" })
        );
      });
      wrap.appendChild(aspWrap);
    }

    return wrap;
  }

  // ================= CYCLE TAB =================

  function weekOf(day) {
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    return 3;
  }

  function renderCycleTab() {
    const root = document.getElementById("panel-cycle");
    root.innerHTML = "";
    const s = STORE.get();

    if (!s.me) {
      root.appendChild(el("div", { class: "empty-hint", text: "Set up your chart first on the Chart tab." }));
      return;
    }

    const day = STORE.currentDay();
    const week = weekOf(day);
    const hs = getHouseSystemPref();

    root.appendChild(el("h2", { text: "21-Day Cycle — Cycle " + s.cycle.number }));
    root.appendChild(
      el("div", { class: "progress-note", text: s.cycle.completedDays.length + " of 21 days complete. Missing a day never resets your cycle — come back whenever." })
    );

    if (day > 21) {
      root.appendChild(el("div", { class: "notice", text: "You've completed this cycle. Head to the Galaxy tab to repeat it." }));
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
      inviteHint.textContent = "Have someone ready to add instead? Go to the People tab to send a consent-based invitation.";
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

    if (!s.me) {
      root.appendChild(el("div", { class: "empty-hint", text: "Set up your chart first on the Chart tab." }));
      return;
    }

    const accepted = s.others.filter((p) => p.consent === "accepted");
    const stars = [{ name: s.me.name || "You", chart: computeChart(s.me, hs) }].concat(
      accepted.map((p) => ({ name: p.name, chart: computeChart(p, hs) }))
    );

    const selfAwareDays = s.cycle.completedDays.filter((d) => d <= 14).length;
    const brightness = Math.round((selfAwareDays / 14) * 100);

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

    root.appendChild(el("h3", { text: "Repeat the cycle" }));
    root.appendChild(
      el("div", { class: "card-actions" }, [
        el("button", { type: "button", text: "Same people, new cycle", onclick: () => { STORE.repeatCycle("same"); renderAll(); location.hash = "#cycle"; } }),
        el("button", { type: "button", text: "New circle", onclick: () => { STORE.repeatCycle("new-circle"); renderAll(); location.hash = "#people"; } }),
        el("button", { type: "button", text: "Solo again", onclick: () => { STORE.repeatCycle("new-circle"); renderAll(); location.hash = "#cycle"; } })
      ])
    );
  }

  // ================= PRIVACY TAB =================

  function renderPrivacyTab() {
    const root = document.getElementById("panel-privacy");
    root.innerHTML = "";
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
      if (confirm("This permanently deletes your chart, cycle progress, and everyone added. Continue?")) {
        STORE.deleteEverything();
        renderAll();
        location.hash = "#chart";
      }
    });
    root.appendChild(btn);
  }

  function renderAll() {
    renderChartTab();
    renderCycleTab();
    renderPeopleTab();
    renderGalaxyTab();
    renderPrivacyTab();
  }

  return { renderAll: renderAll, renderChartTab: renderChartTab, renderCycleTab: renderCycleTab, renderPeopleTab: renderPeopleTab, renderGalaxyTab: renderGalaxyTab, renderPrivacyTab: renderPrivacyTab };
})();
