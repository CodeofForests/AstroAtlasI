/*
 * Content library for the 21-day cycle.
 *
 * MVP note (tracked on Construction Site): these are template-generated,
 * not hand-written copy. Each body gets one "gift" paragraph and one "cost"
 * paragraph, personalized with the user's actual sign/house placement.
 * Structural rule from product description §3 is enforced by construction:
 * every Week 2 entry is generated FROM the same body as its Week 1 entry,
 * so a limitation can never appear without the strength it belongs to.
 */

const CONTENT = (function () {
  "use strict";

  // The seven bodies used for the 7-day gift/cost weeks — classical set,
  // matches what most people expect from "your chart" without overwhelming
  // a first cycle. Outer planets (Uranus–Pluto) move slowly enough that
  // they describe generational threads more than personal ones; saved for
  // a later cycle rather than day 1.
  const WEEK_BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

  const BODY_CORE = {
    Sun: {
      gift: "You are naturally built to lead from a clear sense of who you are — you don't borrow your direction from whoever's in the room.",
      cost: "That same clarity can tip into needing to be the center of the story, or dismissing input that doesn't originate with you."
    },
    Moon: {
      gift: "You read emotional weather before anyone says a word, and you know how to make a room feel safe.",
      cost: "The cost is absorbing moods that were never yours to carry, and mistaking someone else's discomfort for a problem you must fix."
    },
    Mercury: {
      gift: "You solve problems by circling them sideways, gathering angles other people walk straight past.",
      cost: "Direct, single-track instruction irritates you — and you can talk yourself (or someone else) in circles when a plain answer would do."
    },
    Venus: {
      gift: "You build warmth on contact — people feel choice-worthy around you, not evaluated.",
      cost: "That warmth becomes an inability to say no, or a habit of smoothing over a disagreement that actually needed to happen."
    },
    Mars: {
      gift: "You move when something needs moving. Hesitation isn't your failure mode.",
      cost: "The same drive can read as steamrolling — starting before the room has caught up, or mistaking speed for rightness."
    },
    Jupiter: {
      gift: "You make things feel bigger and more possible than they looked five minutes ago.",
      cost: "Optimism unchecked becomes overpromising, or skipping the unglamorous middle step that would have made the big plan real."
    },
    Saturn: {
      gift: "You do the unglamorous, structural work that makes everything else stand up.",
      cost: "The cost is treating rest as something to be earned, and measuring your worth by output rather than by being."
    }
  };

  // Third-person variants for Week 3 "noticing someone else" — written
  // separately rather than pronoun-swapped from BODY_CORE.gift, which reads
  // grammatically broken once regex-substituted ("who them are").
  const NOTICE_CORE = {
    Sun: "leads from a clear sense of who they are — they don't borrow their direction from whoever's in the room.",
    Moon: "reads emotional weather before anyone says a word, and knows how to make a room feel safe.",
    Mercury: "solves problems by circling them sideways, gathering angles other people walk straight past.",
    Venus: "builds warmth on contact — people feel choice-worthy around them, not evaluated.",
    Mars: "moves when something needs moving. Hesitation isn't their failure mode.",
    Jupiter: "makes things feel bigger and more possible than they looked five minutes ago.",
    Saturn: "does the unglamorous, structural work that makes everything else stand up."
  };

  const SIGN_FLAVOR = {
    Aries: "quick, first-mover energy",
    Taurus: "a steady, unhurried pace",
    Gemini: "constant reframing and cross-referencing",
    Cancer: "protective, memory-driven instinct",
    Leo: "visible, warmly declarative expression",
    Virgo: "precise, detail-checking care",
    Libra: "weighing every side before landing",
    Scorpio: "intensity that doesn't do small talk",
    Sagittarius: "reaching for the bigger picture",
    Capricorn: "long-game, structural patience",
    Aquarius: "stepping outside the room to see the pattern",
    Pisces: "porous, absorbing empathy"
  };

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function personalize(baseText, sign, house) {
    const flavor = SIGN_FLAVOR[sign] || "its own particular way";
    const houseText = house ? ` — most visibly in your ${ordinal(house)} house` : "";
    return baseText + ` For you, this comes through as ${flavor} (${sign})${houseText}.`;
  }

  function dayContent(kind, body, sign, house) {
    const core = BODY_CORE[body];
    if (!core) return null;
    const base = kind === "gift" ? core.gift : core.cost;
    return personalize(base, sign, house);
  }

  const PRACTICES = [
    { key: "breath", label: "Breath", desc: "Steadying yourself before looking at something uncomfortable. Gentle, slow breathing only — never breath-holding, never near water. Not medical guidance." },
    { key: "meditation", label: "Meditation / sitting", desc: "Noticing a reaction without immediately obeying it." },
    { key: "movement", label: "Movement / yoga", desc: "What the body is holding that the mind has explained away." },
    { key: "journaling", label: "Journaling", desc: "Making a pattern visible; you can't examine what stays unwritten." },
    { key: "cooking", label: "Cooking", desc: "Attention, sequence, and doing something concrete for someone." },
    { key: "tidying", label: "Tidying your environment", desc: "What you've been avoiding is usually physical too." },
    { key: "reading", label: "Reading", desc: "Sustained time inside another person's interior." },
    { key: "music", label: "Music", desc: "Feeling something without needing words for it yet." },
    { key: "novelty", label: "Changing your surroundings", desc: "Novelty interrupting autopilot — a different route home, an unfamiliar part of your own city, a café you'd normally walk past." }
  ];

  function noticeContent(body, name, sign) {
    const core = NOTICE_CORE[body];
    if (!core) return null;
    const flavor = SIGN_FLAVOR[sign] || "their own particular way";
    return (
      (name || "They") + "'s " + body + " " + core +
      " For them, this likely comes through as " + flavor + " (" + sign + "). " +
      "Something to notice, not to flatten into a label — a question you could ask: what does that actually cost them, day to day?"
    );
  }

  // Home-screen life-area reveals (Relationship / My job / My health). Each
  // pulls a real, specific placement from the user's own chart — never a
  // generic "Aries are..." line — so the first thing someone sees after
  // picking a category names something true about THEM specifically. Reuses
  // SIGN_FLAVOR rather than writing three more 12-entry content sets from
  // scratch, since the underlying "mode of expression" idea is domain-
  // agnostic (how you love, how you work, how you spend energy are all
  // just that same trait pointed at a different room in the house).
  function domainReveal(kind, chart) {
    if (kind === "relationship") {
      const venus = chart.positions.Venus, moon = chart.positions.Moon;
      if (!venus || !moon) return null;
      const venusSign = ASTRO.signOf(venus.lon), moonSign = ASTRO.signOf(moon.lon);
      const text =
        venusSign === moonSign
          ? "Both your Venus and Moon are in " + venusSign + " — " + SIGN_FLAVOR[venusSign] +
            " isn't just how you show up in relationships, it's what you need back too."
          : "In relationships, you show up through " + SIGN_FLAVOR[venusSign] + ". " +
            "Underneath, you need to feel loved through " + SIGN_FLAVOR[moonSign] + ".";
      return { heading: "Venus in " + venusSign + ", Moon in " + moonSign, text: text };
    }
    if (kind === "job") {
      if (chart.unknownTime || chart.mc === null || chart.mc === undefined) return { needsBirthTime: true };
      const saturn = chart.positions.Saturn;
      const mcSign = ASTRO.signOf(chart.mc);
      const saturnSign = ASTRO.signOf(saturn.lon);
      const text =
        mcSign === saturnSign
          ? "Both your Midheaven and Saturn are in " + mcSign + " — " + SIGN_FLAVOR[mcSign] +
            " isn't just the face you bring to work, it's the discipline you've built your whole career around."
          : "The face you bring to work leans on " + SIGN_FLAVOR[mcSign] + ". " +
            "Saturn shows where you've had to build real discipline: " + SIGN_FLAVOR[saturnSign] + ".";
      return { heading: "Midheaven in " + mcSign + ", Saturn in " + saturnSign, text: text };
    }
    if (kind === "health") {
      const mars = chart.positions.Mars;
      if (!mars) return null;
      const marsSign = ASTRO.signOf(mars.lon);
      return {
        heading: "Mars in " + marsSign,
        text:
          "That's how you spend energy: " + SIGN_FLAVOR[marsSign] + ". " +
          "Notice where that shows up in your body today — this isn't medical advice, just a mirror."
      };
    }
    return null;
  }

  return {
    WEEK_BODIES: WEEK_BODIES,
    BODY_CORE: BODY_CORE,
    PRACTICES: PRACTICES,
    dayContent: dayContent,
    noticeContent: noticeContent,
    domainReveal: domainReveal
  };
})();
