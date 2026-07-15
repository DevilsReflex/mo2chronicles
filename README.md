# The Chronicle of Nave

An interactive, scroll-driven chronicle of five years of guild history in **Mortal Online 2** (2021–2026) — sieges, betrayals, the sixteen thrones, the Reckoning, and the opening of Sarducaa — set down in the manner of the old chronicles.

Built as a single static page:

- `index.html` — the shell
- `css/style.css` — design system modeled on the mortalonline2.com aesthetic (Marcellus SC / EB Garamond, near-black ground, antique gold)
- `js/data.js` — the full chronicle text and its 154 source links, extracted from the source document
- `js/main.js` — timeline renderer, scroll-driven reveals, ember particles, click-to-play video embeds

## Local preview

Any static server works:

```
npx serve .
```

## Deploy

Deployed to Cloudflare via Wrangler (static assets):

```
npx wrangler deploy
```

---

*An unofficial fan chronicle. Mortal Online 2 is a trademark of Star Vault AB.*
