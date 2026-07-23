#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   build-seo.js — static pre-render for search engines
   ───────────────────────────────────────────────────────────────
   Run against dist/ AFTER deploy.sh copies the public files. It:
     1. Pre-renders every chronicle entry as plain, semantic HTML into
        the (otherwise empty) #chronicle div, so crawlers and no-JS
        readers get the full text in the initial HTML response. main.js
        replaces #chronicle on load (root.innerHTML = …), so this is
        progressive enhancement, not cloaking — same content both ways.
     2. Injects Organization, CollectionPage/ItemList and FAQPage
        JSON-LD into <head>.
   Edits dist/index.html in place. Runs only on a fresh dist (it looks
   for the empty <div id="chronicle"></div> marker and errors if gone).
   ═══════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");
const DATA = path.join(DIST, "js", "data.js");
const HTML = path.join(DIST, "index.html");
const ORIGIN = "https://mo2chronicles.com";

/* ── editable SEO copy ─────────────────────────────────────────── */
const INTRO_PARAGRAPHS = [
  "The Chronicle of Nave is an unofficial, community-made history of the guild wars of Mortal Online 2 (MO2), the hardcore full-loot sandbox MMORPG built by Star Vault AB. Where the official pages catalog the world's lore and the wikis list its nouns, this chronicle narrates its events: a dated, cross-linked, video-backed timeline of the sieges, betrayals, and campaigns that shaped the world of Nave from 2021 through 2026. Every entry names the guilds involved, sets a date, and links the footage that verifies it.",
  "The saga unfolds on Myrland, the first continent of Nave, across imperial Tindrem, coastal Meduli, Fabernum, Vadda, Bakti, and Morin Khur. It follows the powers that fought to hold them under the game's Territory Control and keep-siege systems — from the empire of the Keepers of the Oath (KotO) and the northern host of Odinseed to Legion, and the great alliances that rose against them: the Anti-Coalition Treaty (ACT), the Coalition, and the Collective. These were wars fought in full-loot PvP, where defeat meant losing everything, and where a single siege could redraw the map.",
  "This is a fan project written in a medieval-chronicle voice, meant as a lasting record of player history rather than a wiki or a strategy guide. It is not affiliated with, sponsored by, or endorsed by Star Vault AB; all guild and place names are used as the community uses them. If you came searching for what actually happened in Mortal Online 2 — who the biggest guilds were, which sieges mattered, and how the balance of power shifted year by year — this chronicle is the connective narrative that the raw videos and reference pages never assembled.",
];

