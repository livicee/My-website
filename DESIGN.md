---
name: Livi Cracknell / Livicee
description: One content workspace with connected records and a continuous ASCII identity field.
colors:
  bg: "#111113"
  panel: "#18181c"
  pink: "#ff3d9b"
  foreground: "#f0eef1"
  muted: "#b4afb8"
  line: "#38333c"
  navigation: "#18171a"
  frame-bar: "#151417"
  frame-recess: "#121114"
  frame-raised: "#222025"
  frame-edge: "#333036"
  frame-highlight: "#363239"
  navigation-selected: "#2a2029"
  record-selected: "#30202d"
  selection-ink: "#ff9ece"
  row-hover: "#211a21"
  sound-row-hover: "#251c24"
  sound-record-selected: "#30242d"
  dialog: "#202025"
  control-edge: "#6b616c"
  control-hover: "#28242a"
  button-border: "#60545f"
  button-hover: "#30232d"
  primary-hover: "#ff72b6"
  preview-bg: "#151419"
  preview-ink: "#f3eaf0"
  preview-accent: "#ec72b2"
  preview-line: "#735269"
  reading-surface: "transparent"
  reading-surface-compact: "transparent"
  reading-surface-mobile: "transparent"
  document-surface: "transparent"
  index-surface: "transparent"
  card: "#17161a"
  card-hover: "#1d1b21"
  card-edge: "#2f2b33"
  chip-edge: "#3d3842"
  field: "#121114"
typography:
  display:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.035em"
  page-heading:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(2rem, 3.125vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.035em"
  record-heading:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-.035em"
  sound-display:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.035em"
  sound-accent:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 600
    fontStyle: "normal"
    lineHeight: 1.08
    letterSpacing: "-.035em"
  sound-page-heading:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(2rem, 3.125vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.035em"
  sound-record-heading:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-.035em"
  sound-mix-title:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-.015em"
  headline:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.02em"
  row-title:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.02em"
  body:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  detail:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: ".875rem"
    fontWeight: 500
    lineHeight: 1.4
  shell-control:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  navigation:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.3
  supporting:
    fontFamily: "Fragment Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: ".875rem"
    fontWeight: 400
    lineHeight: 1.5
  compact:
    fontFamily: "Fragment Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: ".75rem"
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "Fragment Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: ".875rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  square: "0px"
  shell-control: "4px"
  navigation-item: "0px"
  mode-well: "6px"
  mode-button: "4px"
  reading-aperture: "3px"
  card: "6px"
  field-panel: "4px"
  chip: "3px"
spacing:
  compact: "8px"
  small: "12px"
  standard: "16px"
  row: "20px"
  section: "24px"
  wide-gap: "28px"
  block: "32px"
  document: "36px"
  page: "40px"
  generous: "48px"
components:
  button-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.square}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.bg}"
  button-secondary:
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.button-hover}"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.shell-control}"
    rounded: "{rounded.shell-control}"
    padding: "0 12px"
  navigation-item:
    textColor: "{colors.muted}"
    typography: "{typography.navigation}"
    rounded: "{rounded.navigation-item}"
    padding: "6px 16px"
  navigation-item-selected:
    backgroundColor: "transparent"
    textColor: "{colors.selection-ink}"
  sample-label:
    textColor: "{colors.muted}"
    typography: "{typography.mono}"
    padding: "0"
  record-row-selected:
    backgroundColor: "{colors.record-selected}"
    textColor: "{colors.selection-ink}"
    padding: "16px"
  evidence-preview:
    backgroundColor: "{colors.preview-bg}"
    textColor: "{colors.preview-ink}"
    rounded: "{rounded.square}"
    width: "100%"
  reading-pane:
    backgroundColor: "{colors.reading-surface}"
    width: "calc(min(840px, (100vw - var(--nav)) * .56) + var(--composition-inset))"
  reading-pane-compact:
    backgroundColor: "{colors.reading-surface-compact}"
    width: "calc(min(740px, (100vw - var(--nav)) * .77) + var(--composition-inset))"
  reading-pane-narrow:
    backgroundColor: "{colors.reading-surface-compact}"
    width: "calc((100vw - var(--nav)) * .86 + var(--composition-inset))"
  reading-pane-mobile:
    backgroundColor: "{colors.reading-surface-mobile}"
    width: "100%"
  record-document:
    backgroundColor: "{colors.document-surface}"
    padding: "28px 36px 36px"
  record-index:
    backgroundColor: "{colors.index-surface}"
    width: "280px"
  sound-mix-link:
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "16px 18px"
  sound-mix-link-active:
    backgroundColor: "{colors.card-hover}"
    textColor: "{colors.selection-ink}"
  sound-navigation-item-selected:
    backgroundColor: "transparent"
    textColor: "{colors.selection-ink}"
  sound-record-row-selected:
    backgroundColor: "{colors.sound-record-selected}"
    textColor: "{colors.selection-ink}"
---

# Design System: Livi Cracknell / Livicee

## Overview

**Creative North Star: "The content workspace"**

Content and Livicee are two datasets in one CMS-style public portfolio. A persistent application frame, connected records and clear selected documents provide the structure. Charcoal surfaces, readable neutral type and neon pink establish the shared identity.

One continuous dark character lattice spans the workspace, including beneath the main content. Transparent reading surfaces expose this quiet atlas layer; a separate mask subdues only the brighter portrait beneath copy. Portrait drawing scale and position remain stable across sections. The settled composition carries the identity before motion begins.

