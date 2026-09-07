/*
 * Data layer — browser-local persistence for this prototype (release plan
 * §7 calls this out explicitly: "lighter-weight browser-local persistence,
 * not production infrastructure"). Everything lives in localStorage under
 * the aa_ prefix. No backend, no accounts — "consent" between people is
 * simulated locally by holding both the user's chart and an "added person"
 * chart in the same browser profile.
 */

const STORE = (function () {
  "use strict";

  const KEY = "aa_state_v1";

  function defaultState() {
    return {
      me: null,           // { name, wall, place, unknownTime }
      others: [],          // [{ id, name, wall, place, unknownTime, consent: 'invited'|'accepted'|'declined'|'withdrawn' }]
      thoughts: [],        // [{ id, atISO, place:{lat,lon,zone,label}, note, cycle, week }] — the horary thought log
      horaryAsked: {},     // { "<cycle>_<week>": { thoughtId, topicKey, question, askedISO } } — one horary question per week
      cycle: {
        number: 1,
        startedAtISO: null,   // for the inception chart (Week 3 solo)
        completedDays: [],     // [1..21]
        choices: {},           // { [dayNum]: 'lean' | 'counter' } — the daily fork
        observationPersonName: null,
        seenUnlocks: [],       // reveal keys ("gift:Mars" / "cost:Venus") already shown with their unlock animation
        brightnessMilestone: 0 // highest Galaxy brightness threshold (25/50/75/100) already celebrated
      },
      deleted: false
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const merged = Object.assign(defaultState(), parsed);
      // Object.assign is shallow: a saved state from before `choices` existed
      // would replace the whole cycle object and lose the new default.
      merged.cycle = Object.assign(defaultState().cycle, parsed.cycle || {});
      return merged;
    } catch (e) {
      return defaultState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore — state just won't persist */
    }
  }

  let state = load();

  function get() {
    return state;
  }
  function update(mutator) {
    mutator(state);
    save(state);
    return state;
  }

  function setMe(profile) {
    return update((s) => {
      s.me = profile;
      if (!s.cycle.startedAtISO) s.cycle.startedAtISO = new Date().toISOString();
    });
  }

  function addOther(profile) {
    return update((s) => {
      s.others.push(Object.assign({ id: "p_" + Date.now(), consent: "invited" }, profile));
    });
  }
  function setConsent(id, status) {
    return update((s) => {
      const p = s.others.find((x) => x.id === id);
      if (p) p.consent = status;
    });
  }
  function withdraw(id) {
    return update((s) => {
      const p = s.others.find((x) => x.id === id);
      if (p) p.consent = "withdrawn";
    });
  }

  function completeDay(dayNum) {
    return update((s) => {
      if (s.cycle.completedDays.indexOf(dayNum) === -1) s.cycle.completedDays.push(dayNum);
    });
  }
  function currentDay() {
    return Math.min(state.cycle.completedDays.length + 1, 21);
  }
  // Remember that a set of reveal keys has now been shown with its
  // "just unlocked" moment, so later renders of the chart tiles stay calm.
  function markUnlocksSeen(keys) {
    return update((s) => {
      if (!s.cycle.seenUnlocks) s.cycle.seenUnlocks = [];
      keys.forEach((k) => {
        if (s.cycle.seenUnlocks.indexOf(k) === -1) s.cycle.seenUnlocks.push(k);
      });
    });
  }
  function setBrightnessMilestone(n) {
    return update((s) => {
      if (!(s.cycle.brightnessMilestone >= n)) s.cycle.brightnessMilestone = n;
    });
  }
  function recordChoice(dayNum, choice) {
    return update((s) => {
      if (!s.cycle.choices) s.cycle.choices = {};
      s.cycle.choices[dayNum] = choice;
    });
  }

  // ---- horary thought log ----
  function addThought(entry) {
    return update((s) => {
      if (!s.thoughts) s.thoughts = [];
      s.thoughts.push(Object.assign({ id: "t_" + Date.now() }, entry));
    });
  }
  function updateThought(id, fields) {
    return update((s) => {
      const t = (s.thoughts || []).find((x) => x.id === id);
      if (t) Object.assign(t, fields);
    });
  }
  function deleteThought(id) {
    return update((s) => {
      s.thoughts = (s.thoughts || []).filter((x) => x.id !== id);
    });
  }
  function recordHorary(key, record) {
    return update((s) => {
      if (!s.horaryAsked) s.horaryAsked = {};
      s.horaryAsked[key] = record;
    });
  }
  function repeatCycle(mode) {
    for (var d = 1; d <= 21; d++) {
      localStorage.removeItem("aa_practice_day_" + d);
      localStorage.removeItem("aa_practice_note_day_" + d);
      localStorage.removeItem("aa_body_day_" + d);
    }
    return update((s) => {
      s.cycle.number += 1;
      s.cycle.completedDays = [];
      s.cycle.choices = {};
      s.cycle.seenUnlocks = [];
      s.cycle.brightnessMilestone = 0;
      s.cycle.startedAtISO = new Date().toISOString();
      if (mode === "new-circle") s.others = [];
    });
  }

  function deleteEverything() {
    localStorage.removeItem(KEY);
    localStorage.removeItem("aa_journey_intro_dismissed");
    localStorage.removeItem("aa_howitworks_seen");
    // Per-day practice picks and free-text notes are stored one key per day.
    for (var d = 1; d <= 21; d++) {
      localStorage.removeItem("aa_practice_day_" + d);
      localStorage.removeItem("aa_practice_note_day_" + d);
      localStorage.removeItem("aa_body_day_" + d);
    }
    state = defaultState();
    state.deleted = true;
    return state;
  }

  return {
    get: get,
    setMe: setMe,
    addOther: addOther,
    setConsent: setConsent,
    withdraw: withdraw,
    completeDay: completeDay,
    currentDay: currentDay,
    markUnlocksSeen: markUnlocksSeen,
    setBrightnessMilestone: setBrightnessMilestone,
    recordChoice: recordChoice,
    addThought: addThought,
    updateThought: updateThought,
    deleteThought: deleteThought,
    recordHorary: recordHorary,
    repeatCycle: repeatCycle,
    deleteEverything: deleteEverything
  };
})();
