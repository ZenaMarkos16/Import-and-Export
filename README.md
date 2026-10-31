# Zena Export Import

A responsive, animated company website inspired by the supplied `Inspiration/` assets. Built with semantic HTML, CSS, vanilla JavaScript, and a dependency-free Node.js backend. The original inspiration files and official logos are preserved.

## Run locally in VS Code

Install **Node.js 22 or newer**, then open a terminal in this folder:

```sh
npm ci
npm start
```

Open `http://localhost:3000` in your computer’s browser. For server auto-reload during development, use `npm run dev` and refresh the browser after frontend changes. Stop with Ctrl+C.

To download future GitHub changes, commit or stash your local work, then run:

```sh
git pull origin main
npm ci
npm start
```

## Verify

```sh
npm run check
npm test
```

The integration tests start a temporary server and exercise static assets, inquiry persistence, validation, privacy boundaries, and submission limits. Test inquiries use a temporary directory removed afterward.

## Project structure

- `public/index.html`: company sections, accessible navigation, inquiry form, privacy dialog.
- `public/styles.css`: responsive layouts, original cargo/product illustrations, animation, reduced-motion support.
- `public/app.js`: menu, service accordions, scroll reveals, inquiry submission.
- `public/assets/`: unchanged supplied logo variants and original SVG illustrations.
- `server.js`: static serving and inquiry API.
- `tests/`: backend integration tests.
- `Inspiration/`: all supplied references; development references, not publicly served.

## Inquiry handling

`POST /api/inquiries` validates and records inquiries in `.data/inquiries.jsonl`. Data is outside the public directory and ignored by Git. A successful response returns a reference number. **No automatic email is sent.** An authorized server operator can review the private records directly. Do not commit or publish inquiry data. The site states this behavior clearly and collects consent.

The local record is functional for development. Before collecting real inquiries, set up a persistent private volume, backups, access controls and an approved retention policy. A single-process, in-memory limit allows ten submissions per client address per hour; use an infrastructure-level limit for production behind a proxy or multiple instances.

Optional runtime variables:

- `PORT`: default `3000`.
- `DATA_DIR`: private writable directory for inquiry records (default `.data/` next to `server.js`).
- `SITE_ORIGIN`: exact public origin, such as `https://your-domain.example`, for a trusted reverse-proxy deployment. Never configure a wildcard. Keep HTTPS enabled at the proxy.

Use a Node-capable host; GitHub Pages alone cannot run the inquiry API. No credentials or paid services are required for local use.

## Content awaiting company confirmation

The repository did not provide official email, phone, address, product catalogue, active destinations, certifications, partners, or business history. These facts are intentionally not invented. Product cards invite specific sourcing/import/export inquiries; the world map is explicitly illustrative. Before public launch, confirm official company content, privacy policy, contact channels, product availability, and inquiry notification/handling arrangements.

## Reference translation

- Floating header image and navigation video → compact floating navigation with an animated active state and mobile menu.
- Hero reference → oversized two-line title and layered container illustration using the actual logo.
- List image → a coordinated three-column product-inquiry composition.
- Services video → oversized typography, charcoal service section, interactive rows, and purposeful reveal motion.
- Map image → restrained world-map presentation without fictional offices.
- Additional layout image → spacious alternating editorial layouts and a trust-focused section.
- Footer image → layered rounded section transition and a dedicated dark branded footer.

All three logo variants were reviewed; the full orange wordmark is used on light backgrounds and the cream variant on dark backgrounds. Logo colors and proportions remain unchanged. Illustrations are original; no third-party photography or tracking is loaded.
