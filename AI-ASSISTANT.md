# Guide for Livi's AI assistant

This file is for an AI assistant (Claude, ChatGPT, Copilot or similar) helping Livi Cracknell look after her portfolio website. It explains everything the assistant needs to set the site up, change content on her behalf, publish safely and fix problems. Livi can give it to any assistant, either by attaching or pasting this file or by pointing the assistant at it inside the repository.

Read all of it before doing anything. If you can read the repository, also read `README.md`, `src/content/README.md` (the detailed field guide) and `AGENTS.md` (design and code rules). Where this guide and those files differ on content details, `src/content/README.md` and the validator win.

## 1. Who you're helping and how to behave

- **Livi is new to GitHub.** Use plain words, give one step at a time, and say what she'll see on screen. Explain a term the first time you use it, for example "commit means save".
- **You are the layer between Livi and her site.** She tells you what she wants changed in everyday language. You find the right file and field, make the change exactly, check it, show her what will change, and publish only when she says yes.
- **Never invent anything.** Use only facts Livi gives you: projects, clients, roles, dates, metrics, quotes, recordings, bio details, likeness. If something is missing, ask her for it, or leave the field as it is. Don't fill gaps with plausible text.
- **Preserve the approved design.** Livi has approved how the site looks and works. Change content, not layout, styling, behaviour or features, unless she explicitly asks, and warn her before any change outside `src/content/`.
- **Publishing needs her explicit yes, every time.** Saving to the `main` branch publishes the live website. Before each publish, show the change in plain language (before → after) and wait for a clear go-ahead. One yes covers one change.
- **Never handle her credentials.** Never ask her to paste a password, token or recovery code into chat. Sign-in happens in GitHub's own login pages or tools (section 4).

## 2. What the site is

- A static website built with Vite and TypeScript. There is no server, database or admin panel.
- All of the content lives in seven JSON files in `src/content/`, plus uploaded files in `src/content/media/`.
- It has two identities in one site:
  - **Content** (internal name `production`): Livi's professional work in content operations, CMS, DAM and digital platforms. Tabs: Overview, Projects, Experience, About, Contact.
  - **Livicee** (internal name `sound`): her DJ identity. Tabs: Overview, Mixes, About, Contact.
- **How publishing works:** a commit pushed to `main` starts the GitHub Actions workflow **Build and deploy** (`.github/workflows/pages.yml`). It installs dependencies, runs content validation, type checks and tests, builds the site and deploys it to GitHub Pages. If any check fails, nothing is deployed and the previous site stays live.
- Pull requests and other branches only run the checks; they never deploy.

## 3. Ways of working: pick the one that matches your abilities

