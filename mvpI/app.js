/* Construction Site tab — rendering + local state.
 * PLANNED / COMPLETED (data.js) are the assistant-maintained source of truth.
 * Hidden items and priority stars are user-driven and live only in localStorage,
 * so hiding/restoring or setting priority never requires a code change.
 */

(function () {
  "use strict";

  const LS_HIDDEN = "aa_cs_hidden_v1";
  const LS_PRIORITY = "aa_cs_priority_v1";
  const LS_SORT = "aa_cs_sort_v1";

  const EFFORT_RANK = { small: 1, medium: 2, large: 3 };
  const EFFORT_LABEL = { small: "Small", medium: "Medium", large: "Large" };

  // ---------- storage helpers ----------

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable — state just won't persist across reloads */
    }
  }

  let hiddenIds = new Set(loadJSON(LS_HIDDEN, []));
  let priorities = loadJSON(LS_PRIORITY, {}); // { id: 1|2|3 }
  let sortMode = loadJSON(LS_SORT, "recent"); // "recent" | "priority" | "effort"

  function persistHidden() {
    saveJSON(LS_HIDDEN, Array.from(hiddenIds));
  }
  function persistPriorities() {
    saveJSON(LS_PRIORITY, priorities);
  }
  function persistSort() {
    saveJSON(LS_SORT, sortMode);
  }

  // ---------- stable ids for PLANNED items (title-derived slug) ----------

  function slugify(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function withIds(list) {
    const seen = Object.create(null);
    return list.map((item) => {
      let id = slugify(item.title);
      if (seen[id]) {
        seen[id] += 1;
        id = id + "-" + seen[id];
      } else {
        seen[id] = 1;
      }
      return Object.assign({ id: id }, item);
    });
  }

  const plannedAll = withIds(PLANNED);

  // ---------- safe DOM helpers (never innerHTML with user data) ----------

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2), attrs[k]);
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach((c) => {
      if (c) node.appendChild(c);
    });
    return node;
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove("show"), 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast("Copied prompt to clipboard"),
        () => fallbackCopy(text)
      );
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Copied prompt to clipboard");
    } catch (e) {
      toast("Copy failed — select and copy manually");
    }
    document.body.removeChild(ta);
  }

  function promptText(item) {
    return "Please build now: " + item.title + "\n\n" + item.desc;
  }

  // ---------- sorting ----------

  function sortPlanned(list) {
    const arr = list.slice();
    if (sortMode === "priority") {
      arr.sort((a, b) => (priorities[b.id] || 0) - (priorities[a.id] || 0));
    } else if (sortMode === "effort") {
      arr.sort((a, b) => EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort]);
    }
    // "recent" = leave in array order (data.js convention: newest first)
    return arr;
  }

  // ---------- card builders ----------

  function starsControl(item) {
    const wrap = el("div", { class: "stars" });
    const current = priorities[item.id] || 0;
    [1, 2, 3].forEach((n) => {
      const btn = el("button", {
        type: "button",
        title:
          n === 1 ? "Low priority" : n === 2 ? "Medium priority" : "High priority",
        onclick: () => {
          priorities[item.id] = current === n ? 0 : n;
          if (priorities[item.id] === 0) delete priorities[item.id];
          persistPriorities();
          render();
        }
      });
      btn.textContent = "★";
      if (n <= current) btn.classList.add("filled");
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function effortBadge(item) {
    return el("span", {
      class: "badge effort-" + item.effort,
      text: EFFORT_LABEL[item.effort] || item.effort
    });
  }

  function plannedCard(item, opts) {
    opts = opts || {};
    const top = el("div", { class: "card-top" }, [
      el("div", { class: "card-title-wrap" }, [
        el("p", { class: "card-title", text: item.title }),
        el("div", { class: "status-label", text: item.statusLabel })
      ]),
      el("div", { class: "card-right" }, [
        item.inProgress
          ? el("span", { class: "badge progress-badge", text: "In progress" })
          : null,
        effortBadge(item),
        !opts.hidden ? starsControl(item) : null
      ])
    ]);

    const desc = el("p", { class: "card-desc", text: item.desc });

    const actions = el("div", { class: "card-actions" }, [
      el("button", {
        class: "copy-btn",
        type: "button",
        text: "📋 Copy prompt",
        onclick: () => copyText(promptText(item))
      }),
      opts.hidden
        ? el("button", {
            type: "button",
            text: "↺ Restore",
            onclick: () => {
              hiddenIds.delete(item.id);
              persistHidden();
              render();
            }
          })
        : el("button", {
            class: "danger",
            type: "button",
            text: "🗑️ Delete",
            onclick: () => {
              hiddenIds.add(item.id);
              persistHidden();
              render();
            }
          })
    ]);

    const card = el(
      "div",
      { class: "card" + (item.inProgress ? " in-progress" : "") },
      [top, desc, actions]
    );
    return card;
  }

  function completedRow(item) {
    const body = el("div", { class: "completed-body" }, [
      el("p", { class: "completed-title", text: item.title }),
      el("p", { class: "completed-desc", text: item.desc }),
      el("button", {
        class: "jump-link",
        type: "button",
        text: "→ Jump to this in the app",
        onclick: () => jumpTo(item.dest)
      })
    ]);
    return el("div", { class: "completed-row" }, [
      el("div", { class: "completed-date", text: item.date }),
      body
    ]);
  }

  function jumpTo(dest) {
    if (!dest) return;
    showTab(dest.tab);
    if (dest.scrollTo) {
      const target = document.getElementById(dest.scrollTo);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- main render ----------

  function render() {
    const visiblePlanned = plannedAll.filter((i) => !hiddenIds.has(i.id));
    const hiddenPlanned = plannedAll.filter((i) => hiddenIds.has(i.id));

    const inProgress = visiblePlanned.filter((i) => i.inProgress);
    const openPlanned = sortPlanned(visiblePlanned.filter((i) => !i.inProgress));

    // --- in progress section ---
    const ipSection = document.getElementById("section-inprogress");
    ipSection.innerHTML = "";
    if (inProgress.length > 0) {
      ipSection.style.display = "";
      const h = el("h2", {}, [document.createTextNode("🔨 Currently in progress")]);
      ipSection.appendChild(h);
      inProgress.forEach((item) => ipSection.appendChild(plannedCard(item)));
    } else {
      ipSection.style.display = "none";
    }

    // --- planned section ---
    const plannedList = document.getElementById("planned-list");
    plannedList.innerHTML = "";
    if (openPlanned.length === 0) {
      plannedList.appendChild(
        el("div", { class: "empty-hint", text: "Nothing planned right now." })
      );
    } else {
      openPlanned.forEach((item) => plannedList.appendChild(plannedCard(item)));
    }
    document.getElementById("planned-count").textContent =
      "(" + openPlanned.length + ")";

    ["recent", "priority", "effort"].forEach((mode) => {
      document
        .getElementById("sort-" + mode)
        .classList.toggle("active", sortMode === mode);
    });

    // hidden list toggle
    const hiddenToggle = document.getElementById("hidden-toggle");
    const hiddenList = document.getElementById("hidden-list");
    if (hiddenPlanned.length === 0) {
      hiddenToggle.style.display = "none";
      hiddenList.style.display = "none";
      hiddenList.innerHTML = "";
    } else {
      hiddenToggle.style.display = "";
      hiddenToggle.textContent =
        (hiddenList.dataset.open === "1" ? "Hide" : "Show") +
        " hidden (" +
        hiddenPlanned.length +
        ")";
      if (hiddenList.dataset.open === "1") {
        hiddenList.style.display = "";
        hiddenList.innerHTML = "";
        hiddenPlanned.forEach((item) =>
          hiddenList.appendChild(plannedCard(item, { hidden: true }))
        );
      } else {
        hiddenList.style.display = "none";
      }
    }

    // collective copy button — all visible planned+in-progress items with a priority set
    const prioritized = plannedAll
      .filter((i) => !hiddenIds.has(i.id) && (priorities[i.id] || 0) > 0)
      .sort((a, b) => (priorities[b.id] || 0) - (priorities[a.id] || 0));
    const bulkBtn = document.getElementById("bulk-copy");
    bulkBtn.disabled = prioritized.length === 0;
    bulkBtn.textContent =
      "📋 Copy prompt for prioritized (" + prioritized.length + ")";
    bulkBtn.onclick = () => {
      const text = prioritized.map((i) => promptText(i)).join("\n\n---\n\n");
      copyText(text);
    };

    // --- completed section ---
    const completedList = document.getElementById("completed-list");
    completedList.innerHTML = "";
    if (COMPLETED.length === 0) {
      completedList.appendChild(
        el("div", { class: "empty-hint", text: "Nothing completed yet." })
      );
    } else {
      COMPLETED.forEach((item) => completedList.appendChild(completedRow(item)));
    }
  }

  // ---------- tabs / step flow ----------

  const UI_RENDERERS = {
    birthdata: () => typeof UI !== "undefined" && UI.renderBirthDataStep(),
    mychart: () => typeof UI !== "undefined" && UI.renderChartStep(),
    cycle: () => typeof UI !== "undefined" && UI.renderCycleTab(),
    people: () => typeof UI !== "undefined" && UI.renderPeopleTab(),
    galaxy: () => typeof UI !== "undefined" && UI.renderGalaxyTab(),
    privacy: () => typeof UI !== "undefined" && UI.renderPrivacyTab()
  };

  const STEP_TABS = ["home", "birthdata", "mychart", "cycle"];
  const STEP_LABELS = { home: "Welcome", birthdata: "Birth data", mychart: "My chart", cycle: "Journey" };

  let lastFlowTab = "birthdata";
  window.APP_BACK = () => { location.hash = "#" + lastFlowTab; };
  // Exposed so js/ui.js (a separate IIFE) can raise the shared toast for
  // earned-surprise moments when a reveal or brightness threshold unlocks.
  window.APP_TOAST = toast;

  function renderStepNav(current) {
    const nav = document.getElementById("step-nav");
    const currentIndex = STEP_TABS.indexOf(current);
    if (currentIndex === -1 || current === "home") {
      nav.hidden = true;
      nav.innerHTML = "";
      return;
    }
    nav.hidden = false;
    nav.innerHTML = "";
    const s = STORE.get();
    STEP_TABS.forEach((tabName, i) => {
      const reachable = i <= 1 || !!s.me;
      const pill = el("button", {
        type: "button",
        class:
          "step-pill" +
          (i === currentIndex ? " current" : "") +
          (i < currentIndex ? " done" : "") +
          (!reachable ? " disabled" : "")
      });
      pill.disabled = !reachable;
      pill.appendChild(el("span", { class: "step-num", text: i < currentIndex ? "✓" : String(i + 1) }));
      pill.appendChild(el("span", { class: "step-label", text: STEP_LABELS[tabName] }));
      if (reachable) pill.addEventListener("click", () => { location.hash = "#" + tabName; });
      nav.appendChild(pill);
      if (i < STEP_TABS.length - 1) nav.appendChild(el("span", { class: "step-connector" }));
    });
  }

  function showTab(name) {
    const s = STORE.get();
    if ((name === "mychart" || name === "cycle" || name === "domain") && !s.me) {
      name = "birthdata";
    }

    document.querySelectorAll(".tabpanel").forEach((p) => {
      p.classList.toggle("active", p.dataset.tab === name);
    });
    if (location.hash !== "#" + name) {
      history.replaceState(null, "", "#" + name);
    }

    document.body.classList.toggle("is-home", name === "home");
    renderStepNav(name);
    if (name !== "home" && STEP_TABS.indexOf(name) !== -1) lastFlowTab = name;

    if (name === "construction") render();
    if (name === "home") {
      renderHomeCategories();
      renderJourneySky();
      // "Continue your journey" teaser is built (js/ui.js renderHomeTeaser)
      // but parked for now per user request — not called here on purpose.
      // Re-enable by adding: if (typeof UI !== "undefined") UI.renderHomeTeaser();
    }
    if (name === "domain") renderDomainReveal();
    if (name === "teaser") renderSkepticTeaser();
    if (UI_RENDERERS[name]) UI_RENDERERS[name]();
  }

  // Home screen categories: plain topic words, no explanation underneath —
  // the whole point is that clicking one is the only way to find out what
  // it says about YOU specifically, not a feature menu you can read your
  // way through first. "Myself" goes to the full chart (already the deepest
  // payoff); the other three open a one-screen personalized reveal pulled
  // from a real, specific placement in the user's own chart.
  let currentDomain = null;
  const HOME_CATEGORIES = [
    { label: "Myself", needsChart: true, target: "mychart" },
    { label: "Relationship", needsChart: true, target: "domain", domain: "relationship" },
    { label: "My job", needsChart: true, target: "domain", domain: "job" },
    { label: "My health", needsChart: true, target: "domain", domain: "health" }
  ];

  // The Home starfield gains one bright "journey star" for every day of the
  // 21-day cycle already completed — progress you can see filling in your
  // own sky, no number attached. Positions are deterministic per index so
  // the same stars stay put between visits; they only accumulate.
  function renderJourneySky() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    let sky = hero.querySelector(".journey-sky");
    if (!sky) {
      sky = document.createElement("div");
      sky.className = "journey-sky";
      sky.setAttribute("aria-hidden", "true");
      hero.insertBefore(sky, hero.firstChild);
    }
    const done = Math.min(STORE.get().cycle.completedDays.length, 21);
    if (Number(sky.dataset.count) === done) return;
    sky.dataset.count = String(done);
    sky.innerHTML = "";
    for (let i = 0; i < done; i++) {
      // cheap deterministic scatter from the index
      const a = Math.sin(i * 12.9898) * 43758.5453;
      const b = Math.sin(i * 78.233) * 12543.1234;
      const left = Math.abs(a - Math.floor(a)) * 100;
      const top = Math.abs(b - Math.floor(b)) * 92 + 2;
      const star = document.createElement("span");
      star.className = "journey-star";
      star.style.left = left.toFixed(2) + "%";
      star.style.top = top.toFixed(2) + "%";
      star.style.setProperty("--tw-delay", (i % 7) * 0.55 + "s");
      if (i === done - 1) star.classList.add("is-new");
      sky.appendChild(star);
    }
  }

  function renderHomeCategories() {
    const grid = document.getElementById("category-grid");
    if (!grid) return;
    const s = STORE.get();
    grid.innerHTML = "";
    HOME_CATEGORIES.forEach((cat) => {
      const card = el("button", { type: "button", class: "category-card category-card-text" }, [
        el("span", { class: "category-label", text: cat.label })
      ]);
      card.addEventListener("click", () => {
        currentDomain = cat.domain || null;
        location.hash = "#" + (cat.needsChart && !s.me ? "birthdata" : cat.target);
      });
      grid.appendChild(card);
    });
  }

  const DOMAIN_LABEL = { relationship: "Relationship", job: "My job", health: "My health" };
  const DOMAIN_CTA = {
    relationship: { label: "Add someone to go deeper", target: "people" },
    job: { label: "See my full chart", target: "mychart" },
    health: { label: "See my full chart", target: "mychart" }
  };

  function renderDomainReveal() {
    const root = document.getElementById("panel-domain");
    root.innerHTML = "";
    const s = STORE.get();
    const kind = currentDomain || "relationship";

    const back = el("button", { type: "button", class: "back-link", text: "← Back" });
    back.addEventListener("click", () => { location.hash = "#home"; });
    root.appendChild(back);

    const hs = localStorage.getItem("aa_house_system") || "placidus";
    const chart = computeChart(s.me, hs);
    const reveal = CONTENT.domainReveal(kind, chart);
    const card = el("div", { class: "card domain-reveal" });
    card.appendChild(el("h2", { text: DOMAIN_LABEL[kind] }));

    if (!reveal || reveal.needsBirthTime) {
      card.appendChild(
        el("p", { class: "day-text", text: "Reading your career angle (the Midheaven) needs a birth time. Add yours to unlock this." })
      );
      const btn = el("button", { type: "button", class: "primary-btn", text: "Add my birth time" });
      btn.addEventListener("click", () => { location.hash = "#birthdata"; });
      card.appendChild(btn);
      root.appendChild(card);
      return;
    }

    card.appendChild(el("p", { class: "domain-heading", text: reveal.heading }));
    card.appendChild(el("p", { class: "day-text", text: reveal.text }));
    root.appendChild(card);

    const cta = DOMAIN_CTA[kind];
    const ctaBtn = el("button", { type: "button", class: "primary-btn", text: cta.label });
    ctaBtn.addEventListener("click", () => { location.hash = "#" + cta.target; });
    root.appendChild(ctaBtn);
  }

  // No-commitment teaser for skeptical first-time visitors: no account, no
  // full birth data — just a date. Deliberately does NOT touch STORE/setMe,
  // so trying this never counts as "starting" anything; only clicking
  // through to the full form does. Carries the entered date over via
  // window.teaserPrefillWall (this file and ui.js are separate IIFEs, so a
  // plain local variable wouldn't be visible from ui.js's renderBirthDataStep).
  window.teaserPrefillWall = null;

  function renderSkepticTeaser() {
    const root = document.getElementById("panel-teaser");
    root.innerHTML = "";

    const back = el("button", { type: "button", class: "back-link", text: "← Back" });
    back.addEventListener("click", () => { location.hash = "#home"; });
    root.appendChild(back);

    const card = el("div", { class: "card" });
    card.appendChild(el("h2", { text: "Try it free — no account, just a date" }));
    card.appendChild(
      el("p", { class: "small-note", text: "Your birth date alone is enough for one real, specific fact from your chart. No time or place needed for this part." })
    );

    const dateInput = el("input", { type: "date" });
    card.appendChild(el("div", { class: "field-row" }, [dateInput]));

    const resultHost = el("div", { class: "teaser-result-host" });
    const revealBtn = el("button", { type: "button", class: "primary-btn", text: "Reveal something about me" });
    revealBtn.addEventListener("click", () => {
      if (!dateInput.value) return;
      const [y, m, d] = dateInput.value.split("-").map(Number);
      const wall = { year: y, month: m, day: d };
      const reveal = CONTENT.teaserReveal(wall);

      resultHost.innerHTML = "";
      const resultCard = el("div", { class: "card teaser-result" });
      resultCard.appendChild(el("p", { class: "domain-heading", text: reveal.heading }));
      resultCard.appendChild(el("p", { class: "day-text", text: reveal.text }));
      resultHost.appendChild(resultCard);

      const cta = el("button", { type: "button", class: "primary-btn", text: "Curious what else my chart says? →" });
      cta.addEventListener("click", () => {
        window.teaserPrefillWall = wall;
        location.hash = "#birthdata";
      });
      resultHost.appendChild(cta);
    });

    card.appendChild(revealBtn);
    root.appendChild(card);
    root.appendChild(resultHost);
  }

  document.getElementById("skeptic-teaser-link").addEventListener("click", () => {
    location.hash = "#teaser";
  });

  document.getElementById("account-btn").addEventListener("click", () => {
    document.getElementById("account-drawer").dataset.open = "1";
  });
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  document.getElementById("drawer-backdrop").addEventListener("click", closeDrawer);
  function closeDrawer() {
    document.getElementById("account-drawer").dataset.open = "0";
  }
  document.querySelectorAll(".drawer-link").forEach((b) => {
    b.addEventListener("click", () => {
      location.hash = "#" + b.dataset.tab;
      closeDrawer();
    });
  });

  document.getElementById("construction-fab").addEventListener("click", () => {
    location.hash = "#construction";
  });
  document.getElementById("construction-back").addEventListener("click", () => {
    location.hash = "#" + lastFlowTab;
  });

  window.addEventListener("hashchange", () => {
    const name = location.hash.replace("#", "");
    if (name) showTab(name);
  });

  document.getElementById("sort-recent").addEventListener("click", () => {
    sortMode = "recent";
    persistSort();
    render();
  });
  document.getElementById("sort-priority").addEventListener("click", () => {
    sortMode = "priority";
    persistSort();
    render();
  });
  document.getElementById("sort-effort").addEventListener("click", () => {
    sortMode = "effort";
    persistSort();
    render();
  });

  document.getElementById("hidden-toggle").addEventListener("click", (e) => {
    const list = document.getElementById("hidden-list");
    list.dataset.open = list.dataset.open === "1" ? "0" : "1";
    render();
  });

  // ---- Motion preference (P0 calm pass) ----
  // "gentle" (default) = the reveal / celebration layer stays quiet; "lively"
  // restores it. Read by CSS via <html data-motion>. prefers-reduced-motion
  // still overrides both.
  (function initMotionPref() {
    let pref = "gentle";
    try { pref = localStorage.getItem("aa_motion_pref") || "gentle"; } catch (e) {}
    if (pref !== "gentle" && pref !== "lively") pref = "gentle";
    document.documentElement.dataset.motion = pref;

    const row = document.getElementById("motion-toggle");
    if (!row) return;
    const btns = row.querySelectorAll("button");
    function paint() {
      const cur = document.documentElement.dataset.motion;
      btns.forEach((b) => {
        const on = b.dataset.motion === cur;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    btns.forEach((b) => {
      b.addEventListener("click", () => {
        document.documentElement.dataset.motion = b.dataset.motion;
        try { localStorage.setItem("aa_motion_pref", b.dataset.motion); } catch (e) {}
        paint();
      });
    });
    paint();
  })();

  render();
  showTab(location.hash ? location.hash.replace("#", "") : "home");
})();