Content is composed and precise; Livicee is the expressive, let-loose side of the same person. Livicee carries the shared pink into its headline accent, lets named mixes lead the night map, and adds subtle vertical equalizer colour bands at 120bpm to the portrait's standard ASCII animation. Navigation and reading remain steady. Implementation of this extension was authorized in [the 29 September direction](docs/LIVICEE-DIRECTION-2026-09-29.md). The user rejected the first revised DJ source as sexualised, then accepted the correction's understated styling and shared-head direction and requested matching scale and crop. The user then clarified that the DJ head needs slightly more height and must retain the full ASCII transition, settling at the same position. The registration matches the endpoint head size and position while the entire figure transitions. The designer subsequently selected B, shoulder-length hair down, from two ImageGen edits of the accepted v2 DJ source. The selected source retains the understated outfit, headphones and relaxed pose. Livi's feedback supplied on 11 October says she is happy with the site's look and operation and explicitly asks to keep this latest DJ illustration. The designer approved the local preview of her requested final tweaks and authorized publication on 11 October 2026; sample factual content remains unapproved.

On 6 October, the user approved the generated mobile proof's centered head-and-shoulders composition and then authorized showing the full existing portrait only on the two mobile Home routes. At widths up to 760px, Home uses the existing source PNGs at a 430px canonical figure width, 14px top offset and centered mobile x position, with up to 340px before reading and the 200px reading allowance preserved in short windows. Every other mobile route hides the portrait presentation and its introduction gap while retaining the quiet ASCII lattice. Desktop composition, source registration and ASCII effects retain their existing settings. The earlier isolated compact-facts prototype was not approved or promoted. This approval covers Home-only mobile composition, not factual content, personal likeness or overall site acceptance; implementation verification is tracked in `HANDOVER.md`.

This documents the implemented system in `src/workspace/workspace.css`, `expression.css`, `cards.css`, `rail.css`, `identity.css`, `veil.ts`, `evidencePreviews.css` and `src/ascii/`. Generated mockups remain quality references, never layout authority. [PRODUCT.md](PRODUCT.md) contains product scope and the factual approval boundary. Runtime and source-art details live in [docs/ASCII-RENDERER.md](docs/ASCII-RENDERER.md).

**Stylesheet ownership:** `main.ts` loads `workspace.css`, `identity.css`, `evidencePreviews.css`, `expression.css`, `cards.css` and `rail.css` in that order; preserve the cascade. `workspace.css` owns base tokens, shared type, shell and responsive document/index layout. `expression.css` owns Livicee's opening, night-chart arrangement and shared interaction refinements. `cards.css` owns entry cards, field-panel spacing and card treatment for related records, contact and mixes, plus the Experience disclosure-row override. `rail.css` owns the rail field's layout; `identity.css` owns portrait layers/masks and Home-only mobile visibility; `evidencePreviews.css` owns diagram framing; `veil.css` owns the decorative transition layer. The 6 October foundation cleanup keeps document/index breakpoints and email wrapping in `workspace.css`, field-panel spacing and contact-card padding in `cards.css`, and removes unused or shadowed declarations from `workspace.css` and `expression.css`. It introduces no visual direction or content change.

**Key Characteristics:**

- One shared shell, explicit active dataset and connected collection/document views; Content also retains its Experience (CV) section.
- Large glyph portraits with stable placement and a continuous quiet ASCII lattice beneath transparent reading surfaces.
- Readable descriptions, restrained rules and visible selected states.
- A bounded portrait morph and visible-text veil, with equivalent keyboard, touch and reduced-motion access.
- Two temperaments in one identity: composed Content, Livicee's pink headline accent, named mix rows and a source-derived glyph groove, with shared typography.
- Sample content and provisional likeness remain visibly identified.

## Colors

The palette combines near-black charcoal and warm neutral text with a single neon-pink interface accent. Frontmatter values are extracted from the shipped source; the sidecar's synthesized tonal ramps support the design panel and do not introduce application tokens.

### Primary

- **Neon pink** (`pink`) marks selected navigation tiles, the active dataset pill outline, links, focus and primary actions.
- **Soft pink** (`selection-ink`) identifies selected record titles and structured code.
- **Light pink** (`primary-hover`) marks a hovered primary action.
- **Preview pink** (`preview-accent`) belongs to generated evidence diagrams. It preserves diagram contrast alongside preview ink and preview lines.

### Neutral

