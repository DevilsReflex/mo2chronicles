/* ═══════════════════════════════════════════════════════════════
   THE CHRONICLE OF NAVE — renderer & effects
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const C = window.CHRONICLE;
  if (!C) return;

  const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII"];
  // per-age accent tints (cold dawn → blood → bronze → fire → desert gold)
  const AGE_TINTS = ["#8fa7c9", "#c05a4b", "#c9a86a", "#d98c4a", "#e3c37f"];
  const AGE_GLOWS = [
    "rgba(90, 118, 160, 0.14)",
    "rgba(156, 60, 46, 0.12)",
    "rgba(201, 168, 106, 0.10)",
    "rgba(196, 116, 48, 0.12)",
    "rgba(214, 186, 120, 0.12)",
  ];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // touch devices get lighter per-frame work; hover-capable devices keep
  // every effect exactly as designed
  const coarsePtr = window.matchMedia("(pointer: coarse)").matches;
  const hoverCapable = window.matchMedia("(hover: hover)").matches;

  /* ── helpers ─────────────────────────────────────────── */
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // typographic dress-up: wrap "quoted speech" in em with proper curly quotes.
  // Runs after esc(), so straight quotes arrive as &quot; entities.
  const dress = (s) => esc(s).replace(/&quot;([\s\S]{2,220}?)&quot;/g, (m, a) => `<em>“${a}”</em>`);

  // a short tag for the spine marker itself — the card already carries the
  // full date, this just needs enough to tell two nearby nodes apart at a
  // glance: "31 MAR" for a dated entry, "MAR"/"SPR" for a month/season-only
  // one, the bare year as a last resort. Ranges and qualifiers ("Late…")
  // collapse to their start.
  const spineDate = (dateStr) => {
    if (!dateStr) return "";
    const start = dateStr.split(/[–-]/)[0].trim().replace(/^(Late|Early|Mid)\s+/i, "");
    let m = start.match(/^(\d{1,2})\s+([A-Za-z]+)\s+\d{4}$/);
    if (m) return `${m[1]} ${m[2].slice(0, 3).toUpperCase()}`;
    m = start.match(/^([A-Za-z]+)\s+\d{4}$/);
    if (m) return m[1].slice(0, 3).toUpperCase();
    m = start.match(/^\d{4}$/);
    if (m) return start;
    return start.slice(0, 3).toUpperCase();
  };

  /* ── the names of Nave ──────────────────────────────────────────
     Player names take the bold gold treatment; guild/house/alliance
     names take the bold crimson treatment. Multi-word names are
     matched as whole phrases (longest first). Deliberately excluded:
     places (Bakti, Vadda…), lore/NPCs (Malturn, Ultumeki…), game
     systems (Reckoning, SEED…), the studio (Star Vault), and a few
     genuinely ambiguous words (Oghmir the race, Discord the app). */
  const PLAYERS = [
    "BruceLeeRob", "Barados", "Azog", "Speznat", "General Lordus", "Lordus", "Tasu",
    "Vellek", "Gab", "Axe", "Rivers", "Riley", "Diphrael", "Kuthara", "Abbadon",
    "Slasher", "Cixx", "Danny", "Killox", "Nerion", "PoisonArrows", "Pandah Sykes",
    "Pandah", "Sykes", "Emdash", "Putzin", "TheMasterStick", "Slyy", "Pockets",
    "RunKarni", "Tats", "Buda", "Thievery", "Cruel", "Stinkeye", "Pinkeye",
    "Henrik Nyström", "Henrik", "Nyström", "Sebastian", "Robmo", "Ahmose", "Highlurder",
    "Phen", "Hayasa", "Viknuss", "Tekk", "MolagAmur", "Kelzyr", "Avonis", "Raknor",
    "DaChieftain", "Phillywob", "Ferrus", "Davis", "Serverus", "Aquagenix", "Qaiten",
    "Amarria", "Malyck", "Bratwire", "Brat", "Suttner", "Apsalar", "Luconuti", "Vecna",
    "Svaar", "Hauron", "Zaras Himotep", "Zaras", "Himotep", "Ghanburi", "Turel", "Volos",
    "Mistmaker", "ProfessorOh", "CoxyMate", "Cedarnut", "AtruinAugustus", "Mahone",
    "Waffle Stomper", "Papaturro", "Tunalion", "Favonius Cornelius", "Favonius", "Cornelius",
    "LordMega", "Nefnate", "Backyard Employee", "Azaad", "Montradamus", "Gbunny", "Jonttre",
    "Smasher", "Ganandorn", "Schnoz", "Bank", "Covfefe", "John Oldman", "Oldman", "Talut",
    "Venomous", "Hillary", "Otto", "Clee", "Forgiven", "Krankone Hsler", "Krankone", "Krank",
    "Pepper", "Blitz", "Bigbadwolff", "AnthonyHD", "CeeJ", "Nebulous", "Demra", "Adolyn",
    "Nausk", "Aesir", "Pox", "Bayard", "Noobert", "Torggaddon", "Tatsuya", "RobberDob",
    "Kidney", "Loud Ziggy", "Ziggy", "HardDriveDump", "Ruthless G", "Wicked", "Clarence",
    "Nalyd", "Embuscade", "Tiglie", "Chip Chip", "TheLazyPeon", "Josh Strife Hayes",
  ];
  const GUILDS = [
    "Odinseed", "Wolfszeit", "KarniMata", "Nightmare Alliance", "Nightmare", "Rat Alliance",
    "KotO", "KoTo", "Legion", "Nightfall", "Content", "Acolytes", "BeastMasters", "Eternal",
    "Requiem", "Integrity", "DracoSilvam", "Mythic", "Companions", "Dreadlords", "Overt",
    "Clandestine", "BlackPriest", "Miscreants", "Tianming", "MANA", "TEA", "Artisans",
    "SLAV", "LaFrance", "Onikumazoku", "Woses", "Chimera", "Gordox", "Unbroken", "MKRG",
    "ACT", "Levia", "Krankids", "Oldguard", "Nameless", "RPK", "BEAR", "Wolfpack", "Saltpack",
    "Headless", "Jungle Alliance", "Bad Company", "Company", "Merry Men", "Northern Bank",
    "Death Jester", "Mors Omnibus", "Black Panthers", "Darkblood Coven", "Torch Bearers",
    "Knights of Myrland", "Shadow Consortium", "Noble Ones", "Free Tribes", "Collective",
    "Harbingers of Judgment", "Guardians of Gabaria", "Saint Sépulcre", "L'Empire",
    "Keepers of the Oath",
  ];
  const NAME_CLASS = {};
  PLAYERS.forEach((n) => (NAME_CLASS[n] = "n-p"));
  GUILDS.forEach((n) => (NAME_CLASS[n] = "n-g"));
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const NAME_RE = new RegExp(
    "(?<![A-Za-z0-9])(" +
      Object.keys(NAME_CLASS)
        .sort((a, b) => b.length - a.length)
        .map(escRe)
        .join("|") +
      ")(?![A-Za-z0-9])",
    "g"
  );
  // wrap known names; skips any text already inside an HTML tag
  function markNames(html) {
    return html.replace(NAME_RE, (m) => `<span class="${NAME_CLASS[m]}">${m}</span>`);
  }
  // full prose pipeline: escape → curly-quote → name-highlight
  const prose = (s) => markNames(dress(s));

  // split long bodies into readable paragraphs at sentence boundaries,
  // never splitting inside a quoted passage (even count of " so far)
  function bodyHTML(body) {
    if (body.length < 700) return `<p class="entry-body">${prose(body)}</p>`;
    const sentences = body.match(/[^.!?]+[.!?]+["”')\]]*\s*/g) || [body];
    const chunks = [];
    let cur = "";
    for (const s of sentences) {
      cur += s;
      const quotesBalanced = (cur.split('"').length - 1) % 2 === 0;
      if (cur.length > 430 && quotesBalanced) {
        chunks.push(cur.trim());
        cur = "";
      }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.map((c) => `<p class="entry-body">${prose(c)}</p>`).join("");
  }

  function youtubeId(url) {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^(www\.|m\.)/, "");
      if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (u.pathname === "/watch") return u.searchParams.get("v");
        const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
        if (m) return m[2];
      }
    } catch (e) {}
    return null;
  }

  function sourceLabel(link) {
    if (link.source) return link.source;
    try {
      return new URL(link.url).hostname.replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  /* ── hero ─────────────────────────────────────────────── */
  // subtitle: "Being a True and Epic History … · 2021 – 2026 · set down …"
  (function renderHero() {
    const parts = C.subtitle.split("·").map((s) => s.trim());
    const sub = document.getElementById("hero-sub");
    const dates = document.getElementById("hero-dates");
    if (parts.length >= 3) {
      sub.innerHTML = esc(parts[0]) + "<br>" + esc(parts.slice(2).join(" · "));
      dates.textContent = parts[1];
    } else {
      sub.textContent = C.subtitle;
      dates.textContent = "2021 – 2026";
    }
  })();

  /* ── prefaces ────────────────────────────────────────── */
  (function renderPrefaces() {
    const el = document.getElementById("prefaces");
    el.innerHTML = C.sections
      .map((sec) => {
        const paras = sec.paragraphs
          .map((p, i) => `<p class="reveal" style="--d:${i * 0.05}s">${prose(p)}</p>`)
          .join("");
        return `<div class="preface-block">
          <h2 class="reveal">${esc(sec.heading)}</h2>
          <div class="ornament reveal" aria-hidden="true"><span class="orn-line"></span><span class="orn-diamond">&#10022;</span><span class="orn-line"></span></div>
          ${paras}
        </div>`;
      })
      .join("");
  })();

  /* ── watch media ─────────────────────────────────────── */
  const SCROLL_ICON = `<svg class="ls-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M7.5 4.5h9.2a2 2 0 0 1 2 2v11.2a1.8 1.8 0 0 0 1.8 1.8H9.3a1.8 1.8 0 0 1-1.8-1.8V4.5z"/><path d="M7.5 4.5a2 2 0 0 0-2 2v1.2h3.6" /><path d="M10.5 9.4h5.2M10.5 12.4h5.2M10.5 15.4h3.4"/></svg>`;

  function renderWatch(links) {
    if (!links || !links.length) return "";
    const vids = [];
    const scrolls = [];
    links.forEach((l) => {
      const id = youtubeId(l.url);
      // noembed: the uploader disabled embedding — render as a link instead
      if (id && !l.noembed) vids.push({ ...l, id });
      else scrolls.push(l);
    });
    let html = `<div class="watch"><div class="watch-label">From the chroniclers</div>`;
    if (vids.length) {
      html += `<div class="video-grid${vids.length > 1 ? " multi" : ""}">`;
      html += vids
        .map(
          (v) => `
        <div class="video-card" data-yt="${esc(v.id)}" role="button" tabindex="0" aria-label="Play video: ${esc(v.text)}">
          <div class="video-thumb">
            <img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="">
            <div class="play-btn" aria-hidden="true"></div>
            <div class="video-caption">
              <span class="vc-title">${markNames(esc(v.text))}</span>
              <span class="vc-source">${esc(sourceLabel(v))}</span>
            </div>
          </div>
        </div>`
        )
        .join("");
      html += `</div>`;
    }
    if (scrolls.length) {
      html += `<div class="link-scrolls">`;
      html += scrolls
        .map(
          (l) => `
        <a class="link-scroll" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
          ${SCROLL_ICON}
          <span><span class="ls-text">${markNames(esc(l.text))}</span><span class="ls-source">${esc(sourceLabel(l))}</span></span>
          <span class="ls-arrow" aria-hidden="true">&#8599;&#xFE0E;</span>
        </a>`
        )
        .join("");
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  /* ── the chronicle timeline ──────────────────────────── */
  (function renderChronicle() {
    const root = document.getElementById("chronicle");
    const navEl = document.getElementById("age-nav");
    let html = "";
    let nav = "";

    C.ages.forEach((age, ai) => {
      const tint = AGE_TINTS[ai] || AGE_TINTS[2];
      const glow = AGE_GLOWS[ai] || AGE_GLOWS[2];
      const id = `age-${ai + 1}`;
      const flyoutId = `flyout-${id}`;
      const flyoutItems = []; // collected while walking this age's entries below
      // one Age's name runs far longer than the rest ("The Coming of Territory
      // and the First Keep to Fall") — give it its own scale so it reads as a
      // considered long title instead of an oversized wrap
      const titleCls = age.name.length > 30 ? " age-title-long" : "";

      html += `
      <section class="age-divider" id="${id}" style="--age-tint:${tint};--age-glow:${glow}" aria-label="${esc(age.age)}">
        <div class="age-seal-ring reveal" aria-hidden="true"></div>
        <div class="age-roman-bg" aria-hidden="true">${ROMANS[ai]}</div>
        <div class="age-inner">
          <div class="age-crest-row reveal" aria-hidden="true">
            <span class="orn-line"></span>
            <svg class="age-crest" viewBox="0 0 40 40"><use href="#crest-nave"/></svg>
            <span class="orn-line"></span>
          </div>
          <p class="age-kicker reveal" style="--d:.06s">${esc(age.age)}</p>
          <h2 class="age-title${titleCls} reveal" style="--d:.12s">${esc(age.name)}</h2>
          <div class="age-ornament reveal" style="--d:.2s" aria-hidden="true"><span class="orn-line"></span><span class="orn-diamond">&#10022;</span><span class="orn-line"></span></div>
          <p class="age-range reveal" style="--d:.28s">${esc(age.range)}</p>
          ${age.temper.map((t, i) => `<p class="age-temper reveal" style="--d:${0.36 + i * 0.1}s">${prose(t)}</p>`).join("")}
          <div class="age-frame-bottom reveal" aria-hidden="true" style="--d:${0.36 + age.temper.length * 0.1}s"></div>
        </div>
      </section>
      <div class="timeline" style="--age-tint:${tint}" data-age="${id}">
        <div class="spine" aria-hidden="true"><div class="spine-fill"></div></div>`;

      let prevYear = null;
      age.entries.forEach((e, ei) => {
        const isTale = e.kind === "tale";
        const isLandmark = (e.title.length > 6 && e.title === e.title.toUpperCase()) || !!e.marker;
        const entryId = `entry-${ai}-${ei}`;
        // year milestone on the spine whenever the chronicle turns a year —
        // only on dated entries (tales carry approximate era-years) and only forward
        if (!isTale && e.year && (prevYear === null || e.year > prevYear)) {
          html += `<div class="year-break reveal" aria-hidden="true"><span class="yb-text">Anno ${e.year}</span><span class="yb-line"></span></div>`;
          prevYear = e.year;
        }
        const cls = ["entry", "reveal", isTale ? "tale" : "", isLandmark ? "landmark" : ""].filter(Boolean).join(" ");
        const dateLine = e.date
          ? `<div class="entry-date">${esc(e.date)}</div>`
          : `<div class="tale-kicker">From the margins of the chronicle${e.era ? ` &mdash; ${esc(e.era)}` : ""}</div>`;
        html += `
        <article class="${cls}" id="${entryId}" data-year="${e.year}">
          <span class="entry-node" aria-hidden="true"></span>
          ${e.date ? `<span class="entry-node-date" aria-hidden="true">${esc(spineDate(e.date))}</span>` : ""}
          <div class="entry-card">
            ${dateLine}
            <h3 class="entry-title">${esc(e.title)}</h3>
            ${bodyHTML(e.body)}
            ${e.marker ? `<div class="fate-seal">${esc(e.marker)}</div>` : ""}
            ${renderWatch(e.links)}
          </div>
        </article>`;

        // the nav flyout mirrors the timeline at a glance: date + title,
        // clickable straight to the entry, landmarks picked out in gold
        flyoutItems.push({
          id: entryId,
          dateLabel: e.date || e.era || "Undated",
          title: e.title,
          isLandmark,
        });
      });

      html += `</div>`;

      const flyoutHtml = `
      <div class="age-flyout" id="${flyoutId}" role="menu" aria-label="${esc(age.name)} at a glance">
        <div class="fy-panel">
          <div class="fy-header">
            <span class="fy-age">${ROMANS[ai]} &mdash; ${esc(age.name)}</span>
            <span class="fy-range">${esc(age.range)}</span>
          </div>
          <div class="fy-list">
            ${flyoutItems
              .map(
                (it) => `<a href="#${it.id}" class="fy-item${it.isLandmark ? " fy-landmark" : ""}" role="menuitem">
                  <span class="fy-date">${esc(it.dateLabel)}</span>
                  <span class="fy-title">${esc(it.title)}</span>
                </a>`
              )
              .join("")}
          </div>
        </div>
      </div>`;

      nav += `
      <div class="age-nav-item" style="--age-tint:${tint}">
        <a href="#${id}" data-age="${id}" class="age-nav-link"><span class="nav-roman">${ROMANS[ai]}</span><span class="nav-name">${esc(age.name)}</span></a>
        <button class="age-nav-caret" type="button" aria-expanded="false" aria-controls="${flyoutId}" aria-label="Preview ${esc(age.name)} at a glance">
          <span class="caret-chevron" aria-hidden="true"></span>
        </button>
        ${flyoutHtml}
      </div>`;
    });

    root.innerHTML = html;
    navEl.innerHTML = nav;

    // ── flyout open/close: hover works via CSS; the caret makes it
    // reachable by click/tap/keyboard, and pins it open on touch ──
    const navItems = Array.from(navEl.querySelectorAll(".age-nav-item"));
    function closeAllFlyouts(except) {
      navItems.forEach((item) => {
        if (item === except) return;
        item.classList.remove("open", "hover-open");
        item.querySelector(".age-nav-caret")?.setAttribute("aria-expanded", "false");
      });
    }
    // hover-intent grace period: plain CSS :hover drops the instant the
    // cursor leaves the trigger's box, which is an unforgivingly small
    // target once the flyout fans out much wider below it. Holding the
    // open state open for a beat after mouseleave means a slightly
    // wayward path from label to list item doesn't slam the panel shut.
    // hover-intent only exists where hover does: on touch, a tap fires a
    // synthetic mouseenter but never mouseleave, which wedged the flyout
    // open over the page with no way to dismiss it from the panel itself
    if (hoverCapable) {
      navItems.forEach((item) => {
        let closeTimer = null;
        item.addEventListener("mouseenter", () => {
          clearTimeout(closeTimer);
          // only one Age's flyout is ever open at a time — entering this
          // one closes any other still open, whether by hover or by pin
          closeAllFlyouts(item);
          item.classList.add("hover-open");
        });
        item.addEventListener("mouseleave", () => {
          closeTimer = setTimeout(() => item.classList.remove("hover-open"), 300);
        });
      });
    }
    navEl.addEventListener("click", (ev) => {
      const caret = ev.target.closest(".age-nav-caret");
      if (!caret) return;
      ev.preventDefault();
      const item = caret.closest(".age-nav-item");
      const willOpen = !item.classList.contains("open");
      closeAllFlyouts(willOpen ? item : null);
      item.classList.toggle("open", willOpen);
      caret.setAttribute("aria-expanded", String(willOpen));
    });
    // a click on a flyout entry navigates, then tidy up the pinned-open state
    navEl.addEventListener("click", (ev) => {
      if (ev.target.closest(".fy-item")) closeAllFlyouts(null);
    });
    document.addEventListener("click", (ev) => {
      if (!ev.target.closest(".age-nav-item")) closeAllFlyouts(null);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeAllFlyouts(null);
    });
  })();

  /* ── video click-to-play ─────────────────────────────── */
  document.addEventListener("click", (ev) => {
    const card = ev.target.closest(".video-card[data-yt]");
    if (!card) return;
    playVideo(card);
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const card = ev.target.closest(".video-card[data-yt]");
    if (!card) return;
    ev.preventDefault();
    playVideo(card);
  });
  function playVideo(card) {
    const id = card.getAttribute("data-yt");
    if (!id) return;
    card.removeAttribute("data-yt");
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Chronicle video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  /* ── scroll reveals ──────────────────────────────────── */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          revealObs.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  /* ── nav state + progress + anno + spine fill ────────── */
  const nav = document.getElementById("topnav");
  const fill = document.getElementById("progress-fill");
  const scrollProgressEl = document.getElementById("scroll-progress");
  const progressTrack = document.querySelector(".scroll-progress-track");
  const progressMarker = document.getElementById("progress-marker");
  const progressMarkerLabel = document.getElementById("progress-marker-label");
  const progressTicks = document.getElementById("progress-ticks");
  const anno = document.getElementById("anno");
  const annoYear = document.getElementById("anno-year");
  const navLinks = Array.from(document.querySelectorAll(".age-nav-link"));
  const timelines = Array.from(document.querySelectorAll(".timeline"));
  const dividers = Array.from(document.querySelectorAll(".age-divider"));
  const entries = Array.from(document.querySelectorAll(".entry[data-year]"));

  // a short, word-safe lead-in to an entry's body, for tick tooltips
  function leadIn(text, max) {
    if (!text) return "";
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
  }

  // real keep/outpost sieges, curated — open-field battles, patch notes,
  // and community drama (e.g. "Odin's Field", "The Relic Wars") are
  // deliberately excluded even though some share language like "battle"
  const SIEGE_TITLES = new Set([
    "The Siege of Tindrem",
    "The First Siege",
    "The March of the ACT Pickaxe Host",
    "Odinseed Raids MKRG",
    "THE FIRST KEEP FALLS",
    "The Battle of Kranesh Keep",
    "The Battle for Minotaur Mountain",
    "The Battle for Odinpost",
    "The Liberation of Tephra",
    "The Siege of Granum Pass",
    "The Siege of Nightfall",
    "The Battle for Sausage Lake Keep",
    "A Hundred and Fifty Blades",
    "The Siege of Ursa Stronghold",
    "The Siege of the KotO Keep",
    "The War over a Small House",
    "The Lament of the Hollow Sieges",
    "The Small Wars of the New Regions",
    "The Fall of Odinpost",
  ]);
  // battles the chronicle itself puts at 100+ combined participants —
  // read straight from each entry's own body text ("near four hundred
  // souls," "150 against 150," "sixty blades a side," etc). Overlaps
  // heavily with sieges (most of Nave's big fights ARE sieges); the two
  // that stand apart as open-field musters are Meduli and Odin's Field
  const BIG_FIGHT_TITLES = new Set([
    "The Muster at Meduli",
    "The Siege of Tindrem",
    "The March of the ACT Pickaxe Host",
    "The Battle of Kranesh Keep",
    "The Battle for Odinpost",
    "A Hundred and Fifty Blades",
    "The Battle for Odin's Field",
    "The Battle for the Undercroft",
  ]);

  // flat entry list mirrors `entries` 1:1 in document order — used to
  // paint the progress-bar ticks and drive the "nearby entries" popover
  const flatEntries = [];
  const ageStartIdx = []; // index into flatEntries where each age begins
  C.ages.forEach((age, ai) => {
    const tint = AGE_TINTS[ai] || AGE_TINTS[2];
    ageStartIdx.push(flatEntries.length);
    age.entries.forEach((e, ei) => {
      const isLandmark = (e.title.length > 6 && e.title === e.title.toUpperCase()) || !!e.marker;
      const firstVideo = (e.links || []).find((l) => !l.noembed && youtubeId(l.url));
      flatEntries.push({
        id: `entry-${ai}-${ei}`,
        tint,
        title: e.title,
        dateLabel: e.date || e.era || "Undated",
        excerpt: leadIn(e.body, 150),
        thumbId: firstVideo ? youtubeId(firstVideo.url) : null,
        isLandmark,
        year: e.year || null,
        isSiege: SIEGE_TITLES.has(e.title),
        isBigFight: BIG_FIGHT_TITLES.has(e.title),
      });
    });
  });
  // paint the track itself as a banded map of the whole chronicle — a
  // hard-stopped gradient, one low-opacity band per Age — so the bar
  // reads as a real timeline of the site rather than a generic loader
  if (progressTrack && flatEntries.length > 1) {
    const stops = [];
    ageStartIdx.forEach((startI, ai) => {
      const from = (startI / (flatEntries.length - 1)) * 100;
      const to = ai + 1 < ageStartIdx.length ? (ageStartIdx[ai + 1] / (flatEntries.length - 1)) * 100 : 100;
      const band = `color-mix(in srgb, ${AGE_TINTS[ai] || AGE_TINTS[2]} 34%, transparent)`;
      stops.push(`${band} ${from.toFixed(3)}%`, `${band} ${to.toFixed(3)}%`);
    });
    progressTrack.style.background = `linear-gradient(90deg, ${stops.join(", ")})`;
  }
  if (progressTicks && flatEntries.length > 1) {
    progressTicks.innerHTML = flatEntries
      .map((fe, i) => {
        const pct = (i / (flatEntries.length - 1)) * 100;
        const cls = ["sp-tick-hit", fe.isSiege || fe.isBigFight ? "sp-tick-hit-siege" : ""].filter(Boolean).join(" ");
        const edgeCls = i < 3 ? " sp-edge-start" : i > flatEntries.length - 4 ? " sp-edge-end" : "";
        const tagLabel = fe.isSiege ? " (keep siege)" : fe.isBigFight ? " (100+ battle)" : "";
        const dotCls = ["sp-tick", fe.isSiege ? "sp-siege" : fe.isBigFight ? "sp-bigfight" : ""].filter(Boolean).join(" ");
        return `<a href="#${fe.id}" class="${cls}" role="menuitem" data-idx="${i}" style="left:${pct.toFixed(3)}%" aria-label="${esc(fe.dateLabel)}: ${esc(fe.title)}${tagLabel}">
          <span class="${dotCls}" style="--tick-tint:${fe.tint}" aria-hidden="true"></span>
          <span class="sp-tick-tip${fe.isLandmark ? " sp-landmark" : ""}${edgeCls}" role="tooltip">
            ${fe.thumbId ? `<img class="sp-tick-tip-thumb" loading="lazy" src="https://i.ytimg.com/vi/${esc(fe.thumbId)}/mqdefault.jpg" alt="">` : ""}
            <span class="sp-tick-tip-date">${esc(fe.dateLabel)}</span>
            <span class="sp-tick-tip-title">${esc(fe.title)}</span>
            ${fe.excerpt ? `<span class="sp-tick-tip-excerpt">${prose(fe.excerpt)}</span>` : ""}
          </span>
        </a>`;
      })
      .join("");
    // year milestones: a labelled rule at the first entry of each year, so
    // the strip reads as a calendar as well as a map of the Ages. Rendered
    // before the era marks so an era's standard paints over its rule.
    const yearFirst = new Map();
    flatEntries.forEach((fe, i) => {
      if (fe.year && !yearFirst.has(fe.year)) yearFirst.set(fe.year, i);
    });
    progressTicks.innerHTML += Array.from(yearFirst.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([yr, idx]) => {
        const pct = (idx / (flatEntries.length - 1)) * 100;
        // the first and last labels would hang off the bar if centred
        const edge = pct < 2 ? " sp-year-edge-start" : pct > 98 ? " sp-year-edge-end" : "";
        return `<span class="sp-year-mark${edge}" style="left:${pct.toFixed(3)}%" data-year="${yr}" aria-hidden="true"></span>`;
      })
      .join("");

    // era-change markers: a full-height standard at the first entry of every
    // age after the first, tinted to the age it opens and named by its numeral.
    // Three of these fall on the very same entry as a year rule, so the numeral
    // sits low and off to one side while the year label keeps the top.
    progressTicks.innerHTML += ageStartIdx
      .slice(1)
      .map((startI, i) => {
        const pct = (startI / (flatEntries.length - 1)) * 100;
        const ai = i + 1;
        return `<span class="sp-era-mark" style="left:${pct.toFixed(3)}%;--tick-tint:${AGE_TINTS[ai] || AGE_TINTS[2]}" data-roman="${ROMANS[ai]}" aria-hidden="true"></span>`;
      })
      .join("");
    // roving arrow-key navigation — 120 individual tab stops is tedious,
    // so within the tick strip Left/Right/Home/End move focus directly
    progressTicks.addEventListener("keydown", (ev) => {
      const hit = ev.target.closest(".sp-tick-hit");
      if (!hit) return;
      const hits = Array.from(progressTicks.querySelectorAll(".sp-tick-hit"));
      const i = hits.indexOf(hit);
      let next = -1;
      if (ev.key === "ArrowRight") next = Math.min(i + 1, hits.length - 1);
      else if (ev.key === "ArrowLeft") next = Math.max(i - 1, 0);
      else if (ev.key === "Home") next = 0;
      else if (ev.key === "End") next = hits.length - 1;
      if (next >= 0) {
        ev.preventDefault();
        hits[next].focus();
      }
    });
    // on phones the visible ticks overlap their neighbours' hit boxes, so a
    // tap can land on the wrong entry (topmost-in-DOM wins). Retarget every
    // touch tap to whichever tick's CENTER is actually nearest the finger.
    if (!hoverCapable) {
      progressTicks.addEventListener("click", (ev) => {
        const tapped = ev.target.closest(".sp-tick-hit");
        if (!tapped) return;
        const hits = Array.from(progressTicks.querySelectorAll(".sp-tick-hit"))
          .filter((h) => getComputedStyle(h).display !== "none");
        let best = tapped, bestDx = Infinity;
        for (const h of hits) {
          const r = h.getBoundingClientRect();
          const dx = Math.abs(ev.clientX - (r.left + r.width / 2));
          if (dx < bestDx) { bestDx = dx; best = h; }
        }
        if (best !== tapped) {
          ev.preventDefault();
          const id = (best.getAttribute("href") || "").slice(1);
          const el = id && document.getElementById(id);
          if (el) scrollToEl(el, true);
        }
      });
    }
  }

  let currentYear = null;
  let currentMarkerLabel = null;
  let ticking = false;
  // horizontal view: the page still scrolls vertically, but that scroll is
  // re-expressed as a sideways slide of #hz-track (see horizontalView below).
  // Every measurement in onScroll therefore has an x-axis twin.
  let hzMode = false;
  let hzTrack = null;

  // centre an element in the viewport, along whichever axis is in play
  function scrollToEl(el, smooth) {
    const behavior = !smooth || reducedMotion ? "auto" : "smooth";
    if (!hzMode) {
      el.scrollIntoView({ behavior, block: "center" });
      return;
    }
    const r = el.getBoundingClientRect();
    const target = window.scrollY + r.left - (window.innerWidth / 2 - r.width / 2);
    window.scrollTo({ top: Math.max(0, target), behavior });
  }

  // static per-timeline / per-divider lookups, resolved once — the scroll
  // handler must never query the DOM per frame
  const spineFills = timelines.map((tl) => tl.querySelector(".spine-fill"));
  const romanBgs = dividers.map((d) => d.querySelector(".age-roman-bg"));
  const chron = document.getElementById("chronicle");

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // slide first, measure after — the rect reads below must see the
      // track where this frame actually puts it
      if (hzMode && hzTrack) hzTrack.style.transform = `translate3d(${-y}px,0,0)`;

      /* ── read phase: every getBoundingClientRect up front, so the frame
         forces a single layout instead of one per interleaved write ── */
      const cr = chron.getBoundingClientRect();
      const inChron = hzMode
        ? cr.left < vw * 0.5 && cr.right > vw * 0.5
        : cr.top < vh * 0.5 && cr.bottom > vh * 0.5;

      let yr = null;
      let activeIdx = -1;
      if (inChron) {
        for (let i = 0; i < entries.length; i++) {
          const r = entries[i].getBoundingClientRect();
          const passed = hzMode ? r.left < vw * 0.6 : r.top < vh * 0.6;
          if (passed) { yr = entries[i].getAttribute("data-year"); activeIdx = i; }
          else break;
        }
      }

      const tlRects = timelines.map((tl) => tl.getBoundingClientRect());
      const dRects = dividers.map((d) => d.getBoundingClientRect());

      /* ── write phase ── */
      nav.classList.toggle("scrolled", y > 40);
      const pct = max > 0 ? y / max : 0;
      // coarse pointers animate the fill by transform (composite-only);
      // a mobile-scoped CSS rule pre-sizes it to 100% with scaleX(0)
      if (coarsePtr) fill.style.transform = `scaleX(${pct})`;
      else fill.style.width = pct * 100 + "%";
      if (progressMarker) {
        progressMarker.style.left = pct * 100 + "%";
        // a standing "you are here" indicator, not just a hover reveal —
        // visible for as long as the reader is inside the dated chronicle
        progressMarker.classList.toggle("visible", inChron);
      }
      if (progressMarkerLabel) {
        // the label is centered on the marker, which runs off the track's
        // own ends near 0%/100% — pin it inward there instead of letting
        // it hang off the header, the same edge treatment the tick
        // tooltips and year labels already use
        progressMarkerLabel.classList.toggle("sp-edge-start", pct < 0.04);
        progressMarkerLabel.classList.toggle("sp-edge-end", pct > 0.96);
        const label = activeIdx >= 0 ? flatEntries[activeIdx].dateLabel : "";
        if (label !== currentMarkerLabel) {
          currentMarkerLabel = label;
          progressMarkerLabel.textContent = label;
        }
      }
      anno.classList.toggle("visible", inChron);

      if (yr && yr !== currentYear) {
        currentYear = yr;
        annoYear.textContent = yr;
        if (!reducedMotion)
          annoYear.animate(
            [{ opacity: 0.2, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
            { duration: 420, easing: "cubic-bezier(0.19,1,0.22,1)" }
          );
      }

      // spine fill per timeline — the rod fills along its own axis
      for (let i = 0; i < timelines.length; i++) {
        const r = tlRects[i];
        const spineFill = spineFills[i];
        if (!spineFill) continue;
        if (hzMode) {
          const visible = Math.min(Math.max(vw * 0.5 - r.left, 0), r.width);
          spineFill.style.height = "";
          spineFill.style.width = visible + "px";
        } else {
          const visible = Math.min(Math.max(vh * 0.62 - r.top, 0), r.height);
          spineFill.style.width = "";
          spineFill.style.height = visible + "px";
        }
      }

      // active age in nav + era atmosphere
      let active = null;
      for (let i = 0; i < dividers.length; i++) {
        const r = dRects[i];
        const passed = hzMode ? r.left < vw * 0.55 : r.top < vh * 0.55;
        if (passed) active = dividers[i].id;
      }
      navLinks.forEach((a) => a.classList.toggle("active", a.dataset.age === active));
      setEra(active ? parseInt(active.split("-")[1], 10) - 1 : -1);

      // roman numerals swell as their divider crosses the viewport — skipped
      // on coarse pointers, where the swell is imperceptible and the per-frame
      // style writes on five viewport-scale glyphs cost real battery
      if (!reducedMotion && !coarsePtr) {
        for (let i = 0; i < dividers.length; i++) {
          const r = dRects[i];
          const near = hzMode ? r.left : r.top;
          const far = hzMode ? r.right : r.bottom;
          const span = hzMode ? vw : vh;
          const size = hzMode ? r.width : r.height;
          if (far < 0 || near > span) continue;
          const p = Math.min(Math.max((span - near) / (span + size), 0), 1);
          if (romanBgs[i]) romanBgs[i].style.setProperty("--zoom", (0.92 + p * 0.18).toFixed(4));
        }
      }

    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  // deferred: onScroll touches the era/atmosphere module declared below
  setTimeout(onScroll, 0);

  /* ── the horizontal view ─────────────────────────────────
     The chronicle on its side: the rod ruled across mid-screen, entries
     alternating above and below it, the reader travelling left to right.
     Rather than hijack the wheel, the page keeps its ordinary vertical
     scrollbar — #hz-spacer supplies the height, and each frame re-spends
     that scroll distance as a translateX on the rail. Wheel, trackpad,
     scrollbar, spacebar and Home/End all keep working for free.        */
  (function horizontalView() {
    const btn = document.getElementById("hz-toggle");
    const mainEl = document.getElementById("top");
    if (!btn || !mainEl) return;
    const footerEl = document.querySelector("footer");

    const clip = document.createElement("div");
    clip.id = "hz-clip";
    const rail = document.createElement("div");
    rail.id = "hz-rail";
    mainEl.parentNode.insertBefore(clip, mainEl);
    clip.appendChild(rail);
    rail.appendChild(mainEl);
    if (footerEl) rail.appendChild(footerEl);
    hzTrack = rail;

    // touch: horizontal pans on the rail map to scroll distance, so the
    // sideways layout answers the sideways gesture it visually invites.
    // Axis-locked so ordinary vertical scrolling is untouched.
    if (!hoverCapable) {
      let sx = 0, sy = 0, lastX = 0, axis = null;
      clip.addEventListener("touchstart", (e) => {
        sx = lastX = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        axis = null;
      }, { passive: true });
      clip.addEventListener("touchmove", (e) => {
        if (!hzMode) return;
        const x = e.touches[0].clientX, yv = e.touches[0].clientY;
        if (axis === null) {
          const dx = Math.abs(x - sx), dy = Math.abs(yv - sy);
          if (dx < 8 && dy < 8) return;
          axis = dx > dy ? "x" : "y";
        }
        if (axis === "x") {
          window.scrollBy(0, lastX - x);
        }
        lastX = x;
      }, { passive: true });
    }

    const spacer = document.createElement("div");
    spacer.id = "hz-spacer";
    spacer.setAttribute("aria-hidden", "true");
    document.body.appendChild(spacer);

    // paging arrows: a determined reader can cross a whole Age in a couple
    // of clicks instead of nudging one entry at a time
    const PAGE_STEP = 3;
    const pageEntries = Array.from(document.querySelectorAll(".entry"));
    function makeArrow(dir) {
      const a = document.createElement("button");
      a.type = "button";
      a.className = "hz-arrow " + (dir < 0 ? "hz-arrow-prev" : "hz-arrow-next");
      a.setAttribute("aria-label", dir < 0 ? "Jump back several entries" : "Jump forward several entries");
      a.innerHTML = '<span class="hz-arrow-chevron" aria-hidden="true"></span>';
      document.body.appendChild(a);
      return a;
    }
    const prevArrow = makeArrow(-1);
    const nextArrow = makeArrow(1);

    function currentEntryIndex() {
      const mid = window.innerWidth / 2;
      let idx = 0;
      for (let i = 0; i < pageEntries.length; i++) {
        if (pageEntries[i].getBoundingClientRect().left < mid) idx = i;
        else break;
      }
      return idx;
    }
    function updateArrowState() {
      const idx = currentEntryIndex();
      prevArrow.disabled = idx <= 0;
      nextArrow.disabled = idx >= pageEntries.length - 1;
    }
    function page(dir) {
      if (!pageEntries.length) return;
      const idx = currentEntryIndex();
      const target = Math.min(pageEntries.length - 1, Math.max(0, idx + dir * PAGE_STEP));
      const el = pageEntries[target];
      scrollToEl(el, true);
      const node = el.querySelector(".entry-node");
      if (node && !reducedMotion)
        node.animate(
          [
            { boxShadow: "0 0 0 rgba(236,208,150,0)" },
            { boxShadow: "0 0 26px rgba(236,208,150,0.9)" },
            { boxShadow: "0 0 0 rgba(236,208,150,0)" },
          ],
          { duration: 1100, easing: "ease-out", delay: 350 }
        );
      requestAnimationFrame(() => requestAnimationFrame(updateArrowState));
    }
    // on touch the arrows also serve vertical mode (the j/k keys' only
    // equivalent there), stepping entry by entry instead of paging by 3
    prevArrow.addEventListener("click", () => (hzMode ? page(-1) : jumpList(allEntries, -1)));
    nextArrow.addEventListener("click", () => (hzMode ? page(1) : jumpList(allEntries, 1)));
    let arrowTicking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!hzMode || arrowTicking) return;
        arrowTicking = true;
        requestAnimationFrame(() => {
          arrowTicking = false;
          updateArrowState();
        });
      },
      { passive: true }
    );

    function sizeSpacer() {
      if (!hzMode) {
        spacer.style.height = "";
        return;
      }
      // travel = everything past the first screenful; the trailing viewport
      // keeps the last panel reachable at rest
      const travel = Math.max(0, rail.offsetWidth - window.innerWidth);
      spacer.style.height = travel + window.innerHeight + "px";
    }

    function setMode(on) {
      hzMode = on;
      document.body.classList.toggle("hz", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      // the rod fills along one axis or the other; clear the stale one so
      // its inline px value can't fight the incoming mode's CSS
      const axis = on ? "height" : "width";
      document.querySelectorAll(".spine-fill").forEach((f) => {
        f.style[axis] = "";
      });
      if (!on) rail.style.transform = "";
      sizeSpacer();
      window.scrollTo(0, 0);
      onScroll();
      if (on) updateArrowState();
      else { prevArrow.disabled = false; nextArrow.disabled = false; }
      try {
        localStorage.setItem("nave-hz", on ? "1" : "0");
      } catch (e) {}
    }

    btn.addEventListener("click", () => setMode(!hzMode));
    window.addEventListener("resize", sizeSpacer);

    // a fixed rail cannot be reached by a native #anchor jump, so every
    // in-page link becomes a horizontal seek. Capture, to pre-empt the
    // default without disturbing the flyout's own close handlers.
    document.addEventListener(
      "click",
      (ev) => {
        if (!hzMode) return;
        const a = ev.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute("href").slice(1);
        if (!id) return;
        const el = document.getElementById(id);
        if (!el) return;
        ev.preventDefault();
        // #top is the whole rail; centring it would land mid-chronicle
        if (id === "top") window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        else scrollToEl(el, true);
      },
      true
    );

    try {
      if (localStorage.getItem("nave-hz") === "1") setMode(true);
    } catch (e) {}
  })();

  /* ── embers (canvas particles) ───────────────────────── */
  function embers(canvasId, density, interactive) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, parts, running = false, raf = null, resizeTimer = null;
    const pointer = { x: -9999, y: -9999 };
    if (interactive && window.matchMedia("(pointer: fine)").matches) {
      const host = canvas.parentElement;
      host.addEventListener("pointermove", (ev) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = ev.clientX - r.left;
        pointer.y = ev.clientY - r.top;
      });
      host.addEventListener("pointerleave", () => { pointer.x = -9999; pointer.y = -9999; });
    }

    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      const dpr = coarsePtr ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = Math.floor(r.width);
      h = Math.floor(r.height);
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(init) {
      return {
        x: Math.random() * w,
        y: init ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 1.9,
        vy: 0.14 + Math.random() * 0.55,
        vx: (Math.random() - 0.5) * 0.22,
        drift: Math.random() * Math.PI * 2,
        a: 0.08 + Math.random() * 0.5,
        shade: Math.random(),
      };
    }
    function reset() {
      resize();
      const n = Math.min(Math.floor((w * h) / density), 140);
      parts = Array.from({ length: n }, () => spawn(true));
    }
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.drift += 0.012;
        p.x += p.vx + Math.sin(p.drift) * 0.18;
        p.y -= p.vy;
        // embers shy away from the pointer, like sparks from a stirred fire
        const pdx = p.x - pointer.x, pdy = p.y - pointer.y;
        const pd2 = pdx * pdx + pdy * pdy;
        if (pd2 < 16900 && pd2 > 0.01) {
          const pd = Math.sqrt(pd2);
          const push = ((130 - pd) / 130) * 1.35;
          p.x += (pdx / pd) * push;
          p.y += (pdy / pd) * push;
        }
        if (p.y < -12 || p.x < -12 || p.x > w + 12) parts[i] = spawn(false);
        const flicker = 0.75 + Math.sin(p.drift * 3) * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // embers run from smoldering maroon to bright ember-red, never gold
        const red = Math.round(70 + p.shade * 150);
        const green = Math.round(12 + p.shade * 34);
        const blue = Math.round(10 + p.shade * 26);
        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${p.a * flicker})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting && !running) {
          running = true;
          tick();
        } else if (!en.isIntersecting && running) {
          running = false;
          if (raf) cancelAnimationFrame(raf);
        }
      });
    });
    io.observe(canvas);
    // debounced resize that rescales existing particles instead of respawning
    // (mobile URL-bar collapse fires resize mid-scroll)
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const ow = w, oh = h;
        resize();
        if (parts && ow && oh) {
          for (const p of parts) { p.x *= w / ow; p.y *= h / oh; }
        }
      }, 150);
    });
    reset();
  }
  embers("embers", 9000, false);
  embers("embers-end", 14000, false);

  /* ═══════════════════════════════════════════════════════
     IMMERSION SYSTEMS
     ═══════════════════════════════════════════════════════ */
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const hexRGB = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const DEFAULT_TINT = "#c9a86a";

  /* ── era atmosphere: aura crossfade + tinted dust + chrome ── */
  let auraEl = null;
  let currentEra = null;
  const dust = (function () {
    const canvas = document.getElementById("atmosphere");
    if (!canvas || reducedMotion) return { setTint() {} };
    const ctx = canvas.getContext("2d");
    let w, h, parts = [], raf = null;
    const cur = hexRGB(DEFAULT_TINT);
    const target = hexRGB(DEFAULT_TINT);
    function resize() {
      const dpr = coarsePtr ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(init) {
      return {
        x: Math.random() * w,
        y: init ? Math.random() * h : h + 8,
        r: 0.5 + Math.random() * 1.5,
        vy: 0.05 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.12,
        drift: Math.random() * Math.PI * 2,
        a: 0.05 + Math.random() * 0.22,
      };
    }
    function reset() {
      resize();
      parts = Array.from({ length: Math.min(Math.floor((w * h) / (coarsePtr ? 44000 : 22000)), 72) }, () => spawn(true));
    }
    function tick() {
      cur.r += (target.r - cur.r) * 0.02;
      cur.g += (target.g - cur.g) * 0.02;
      cur.b += (target.b - cur.b) * 0.02;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.drift += 0.008;
        p.x += p.vx + Math.sin(p.drift) * 0.12;
        p.y -= p.vy;
        if (p.y < -8 || p.x < -8 || p.x > w + 8) parts[i] = spawn(false);
        const flicker = 0.8 + Math.sin(p.drift * 2.6) * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cur.r | 0},${cur.g | 0},${cur.b | 0},${(p.a * flicker).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    let rt = null;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const ow = w, oh = h;
        resize();
        if (ow && oh) for (const p of parts) { p.x *= w / ow; p.y *= h / oh; }
      }, 150);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf) tick();
    });
    reset();
    tick();
    return {
      setTint(hex) {
        const t = hexRGB(hex);
        target.r = t.r; target.g = t.g; target.b = t.b;
      },
    };
  })();

  function auraCSS(hex) {
    const { r, g, b } = hexRGB(hex);
    return (
      `radial-gradient(ellipse 75% 55% at 50% -10%, rgba(${r},${g},${b},0.10), transparent 65%),` +
      `radial-gradient(ellipse 85% 55% at 50% 110%, rgba(${r},${g},${b},0.08), transparent 65%)`
    );
  }
  function setEra(idx) {
    if (idx === currentEra) return;
    currentEra = idx;
    const tint = idx >= 0 ? AGE_TINTS[idx] || DEFAULT_TINT : DEFAULT_TINT;
    dust.setTint(tint);
    document.documentElement.style.setProperty("--chrome-tint", tint);
    // fresh layer per era so rapid scrolling never repaints a layer mid-fade
    const prev = auraEl;
    const el = document.createElement("div");
    el.className = "aura-layer";
    el.setAttribute("aria-hidden", "true");
    el.style.background = auraCSS(tint);
    document.body.insertBefore(el, document.getElementById("atmosphere"));
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = "1"; }));
    auraEl = el;
    if (prev) {
      prev.style.opacity = "0";
      setTimeout(() => prev.remove(), coarsePtr ? 1000 : 2700);
    }
  }
  setEra(-1);

  /* ── keyboard walking ── */
  function jumpList(list, dir) {
    const mid = (hzMode ? window.innerWidth : window.innerHeight) / 2;
    let targetEl = null;
    const near = (el) => (hzMode ? el.getBoundingClientRect().left : el.getBoundingClientRect().top);
    const far = (el) => (hzMode ? el.getBoundingClientRect().right : el.getBoundingClientRect().bottom);
    if (dir > 0) {
      targetEl = list.find((el) => near(el) > mid + 30);
    } else {
      // previous = last entry that ends before the midline, so the entry
      // currently spanning the center is never re-targeted
      for (const el of list) {
        if (far(el) < mid - 30) targetEl = el;
        else break;
      }
    }
    if (targetEl) {
      scrollToEl(targetEl, true);
      const node = targetEl.querySelector(".entry-node");
      if (node && !reducedMotion)
        node.animate(
          [
            { boxShadow: "0 0 0 rgba(236,208,150,0)" },
            { boxShadow: "0 0 26px rgba(236,208,150,0.9)" },
            { boxShadow: "0 0 0 rgba(236,208,150,0)" },
          ],
          { duration: 1100, easing: "ease-out", delay: 350 }
        );
    }
  }
  const allEntries = Array.from(document.querySelectorAll(".entry"));
  document.addEventListener("keydown", (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t instanceof Element && t.matches("input, textarea, select, [contenteditable]")) return;
    const k = ev.key.toLowerCase();
    if (k === "j" || k === "k") {
      ev.preventDefault();
      jumpList(allEntries, k === "j" ? 1 : -1);
    }
  });

})();
