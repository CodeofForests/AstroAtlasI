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

  // The daily fork. Each Week 1/2 day, after reading the gift (or its cost),
  // the user picks ONE real move to make today: go WITH the grain of their
  // chart, or deliberately AGAINST it. Neither is "right" — the point is that
  // the choice is theirs and it gets logged. Twenty-one logged choices are
  // the thing no birth chart predicted, which is exactly the map-vs-traveller
  // idea made concrete (see GLOSSARY "the map and you").
  const BODY_EXPERIMENT = {
    Sun:     { prompt: "Your Sun sets its own direction. In one real moment today:",
               lean: "I picked the direction and said so out loud",
               counter: "I let someone else pick — on purpose" },
    Moon:    { prompt: "Your Moon feels the room and tends it. In one real moment today:",
               lean: "I looked after how someone felt",
               counter: "I let a mood in the room just be, without fixing it" },
    Mercury: { prompt: "Your Mercury circles a problem from every side. In one real moment today:",
               lean: "I explored every angle before answering",
               counter: "I gave one plain answer and stopped" },
    Venus:   { prompt: "Your Venus keeps things warm and smooth. In one real moment today:",
               lean: "I made a moment feel easy and kind",
               counter: "I let a small disagreement stay in the room" },
    Mars:    { prompt: "Your Mars moves first. In one real moment today:",
               lean: "I started the thing without waiting",
               counter: "I waited one beat before acting — on purpose" },
    Jupiter: { prompt: "Your Jupiter makes things feel big and possible. In one real moment today:",
               lean: "I made something feel bigger and possible",
               counter: "I named the small next step instead of the big vision" },
    Saturn:  { prompt: "Your Saturn does the solid, structural work. In one real moment today:",
               lean: "I did the unglamorous work that holds things up",
               counter: "I rested before I'd 'earned' it — on purpose" }
  };

  // Week 3 forks (Days 15–21) — same two-option shape, pointed at other
  // people instead of a chart body. "lean" = your usual move, "counter" =
  // deliberately the opposite, so the Day-21 tally reads the same way.
  const WEEK3_FORKS = [
    { prompt: "A person you find difficult. Today:",
      lean: "I responded the way I always do", counter: "I tried the opposite of my usual move" },
    { prompt: "Someone asked something of you. Today:",
      lean: "I answered from habit", counter: "I paused and chose fresh" },
    { prompt: "A person you've quietly labelled in your head. Today:",
      lean: "I let the label stand", counter: "I looked for where the label is wrong" },
    { prompt: "Credit for something you did together. Today:",
      lean: "I took my usual share", counter: "I gave more of it away than felt natural" },
    { prompt: "A disagreement. Today:",
      lean: "I pushed for my side", counter: "I argued their side back to them first" },
    { prompt: "Someone's way of doing a thing that isn't your way. Today:",
      lean: "I did it my way", counter: "I did it their way once, fully" },
    { prompt: "The person from Day 15 you found difficult — look again. Today:",
      lean: "Same as before", counter: "Something shifted" }
  ];

  function experimentFor(body) {
    return BODY_EXPERIMENT[body] || null;
  }
  function week3Fork(day) {
    return WEEK3_FORKS[(day - 15) % WEEK3_FORKS.length] || null;
  }

  // Plain-language toolkit. Every entry has a "plain" line written so a
  // five-year-old could follow it, and a "real" line tying it back to the
  // actual astronomy — so a newcomer is never blocked by a word, and the
  // "this is computed like an astronomer" positioning still holds.
  const GLOSSARY = [
    { term: "Birth chart",
      plain: "A picture of where the Sun, Moon and planets sat in the sky at the exact minute you were born — like a photo of the sky taken from your first breath.",
      real: "We compute it the way an astronomer would, from your date, time and place." },
    { term: "Inception chart",
      plain: "The same kind of sky-photo, but for the moment you pressed Start on Day 1 — a picture of a moment you chose, not one you were handed.",
      real: "Your birth chart you were given; this one you made by showing up today." },
    { term: "Why 21 days",
      plain: "Long enough to try something new every day and actually feel it change; short enough that you can see the finish line from the start.",
      real: "Three weeks: one for your strengths, one for their costs, one for the people around you." },
    { term: "Sign (Aries, Leo…)",
      plain: "Which slice of sky a planet was sitting in. Picture the sky as a wheel cut into 12 named slices, each with its own flavour.",
      real: "The zodiac — 12 equal 30° segments along the Sun's yearly path." },
    { term: "House",
      plain: "Which room of your life a planet shows up in most — a 'money room', a 'friends room', a 'home room'. There are 12 rooms.",
      real: "The 12 houses, set by the exact time and place of birth." },
    { term: "Aspect",
      plain: "When two planets sit at a special angle to each other, so they work as a team — or argue.",
      real: "Angular links like conjunction (0°), square (90°), trine (120°)." },
    { term: "Planet / body",
      plain: "Each one stands for a part of you: the Sun is who you are, the Moon is what you need to feel safe, Mars is how you go after things.",
      real: "The journey uses the classical seven; the outer planets describe whole generations more than one person." },
    { term: "Gift and cost",
      plain: "Every strength has a price tag. The thing you're great at is the same thing that trips you up — so we always show them together.",
      real: "Week 1 is the gift; Week 2 is that same gift's cost — never a separate list of flaws." },
    { term: "Your Galaxy",
      plain: "You're one star. People you add — only if they say yes — are other stars. Together you make a little galaxy.",
      real: "A midpoint composite chart of everyone who has consented." },
    { term: "Brightness",
      plain: "How much of the journey you've taken in. It goes up when you look at a gift and its cost together, and you can't buy it.",
      real: "Earned only by completing days; never purchasable." },
    { term: "North Node / South Node",
      plain: "The South Node is the move you already know by heart. The North Node is the direction you're still growing toward — the stretch.",
      real: "The two points where the Moon's path crosses the Sun's." },
    { term: "The map and you",
      plain: "Your chart is a map of the ground you started on. It doesn't drive the car. Every choice you make is you turning the wheel — which is why twins with almost the same chart still live totally different lives.",
      real: "The chart describes tendencies, not a fixed future. Nothing here predicts what will happen." },
    { term: "Why notice the body?",
      plain: "Your chart doesn't act on your body. What it names is a handful of tendencies — ways you reliably lean. Each one has a felt signature: when your “act first” tendency fires, something moves in your chest and hands before you've decided anything. That sensation is the earliest sign a pattern is running — sooner than the thought, sooner than the action. Learn its signature and you get a choice you didn't have before. And because it always passes, you also see it isn't you — just weather moving through.",
      real: "The chart points to tendencies; a tendency has a body signature that precedes the thought. Noticing it is the earliest point you can catch the pattern — and watching it pass is how you stop being run by it." }
  ];
  // Same words, reused inline on the body-log card so the explanation is
  // said once and stays consistent wherever it appears.
  const BODY_RATIONALE = GLOSSARY[GLOSSARY.length - 1];

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

  // One plain-language phrase per house, so "your 7th house" never appears on
  // its own to someone who has never used astrology. The number stays in
  // parentheses for people who do know it.
  const HOUSE_MEANING = {
    1: "how you come across and your first move in anything",
    2: "money, belongings, and what you treat as worth having",
    3: "everyday talk, learning, and the people right around you",
    4: "home, family, and where you come from",
    5: "play, creativity, romance, and self-expression",
    6: "daily work, health, and the routines that hold your days together",
    7: "close one-to-one relationships and partnerships",
    8: "trust, intimacy, shared money, and deep change",
    9: "beliefs, travel, and the bigger picture you live by",
    10: "your work in the world, your reputation, and public role",
    11: "friends, groups, and what you're aiming for long-term",
    12: "solitude, the inner life, and what stays behind the scenes"
  };
  function houseMeaning(house) {
    return HOUSE_MEANING[house] || null;
  }

  function personalize(baseText, sign, house) {
    const flavor = SIGN_FLAVOR[sign] || "its own particular way";
    let tail = ` For you, this comes through as ${flavor} (${sign})`;
    if (house && HOUSE_MEANING[house]) {
      tail += `, and it shows up most in ${HOUSE_MEANING[house]} (${ordinal(house)} house)`;
    }
    return baseText + tail + ".";
  }

  function dayContent(kind, body, sign, house) {
    const core = BODY_CORE[body];
    if (!core) return null;
    const base = kind === "gift" ? core.gift : core.cost;
    return personalize(base, sign, house);
  }

  // Practices are grouped into the three doors an action can come through:
  // mind (thought), speech (word), body (deed / sensation). Each day suggests
  // one, tied to the day's planet; the rest of that category — and the other
  // two categories — stay available. `cat` drives the grouped picker in ui.js.
  const PRACTICE_CATEGORIES = [
    { key: "mind", label: "Mind", blurb: "Working with thought — catching it before it runs you." },
    { key: "speech", label: "Speech", blurb: "Working with words — what you say, soften, or leave unsaid." },
    { key: "body", label: "Body", blurb: "Working with sensation and deed — what the body knows first." }
  ];
  const PRACTICES = [
    // ---- Mind ----
    { key: "meditation", cat: "mind", label: "Sit with a thought", desc: "Ten minutes. When a reaction rises, name it and don't obey it — just watch it pass." },
    { key: "journaling", cat: "mind", label: "Journaling", desc: "Write the pattern down. You can't examine what stays unwritten." },
    { key: "label_thoughts", cat: "mind", label: "Label three thoughts", desc: "Three times today, stop and name the thought you're having in one word — 'planning', 'blaming', 'wanting'. Then carry on." },
    { key: "reading", cat: "mind", label: "Reading", desc: "An hour inside another person's interior — sustained attention on a mind that isn't yours." },
    // ---- Speech ----
    { key: "truth_sentence", cat: "speech", label: "One true sentence", desc: "Once today, say one true thing you'd normally soften or skip — plainly, kindly, without the cushion." },
    { key: "no_complaint", cat: "speech", label: "A day without complaint", desc: "Notice every pull to complain out loud. Feel it, let it go unsaid. Count how many times." },
    { key: "ask_not_tell", cat: "speech", label: "Ask instead of tell", desc: "Replace one statement you were about to make with a genuine question, and listen to the whole answer." },
    { key: "chosen_silence", cat: "speech", label: "An hour of chosen silence", desc: "One deliberate hour of not speaking — chosen, not withdrawn. Notice what wanted to be said." },
    // ---- Body ----
    { key: "breath", cat: "body", label: "Gentle breath", desc: "Slow, easy breathing before you look at something hard. Never breath-holding, never near water. Not medical guidance." },
    { key: "movement", cat: "body", label: "Movement / yoga", desc: "What the body is holding that the mind has explained away." },
    { key: "cooking", cat: "body", label: "Cooking", desc: "Attention, sequence, and something concrete made for someone." },
    { key: "tidying", cat: "body", label: "Tidying one corner", desc: "Set one small part of your space in order — what you've been avoiding is usually physical too." }
  ];

  // One practice per body is highlighted as "suggested for today", with a
  // line saying why it fits. Week 1 and Week 2 share a body, so the
  // suggestion carries across both. Each suggested key names a real PRACTICES
  // entry; its category comes along for free.
  const PRACTICE_SUGGESTION = {
    Sun:     { key: "journaling",    why: "The Sun is who you are at the core — write yourself down when no one's watching." },
    Moon:    { key: "breath",        why: "The Moon is what settles you — slow breathing is the quickest way back to it." },
    Mercury: { key: "truth_sentence", why: "Mercury is how you speak — say one true thing today without the cushion." },
    Venus:   { key: "cooking",       why: "Venus is what you find worth wanting — make something good with your hands, for someone." },
    Mars:    { key: "movement",      why: "Mars is how you take action — move, and notice where the impulse actually lives." },
    Jupiter: { key: "reading",       why: "Jupiter is where you reach — an hour inside someone else's thinking stretches it further." },
    Saturn:  { key: "tidying",       why: "Saturn is the structural work — set one small part of your space in order." }
  };
  const WEEK3_SUGGESTION = { key: "ask_not_tell", why: "Week 3 is about other people — trade one statement for a real question and hear the whole answer." };

  function practiceSuggestion(day, week) {
    if (week === 3) return WEEK3_SUGGESTION;
    return PRACTICE_SUGGESTION[WEEK_BODIES[(day - 1) % 7]] || null;
  }

  // A short line for the day to sit with. Tied to the body (Weeks 1–2) or to
  // the "seeing other people" theme (Week 3). MVP note: these need a proper
  // rights/attribution pass before launch — tracked on the Construction Site.
  const PLANET_QUOTE = {
    Sun:     { text: "The privilege of a lifetime is to become who you truly are.", who: "Carl Jung" },
    Moon:    { text: "Nothing ever goes away until it has taught us what we need to know.", who: "Pema Chödrön" },
    Mercury: { text: "It is the mark of an educated mind to entertain a thought without accepting it.", who: "Aristotle" },
    Venus:   { text: "To love at all is to be vulnerable.", who: "C. S. Lewis" },
    Mars:    { text: "Well done is better than well said.", who: "Benjamin Franklin" },
    Jupiter: { text: "He who has a why to live can bear almost any how.", who: "Friedrich Nietzsche" },
    Saturn:  { text: "Excellence is not an act, but a habit.", who: "Will Durant" }
  };
  const WEEK3_QUOTE = [
    { text: "Everyone you meet is fighting a battle you know nothing about. Be kind.", who: "Ian Maclaren" },
    { text: "We don't see things as they are; we see them as we are.", who: "Anaïs Nin" },
    { text: "Between stimulus and response there is a space, and in that space is our freedom.", who: "Viktor Frankl" },
    { text: "No act of kindness, no matter how small, is ever wasted.", who: "Aesop" },
    { text: "Seek first to understand, then to be understood.", who: "Stephen Covey" },
    { text: "If you want to go fast, go alone. If you want to go far, go together.", who: "African proverb" },
    { text: "We are all just walking each other home.", who: "Ram Dass" }
  ];
  function quoteForDay(day, week) {
    if (week === 3) return WEEK3_QUOTE[(day - 15) % WEEK3_QUOTE.length];
    return PLANET_QUOTE[WEEK_BODIES[(day - 1) % 7]] || null;
  }

  // Where each planet's gift/cost tends to be *felt*, not thought. Written
  // phenomenologically ("you might notice"), never as medical or anatomical
  // claim. Each line also carries the point of the whole exercise: the
  // sensation arrives and passes on its own — it is weather, not identity.
  const PLANET_BODY_CUE = {
    Sun:     "The Sun is often felt high and central — the sternum, a lift behind the eyes; or a flatness there when it's missing. Watch it rise and settle. It isn't fixed.",
    Moon:    "The Moon tends to sit low and soft — the belly, the throat, the back of the chest. Whatever's there moves through in waves if you let it.",
    Mercury: "Mercury is quick and up top — jaw, temples, a buzz in the hands, breath high in the chest. It speeds and slows on its own.",
    Venus:   "Venus is warmth on the surface — the face, the chest, the palms; a softening, or a held smile that quietly costs something. Notice it come, notice it go.",
    Mars:    "Mars runs hot and forward — heat in the chest and hands, a set jaw, a lean in the legs. Feel it surge. Then feel it pass.",
    Jupiter: "Jupiter expands — a widening in the ribs, breath that wants more room; or a heaviness when the reach overshot. It swells and recedes.",
    Saturn:  "Saturn is weight and holding — the shoulders, the lower back, a bracing in the belly. You can set it down. It returns. That's fine."
  };
  const WEEK3_BODY_CUE =
    "With another person in mind, notice the body first — where you tighten, lean away, soften, or brace. It shifts as they shift, and as you do.";

  function bodyCueForDay(day, week) {
    if (week === 3) return WEEK3_BODY_CUE;
    return PLANET_BODY_CUE[WEEK_BODIES[(day - 1) % 7]] || null;
  }

  // Vocabulary for the one-tap body log. Kept small and plain so a first-time
  // user isn't asked to introspect in jargon. One quality + one place, both
  // optional — a snapshot, never a verdict.
  const BODY_QUALITIES = ["tight", "open", "heavy", "buzzing", "calm", "numb"];
  const BODY_PLACES = ["chest", "gut", "throat", "jaw", "shoulders", "hands", "legs"];

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

  // Short, non-paragraph phrases for the no-commitment teaser — what a
  // body is fundamentally "about," compact enough to slot into one
  // sentence naming a specific real aspect from the visitor's own chart.
  const BODY_ESSENCE = {
    Sun: "who you are at the core",
    Moon: "what you need to feel safe",
    Mercury: "how you think and talk",
    Venus: "what you find worth wanting",
    Mars: "how you take action",
    Jupiter: "where you overreach, or grow",
    Saturn: "where you've had to grow up fast",
    Uranus: "where you break your own rules",
    Neptune: "where reality gets blurry for you",
    Pluto: "what you can't help transforming",
    Chiron: "the wound you keep teaching from",
    NorthNode: "the direction you're growing toward",
    SouthNode: "the pattern you already know too well"
  };

  const ASPECT_FRAME = {
    Conjunction: "fuse into a single impulse",
    Sextile: "quietly back each other up",
    Square: "grind against each other",
    Trine: "flow together almost too easily",
    Opposition: "pull you in two directions at once"
  };

  // Teaser for the skeptical/curious first-time visitor: needs ONLY a
  // birth date (no time, no place) since a body's zodiac sign and the
  // aspects between bodies don't depend on either — houses and the
  // Ascendant do, but those aren't used here. Picks the visitor's single
  // tightest-orb aspect (the most exact, most "real" fact in their chart)
  // rather than a generic sun-sign line, so it reads as specific to them.
  function teaserReveal(wall) {
    const utcDate = new Date(Date.UTC(wall.year, wall.month - 1, wall.day, 12, 0, 0));
    const { positions } = ASTRO.computePositions(utcDate);
    const aspects = ASTRO.computeAspects(positions);

    if (aspects.length === 0) {
      const sunSign = ASTRO.signOf(positions.Sun.lon);
      return {
        heading: "Sun in " + sunSign,
        text: "Even with just your birth date: your Sun is in " + sunSign + " — " + SIGN_FLAVOR[sunSign] + "."
      };
    }

    let tightest = aspects[0];
    aspects.forEach((a) => { if (a.orb < tightest.orb) tightest = a; });
    const frame = ASPECT_FRAME[tightest.aspect] || "shape each other";
    return {
      heading: tightest.a + " " + tightest.symbol + " " + tightest.b,
      text:
        "Your " + tightest.a + " and " + tightest.b + " are in " + tightest.aspect.toLowerCase() +
        ", only " + tightest.orb + "° from exact: " + BODY_ESSENCE[tightest.a] + ", and " +
        BODY_ESSENCE[tightest.b] + " — " + frame + "."
    };
  }

  function signFlavor(sign) {
    return SIGN_FLAVOR[sign] || "its own particular way";
  }
  function bodyEssence(body) {
    return BODY_ESSENCE[body] || null;
  }

  return {
    WEEK_BODIES: WEEK_BODIES,
    BODY_CORE: BODY_CORE,
    PRACTICES: PRACTICES,
    PRACTICE_CATEGORIES: PRACTICE_CATEGORIES,
    GLOSSARY: GLOSSARY,
    dayContent: dayContent,
    experimentFor: experimentFor,
    week3Fork: week3Fork,
    practiceSuggestion: practiceSuggestion,
    quoteForDay: quoteForDay,
    bodyCueForDay: bodyCueForDay,
    BODY_QUALITIES: BODY_QUALITIES,
    BODY_PLACES: BODY_PLACES,
    BODY_RATIONALE: BODY_RATIONALE,
    houseMeaning: houseMeaning,
    signFlavor: signFlavor,
    bodyEssence: bodyEssence,
    teaserReveal: teaserReveal,
    noticeContent: noticeContent,
    domainReveal: domainReveal
  };
})();