- **Workspace charcoal** (`bg`) anchors the shell and collection views.
- **Panel charcoal** (`panel`) supports contained media controls.
- **Rail graphite** (`navigation`, `#18171a`) supports the sidebar; the reading area reaches the window edge with no right return. **Bar graphite** (`frame-bar`, `#151417`) distinguishes the full-width header and footer, with one-pixel seams. The phone dock uses the same bar surface and seam.
- **Search charcoal** (`frame-recess`, `#121114`) forms the search field and identity-switch track; **selected charcoal** (`frame-raised`, `#222025`) forms the sliding identity pill and active phone navigation. Desktop navigation marks selection with soft-pink text and a 14% pink icon tile, without a row fill or edge indicator. **Frame edge** (`frame-edge`, `#333036`) and **frame highlight** (`frame-highlight`, `#363239`) supply restrained rules and the fine screen lip.
- **Dialog charcoal** (`dialog`) distinguishes modal filters.
- **Warm white** (`foreground`) is the main reading ink; **soft grey** (`muted`) carries supporting copy.
- **Muted plum rule** (`line`) separates records, facts and application regions.
- **Selected plum** (`record-selected`) supports record selection without replacing its text or positional indicator; phone navigation uses a flush `frame-raised` fill while desktop selection is carried by its icon tile and label.
- **Sound plum** (`sound-row-hover`, `sound-record-selected`) deepens Livicee's record hover and selected surfaces. Content retains its `row-hover` plum; both modes use the same solid bezel and pink accent.
- **Preview charcoal, ink and line** (`preview-bg`, `preview-ink`, `preview-line`) form the evidence media palette.
- **Control edge and hover** (`control-edge`, `control-hover`) distinguish action borders, segmented groups and interaction states. Existing button palette tokens remain available; ordinary secondary controls use the shared control treatment.
- **Cards and fields** (`card`, `card-hover`, `card-edge`, `chip-edge`, `field`) distinguish entry cards, document panels and chips. `cards.css` owns these tokens and their component treatment.
- **Reading layers** (`reading-surface`, `reading-surface-compact`, `reading-surface-mobile`, `document-surface`, `index-surface`) are transparent. The quiet dark ASCII lattice remains visible beneath main content; the brighter portrait alone is masked behind reading areas.

**The Readable Surface Rule.** Keep the dark ASCII lattice continuous beneath main content. Subdue only the brighter portrait behind paragraphs and controls, preserving readable copy and the quiet texture.

## Typography

**Reading font:** self-hosted Instrument Sans variable, with Arial and sans-serif fallbacks. The bundled face (shipped as preloaded WOFF2) exposes weights 400–700 with `font-display: swap`; its OFL licence is included in `src/assets/fonts/instrument-sans-OFL.txt`.

**Action font:** Instrument Sans at weight 500 carries navigation, identity buttons, links, action buttons and segmented choices. Search uses Instrument Sans at weight 400; the availability line uses weight 500. Sans is what visitors read and act on.

**Metadata font:** self-hosted Fragment Mono Regular, with system monospace fallbacks. It carries counts, structured field labels, chips, breadcrumbs, footer information and transition glyphs. Mono is what the system reports. Its OFL licence is included in `src/assets/fonts/fragment-mono-OFL.txt`.

**Shared overview typography:** Livi's 11 October feedback requests continuity between the two identities. Both Overview headlines now use Instrument Sans at weight 600 and the same scale and line rhythm; Livicee's second phrase retains its pink colour.

**Structured labels:** the monospace stack in the `mono` token. The identity canvas uses Fragment Mono / Consolas / Courier New / monospace, with glyph size derived from its logical cell height. Evidence SVG source diagrams use Arial.

### Hierarchy

The root stays at `font-size: 100%`. Reading and content-control roles use rem-based tokens so browser font settings remain effective; pixel equivalents below assume the default 16px root. Shell geometry and its compact labels keep their established dimensions.

- **Overview display:** both identities use Instrument Sans `clamp(2.5rem, 4vw, 3.5rem)` (40–56px), weight 600, line-height 1.08 and tracking `-.035em`. Phones use `clamp(2rem, 8.6vw, 2.75rem)` (32–44px). Only the overview receives this display treatment. Livicee's second phrase is pink, with the same font, weight and spacing as the first.
- **Page heading:** collections, About and Contact share `clamp(2rem, 3.125vw, 2.75rem)` (32–44px), weight 600 and line-height 1.08 in both identities. **Record headings** share `clamp(1.75rem, 2.5vw, 2.25rem)` (28–36px), weight 600 and line-height 1.16. Main heading tracking is `-.035em`.
- **Section and item titles:** section titles use 1.375rem (22px), weight 600 and line-height 1.3; phones use 1.25rem (20px). Entry-card titles use 1.5rem (24px), weight 600, line-height 1.25 and tracking `-.02em`; phones use 1.3125rem (21px). Compact index titles stay 18px with a 14px supplied subtitle, rather than repeating the document summary.
- **DJ mix rows:** titles are 1.5rem (24px), 1.375rem (22px) on phones, with line-height 1.3. The expressive opening and portrait rhythm do not enlarge every document and control.
- **Body:** 1.125rem (18px) across desktop and phone reading, with paragraph line-height 1.6 and entry-card descriptions 1.55. Story copy is limited to 65ch. **Detail:** 1rem (16px) for facts and dense reading structures. **Metadata:** .875rem (14px). **Compact information:** .75rem (12px).
- **Content controls:** Instrument Sans 500 actions, return links and filters use .875rem (14px) with at least 44px targets. Document/Model and mix-order choices form segmented groups; their labels use the compact role on phones. Model references are underlined links; capabilities use mono query chips with counts. Sample status is plain footer information.
- **Shell controls:** desktop identity names, availability and rail labels use 14px Instrument Sans 500; search uses 14px Instrument Sans 400. Breadcrumbs and footer information use 12px Fragment Mono. Phones retain 12px full-name switch and navigation labels; Overview availability uses 14px Fragment Mono. The CV hint stays in markup but is visually hidden.

**The Reading Hierarchy Rule.** Reserve display scale for the two overview introductions. Share page, record, section and control roles across identities; preserve readable body copy and browser font preferences. A control's painted response must stay inside its actual hit target.