// FAQ pairs — rendered as visible on-page text AND as FAQPage JSON-LD
// (identical, so the structured data matches the page). Fact-checked;
// accurate, concise, non-promotional, and never implying official status.
const FAQS = [
  ["What is Mortal Online 2?", "Mortal Online 2 (MO2) is a hardcore, full-loot sandbox MMORPG developed and published by the Swedish studio Star Vault AB. It launched on Steam on January 25, 2022, and features first-person combat, a skill-based (classless) progression system, and a single shared world where players build, trade, and wage war. It is subscription-based rather than free-to-play."],
  ["What is Nave in Mortal Online 2?", "Nave is the world (planet) in which Mortal Online 2 is set. Its continents include Myrland, the original playable landmass where nearly all guild-war history from 2021 to 2026 takes place, along with Sidoia, Sarducaa, and Nordveld. New players begin on the tutorial realm of Haven before crossing to Myrland."],
  ["What is Myrland?", "Myrland is the first and primary continent of Nave in Mortal Online 2, home to cities such as Tindrem, Meduli, Fabernum, Vadda, Bakti, and Morin Khur. It is the stage for the game's Territory Control conflicts, keep sieges, and guild wars, and is divided into claimable regions that guilds fight to hold."],
  ["Does Mortal Online 2 have classes?", "No. Mortal Online 2 has no classes; your character is defined by the skills you train and by the race and clade you choose at creation. There are 4 clades (Human, Alvarin, Oghmir, and Hybrid) and 10 races: Tindremene, Kallard, Khurite, Sarducaan, Sidoian, Sheevra, Veela, Blainn, Huergar, and Thursar (the Thursar being the single race of the Hybrid clade)."],
  ["How does Territory Control and siege warfare work in Mortal Online 2?", "Territory Control is a guild-versus-guild land system added on August 15, 2023, that lets guilds claim and defend regions and structures across Myrland. Guilds capture keeps and outposts through scheduled sieges, and the 2025 Reckoning update reorganized the map into a few dozen claimable regions (announced as roughly 31) with outpost siege points. Combat is full-loot, so defeated players drop their gear."],
  ["What happens when you die in Mortal Online 2?", "Mortal Online 2 uses a full-loot PvP system: when you are killed, other players can take everything you were carrying. Death carries real consequences to your gear and progress, which is why the game is considered hardcore and unforgiving, and why it is widely regarded as having a steep, time-intensive road to becoming competitive in PvP."],
  ["Is Mortal Online 2 free to play?", "No. Mortal Online 2 is subscription-based, costing around $14 per month, with discounts for buying multiple months at a time. Buying the game includes an initial 30-day period of free access, but ongoing play requires an active subscription. It is not free-to-play, which is a common misconception."],
  ["Is Mortal Online 2 worth playing?", "That depends on your taste for hardcore, high-risk sandbox MMOs. Mortal Online 2 offers deep full-loot PvP, player-driven politics, and large-scale sieges, but it has a steep learning curve, a grind-heavy progression, a paid subscription, and a relatively small player base. Players who enjoy meaningful risk and territorial warfare tend to value it most."],
  ["Is Mortal Online 2 dead?", "Mortal Online 2 is a live, actively updated game with an ongoing development roadmap, including the 2025 Reckoning update and the upcoming Sarducaa continent. Its concurrent player counts are modest and have declined from their January 2022 launch peak, so it is niche rather than mainstream, but it continues to receive content and host active guild conflicts."],
  ["Who are the major guilds in Mortal Online 2's history?", "The chronicle documents many of the empires and alliances that shaped the war, including Keepers of the Oath (KotO), Odinseed, Legion, and alliance blocs such as the Anti-Coalition Treaty (ACT), the Coalition, and the Collective. Dozens of other guilds appear across the timeline as they rose, allied, betrayed one another, and fell."],
  ["What was the biggest battle in Mortal Online 2?", "Some of the largest recorded engagements pitted massed alliances against the empire of Keepers of the Oath, with community footage of battles such as ACT versus KotO and the Siege of Tindrem circulating widely, some claiming hundreds of participants. Exact head counts vary by source, so the chronicle names each battle, dates it, and links the surviving video evidence."],
  ["What is the Tindremic Empire?", "The Tindremic Empire is the dominant human civilization in Mortal Online 2's lore, centered on the great southern capital of Tindrem on Myrland. Its people, the Tindremene, are one of the game's core human races, and its cities and guarded towns anchor much of the world's geography and political backdrop."],
  ["Who made Mortal Online 2 and when did it release?", "Mortal Online 2 was developed and published by Star Vault AB, a Swedish studio based in Malmö and led by Henrik Nystrom. It is the successor to the 2010 title Mortal Online and released on Steam on January 25, 2022, built on Epic's Unreal Engine."],
  ["What is The Chronicle of Nave?", "The Chronicle of Nave is an unofficial, fan-made history of Mortal Online 2's guild wars from 2021 to 2026, written in an epic medieval-chronicle voice. It presents dated, video-backed entries covering named sieges, guild rivalries, betrayals, and shifts in Territory Control. It is a community project and is not affiliated with or endorsed by Star Vault."],
];
/* ──────────────────────────────────────────────────────────────── */

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadChronicle() {
  const raw = fs.readFileSync(DATA, "utf8");
  const window = {};
  // eslint-disable-next-line no-eval
  eval(raw);
  if (!window.CHRONICLE) throw new Error("build-seo: window.CHRONICLE not found in " + DATA);
  return window.CHRONICLE;
}

