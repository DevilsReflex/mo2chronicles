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

  /* ── invocation ──────────────────────────────────────── */
  (function renderInvocation() {
    const el = document.getElementById("invocation");
    el.innerHTML = C.invocation
      .map((p, i) => `<p class="reveal" style="--d:${i * 0.08}s">${prose(p)}</p>`)
      .join("");
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

      html += `
      <section class="age-divider" id="${id}" style="--age-tint:${tint};--age-glow:${glow}" aria-label="${esc(age.age)}">
        <div class="age-roman-bg" aria-hidden="true">${ROMANS[ai]}</div>
        <div class="age-inner">
          <p class="age-kicker reveal">${esc(age.age)}</p>
          <h2 class="age-title reveal" style="--d:.1s">${esc(age.name)}</h2>
          <div class="age-ornament reveal" style="--d:.18s" aria-hidden="true"><span class="orn-line"></span><span class="orn-diamond">&#10022;</span><span class="orn-line"></span></div>
          <p class="age-range reveal" style="--d:.26s">${esc(age.range)}</p>
          ${age.temper.map((t, i) => `<p class="age-temper reveal" style="--d:${0.34 + i * 0.1}s">${prose(t)}</p>`).join("")}
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
    navItems.forEach((item) => {
      let closeTimer = null;
      item.addEventListener("mouseenter", () => {
        clearTimeout(closeTimer);
        item.classList.add("hover-open");
      });
      item.addEventListener("mouseleave", () => {
        closeTimer = setTimeout(() => item.classList.remove("hover-open"), 300);
      });
    });
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
    card.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Chronicle video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
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
  const progressMarker = document.getElementById("progress-marker");
  const progressTicks = document.getElementById("progress-ticks");
  const progressPopover = document.getElementById("progress-popover");
  const progressPopoverList = document.getElementById("progress-popover-list");
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

  // flat entry list mirrors `entries` 1:1 in document order — used to
  // paint the progress-bar ticks and drive the "nearby entries" popover
  const flatEntries = [];
  C.ages.forEach((age, ai) => {
    const tint = AGE_TINTS[ai] || AGE_TINTS[2];
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
      });
    });
  });
  if (progressTicks && flatEntries.length > 1) {
    progressTicks.innerHTML = flatEntries
      .map((fe, i) => {
        const pct = (i / (flatEntries.length - 1)) * 100;
        const edgeCls = i < 3 ? " sp-edge-start" : i > flatEntries.length - 4 ? " sp-edge-end" : "";
        return `<a href="#${fe.id}" class="sp-tick-hit" role="menuitem" style="left:${pct.toFixed(3)}%" aria-label="${esc(fe.dateLabel)}: ${esc(fe.title)}">
          <span class="sp-tick${fe.isLandmark ? " sp-landmark" : ""}" style="--tick-tint:${fe.tint}" aria-hidden="true"></span>
          <span class="sp-tick-tip${fe.isLandmark ? " sp-landmark" : ""}${edgeCls}" role="tooltip">
            ${fe.thumbId ? `<img class="sp-tick-tip-thumb" loading="lazy" src="https://i.ytimg.com/vi/${esc(fe.thumbId)}/mqdefault.jpg" alt="">` : ""}
            <span class="sp-tick-tip-date">${esc(fe.dateLabel)}</span>
            <span class="sp-tick-tip-title">${esc(fe.title)}</span>
            ${fe.excerpt ? `<span class="sp-tick-tip-excerpt">${prose(fe.excerpt)}</span>` : ""}
          </span>
        </a>`;
      })
      .join("");
  }

  let activePopoverIdx = -1;
  function updateProgressPopover(idx) {
    if (!progressPopoverList || idx < 0 || idx === activePopoverIdx || !flatEntries[idx]) return;
    activePopoverIdx = idx;
    const start = Math.max(0, idx - 1);
    const end = Math.min(flatEntries.length, idx + 5);
    let html = "";
    for (let i = start; i < end; i++) {
      const it = flatEntries[i];
      const rel = i < idx ? "sp-past" : i === idx ? "sp-current" : "sp-next";
      html += `<a href="#${it.id}" class="fy-item sp-item ${rel}${it.isLandmark ? " fy-landmark" : ""}" role="menuitem">
        <span class="fy-date">${esc(it.dateLabel)}</span>
        <span class="fy-title">${esc(it.title)}</span>
      </a>`;
    }
    progressPopoverList.innerHTML = html;
  }
  updateProgressPopover(0); // seed with the opening entries before any scroll happens

  let currentYear = null;
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;

      nav.classList.toggle("scrolled", y > 40);
      const pct = max > 0 ? y / max : 0;
      fill.style.width = pct * 100 + "%";
      if (progressMarker) progressMarker.style.left = pct * 100 + "%";
      if (progressPopover && scrollProgressEl) {
        const barW = scrollProgressEl.offsetWidth;
        const half = (progressPopover.offsetWidth || 340) / 2 + 8;
        const x = Math.min(Math.max(pct * barW, half), Math.max(barW - half, half));
        progressPopover.style.setProperty("--sp-x", x + "px");
      }

      // anno visibility: only within the chronicle proper
      const chron = document.getElementById("chronicle");
      const cr = chron.getBoundingClientRect();
      const inChron = cr.top < window.innerHeight * 0.5 && cr.bottom > window.innerHeight * 0.5;
      anno.classList.toggle("visible", inChron);

      // current year/entry = last entry whose top is above mid-viewport
      if (inChron) {
        let yr = null;
        let idx = -1;
        for (let i = 0; i < entries.length; i++) {
          const r = entries[i].getBoundingClientRect();
          if (r.top < window.innerHeight * 0.6) { yr = entries[i].getAttribute("data-year"); idx = i; }
          else break;
        }
        updateProgressPopover(idx);
        if (yr && yr !== currentYear) {
          currentYear = yr;
          annoYear.textContent = yr;
          if (!reducedMotion)
            annoYear.animate(
              [{ opacity: 0.2, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
              { duration: 420, easing: "cubic-bezier(0.19,1,0.22,1)" }
            );
        }
      }

      // spine fill per timeline
      for (const tl of timelines) {
        const r = tl.getBoundingClientRect();
        const spineFill = tl.querySelector(".spine-fill");
        const visible = Math.min(Math.max(window.innerHeight * 0.62 - r.top, 0), r.height);
        spineFill.style.height = visible + "px";
      }

      // active age in nav + era atmosphere
      let active = null;
      for (const d of dividers) {
        if (d.getBoundingClientRect().top < window.innerHeight * 0.55) active = d.id;
      }
      navLinks.forEach((a) => a.classList.toggle("active", a.dataset.age === active));
      setEra(active ? parseInt(active.split("-")[1], 10) - 1 : -1);

      // roman numerals swell as their divider crosses the viewport
      if (!reducedMotion) {
        for (const d of dividers) {
          const r = d.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) continue;
          const p = Math.min(Math.max((window.innerHeight - r.top) / (window.innerHeight + r.height), 0), 1);
          const roman = d.querySelector(".age-roman-bg");
          if (roman) roman.style.setProperty("--zoom", (0.92 + p * 0.18).toFixed(4));
        }
      }

    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  // deferred: onScroll touches the era/atmosphere module declared below
  setTimeout(onScroll, 0);

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        gold: Math.random() > 0.35,
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
        ctx.fillStyle = p.gold
          ? `rgba(224, 180, 108, ${p.a * flicker})`
          : `rgba(150, 140, 120, ${p.a * flicker * 0.6})`;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      parts = Array.from({ length: Math.min(Math.floor((w * h) / 22000), 72) }, () => spawn(true));
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
      setTimeout(() => prev.remove(), 2700);
    }
  }
  setEra(-1);

  /* ── keyboard walking ── */
  function jumpList(list, dir) {
    const mid = window.innerHeight / 2;
    let targetEl = null;
    if (dir > 0) {
      targetEl = list.find((el) => el.getBoundingClientRect().top > mid + 30);
    } else {
      // previous = last entry that ends above the midline, so the entry
      // currently spanning the center is never re-targeted
      for (const el of list) {
        const r = el.getBoundingClientRect();
        if (r.bottom < mid - 30) targetEl = el;
        else break;
      }
    }
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
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

  /* ── ambience: wind, deep drone, distant ember-crackle ── */
  (function ambience() {
    const btn = document.getElementById("ambience-toggle");
    let ac = null, master = null, on = false, crackleTimer = null, suspendTimer = null;
    function build() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0;
      master.connect(ac.destination);

      // wind: looped brown noise through a slowly wobbling lowpass
      const len = ac.sampleRate * 4;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.2;
      }
      const wind = ac.createBufferSource();
      wind.buffer = buf;
      wind.loop = true;
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 330;
      lp.Q.value = 0.4;
      const windGain = ac.createGain();
      windGain.gain.value = 0.055;
      wind.connect(lp).connect(windGain).connect(master);
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoAmp = ac.createGain();
      lfoAmp.gain.value = 110;
      lfo.connect(lfoAmp).connect(lp.frequency);
      const lfo2 = ac.createOscillator();
      lfo2.frequency.value = 0.11;
      const lfo2Amp = ac.createGain();
      lfo2Amp.gain.value = 0.02;
      lfo2.connect(lfo2Amp).connect(windGain.gain);
      wind.start();
      lfo.start();
      lfo2.start();

      // drone: two barely-detuned triangles, very low
      const droneGain = ac.createGain();
      droneGain.gain.value = 0.016;
      const dlp = ac.createBiquadFilter();
      dlp.type = "lowpass";
      dlp.frequency.value = 190;
      [55, 55.4].forEach((f) => {
        const o = ac.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        o.connect(dlp);
        o.start();
      });
      dlp.connect(droneGain).connect(master);
    }
    function crackle() {
      if (!on || !ac) return;
      const dur = 0.025 + Math.random() * 0.06;
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1400 + Math.random() * 1400;
      const g = ac.createGain();
      g.gain.value = 0.01 + Math.random() * 0.022;
      src.connect(hp).connect(g).connect(master);
      src.start();
      crackleTimer = setTimeout(crackle, 700 + Math.random() * 2800);
    }
    btn.addEventListener("click", () => {
      on = !on;
      btn.setAttribute("aria-pressed", String(on));
      clearTimeout(suspendTimer);
      if (on) {
        if (!ac) build();
        ac.resume();
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(1.0, ac.currentTime, 0.8);
        crackle();
      } else if (ac) {
        clearTimeout(crackleTimer);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(0, ac.currentTime, 0.4);
        suspendTimer = setTimeout(() => { if (!on && ac) ac.suspend(); }, 1800);
      }
    });
  })();
})();