## Layout

The shell is one viewport-height grid with four sibling regions: full-width header, destination rail, reading body and full-width desktop footer. The rail is 192px at every desktop breakpoint, giving its icon and label pair room to breathe; the header is 56px, the footer 44px and the right return is 0px. The footer's contact and copy targets remain 44px high. The focusable reading body scrolls independently and spans the full display opening, keeping its scrollbar at the window edge even when the content composition gains a centering inset on wide screens; the desktop rail can scroll in short windows. Chrome occupies its own grid space and never covers the final record actions. Body scroll restoration and keyboard navigation preserve the frame.

The header has three stable DOM children: a status line, the full-name identity switch, and persistent search. On desktop the 260px switch sits at the left of the header and availability sits in the middle, falling back to copyright when `identity.status` is empty. The 44px switch uses `switchLabel` for both visible and accessible names: **Livi Cracknell** and **DJ Livicee**. Search remains 212px wide at the right. At 761–1100px the supplied status wraps in the space between switch and search; focused compact search at 761–960px temporarily hides it to avoid overlap. Above 900px, a stacked-layers icon for the professional side crossfades to the headphones mark at the far left and the switch gains a 30px inset; these glyphs are CSS backgrounds, leaving the header DOM unchanged. The 192px rail contains destination links and its object-free ASCII field, with no author or practice block. Header and footer are independent full-width `#151417` bars with one-pixel seams against the `#18171a` rail. The footer retains the sample note left, plain copyright center and `.footer-actions` right, holding direct contact and Copy email. The portrait keeps its accessible figure label without a visible caption.

Breadcrumbs are the first child of `#view` on every route so positional DOM updates preserve the following content slot. Empty breadcrumbs hide on non-record pages; deep paths have a 44px minimum height and scroll with their record. At widths up to 960px the current-record label hides while useful parent links remain; the whole path hides on phones. Search collapses to a 44px target at widths up to 960px. Between 761px and 960px focused search uses `min(240px, calc(50vw - 180px))` at the right, staying clear of the identity switch; Escape closes it, preserves the query and restores selected-identity focus.

Reading surfaces begin directly against the rail. Their final width is `calc(var(--reading-width-base) + var(--composition-inset))`, where the wide-screen inset is `max(0px, (100vw - var(--nav) - 1592px) / 2)`. Overview, Projects/Mixes, Experience, About and Contact share that reading origin. The portrait stays centred in the exposed field between the reading surface and the window edge. There is no collection-tab bar; the collection index begins below the header.

### Historical audit and verification

| Audit evidence | Implemented decision |
| --- | --- |
| Competing title sizes and repeated metadata obscured reading priority. | Reserve display scale for overview introductions; share page/record scales, keep supplied index subtitles and move metadata below the summary. |
| Multi-row quick filters delayed the work and several control types looked alike. | Use one native Filter panel; retain a single live count, segmented view/order choices, underlined references and plain sample status. |
| Outward fills and elastic row text made clickable regions feel uncertain. | Keep paint within the actual target; use steady text, 160ms color changes and a separate keyboard outline/selected state. |
| Author, practice and collection totals repeated across several pieces of chrome. | A left-hand role and full-name identity switch at the left; useful status and contact in the footer. |
| Stacking author, identity and navigation created an oversized left block. | Use one full-name identity switch at the left of the masthead and a 192px destination-only rail with 46px rows. |
| Independent panel shadows made the surround feel assembled rather than connected. | A restrained screen opening with a 12px right return; independent header/footer bars have one-pixel seams against the rail. |
| The user explicitly rejected excessive depth and asked for a screen bezel. | Restrict depth to the fine inner lip; remove raised buttons, control wells, gradient finishes and decorative brackets. |
| Projects and mixes are the evidence visitors should reach quickly. | Emphasize Projects/Mixes in the rail; overview actions lead to work and contact. Selected counts describe the visible rows: three projects or five mixes. |
| Duplicate page labels consumed breadcrumb space without helping deeper navigation. | Deep record paths live inside the reading view and link to the collection and, for attached evidence, the parent project. Empty paths hide. |
| A phone footer plus navigation consumed a second permanent band. | Use one 64px bottom dock plus safe area; keep Contact in navigation and on the page. |
| Repeated artwork introductions delayed opened documents on phones. | Records begin immediately; other pages reserve at most 240px while keeping 200px for reading when available. |
| Rearranging controls could disrupt search focus, scrolling and ASCII continuity. | Preserve one search field, one switch, the four canvases and stable sibling regions. The same switch remains a header child across breakpoints. |

### Current content composition

Overview, collection and profile pages use the same composed reading-pane widths in frontmatter. The base is `min(840px, (100vw - var(--nav)) * .56)` by default, `min(740px, (100vw - var(--nav)) * .77)` at widths up to 1200px, and `calc((100vw - var(--nav)) * .86)` at widths up to 960px; the final desktop width adds `--composition-inset`. Phones use full width. Horizontal page padding is 40px by default, 44px at 1700px and above, 32px at 1200px and below, then 28px at 960px and below. Content's overview places a concise introduction and three useful project cards beside the exposed portrait; Livicee presents five named mix cards. The displayed count matches each selection, and a link opens the complete collection. Sample collection appears only in the desktop footer.