function prerenderChronicle(C) {
  let out = "";

  // About / intro — keyword-rich crawlable body copy
  out += '<section class="seo-about">\n';
  out += "  <h2>About the Chronicle of Nave</h2>\n";
  for (const p of INTRO_PARAGRAPHS) out += "  <p>" + esc(p) + "</p>\n";
  out += "</section>\n";

  // FAQ — rendered as real, visible text so the FAQPage JSON-LD matches
  // the on-page content (Google requires FAQ markup to reflect the page)
  out += '<section class="seo-faq">\n';
  out += "  <h2>Frequently asked questions about Mortal Online 2</h2>\n";
  for (const [q, a] of FAQS) {
    out += "  <h3>" + esc(q) + "</h3>\n";
    out += "  <p>" + esc(a) + "</p>\n";
  }
  out += "</section>\n";

  // "How to read" and any other prose sections
  for (const s of C.sections || []) {
    out += '<section class="seo-section">\n';
    if (s.heading) out += "  <h2>" + esc(s.heading) + "</h2>\n";
    for (const p of s.paragraphs || []) out += "  <p>" + esc(p) + "</p>\n";
    out += "</section>\n";
  }

  // The chronicle proper: an Age per section, entries as articles. Entry
  // ids match main.js's runtime ids so the ItemList anchors resolve even
  // before hydration; main.js replaces #chronicle wholesale, so there is
  // never a duplicate id at any observable moment.
  C.ages.forEach((age, ai) => {
    out += '<section class="seo-age">\n';
    out += "  <h2>" + esc(age.age) + " — " + esc(age.name) + "</h2>\n";
    if (age.range) out += '  <p class="seo-age-range">' + esc(age.range) + "</p>\n";
    for (const t of age.temper || []) out += "  <p>" + esc(t) + "</p>\n";

    age.entries.forEach((e, ei) => {
      out += '  <article id="entry-' + ai + "-" + ei + '">\n';
      out += "    <h3>" + esc(e.title) + "</h3>\n";
      if (e.date) out += '    <p class="seo-date">' + esc(e.date) + "</p>\n";
      if (e.body) out += "    <p>" + esc(e.body) + "</p>\n";
      if (e.marker) out += "    <p><strong>" + esc(e.marker) + "</strong></p>\n";
      const links = (e.links || []).filter((l) => l && l.url);
      if (links.length) {
        out += '    <ul class="seo-sources">\n';
        for (const l of links) {
          const label = [l.text, l.source].filter(Boolean).map(esc).join(" — ");
          out += '      <li><a href="' + esc(l.url) + '" rel="noopener">' + label + "</a></li>\n";
        }
        out += "    </ul>\n";
      }
      out += "  </article>\n";
    });
    out += "</section>\n";
  });

  return out;
}

function jsonLd(C) {
  const blocks = [];

  blocks.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORIGIN + "/#chronicle-of-nave",
    name: "The Chronicle of Nave",
    url: ORIGIN + "/",
    logo: ORIGIN + "/assets/icon-512.png",
    description: "An unofficial, fan-made community chronicle of the guild wars of Mortal Online 2. Not affiliated with Star Vault AB.",
  });

  const entries = [];
  C.ages.forEach((age, ai) => {
    age.entries.forEach((e, ei) => {
      entries.push({
        "@type": "ListItem",
        position: entries.length + 1,
        name: e.title + (e.date ? " (" + e.date + ")" : ""),
        url: ORIGIN + "/#entry-" + ai + "-" + ei,
      });
    });
  });
  blocks.push({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Chronicle of Nave — a history of Mortal Online 2",
    url: ORIGIN + "/",
    about: {
      "@type": "VideoGame",
      name: "Mortal Online 2",
      publisher: { "@type": "Organization", name: "Star Vault AB" },
    },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: entries.length,
      itemListElement: entries,
    },
  });

  blocks.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  });

  return blocks
    .map((b) => '<script type="application/ld+json">\n' + JSON.stringify(b, null, 2) + "\n</script>")
    .join("\n");
}

function main() {
  const C = loadChronicle();
  let html = fs.readFileSync(HTML, "utf8");

  const MARKER = '<div id="chronicle"></div>';
  if (!html.includes(MARKER)) {
    throw new Error("build-seo: expected empty '" + MARKER + "' in dist/index.html (already built or template changed?)");
  }
  const prerendered = prerenderChronicle(C);
  html = html.replace(MARKER, '<div id="chronicle">\n' + prerendered + "</div>");

  const ld = jsonLd(C);
  if (!html.includes("</head>")) throw new Error("build-seo: no </head> in dist/index.html");
  html = html.replace("</head>", ld + "\n</head>");

  fs.writeFileSync(HTML, html);

  const entryCount = C.ages.reduce((n, a) => n + a.entries.length, 0);
  console.log("build-seo: pre-rendered " + entryCount + " entries + intro into dist/index.html");
  console.log("build-seo: injected Organization + CollectionPage(" + entryCount + " items) + FAQPage(" + FAQS.length + " Q&A) JSON-LD");
}

main();
