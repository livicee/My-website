# Developer setup

Livi's everyday GitHub editing workflow starts in [README.md](README.md), with detailed content instructions in [src/content/README.md](src/content/README.md). Local tools are only needed for development and optional previews.

## Setup and checks

Use Node.js 22.12 or later within version 22 (`.nvmrc`) to match the GitHub Actions runtime. Vite 7 does not support older Node 22 releases. The only dependencies are `typescript` and `vite`, both from the public npm registry. There are no secrets, `.env` files or machine-specific paths.

```powershell
git clone https://github.com/<username>/<repository>.git
cd <repository>
npm ci
npm run build
npm run dev
```

A fresh clone was installed and built this way with Node 22.23.3 on 12 October 2026: content validation, both type checks, the full `npm test` suite and the Vite build all passed. Newer npm versions (11.x) print an `allow-scripts` warning about esbuild's postinstall; the build still succeeds, and Node 22's bundled npm 10 does not print it.

Development preview: http://127.0.0.1:5193/ . The public site uses relative assets and hash routes for GitHub Pages hosting.

`npm run build` runs content validation, both TypeScript checks and the remaining automated tests, then builds the public site. `npm run check` runs the checks without generating production output. `npm run validate:content` reports JSON syntax, shape, ID, reference and attachment errors with filenames and fields. Its CLI is read-only; it does not repair or save content.

For a production preview after building:

```powershell
npm run preview -- --host 127.0.0.1 --port 5194 --strictPort
```

Open http://127.0.0.1:5194/ . Local previews do not publish anything.

## Browser fixtures

`npm test` includes pure public-site contracts, real content/schema/rendering checks, evidence previews, content validation and CLI failure/recovery cases, and fixture-runner exit/cleanup checks. The contract tests' frozen sample data is independent of the editable JSON, so replacing sample content does not require keeping its titles or record counts.

For the eight browser fixture pages, start `npm run dev`, then run `npm run fixtures`. Playwright is intentionally an external development tool; set `PLAYWRIGHT` to its installed package folder if it is not resolvable locally. Set `BASE` when using a different server port. `tests/fixtures.mjs` accepts browser names such as `chromium`, `webkit` and `firefox`. The browser fixtures are optional and not part of `npm run build` or CI.

Known fixture state (12 October 2026, Chromium, WebKit and Firefox): regression, identity, failure-fallback and playback fixtures pass. Seven `tests/proof.html` checks fail in every engine ("settles to an idle glyph field", "no continuous loop" and similar). They expect the portrait to be idle within 300ms, but the shipped design runs a 9-second ambient glyph burst after each mount (`AMBIENT_BURST_MS` in `src/workspace/identity.ts`). The fixture predates that behaviour; the site is not broken. In WebKit and Firefox, `refinement.html` also reports "User scrolling cancels the veil". Firefox cancels the veil about 80ms after a scroll, just past the fixture's 60ms wait. WebKit cancels it after about 350ms, close to the veil's natural 560ms end. These are recorded, not fixed.

## Search and link previews

The site's public address lives in one place: `siteUrl` in `src/content/site.json`. It holds the placeholder `https://livi-cracknell.github.io/` until it is set to the real address during setup (see [HANDOVER.md](HANDOVER.md#address-search-and-link-previews)). At build, `vite.config.ts` fills it into `index.html` (canonical link, Open Graph and Twitter link-preview tags), fills `searchTitle` and `searchDescription` into the page title, meta description and Open Graph title and description, and generates `robots.txt`, `sitemap.xml` and a schema.org Person record, plus a no-JavaScript fallback, from `site.json`. Moving the site means changing that one field. `robots.txt` is only read from the root of a domain, so it takes effect on a user site such as `livi-cracknell.github.io` or a custom domain, not on a `/repository/` project address.

## Repository layout

- `src/content/`: seven canonical JSON files, schema and uploaded media.
- `src/workspace/`: public shell, routes, collections, evidence and audio.
- `src/ascii/`: live glyph renderer and original portrait assets.
- `scripts/check-content.mjs`, `scripts/content-validation.mjs`: build-time content checks.
- `public/`: copied unchanged to the site root: home-screen icons, the web manifest and the 1200×630 link-preview image (`og-image.png`).
- `.github/workflows/`: existing **Build and deploy** workflow; pushes to `main` publish only after a successful build.
- `docs/`: renderer notes (`ASCII-RENDERER.md`) and the content review (`CONTENT-REVIEW.md`).
- `assets-source/`: font sources and the portrait artwork provenance.

The local editor, launcher and content write/upload endpoints have been retired. Vite serves the public site and development fixtures. Old `.studio/` backups remain ignored by Git and must stay local; nothing in the build reads them. GitHub commit history is the recovery source for future content updates.