An opened record retains a sticky, scrollable index and selected state beside its document above 960px. Its 920px base width also absorbs the wide-screen inset so its right edge remains aligned with the established document boundary. Its index is 280px on desktop and 240px at widths up to 1200px. At 960px and below, the selected document hides the index and uses the available reading width, with a visible return link to the collection. This prevents compressed reading columns on tablets. The transparent document carries compact field panels, capability chips, a contribution card and linked evidence. Opening a record does not move the portrait.

At widths up to 760px:

- The shell uses a 56px header and one bottom navigation dock of 64px plus `safe-area-inset-bottom`. The standalone footer is hidden. Contact remains a full-size navigation destination and a page action.
- Navigation columns are equal (`grid-auto-columns: minmax(0, 1fr)`): five on Content, four on Livicee. Labels are 12px beneath 18px icons, with at least 52px-high links. The overview link reads **Home**; its desktop label is **Overview**. A flat active fill, pink text and a thin bottom marker identify selection.
- Availability is shown at the top of Overview, above the heading. The standalone sample footer is hidden with the desktop footer; pages do not repeat its sample marker.
- Collection and document become separate connected views. The selected document hides the desktop index and retains a visible return link.
- Main content uses 20px side padding. Evidence tables scroll within their own region.
- Both Home routes retain the full existing centered portrait and reserve `min(340px, max(0px, var(--view-height) - 200px))` for its introduction. This preserves 200px of reading space when the viewport can provide it. Every other mobile route has no portrait presentation or portrait gap, including collections, Experience, About, Contact, records, evidence and missing-record pages; the quiet lattice remains. `workspace.css` scopes the gap and `identity.css` scopes portrait-layer visibility using the route's `.home-page` presence through `:has()`. The canonical portrait bounds remain 430px wide at a 14px top offset, centered by `x = (canvas width - figure width) / 2`; route changes do not alter source registration or resample the geometry. On Home, its mask follows the actual reading area's top as the body scrolls, leaving 4% portrait opacity beneath copy while the quiet lattice remains continuous.
- The header availability line hides. The same two explicit full-name identity buttons remain visible in the header, using `min(300px, calc(100vw - 80px))` (240–300px across supported phone widths) and 12px labels; search has a 44px target at the right. No identity menu or duplicate switch is added. Search expands in place on focus; the switch uses `visibility: hidden` so its buttons cannot become invisible keyboard stops. Blurring search restores them. Escape closes phone search and focuses the selected identity without clearing the query.
- Collection and profile views use the full-width reading surface and quiet lattice, with the mobile portrait hidden and no introductory gap.

**The Drawing Scale Rule.** Keep portrait scale and position dependent on the viewport, never the route. Register each source to the shared head anchor before character sampling. Compose, crop or occlude it at a useful character scale; opening a document must not miniaturise it into a separate identity column.

## Elevation & Depth

The sidebar uses `#18171a`; independent full-width header/footer bars use `#151417` with a one-pixel separating seam. The mobile dock shares that bar treatment. A one-pixel dark top/left edge and lighter bottom/right edge, plus a restrained `inset 1px 2px 4px` aperture shadow, describe the screen opening. The desktop aperture has a 3px radius; the phone opening is square. Search and the mode track use `#121114`; the active identity pill and phone navigation use `#222025`. Desktop navigation selection uses a pink icon tile and soft-pink label. The switch pill carries a fine pink outline and restrained glow and slides between identities over 320ms; other controls remain flush. Search and the switch track are painted 36px tall within 44px hit targets. No gradients or decorative bracket states are used.

Overview, collection, profile, document and index surfaces remain transparent, with no reading-pane backdrop blur. The quiet `.identity-lattice` canvas stays unmasked; `#identity-grid` holds the pink portrait above the separate colour/monochrome background response layers. Desktop reading areas reduce portrait opacity to 6% through a horizontal mask, fading to full visibility around the reading edge. Opened records use their wider document/index boundary without moving the portrait. Phones reduce the portrait to 4% beneath the reading area's current top. Monochrome filtering applies only to background responses, never to the portrait. Cards and documents have no ambient drop shadows. The selected record retains its inset pink indicator (`inset 1px 0 var(--pink)`).

The native filter dialog adds a dark translucent backdrop and a stronger border. Layer order is explicit: identity field 0, view 1, footer 2, topbar 20, navigation 30, decorative text veil 45, and toast/skip link 100. Native modal dialogs occupy the browser's top layer.

## Shapes

The transparent reading document and ordinary action buttons retain square geometry. Entry, contribution, related-record, contact and mix cards use a 6px radius; Experience uses open disclosure rows with a bottom hairline and square geometry; field panels, search, mode buttons and icon tiles use 4px; chips and entry media use 3px. The identity track uses 6px and the desktop reading aperture 3px. Desktop navigation rows extend edge to edge with square corners; phone navigation retains 4px corners. Selected records retain their narrow inset indicator; phone navigation uses a short bottom marker. Preserve native audio controls rather than forcing their browser-specific shape into the visual system.

Icons are hand-written line SVGs, generally 20px, with compact variants. Desktop navigation places a 14px glyph in a 28px tile; phones use bare 18px icons. The header identity marks are CSS background SVGs. The professional icon is a stacked-layers line icon in the same 24px stroke style as the headphones. Livi has no logo; do not invent a logo or monogram.

## Components

