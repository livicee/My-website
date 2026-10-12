# Livi Cracknell / Livicee: handover

Public ASCII portfolio for Livi's professional work (**Content**) and her DJ identity (**Livicee**) in one CMS-style interface. Livi has approved the look and operation of the site and asked to keep the latest DJ illustration.

These files are Livi's. She puts them in a repository on her own GitHub account, GitHub Pages publishes the site from there, and after that she edits content directly in GitHub. Nothing needs to run on her computer.

**Status: handover not complete.** Tick the meeting checklist below only when each item has actually been seen working under Livi's account.

## Set up your own copy (once)

This is easiest done together in the handover meeting, or by an AI assistant (Claude, ChatGPT or similar) using [AI-ASSISTANT.md](AI-ASSISTANT.md) or the prompt at the end of this file.

1. **Create a GitHub account** at https://github.com/signup and note your username. Keep your password to yourself; nobody else needs it.
2. **Create an empty repository:** click **+** (top right) → **New repository**.
   - **Name:** `<your-username>.github.io` gives the simplest address, `https://<your-username>.github.io/`. Any other name, such as `livi-cracknell`, gives `https://<your-username>.github.io/livi-cracknell/`.
   - Choose **Public**. Free GitHub accounts can only publish Pages from public repositories.
   - Leave *Add a README*, *.gitignore* and *license* unticked, so the repository is empty.
