# Editing your portfolio in GitHub

Start from the [repository README](../../README.md). Edit on **main**, commit your change, then check **Actions → Build and deploy** before refreshing the public site. You only need a browser and repository write access.

> Sections marked **Later: ask for help the first time** change several records or files at once and are easy to get wrong. Everything else is fine to do on your own.

## Choose a file

| File | Contents |
| --- | --- |
| [site.json](site.json) | Names, email, website address (`siteUrl`, used by search and link previews), browser-tab and search title (`searchTitle`), search and link-preview description (`searchDescription`), each identity's status and social links, footer note |
| [copy.json](copy.json) | Home, About and Contact pages; Experience heading and optional CV download |
| [projects.json](projects.json) | Professional projects |
| [experience.json](experience.json) | Experience / CV entries, dates and linked projects |
| [mixes.json](mixes.json) | DJ sets, descriptions, recording links and cover images |
| [evidence.json](evidence.json) | Supporting evidence attached to projects |
| [notices.json](notices.json) | Related-projects heading |
| [media/](media/) | Images, recordings and CV PDFs referenced by filename |

`siteUrl` must be the site's real public address, starting `https://` and ending with `/`; change it only when the address changes (see [HANDOVER.md](../../HANDOVER.md#address-search-and-link-previews)). **production** is the professional side; **sound** is Livicee. An empty `status` hides the mobile Home status and uses copyright in the desktop header. An empty social-profile field hides that link. Profiles use full HTTPS addresses for their named service, such as `https://soundcloud.com/livicee` and `https://instagram.com/livicee`.

## Change text

Open a JSON file, click the pencil and change its text. This is the existing professional status field:

```json
"status": "Currently: Implementation Success Manager @ Storyblok"
```

Keep property names, brackets and commas in place. Use straight double quotes around text. Apostrophes, curly quotation marks, accents, ampersands and em dashes are fine inside it. A straight double quote inside a value needs a backslash: `\"`. Use `\n` for a newline inside a string; page headings use `<br>` for a visible line break. Other HTML is displayed as text.

JSON uses commas **between** fields and records, with no comma after the last one. Numbers and `true` / `false` have no quotation marks. JSON does not accept comments. For an ordinary wording change, keep `id`, `slug`, `collection` and `relations` unchanged.

Click **Commit changes…**, describe the edit, choose **Commit directly to the main branch**, and confirm. This starts publication. GitHub's file preview shows your edit, not a rendered preview of the portfolio. [GitHub's file-editing guide](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files) explains the controls.

## Check publication or fix a failed edit

Open the repository's **Actions** tab, select your latest **Build and deploy** run and check it finishes successfully. A queued or running workflow has not finished publishing. After success, refresh the public page you changed.

If a run fails, open its **build** job and expand the failed step. Content validation runs first. A message such as `src/content/projects.json → dam-migration.title` means the `title` field of that project needs attention. An invalid-JSON error names the file and gives the parser's location where available; check nearby quotes, commas and brackets. A missing-attachment error names the exact filename to upload or correct.

Fix the file on **main** and commit again. The failed build cannot deploy; your previous successful website remains available. Failures later in the workflow may be a hosting or build problem rather than a content mistake. Keep the run link for your maintainer if the content messages do not explain it.

## Restore earlier content

1. Open the affected file in GitHub and select **History**.
2. Open a commit from before the unwanted edit, then view the file at that revision and copy the text you want back.
3. Return to the file on **main**, click the pencil, replace the affected text and commit the restoration.
4. Check the new Actions run and refresh the website.

For changes spanning several files, restore all affected files from the same known-good revision together. Do not edit the old revision itself. The current file's history and repository commit history keep earlier content even after a failed build.

## Choose project tags

Each project's `tags` list is the capabilities it shows, for example `"tags": ["CMS", "Content modelling"]`. They appear as chips on the project card, and the **Filter** on Projects lists every tag used, with a count. Pick from a small shared set (the samples use six: CMS, DAM, Content modelling, Workflow, Governance, Content quality) and spell each one exactly the same everywhere, because `CMS` and `cms` count as two different filters. Two or three tags per project is plenty; a tag only one project uses adds a filter that finds a single project.

## Upload an image or CV

1. Give the file a simple name using letters, numbers, hyphens or underscores. Keep its extension; avoid spaces. Capitalisation must match exactly.
2. Open [media/](media/) in GitHub on **main**, select **Add file → Upload files**, choose the file and commit it.
3. Edit the appropriate JSON file to reference its **filename only**, without `media/` or a full path. Commit and check Actions.

Supported images are JPG/JPEG, PNG and WebP. **Project thumbnails:** each project's `artwork` currently points at the shared placeholder `project-placeholder.png`. To use your own image, upload it and change that project's `artwork.file` to its filename; it is cropped to fill its frame, so use a 16:9 landscape image, ideally 1600 × 900 pixels. **Evidence images:** each evidence record's `artwork` points at `evidence-placeholder.png` in the same way and is shown on the project page and in evidence lists; the opened evidence page still shows its table or workflow from the JSON. **Mix covers:** in a mix record, add an `artwork` field. For an uploaded file named `cover.jpg`, the field looks like this:

```json
"artwork": { "file": "cover.jpg", "alt": "" }
```

