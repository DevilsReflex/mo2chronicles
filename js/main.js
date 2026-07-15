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

  // typographic dress-up: keep quotes as-is, wrap "quoted speech" in em for tone
  const dress = (s) => esc(s).replace(/[“”]([^“”]{2,220})[“”]|"([^"]{2,220})"/g, (m, a, b) => `<em>“${a || b}”</em>`);

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
      .map((p, i) => `<p class="reveal" style="--d:${i * 0.08}s">${dress(p)}</p>`)
      .join("");
  })();

  /* ── prefaces ────────────────────────────────────────── */
  (function renderPrefaces() {
    const el = document.getElementById("prefaces");
    el.innerHTML = C.sections
      .map((sec) => {
        const paras = sec.paragraphs
          .map((p, i) => {
            // highlight the ✦-thread explainer as a callout
            if (p.indexOf("✦") !== -1 || /marked wherever it appears/.test(p)) {
              return `<div class="thread-callout reveal" style="--d:${i * 0.05}s"><p>${dress(p)}</p></div>`;
            }
            return `<p class="reveal" style="--d:${i * 0.05}s">${dress(p)}</p>`;
          })
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
  function renderWatch(links, tint) {
    if (!links || !links.length) return "";
    const vids = [];
    const scrolls = [];
    links.forEach((l) => {
      const id = youtubeId(l.url);
      if (id) vids.push({ ...l, id });
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
              <span class="vc-title">${esc(v.text)}</span>
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
          <span class="ls-icon" aria-hidden="true">&#128220;</span>
          <span><span class="ls-text">${esc(l.text)}</span><span class="ls-source">${esc(sourceLabel(l))}</span></span>
          <span class="ls-arrow" aria-hidden="true">&#8599;</span>
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
      nav += `<a href="#${id}" data-age="${id}"><span class="nav-roman">${ROMANS[ai]}</span><span class="nav-name">${esc(age.name)}</span></a>`;

      html += `
      <section class="age-divider" id="${id}" style="--age-tint:${tint};--age-glow:${glow}" aria-label="${esc(age.age)}">
        <div class="age-roman-bg" aria-hidden="true">${ROMANS[ai]}</div>
        <div class="age-inner">
          <p class="age-kicker reveal">${esc(age.age)}</p>
          <h2 class="age-title reveal" style="--d:.1s">${esc(age.name)}</h2>
          <p class="age-range reveal" style="--d:.2s">${esc(age.range)}</p>
          ${age.temper.map((t, i) => `<p class="age-temper reveal" style="--d:${0.3 + i * 0.1}s">${dress(t)}</p>`).join("")}
        </div>
      </section>
      <div class="timeline" style="--age-tint:${tint}" data-age="${id}">
        <div class="spine" aria-hidden="true"><div class="spine-fill"></div></div>`;

      age.entries.forEach((e) => {
        const isTale = e.kind === "tale";
        const cls = ["entry", "reveal", isTale ? "tale" : "", e.odinseed ? "odinseed" : ""].filter(Boolean).join(" ");
        const dateLine = e.date
          ? `<div class="entry-date">${esc(e.date)}${e.odinseed ? `<span class="thread-tag">&#10022; The thread of Odinseed</span>` : ""}</div>`
          : `<div class="tale-kicker">From the margins of the chronicle${e.era ? ` &mdash; ${esc(e.era)}` : ""}${e.odinseed ? ` &nbsp;&#10022;` : ""}</div>`;
        html += `
        <article class="${cls}" data-year="${e.year}">
          <span class="entry-node" aria-hidden="true">${e.odinseed ? '<span class="node-star">&#10022;</span>' : ""}</span>
          <div class="entry-card">
            ${dateLine}
            <h3 class="entry-title">${esc(e.title)}</h3>
            <p class="entry-body">${dress(e.body)}</p>
            ${e.marker ? `<div class="fate-seal">${esc(e.marker)}</div>` : ""}
            ${renderWatch(e.links, tint)}
          </div>
        </article>`;
      });

      html += `</div>`;
    });

    root.innerHTML = html;
    navEl.innerHTML = nav;
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
  const anno = document.getElementById("anno");
  const annoYear = document.getElementById("anno-year");
  const navLinks = Array.from(document.querySelectorAll(".age-nav a"));
  const timelines = Array.from(document.querySelectorAll(".timeline"));
  const dividers = Array.from(document.querySelectorAll(".age-divider"));
  const entries = Array.from(document.querySelectorAll(".entry[data-year]"));

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
      fill.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

      // anno visibility: only within the chronicle proper
      const chron = document.getElementById("chronicle");
      const cr = chron.getBoundingClientRect();
      const inChron = cr.top < window.innerHeight * 0.5 && cr.bottom > window.innerHeight * 0.5;
      anno.classList.toggle("visible", inChron);

      // current year = last entry whose top is above mid-viewport
      if (inChron) {
        let yr = null;
        for (const e of entries) {
          const r = e.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.6) yr = e.getAttribute("data-year");
          else break;
        }
        if (yr && yr !== currentYear) {
          currentYear = yr;
          annoYear.textContent = yr;
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

      // active age in nav
      let active = null;
      for (const d of dividers) {
        if (d.getBoundingClientRect().top < window.innerHeight * 0.55) active = d.id;
      }
      navLinks.forEach((a) => a.classList.toggle("active", a.dataset.age === active));
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ── embers (canvas particles) ───────────────────────── */
  function embers(canvasId, density) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, parts, running = false, raf = null;

    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = Math.floor(r.width);
      h = canvas.height = Math.floor(r.height);
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
    window.addEventListener("resize", reset);
    reset();
  }
  embers("embers", 9000);
  embers("embers-end", 14000);
})();