3. **Put the files in.** Unzip the files you were sent. The zip contains a hidden folder called `.github` that must go in too; it holds the publishing workflow. Use one of these:
   - **GitHub Desktop** (free app, https://desktop.github.com): sign in, **File → Clone repository**, pick your new repository and clone it. Copy everything from the unzipped folder into the cloned folder, including `.github` (Windows: File Explorer **View → Show → Hidden items**; Mac: press **Cmd+Shift+.** in Finder). In GitHub Desktop, type `Add portfolio` as the summary, click **Commit to main**, then **Push origin**.
   - **Your AI assistant**, using [AI-ASSISTANT.md](AI-ASSISTANT.md) or the prompt at the end of this file.
   
   Don't use GitHub's browser **Upload files** for this first setup, because it can leave out the hidden `.github` folder.
4. **Turn on Pages:** in your repository, **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. **Set your address:** open `src/content/site.json`, click the pencil and change `siteUrl` to your address from step 2. It must start `https://` and end with `/`. Commit it to **main**. Search results and link previews use this address.
6. **Check it published:** the run started in step 3 may have failed because Pages wasn't on yet; that's expected. Open **Actions** and wait for **Build and deploy** to show a green tick. **Settings → Pages** then shows *Your site is live at …* with a **Visit site** button. Bookmark it.

If the run from step 5 fails, open it in **Actions**. A message about Pages usually means step 4 was missed: set the source, then click **Re-run all jobs**.

## Livi's routine

1. Sign in to GitHub, open the portfolio repository on **main** and choose a content file from [README.md](README.md).
2. Click the pencil, edit the text, then **Commit changes…** directly to **main** with a short description.
3. Open **Actions → Build and deploy** and wait for the run to succeed.
4. Refresh the live site and check the change.

The [content editing guide](src/content/README.md) covers JSON syntax, adding and removing records, related records, image and CV uploads, SoundCloud/Mixcloud sets, failed builds and restoring earlier content from file history. A content error names the file and field to fix, and a failed build leaves the previous deployment live.

## Address, search and link previews

`siteUrl` in `src/content/site.json` is the only place the site's address is written. The build fills it into the canonical link, link-preview tags (`og:url`, `og:image`, `twitter:image`), schema.org data, `robots.txt` and `sitemap.xml`. Until it's set (step 5), it holds the placeholder `https://livi-cracknell.github.io/`, and link previews won't show the preview image. The site itself works at any address, because pages, icons and fonts use relative paths.

The browser-tab and search-result title and the description shown in search results and link previews are `searchTitle` and `searchDescription` in the same file. The link-preview picture is `public/og-image.png`, a fixed 1200 × 630 image with the tagline drawn into it; replacing it means uploading a new image with the same name and size.

`robots.txt` only takes effect at the root of a domain: a `<username>.github.io` repository or a custom domain, not a `/livi-cracknell/` style address.

**Custom domain (optional, later):** buy the domain, add it under **Settings → Pages → Custom domain**, create the DNS records GitHub shows, wait for the DNS check, tick **Enforce HTTPS**, then change `siteUrl` to `https://<domain>/`. No `CNAME` file is needed with Actions publishing.

## Preparing the files to send

From a clean, up-to-date checkout of `main`, create the zip with:

```bash
git archive --format=zip -o livi-portfolio.zip HEAD
```

This includes only the project's tracked files, `.github` included. It leaves out commit history, `node_modules`, `dist` and every ignored local folder. Livi's repository starts with fresh history from her first commit. Run `npm run build` first to confirm the files build.

## What Livi must replace or approve

Every record below carries `"sample": true` and stays that way until Livi confirms its replacement content. Then set that record's `sample` to `false`. The footer's **Sample collection** (`footerNote` in `site.json`) stays until all of them are confirmed. No metrics, dates or claims have been invented. Unknown years read `To confirm`.

**Projects** (`projects.json`, 10): Asset library migration · Reusable content model · Editorial request to release · Shared vocabulary · Content inventory & decisions · Asset rights & reuse · CMS authoring experience · Publishing readiness · Team knowledge handover · Review & retirement. For each: real title, context, her own contribution, deliverables, year, a thumbnail image (each currently uses the shared placeholder `project-placeholder.png`), and whether the organisation can be named.

**Evidence** (`evidence.json`, 12, all authored examples, not her documents): Asset metadata model · Migration checkpoints · Decision ownership · Reusable record schema · Request to release workflow · Contributor starter guide · Content decision register · Asset usage checks · Authoring field guide · Content release checks · Maintenance handover index · Review and archive rules. Replace them with approved, shareable material or remove them. Each currently shows the shared placeholder image `evidence-placeholder.png`.

**Experience** (`experience.json`, 3 practice-area groupings, not jobs): Content & asset operations · Content platforms & architecture · Editorial delivery & enablement. Replace them with her real roles, organisations and dates. A CV PDF download is optional.

**Mixes** (`mixes.json`, 5): January Bluze (Pirate Studios mix) · Neo Soul and Chill · Funky Edits - Nov 25 · Disco for days · Sounds from Ace Hotel lobby: Neo Soul Musings. The titles and SoundCloud links are her real sets. She needs to confirm the descriptions, styles, years, durations and any artwork.

**Page copy** (`copy.json`, not flagged as sample, but written for the review): both Home intros, both About pages (including the "How I work" / "How I pick" principles) and both Contact ledes. She should approve them or reword them in her own voice. Livicee's About ends "Files go on when I have them to share", which predates the SoundCloud links.

**Other items to confirm:** `livicracknell91@gmail.com` for both enquiries and bookings. "LC Sound Consulting" (`entity`, shown on Contact). Both portraits as an acceptable likeness: she asked to keep the DJ illustration, and the professional portrait's accessible label still says "Provisional". A YouTube channel can be added to `site.json` when she has one.

Already confirmed by Livi: the Storyblok status line, her LinkedIn, SoundCloud and Instagram profiles, and "Available for Bookings". [docs/CONTENT-REVIEW.md](docs/CONTENT-REVIEW.md) is the original 16 September source review. Some of its details, such as the editor and track names, are superseded by this list.

## Meeting checklist

- [ ] **Her account:** Livi has signed in to her own new GitHub account.
- [ ] **Her repository:** the files are in a public repository under her account, `.github` folder included.
- [ ] **Published under her account:** Pages source is GitHub Actions, `siteUrl` is her address, a **Build and deploy** run on `main` shows a green tick, and the site opens at her address.
- [ ] **Her edit:** Livi changes one line of text herself, for example a Contact lede in `copy.json`. She commits it to `main`, watches Actions turn green and sees it on the live site.
- [ ] **Her restore:** Livi opens that file's **History** and restores the earlier text herself following the README. She commits it, watches it publish and confirms the site matches the original.
- [ ] **Bookmarks:** her repository, `src/content/`, Actions and the live site.
- [ ] **Sample list:** walk through "What Livi must replace or approve" and agree who supplies what.
- [ ] Optional: she pastes the Claude prompt below into her own Claude and confirms it can preview the site locally.

## Prompt for Livi's Claude

Livi can paste this into Claude Code (or any assistant with terminal access) on her own computer. For an assistant that can only chat, such as ChatGPT in a browser, attach [AI-ASSISTANT.md](AI-ASSISTANT.md) instead and ask it to follow that guide.

```text
You're helping me maintain my portfolio website, a Vite + TypeScript static site published by GitHub Pages.
My repository: https://github.com/<my-username>/<my-repository>
(If I haven't created it yet, I have the site's files as a zip. Help me follow "Set up your own copy" in
HANDOVER.md, which is inside the zip.)

Set up:
1. GitHub sign-in: never ask me to paste a password or token into chat. Check `gh auth status`; if I'm not
   signed in, have me run `gh auth login` myself (browser login), or use Git Credential Manager.
2. Clone my repository and open it. Read AI-ASSISTANT.md first (the full guide), then README.md, HANDOVER.md,
   AGENTS.md and src/content/README.md before changing anything; AGENTS.md has the project rules.
3. Use Node.js 22 (see .nvmrc; 22.12 or later). Install with `npm ci`.
4. Preview with `npm run dev` (http://127.0.0.1:5193/). Previews publish nothing.

Working rules:
- My content lives only in src/content/*.json, with uploads in src/content/media/. Change application
  code only when I ask.
- Preserve the approved design and behaviour. Don't redesign, add features or remove anything unless I ask.
- Never invent claims, clients, dates, metrics, recordings or bio details. Use only what I give you.
  Keep "sample": true on a record until I confirm its content.
- Before committing, run `npm run build` (content validation, type checks, tests, build) and fix failures.
- Commit with a short clear message. Pushing to main publishes my website: show me the change and get my
  explicit go-ahead before every push to main. Afterwards check Actions → Build and deploy succeeded.
```

## Developer notes

Setup, checks and previews are in [DEVELOPER.md](DEVELOPER.md). Design and product rules are in [DESIGN.md](DESIGN.md) and [PRODUCT.md](PRODUCT.md); the portrait renderer is described in [docs/ASCII-RENDERER.md](docs/ASCII-RENDERER.md). The local editor has been retired, and GitHub history is the recovery source for content.

## Current state

- **Content tabs:** Overview, Projects, Experience, About, Contact. **Livicee tabs:** Overview, Mixes, About, Contact.
- **Headers:** Content shows "Currently: Implementation Success Manager @ Storyblok". Livicee shows "Available for Bookings". Both come from `status` in `site.json`.
- **Livicee:** the approved DJ illustration, with her SoundCloud and Instagram in the rail and on Contact. SoundCloud sets play in a persistent player bar that keeps playing across navigation and identity switches.
- **Records:** 30 samples in total: 10 projects, 12 evidence examples, 3 Experience groupings and 5 mixes.