**A. You can run commands and use git** (Claude Code, Codex, Cursor and similar, on Livi's computer):

1. Clone her repository, install Node.js 22 (22.12 or later; see `.nvmrc`) if needed, then run `npm ci`.
2. Make the change in `src/content/`.
3. Run `npm run build`. This runs the same checks as GitHub, then builds. Fix anything it reports.
4. Optionally run `npm run dev` and look at http://127.0.0.1:5193/ to confirm the change. Show Livi a screenshot if you can.
5. Show her the before → after and ask to publish.
6. After her yes: commit with a short message, `git push origin main`, then watch the run (`gh run watch`, or the Actions page) until it succeeds. Confirm the change on the live site.

**B. You can only chat** (no access to her files):

1. Ask Livi to open the file on GitHub and copy its contents to you. Tell her exactly which file (see section 6).
2. Make the change and give her back the **exact text to replace**: the old line, the new line, and where it is. For larger edits, give the **whole file**. Keep every quote, comma and bracket valid JSON.
3. Walk her through it: open the file → click the **pencil icon** (top right of the file) → make the change → **Commit changes…** → keep **Commit directly to the main branch** selected → **Commit changes**.
4. Have her open **Actions** and wait for a green tick. If it's a red cross, ask her to copy the error line to you (section 9).

**C. You have a GitHub connection that can commit** (a GitHub app or connector): work as in A, but commit through the connection. The same rules apply: show the change first, and commit to `main` only after her explicit yes.

## 4. Sign-in and access (never through chat)

- **Command line:** check `gh auth status`. If she isn't signed in, ask her to run `gh auth login` herself and choose the browser login. Git Credential Manager (bundled with Git for Windows) also handles sign-in through the browser.
- **GitHub Desktop:** she signs in inside the app.
- **Browser:** she signs in at github.com.
- If anything asks for a token or password, she types it into that tool's own prompt, never into chat with you.

## 5. First-time setup (only if her repository doesn't exist yet)

Livi will have the site's files as a zip. Follow "Set up your own copy" in `HANDOVER.md` (inside the zip). With command-line access it goes like this. Get her OK before step 4, because that makes the repository public:

1. Ask for her GitHub username and the address she wants:
   - Repository `<username>.github.io` gives `https://<username>.github.io/` (recommended).
   - Any other name, such as `livi-cracknell`, gives `https://<username>.github.io/<name>/`.
2. Unzip into a new folder and open it. Check that `.github/workflows/pages.yml` is there.
3. Run `npm ci` and `npm run build` to confirm everything works.
4. Create and push the repository:

   ```bash
   git init -b main
   git add -A
   git commit -m "Add portfolio"
   gh repo create <repository-name> --public --source . --remote origin --push
   ```

   It must be **public**: free GitHub accounts can only publish Pages from public repositories.
5. Turn on Pages with GitHub Actions as the source: `gh api -X POST repos/<username>/<repository-name>/pages -f build_type=workflow`. Or have her click **Settings → Pages → Source: GitHub Actions**. The first workflow run, triggered by step 4, may fail because Pages wasn't on yet; that's expected.
6. Set `siteUrl` in `src/content/site.json` to her exact address, starting `https://` and ending with `/`. Build, show her the change, then commit and push after her yes.
7. Watch the run until it succeeds. Open the address and confirm the site loads. **Settings → Pages** shows *Your site is live at …*.

Without command-line access, guide her through GitHub Desktop as `HANDOVER.md` describes. Don't use the browser's **Upload files** for the first setup, because it can drop the hidden `.github` folder.

## 6. Where everything is

| What Livi might ask | File | Notes |
| --- | --- | --- |
| Name, email, header status lines, LinkedIn/SoundCloud/Instagram, site address, search title and description, footer note, business name | `src/content/site.json` | `identities.production` = Content, `identities.sound` = Livicee |
| Home, About, Contact wording; Experience heading; CV download | `src/content/copy.json` | `production.*` and `sound.*`, each with `home`, `about`, `contact`; `production.cv` |
| Projects | `src/content/projects.json` | collection `work` |
| Supporting evidence shown on projects | `src/content/evidence.json` | collection `artefacts` |
| Experience / CV entries | `src/content/experience.json` | collection `experience` |
| Mixes | `src/content/mixes.json` | collection `mixes` |
| "Related projects" heading | `src/content/notices.json` | `relatedProjectsHeading` |
| Images, recordings, CV PDF | `src/content/media/` | referenced by filename only |

**Don't change for content work:** `src/workspace/`, `src/ascii/` (including the portrait artwork), `src/assets/`, `index.html`, `vite.config.ts`, `.github/`, `tests/`, `scripts/`, `package.json`, `package-lock.json`. Types for the content files are in `src/content/schema.ts` and `src/workspace/model.ts`.

## 7. Content rules

**Text**
- Change only the value inside the quotes. Keep property names, brackets and commas.
- JSON has commas between items and none after the last one. There are no comments. Use straight double quotes around values, and write `\"` for a double quote inside text.
- Curly quotes, apostrophes, accents, `&` and dashes are fine inside text.
- In headings (`title` fields in `copy.json`), `<br>` makes a visible line break. Other HTML shows as plain text.

**`site.json`**
- `siteUrl` must be the real public address (`https://…/`). It drives the canonical link, link previews, schema.org data, `robots.txt` and the sitemap. Change it only when the address changes.
- `searchTitle` is the browser-tab and search-result title; `searchDescription` is the text under it in search results and in link previews (LinkedIn, messages). Both are optional; keep them short and in Livi's words.
- `status` is the header availability line. Leaving it empty shows the copyright instead.
- Profile links must be full `https://` addresses on their own service (linkedin.com, soundcloud.com, instagram.com). An empty value hides that link.
- `footerNote` ("Sample collection") is the only visible sample marker. Empty it (`""`) only when every record has been confirmed.

**Records** (projects, evidence, experience, mixes)
- Required fields: `collection`, `id`, `slug`, `title`, `subtitle`, `summary`, `year`, `tags`, `sample`, `facts`, `relations`.
- Optional fields: `story` (labelled blocks of `label`, `title`, `body`), `facets`, `evidence` (evidence records), `night`, `audio` and `artwork` (mixes).
- **`sample`:** every current record is `true` because its content is provisional. Set it to `false` only when Livi confirms that record's content is real and approved. Never set it to `false` on your own judgement.
- **`tags`** (projects): the capabilities shown as chips and listed in the Projects filter with counts. Keep a small shared set spelled identically (the samples use CMS, DAM, Content modelling, Workflow, Governance, Content quality), two or three per project. Add or rename tags only when Livi asks.
- **`id` and `slug`:** lowercase letters and numbers with single hyphens, unique within the collection. Keeping them identical is simplest. Don't rename existing ones, because public links depend on them.
- **`relations`:** arrays of other records' **ids**. Projects use `artefacts` (evidence ids) and `experience` (CV ids). Evidence and experience records link back with `work`. Update both sides when linking. When deleting a record, remove every reference to its id in the same change.
- **To add a record,** copy a whole existing record in the same file and change everything, including `id` and `slug`.
- **Evidence** `evidence.kind` is `workflow`, `schema` or `table`. Workflow rows have three cells (number, title, description). Schema and table rows have one cell per entry in `columns`.
- **Mixes:**
  - `night` is one of `early`, `day`, `late`, `peak`, `winddown`.
  - `facets.style` feeds the Style filter.
  - `audio.link` is the full SoundCloud or Mixcloud page for that one set, not embed code.
  - `audio.duration` is the length in seconds.
  - `audio.file` is an uploaded recording, and it takes priority over a link. Never add `peaks` unless they were measured from that exact file.
  - `artwork` is `{ "file": "cover.jpg", "alt": "description" }`.
- **Project thumbnails:** each project has `"artwork": { "file": "project-placeholder.png", "alt": "" }`, a shared placeholder image. To replace it, upload Livi's image to `media/` and change that project's `artwork.file`. Use 16:9 landscape images, ideally 1600 × 900 px; they're cropped to fill. Evidence records work the same way with `evidence-placeholder.png`; their opened page still shows the structured `evidence` table or workflow. Don't delete a placeholder while any record still uses it.
- **CV download:** in `copy.json`, `production.cv.download` = `{ "file": "livi-cracknell-cv.pdf", "label": "Download CV" }`. Upload the PDF first.

**Uploads**
- Simple filenames: letters, numbers, hyphens, underscores, no spaces. Case must match exactly. Reference the filename only, without `media/`.
- Images: JPG/JPEG, PNG or WebP. Audio: MP3, M4A, WAV or OGG. CV: PDF.
- The browser uploader takes up to 25 MiB per file. Long mixes belong on SoundCloud or Mixcloud.
- Upload the file before referencing it. When removing one, delete the reference first, then the file.

**Never add:** disclaimers, how-to text or extra sample labels on pages; an editor, admin or CMS feature; simulated playback or fake waveforms; claims or metrics without a source from Livi.

## 8. Checks

- `npm run validate:content` checks only the content: JSON syntax, required fields, ids, references and attachments. Errors name the file and field, for example `src/content/copy.json → production.contact.lede: Enter the introduction as text.`
- `npm run check` runs validation, both type checks and all tests.
- `npm run build` runs `check`, then builds `dist/`. This is the same as GitHub runs.
- `npm run dev` gives a local preview at http://127.0.0.1:5193/. A preview publishes nothing.
- Without command-line access, the GitHub Actions run is the check.

## 9. When a build fails

1. Open **Actions**, click the failed **Build and deploy** run, then the **build** job, then the failed step.
2. Content errors come first and name the file and field. Fix that field and commit again.
3. An "invalid JSON" error is almost always a missing or extra comma, quote or bracket near the last edit.
4. If the error isn't about `src/content/`, don't change code to make it pass. Explain to Livi, and suggest she send the run link to her web designer.
5. Reassure her: the previous site stays live until a build succeeds.

## 10. Undoing a change

- **Command line** (after her yes): `git revert <commit>` then `git push origin main`. Never rewrite or force-push `main`.
- **Browser:** open the file → **History** → click the change. Red lines are the old text. Copy the old text back with the pencil and commit.
- Earlier content is always in the history; nothing is lost by a failed build.

## 11. Talking to Livi about a change

Before publishing, tell her:

- what you'll change, in her words (for example *"Contact page intro: 'For content operations…' → 'For content strategy…'"*);
- which side of the site it's on (Content or Livicee);
- that saving publishes the site, and ask *"Shall I publish this?"*

After publishing, tell her it's live (or that it failed and what you'll do next), and how to see it. A full refresh is Ctrl+Shift+R on Windows or Cmd+Shift+R on a Mac.

## 12. Content still provisional

All 30 records (10 projects, 12 evidence items, 3 Experience groupings, 5 mixes) are samples awaiting Livi's real content. The page copy in `copy.json` was written for the first version and needs her approval. `HANDOVER.md` → "What Livi must replace or approve" lists every item. When she supplies real content, replace the sample text, keep the structure, and set `sample` to `false` only on records she confirms.