Replace the filename with yours and fill `alt` with your image description; empty `alt` uses the mix title as its description. Separate this field from neighbouring fields with a comma.

For a CV, upload a PDF. In [copy.json](copy.json), find `production`, then `cv`, and add `download` beside its existing `title` field, with a comma separating them:

```json
"download": { "file": "livi-cracknell-cv.pdf", "label": "Download CV" }
```

Use your PDF's exact filename; `label` is the link text. Remove the `download` object, or leave its `file` empty, to hide the download. Upload the file before adding its reference. When deleting a file, remove its JSON reference first. Uploaded but unused files are still included in the build, so delete unwanted media through GitHub after unlinking it. [GitHub's upload guide](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) covers uploading files.

GitHub's browser uploader accepts files up to 25 MiB each. Use SoundCloud or Mixcloud for larger recordings.

## Add a recording to a mix

The easiest option is the full **SoundCloud or Mixcloud page for that individual set**, stored in the mix's `audio.link`. A profile link belongs in `site.json`; a recording link belongs in `mixes.json`. Paste the page address, not iframe/embed code. SoundCloud sets get a play button on the Mixes list and the mix page, and play in the site's player bar; Mixcloud sets offer **Load player**. Visitors can also open the set directly. Add `audio.duration` (the set's length in seconds) to show its length in the Mixes list.

If the mix has no `audio` field yet, add an `audio` object containing a `link` field, with your full set URL as its text value. Separate the new object from neighbouring fields with a comma. If `audio` already exists, edit it rather than adding a second one.

**Later: ask for help the first time.** This paragraph and the next cover uploading a recording file and its waveform data. For a hosted recording, upload an MP3, M4A, WAV or OGG into `media/`, then use its filename in `audio.file`, for example:

```json
"audio": { "file": "after-hours.mp3" }
```

A file takes priority over a link when both are supplied. Remove `audio.file` to return to the linked player. A recording can play without `peaks` or `duration`; omit these unless you have measured metadata for that exact file. Uploading through GitHub does not generate a waveform. Remove old metadata when replacing a recording.

Update the mix's descriptive facts too, so text such as “Not attached” stays accurate. Remove the `audio` object to return to the missing-recording state.

## Add or remove records

> **Later: ask for help the first time.** Adding, removing or linking records touches IDs and references, sometimes across several files.

Each record file contains an array of objects. To add a record, copy a whole existing object **in the same file**, add a comma between it and its neighbour, then change its content. Use a new, unique `id` and `slug`: lowercase letters/numbers separated by single hyphens. IDs and slugs must not collide with any other ID or slug in that collection. Keeping `id` and `slug` identical is simplest. Existing public links depend on them, so avoid renaming an existing record's addresses.

Keep the required fields: `collection`, `id`, `slug`, `title`, `subtitle`, `summary`, `year`, `tags`, `sample`, `facts` and `relations`. Optional lists can be empty. A new record can begin with `"relations": {}`. Use confirmed facts; leave `sample` as `true` while a record is provisional, then set it to `false` when confirmed. Clear `site.json`'s `footerNote` only once the sample collection has been replaced.

| File | `collection` value | Relationship key pointing here |
| --- | --- | --- |
| projects.json | `work` | `work` |
| evidence.json | `artefacts` | `artefacts` |
| experience.json | `experience` | `experience` |
| mixes.json | `mixes` | `mixes` |

`relations` values are arrays of another record's **id**, not its title or slug. A project's `relations.artefacts` lists supporting evidence IDs; its `relations.experience` lists CV IDs. Evidence and CV entries use `relations.work` to link back to projects. Update both sides when linking these records so navigation stays consistent. Evidence uses `workflow`, `schema` or `table` shapes: workflow rows contain three cells (number, title, description); schema/table rows have one cell per column heading.

To delete a record, remove its whole object and adjust the neighbouring comma. Search for its ID across the content files and remove related references in the same change. Delete supporting evidence only if no remaining project needs it. Missing references and duplicate addresses block publication and name the field to fix.

**Later: ask for help the first time.** For several related file edits in one commit, open the repository on **main** and press **.** to use GitHub's browser editor. Edit the files, open **Source Control**, review the changed files, stage them with **+**, enter a message and choose **Commit & Push**. Check the branch is **main** before committing. Uncommitted work remains in that browser until committed. [GitHub's browser-editor guide](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor) describes this flow. Single-file text edits can continue using the pencil.

## Current content and boundaries

The 11 October feedback confirms the Storyblok status and Livicee profile links. It does not supply the employment chronology or project case studies; the current records remain samples. The full list of what to replace or approve is in [HANDOVER.md](../../HANDOVER.md#what-livi-must-replace-or-approve). YouTube is deferred until Livi supplies a channel. Portrait sources remain in `src/ascii/assets/`; ordinary content edits do not require touching those files or the application code.

Developer setup and local checks are separate in [DEVELOPER.md](../../DEVELOPER.md). Types live in `schema.ts` and `src/workspace/model.ts`; no content migration is required.

### About page formatting

The About `body` supports blank lines (`\n\n` in JSON) for separate paragraphs, `## Heading` for section headings, `**text**` for bold names or phrases, and `_text_` for emphasis (used for DJ locations). Raw HTML is displayed as text. These styles use the existing site typography.