### Actions and focus

Primary actions are solid pink with charcoal text, in Instrument Sans 500. Secondary actions use an outlined rectangle. Both use the 14px control role, a 44px minimum height and 10px 16px padding. Hover changes background, border and ink over 160ms; text stays steady, while entry-card arrows move 2px right and up within their target. Row hover and keyboard focus use contained plum and soft-pink title/arrow ink; cards use their own darker surface and pink border response. General focus is a two-pixel pink outline; rows place it two pixels inside their actual target, while buttons and segmented choices offset it two pixels outside. Persistent selection retains its own fill and indicator. Reduced motion removes these transitions. Sample labels have no button border or padding.

### Navigation and dataset switch

Both identities share Overview/Home, Projects or Mixes, About and Contact; Content adds **Experience** after Projects. The CV hint remains in markup but is visually hidden in this compact rail. The left desktop switch identifies the person through **Livi Cracknell** and **DJ Livicee**; header availability carries the supplied status. Counts and identity cross-links no longer occupy the rail. Contact and the identity's configured profile links sit at its foot: LinkedIn on Content; Livi's supplied `https://soundcloud.com/livicee` and `https://instagram.com/livicee` on Livicee. The LinkedIn address remains a placeholder. Profile links are also available on Contact; phones hide them from the dock. YouTube is deferred until supplied. The object-free ASCII sweep between hairlines is owned by `railArt.ts`, `railField.ts` and `rail.css`; it hides on phones and below 560px height, freezes under reduced motion and pauses off screen. Professional Experience remains at `#/experience`: numbered native disclosure rows restore the Pixel hierarchy of date, title and subtitle, expanding to summaries, facts and connected projects. The three current records are still sample practice groupings with unconfirmed dates, not the archived fictional employment chronology. Project evidence remains connected to its project; capabilities, platforms, events/brands and locations are retired public collections whose saved URLs lead to relevant collections.

Desktop navigation combines an icon tile and 14px Instrument Sans 500 label in 48px rows; selection turns the tile pink and label soft pink. Mobile retains five Content or four Livicee sections with icon above label, a flush active fill and short bottom accent. Active links expose `aria-current`. The mode-switch group is the second child of `.topbar`, between availability and search; the rail holds `.nav-links`, including its ASCII field and foot links. The buttons' visible and accessible names both come from `switchLabel`: **Livi Cracknell** and **DJ Livicee**. `aria-pressed`, foreground active text and the sliding pill identify the selected mode. Dataset switching preserves the corresponding section, with an opened record returning to the other dataset's collection. The persistent shell node permits the switch pill to animate; the selected identity remains explicit even where artwork is occluded.

Forced-colour mode supplies a system Highlight outline for the selected navigation, record and dataset button, so selection survives removal of decorative fills and shadows.

### Search, filters and status

The header is the single persistent search surface. Content searches Projects and Livicee searches Mixes; entering a term opens the appropriate collection through the content-view transition, writes the query to the URL and retains focus while results update. `Ctrl/Cmd+K` and `/` focus this field. A recessed charcoal field has a one-pixel edge at rest; focus turns that edge pink. At widths up to 960px it collapses to a 44px target until focused; Escape restores selected-identity focus without clearing the query. The header availability line carries a slowly pulsing pink dot, disabled under reduced motion.

Collections present the heading before utility controls. One live result count sits left; Clear and Filter sit right. The heading does not repeat the count. The toolbar is 6px below the heading. Filter is painted 36px tall within its 44px target. Clear keeps its short visible label and the accessible name “Clear search and filters”. One Filter entry point opens all available native checkbox facets at every width, with contextual “Filter Projects” or “Filter Mixes” titles. There is no duplicated quick-filter row. The dialog retains a fixed header/footer and a scrolling body so Show results remains available on phones; selected labels have a subtle fill as well as native checks. Its reset action reads Clear with the accessible name “Clear filters”. Escape closes it and returns focus to its trigger. Applied filters preserve URL/history behavior and do not run a text veil. Empty results and missing records retain recovery links.

Capabilities remain evidence-backed queries: supplied project tags link to the Projects that prove them, as underlined mono links with counts. Model references remain underlined links. Mutually exclusive Document/Model and As listed/Through the night choices use segmented groups with `aria-pressed`, a selected fill and a light baseline. This separates navigation, mutually exclusive choices, multi-select checkboxes and plain sample information.

The only visible sample marker is the footer's Sample collection note; pages do not repeat notices, descriptions or gateway links. Current launch content comprises 30 connected sample records: ten projects, twelve attached evidence records, three CV entries on Experience, and five mixes. Only Projects and Mixes are record collections; presentation must not imply factual approval. Counts and record data come from content, not decorative hard-coded totals.

### Records and relationships

Project entries use `cards.ts` and `cards.css`: the project's image thumbnail (`artwork` in JSON, falling back to its evidence diagram), content-type tile, mono uppercase field label, 20px title, 16px summary (inside the 22px section headings), with the thumbnail filling the card height on desktop, plain mono tags and an arrow. Inside the page body, pink is reserved for the primary action, the current selection and Livicee's headline; type badges, chevrons, tab underlines and ordinary links are neutral, and list waveforms are dim until their row is hovered, selected or playing. Project and evidence pages show their image as a full-width 16:9 picture; mix covers stay square. Keep the `project-row` and `overview-item` class contracts. Compact selected-index rows use the supplied subtitle and a tinted surface, one-pixel inset pink edge and soft-pink title. Documents present title and visible description before human-readable metadata, then field panels, capability chips, a labelled contribution card and connected evidence. Machine slugs remain available in Model view rather than repeating above the reading title. Story subsections use semantic h3 headings within their section. Avoid mechanically repeating four large case-study headings.

