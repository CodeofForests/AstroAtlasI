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
    if ((name === "mychart" || name === "cycle") && !s.me) {
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
    if (UI_RENDERERS[name]) UI_RENDERERS[name]();
  }

  document.getElementById("hero-cta").addEventListener("click", () => {
    const s = STORE.get();
    location.hash = s.me ? "#mychart" : "#birthdata";
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

  render();
  showTab(location.hash ? location.hash.replace("#", "") : "home");
})();