Related records are hairline-divided rows with a neutral icon, meaningful record title and optional supporting text. Facts are unboxed label/value pairs in a responsive grid. Evidence tables retain semantic headers and a focusable native horizontal scrolling region when needed.

### Continuous ASCII identity

The source image is sampled into actual characters `.:;i1tfx08#@` with 32 brightness levels, deterministic seeds and a cached glyph atlas. The image and surrounding field share the same lattice. Default logical cells are 6×9px, or 5×8px when the canvas width is below 700px. Sources are sampling inputs and are never drawn as the visible portrait.

Above the 760px phone breakpoint, canonical figure width is `clamp(580px, canvas height × .86, 850px)`, with a 2:3 aspect ratio. Its horizontal centre matches the centre of the exposed field between the shared reading boundary and the window edge; its top is `max(8px, canvas height × .018)`. The phone override is documented in Layout. Portrait position and scale remain invariant across routes at the same viewport; document and profile surfaces overlap the same figure. Before sampling, the DJ source is scaled by 1.095 horizontally and 1.122 vertically, then offset by −41 source pixels horizontally and −6 vertically against the unchanged professional source. The additional vertical stretch is about 2.47% relative to the previous uniform registration. The selected shoulder-length source retains this registration. These offsets scale with the canonical figure, preserving the settled head size and position at each viewport without changing either PNG. The professional low-bun/folded-arm source remains provisional; Livi explicitly requested retention of the selected Livicee illustration in the feedback supplied on 11 October. The current DJ source is selected ImageGen option B: shoulder-length hair down, headphones, a loose boxy high-neck sleeveless tee fully covering the torso, and relaxed hands in pockets. It edits the accepted v2 DJ source and faces left like the professional source. Its understated styling and shoulder-length hairstyle are retained as approved artwork; this does not establish additional factual likeness details. The existing renderer samples the artwork into actual glyphs; [selected-source provenance](assets-source/portraits/livicee-20260929-v3.md) records the exact prompt and hash.

Dataset morphing lasts 560ms and never blocks routing or input. The full figure, including the head, participates in transition dimming and character scramble. Registration aligns the settled head size and position; it does not freeze the head or protect it from the ASCII transition. Small differences between the generated head shapes remain. Both identities retain their semantic ASCII current on a 100ms cadence during hover and click responses. Content's 94px hover region softly dims sampled luminance by at most 46%, with a restrained local scramble; surrounding glyphs continue unchanged.

Livicee adds subtle vertical equalizer colour bands at a targeted 30fps. A 500ms kick establishes 120bpm across a repeating 2000ms phrase, with shorter offbeat accents and slower-decaying peak caps. Each band tints three glyph columns followed by a one-column gap; levels rise from a common baseline through actual portrait glyphs. A muted lilac layer uses .16 bar strength and .22 peak strength while the base portrait remains at full brightness. Source-atop compositing preserves the original glyph ink alpha, and ambient animation leaves figure geometry fixed. The beat is authored, independent of audio, and standard semantic letter updates continue every 100ms. Within 168px of the pointer, short glyph runs respond locally with up to 4.5px magnetic displacement and .24 added light; clicks add a 900ms traveling ring. Only these local interactions displace the figure, with combined displacement capped at 8.5px. Both hover effects ease in over 110ms, follow cursor coordinates with a 55ms elapsed-time response, hold for 160ms after inactivity and release over 220ms. Re-entry begins from the current influence. Ordinary reading content permits background hover and clicks. Controls, copyable text, measured waveform seeking, touch input and reduced motion suppress pointer effects; `data-ascii-shield` is an explicit opt-out. Only primary presses trigger a response. Secondary presses and drags that begin on a protected control or copyable text stay protected after leaving that element, until release/cancellation. Only the background response blends to subdued grey behind reading copy; Livi remains pink. Background reactions also become dark neutral inside the negative space of each face, using source-registered regions with a soft edge; near-black interior glyphs also stay neutral so clicks cannot flash pink inside the face. Hair, clothing and the profile outline stay pink. Portfolio text does not accidentally select, while email and editable or explicitly copyable text remain selectable.

The identity switch resolves all visible workspace text through one 560ms character veil, synchronized to the portrait morph. Navigation, header, reading view, collection index and visible footer copy share the same event. Internal route navigation from the rail, breadcrumbs, inline actions and record links uses the same language only inside the new content view, keeping the navigation, header and footer spatially stable. A decorative, pointer-transparent, `aria-hidden` canvas measures each visible character's DOM position, masks it with its local surface color and has a budget of 2400 glyphs. Its glyphs use Fragment Mono, matching the metadata and the character field. Semantic copy, focus and hit targets stay intact. User scroll, resize, a hidden document or a reduced-motion change cancels the veil; reduced motion skips it. A new transition cancels any previous veil before starting its replacement. A live reduced-motion change also cancels in-flight crate reordering and Document/Model settling, clearing their temporary styles. Do not add separate section entrances or repeating body-copy hover animation.

Rendering stops at rest (the ambient current runs in 9-second bursts after visitor activity, then the loop stops), offscreen and while the document is hidden. Livicee eases into its groove over 650ms and back to the exact cached rest over the last 900ms of the activity window. Timers schedule its 30fps cadence and Content's 100ms cadence; bounded interaction effects use animation frames. Resize settles and resamples rather than stretching stale pixels. Reduced motion skips identity transitions and effects, including a live preference change. Source or canvas failure displays a readable fallback while the collection stays usable.

### Evidence previews

Previews show the record's `artwork` image in a 16:9 frame, cropped to fill (placeholders are 1600×900). A record without artwork shows the diagram generated from its actual schema, table or workflow data, as it is: 600×420 source diagrams in a 10:7 frame with a one-pixel line that turns pink on hover, and no character layer. ASCII stays the portrait's material.

Opened evidence stays readable semantic HTML. A diagram that fails to load says so and still links to the evidence document.

### Mixes: the crate and the deck

Livicee's Mixes read as a crate: numbered rows (each mix keeps its catalogue number) under a mono ruler of the night: Early, Day, Late, Peak, Wind-down. Each row carries a vector chart of the whole night as a quiet grey area on the ruler's grid, with the mix's stretch filled pink over a faint pink column; the Time column shows only a measured length and `--:--` otherwise. "Order: As listed / Through the night" re-sorts in place, and rows glide to their new places (not under reduced motion). On a mix page the index keeps number, title and chart.

Livicee's Overview uses a 72px-high night chart in an 88px supporting band (64px in an 80px band on phones) above full-width named cards. Each card shows its phase, 24px title, 14px style and arrow; phones use 22px titles and 12px style. A mix not yet placed in the night follows as an ordinary entry card. Sample collection remains in the desktop footer. Hover and keyboard focus use the card surface, border and soft-pink ink; the chart emphasizes the corresponding phase. Titles, arrows and hit targets stay still. Mix titles here and in the Mixes list are 20px with 16px summaries, matching project cards. Reduced motion removes interaction transitions; both DJ opening phrases use Instrument Sans, with the second phrase pink.

A mix page opens on a deck: a framed player whose bar names the loaded mix and its length. With measured recording metadata, the waveform is mirrored bars around a centre line, pink where played and grey ahead, with a glowing playhead that follows the native player; clicking the waveform seeks. A link or an unmeasured file shows a flat centre line instead; no shape is invented. "In the night" follows at full width with the stretch marked pink on the ruler, then her listening notes and the facts.

### Audio and contact

Approved recordings use native controls, squared off where the browser allows, with no autoplay and a visible loading-failure message. Missing recordings state that a recording has not been supplied. Mix cover art, when supplied, sits square under the mix title (up to 360px) with a one-pixel line border, and as a 44px thumbnail beside the title in the crate; a failed thumbnail simply goes. SoundCloud mixes have a play control on each crate row (under the catalogue number) and on the mix page, beside an Open on SoundCloud link. Pressing play opens a slim player bar in the site's own style over the footer (above the dock on phones): play/pause, title linking to the mix, a pink hairline scrubber, time, a SoundCloud link and close. It keeps playing across pages and identities; close stops it and returns focus to the set's play control. Nothing from SoundCloud loads before the first play. Mixcloud mixes keep a secondary Load player button; that frame loads only on click and never autoplays. Contact uses the confirmed address, distinct professional/booking mail subjects and an accessible copy confirmation. Professional copy describes enquiries without advertising job availability, matching the confirmed header status “Currently: Implementation Success Manager @ Storyblok”. Livicee retains “Available for Bookings” and its supplied SoundCloud/Instagram links; both profiles are editable in site.json. The public workspace has no simulated editor, publishing or playback controls.

## Do's and Don'ts

### Do:

- **Do** retain one shared Content/Livicee shell, explicit selected dataset and Content's Experience (CV) section.
- **Do** express Livicee through shared pink, type scale, named mix rows and source-derived glyph rhythm while keeping navigation and reading steady.
- **Do** preserve the portrait's viewport-based drawing scale and anchor as collection and document surfaces overlap it.
- **Do** keep the quiet ASCII lattice visible beneath transparent reading surfaces and mask only the brighter portrait to preserve contrast.
- **Do** keep main copy readable, action labels at 14px, compact phone navigation at its documented sizes and the sample status in its single desktop-footer location.
- **Do** show original evidence diagrams directly and preserve keyboard and touch access to their documents.
- **Do** retain reduced-motion, idle, hidden-document and failure behavior when changing the renderer.
- **Do** keep provisional content and artwork clearly identified until approved.

### Don't:

- **Don't** use generated mockups or archived experiments as general layout authority. The restored Pixel Experience row structure is an explicit exception requested by Livi.
- **Don't** turn the portrait into a tiny navigation thumbnail, framed card or empty full-screen hero.
- **Don't** put essential descriptions behind expansion controls to fit a denser layout.
- **Don't** add ambient glyph motion or blocking curtains to ordinary search, filtering or record navigation.
- **Don't** restore retired collection bars or route-specific portrait shifts. Experience is the explicitly requested CV destination at `#/experience`.
- **Don't** reintroduce pixel-cell borders, an invented logo, fabricated outcomes, likeness details or recordings.
- **Don't** replace native media or honest missing-content states with simulated controls.
