import { all, recordPath, related, site } from './content';
import { collectionNames, collectionPath, evidencePath, sectionPath, type ContentRecord, type Route } from './model';
import { libraryPath, contextPath, hashFor } from './routes';
import { facetsFor, isNightOrder, results, selectedCount } from './search';
import { escape, factsList, icon, arrow, link, nightRuler, plural } from './html';
import { audioPlayer } from './audio';
import { playButton } from './player';
import { entryCard } from './cards';
import { evidencePreview } from './evidencePreviews';
import { nightChart, phaseLabel } from './night';
import { formatLength } from './waveform';

/** The heading a collection list carries: the identity's label for Projects or Mixes, "Project evidence" inside a project. */
export function collectionTitle(route: Route): string {
    const collection = route.collection;
    return route.project ? 'Project evidence' : collection === 'work' ? site.identities.production.workLabel : collection === 'mixes' ? site.identities.sound.workLabel : collection ? collectionNames[collection] : 'collection';
}
/** The Projects list filtered to one capability. */
const tagHref = (tag: string) => hashFor(collectionPath('work'), new URLSearchParams([['tag', tag]]));

export function filters(route: Route): string {
    return facetsFor(route).map(facet => `<fieldset class="filter-group"><legend>${facet.label}</legend>${facet.options.map(opt => `<label><input type="checkbox" name="${facet.key}" value="${escape(opt.value)}" ${route.query.getAll(facet.key).includes(opt.value) ? 'checked' : ''}><span>${escape(opt.label)}</span><span class="chip-count" aria-hidden="true">${opt.count}</span></label>`).join('')}</fieldset>`).join('');
}
/** A project's capabilities, each opening the projects that prove it. */
function capabilities(r: ContentRecord): string {
    if (r.collection !== 'work' || !r.tags.length) return '';
    const count = (tag: string) => all('work').filter(p => p.tags.includes(tag)).length;
    return `<section class="capabilities" aria-label="Capabilities"><h2>Capabilities</h2><div class="query-line">${r.tags.map(tag => `<a class="query-chip" href="${escape(tagHref(tag))}" aria-label="${escape(`${tag}: ${plural(count(tag), 'project')}`)}"><span>${escape(tag)}</span><span class="chip-count" aria-hidden="true">${count(tag)}</span></a>`).join('')}</div></section>`;
}
export function library(route: Route): string {
    const collection = route.collection!;
    const list = results(route);
    const title = collectionTitle(route);
    const isRecord = route.page === 'record';
    const facets = facetsFor(route);
    const resultLabel = collection === 'mixes' ? plural(list.length, 'mix', 'mixes') : plural(list.length, collection === 'work' ? 'project' : 'record');
    return `<div class="${isRecord ? 'has-record' : 'collection-view'}"><div class="library-surface">
      <section class="collection-index" aria-label="${escape(title)} index"><div class="index-header"><${isRecord ? 'h2' : 'h1'}>${escape(title)}</${isRecord ? 'h2' : 'h1'}><div class="index-tools"><div class="index-status"><span id="result-status" aria-live="polite">${resultLabel}</span></div><div class="index-actions">${[...route.query.keys()].some(key => key !== 'order' && key !== 'view') ? `<button class="clear-filters" data-clear aria-label="Clear search and filters">Clear ${icon('close')}</button>` : ''}${facets.length ? `<button class="filter-trigger" data-filters aria-label="Filter ${escape(title)}">${icon('filters')}<span>Filter</span>${selectedCount(route.query, collection) ? `<b>${selectedCount(route.query, collection)}</b>` : ''}</button>` : ''}</div></div></div>
      ${isRecord ? `<div class="index-records" id="index-records">${list.length ? list.map(r => indexRecord(r, route)).join('') : '<div class="index-empty">No matching records.<br><button class="text-link" data-clear>Clear the filters</button></div>'}</div>` : ''}</section>
      <article id="main" class="record-surface" tabindex="-1">${isRecord ? recordDetail(route.record!, route) : collectionOverview(route, list)}</article>
    </div></div>`;
}
function collectionOverview(route: Route, list: ContentRecord[]): string {
    const collection = route.collection!;
    const records = collection === 'mixes' ? crate(list, route) : `<div class="overview-records">${list.map(r => overviewItem(r, route)).join('')}</div>`;
    return `<div class="collection-overview">${collection === 'mixes' && list.length > 1 ? orderLine(route) : ''}${route.project ? `<a class="text-link" href="${escape(hashFor(recordPath(route.project)))}" data-return>${icon('back')} Back to ${escape(route.project.title)}</a>` : ''}${list.length ? records : `<div class="empty-results">${icon('search')}<h2>No matches.</h2><button class="button" data-clear>Clear search & filters</button></div>`}</div>`;
}
/** A mix keeps its catalogue number (its place in the collection) whatever the order or filter. */
const crateNumber = (r: ContentRecord) => String(all('mixes').findIndex(m => m.id === r.id) + 1).padStart(2, '0');
/** Two views of the crate: as listed, or through the night. Toggles in place, like the capability queries. */
function orderLine(route: Route): string {
    const nightOrdered = isNightOrder(route);
    const toggle = (on: boolean, label: string) => {
        const query = new URLSearchParams(route.query);
        if (on) query.set('order', 'night'); else query.delete('order');
        return `<button type="button" class="query-chip" data-query="${escape(hashFor(collectionPath('mixes'), query))}" data-reorder aria-pressed="${on === nightOrdered}">${escape(label)}</button>`;
    };
    return `<div class="query-line order-line" role="group" aria-label="Order the mixes"><div class="segment-control">${toggle(false, 'As listed')}${toggle(true, 'Through the night')}</div></div>`;
}
/** Livicee's library: numbered like a crate, each row lighting its stretch of the night across a shared ruler. */
function crate(list: ContentRecord[], route: Route): string {
    return `<div class="crate"><div class="crate-head" aria-hidden="true"><span>#</span>${nightRuler()}<span>Time</span></div><ol class="crate-rows">${list.map(r => `<li data-key="${escape(r.id)}">${playButton(r, 'crate-play')}${crateRow(r, route)}</li>`).join('')}</ol></div>`;
}
function crateRow(r: ContentRecord, route: Route): string {
    // A length comes from a measured file or the provider's own figure; unknown lengths show the empty time, unread.
    const length = r.audio?.duration ? formatLength(r.audio.duration) : '';
    const place = r.night ? `<span class="visually-hidden">. ${escape(phaseLabel(r.night))} in the night.</span>` : '';
    // Cover art sits beside the title; the title names it, so it is decorative here.
    const art = r.artwork ? `<img class="record-thumb" src="${escape(r.artwork.src)}" alt="" width="44" height="44" loading="lazy" decoding="async" data-media>` : '';
    return link(contextPath(r, route), `<span class="crate-no" aria-hidden="true">${crateNumber(r)}</span><span class="crate-title">${art}<strong>${escape(r.title)}</strong><span class="crate-meta">${escape(r.tags.slice(0, 2).join(' · '))}</span></span><span class="crate-summary">${escape(r.summary)}${place}</span>${nightChart(r.night, 'night-lane')}<span class="crate-time">${length ? `<span class="visually-hidden">Length </span>${escape(length)}` : '<span aria-hidden="true">--:--</span>'}</span>`, r.artwork ? 'crate-row has-art' : 'crate-row', route.query);
}
/** The record page's index: mixes keep their number and lane, so the list still reads as the crate. */
function indexRecord(r: ContentRecord, route: Route): string {
    const text = r.collection === 'mixes'
        ? `<span class="index-record-copy index-mix"><strong><span class="crate-no" aria-hidden="true">${crateNumber(r)}</span>${escape(r.title)}</strong>${nightChart(r.night, 'night-lane')}</span>`
        : `<span class="index-record-copy"><strong>${escape(r.title)}</strong><span>${escape(r.subtitle)}</span></span>`;
    return link(contextPath(r, route), `${text}${icon('chevron')}`, `index-record ${r.id === route.record?.id ? 'selected' : ''}`, route.query);
}
function overviewItem(r: ContentRecord, route: Route): string {
    return link(contextPath(r, route), entryCard(r), 'overview-item', route.query);
}
function recordDetail(r: ContentRecord, route: Route): string {
    const peers = results(route);
    const index = peers.findIndex(item => item.id === r.id);
    const prev = index >= 0 ? peers[index - 1] : undefined;
    const next = index >= 0 ? peers[index + 1] : undefined;
    const evidence = related(r, 'artefacts');
    // Evidence connects back to the projects that use it.
    const projects = r.collection === 'artefacts' ? related(r, 'work') : [];
    const mix = r.collection === 'mixes';
    // A mix's artwork is a square cover; a project's or evidence record's image is a full-width 16:9 picture.
    const cover = !r.artwork ? '' : mix
        ? `<figure class="mix-cover"><img src="${escape(r.artwork.src)}" alt="${escape(r.artwork.alt)}" width="640" height="640" loading="lazy" decoding="async" data-media></figure>`
        : `<figure class="record-cover"><img src="${escape(r.artwork.src)}" alt="${escape(r.artwork.alt)}" width="1600" height="900" loading="lazy" decoding="async" data-media></figure>`;
    const facts = factsList(r.facts);
    const story = r.story?.length ? `<div class="story"><h2 class="visually-hidden">${r.collection === 'work' ? 'Inside the project' : mix ? 'Listening notes' : 'About this record'}</h2>${r.story.map(block => `<div class="story-block"><span class="story-label">${escape(block.label)}</span><h3>${escape(block.title)}</h3><p>${escape(block.body)}</p></div>`).join('')}</div>` : '';
    // A mix page is a deck: the recording first, then where it sits in the night, then her notes.
    const body = mix ? `${cover}${audioPlayer(r)}${nightPlace(r)}${story}${facts}` : `${cover}${facts}${capabilities(r)}${r.evidence ? evidenceView(r) : ''}${story}`;
    const linked = `${evidence.length ? `<section class="project-evidence"><div class="section-heading"><h2>Evidence</h2>${link(evidencePath(r), 'View all ' + arrow(), 'text-link')}</div>${evidencePreview(evidence[0], evidencePath(r, evidence[0]))}<div class="evidence-links">${evidence.map(item => link(evidencePath(r, item), `${icon('document')}<span>${escape(item.title)}<small>${escape(item.subtitle)}</small></span>${arrow()}`, 'relation-row')).join('')}</div></section>` : ''}
      ${projects.length ? `<section class="connections"><h2 class="visually-hidden">Connected records</h2><div class="connection-group"><h3 class="visually-hidden">${collectionNames.work}</h3>${projects.map(item => link(recordPath(item), `${icon('link')}<span>${escape(item.title)}</span>${icon('arrow')}`, 'relation-row')).join('')}</div></section>` : ''}`;
    // Mixes are for listening, not inspecting: they have no Model view, even from an old ?view=model address.
    const inspecting = !mix && route.query.get('view') === 'model';
    return `<div class="record-detail" data-record-id="${escape(r.id)}"><div class="detail-topline"><a class="back-link" href="${escape(hashFor(libraryPath(route), route.query))}" data-return>${icon('back')} ${escape(r.collection === 'work' ? site.identities.production.workLabel : mix ? site.identities.sound.workLabel : collectionNames.artefacts)}</a></div><div class="record-heading"><h1>${escape(r.title)}</h1><p class="lede">${escape(r.summary)}</p>${docMeta(r)}</div>
      ${mix ? '' : viewLine(r, route)}<div class="record-body"><div class="record-document"${inspecting ? ' hidden' : ''}>${body}${linked}</div>${inspecting ? modelView(r) : ''}</div>
      <nav class="record-pagination" aria-label="Browse records">${prev ? link(contextPath(prev, route), icon('back') + '<span><small>Previous</small>' + escape(prev.title) + '</span>', '', route.query) : '<span></span>'}${next ? link(contextPath(next, route), '<span><small>Next</small>' + escape(next.title) + '</span>' + icon('arrow'), '', route.query) : '<span></span>'}</nav></div>`;
}
/**
 * Document or Model: the same record read as a page, or inspected as the CMS stores it. In place, like the other toggles.
 * The document stays in the page, hidden, while the model shows, so a playing mix or a loaded player carries on.
 */
function viewLine(r: ContentRecord, route: Route): string {
    const inspecting = route.query.get('view') === 'model';
    const toggle = (model: boolean, label: string) => {
        const query = new URLSearchParams(route.query);
        if (model) query.set('view', 'model'); else query.delete('view');
        return `<button type="button" class="query-chip" data-query="${escape(hashFor(contextPath(r, route), query))}" data-flip aria-pressed="${model === inspecting}">${label}</button>`;
    };
    return `<div class="query-line view-line" role="group" aria-label="Show this record as"><div class="segment-control">${toggle(false, 'Document')}${toggle(true, 'Model')}</div></div>`;
}
/** Read-only Model summary of a project's or evidence's fields, types and values; references open their records. Mixes have no Model view. */
function modelView(r: ContentRecord): string {
    const kind = r.collection === 'work' ? 'project' : r.collection === 'artefacts' ? 'evidence' : r.collection;
    const refs = (items: ContentRecord[], path: (item: ContentRecord) => string) => items.map(item => link(path(item), escape(item.title), 'query-chip model-ref')).join('');
    const rows: [string, string, string][] = [
        ['_type', 'document', escape(kind)],
        ['_id', 'slug', `<code>${escape(r.id)}</code>`],
        ['title', 'string · required', escape(r.title)],
        ...(r.subtitle ? [['subtitle', 'string', escape(r.subtitle)] as [string, string, string]] : []),
        ['summary', 'text', escape(r.summary)],
        ['year', 'string', escape(r.year)],
    ];
    if (r.tags.length) rows.push(['tags', `string[] · ${r.tags.length}`, r.tags.map(tag => r.collection === 'work'
        ? `<a class="query-chip model-ref" href="${escape(tagHref(tag))}">${escape(tag)}</a>` : `<span class="model-tag">${escape(tag)}</span>`).join('')]);
    if (r.facets?.type) rows.push(['type', 'string', escape(r.facets.type)]);
    if (r.facts.length) rows.push(['facts', `object[] · ${r.facts.length}`, factsList(r.facts, 'model-facts')]);
    if (r.story?.length) rows.push(['story', `block[] · ${r.story.length}`, r.story.map(block => `<span class="model-block"><small>${escape(block.label)}</small>${escape(block.title)}</span>`).join('')]);
    if (r.evidence) rows.push(['body', `object · ${r.evidence.kind}`, `${escape(r.evidence.title)} <span class="model-none">${r.evidence.rows.length} rows</span>`]);
    const evidence = related(r, 'artefacts'), roles = related(r, 'experience'), projects = related(r, 'work');
    if (evidence.length) rows.push(['evidence', `reference[] → evidence · ${evidence.length}`, refs(evidence, item => evidencePath(r, item))]);
    if (roles.length) rows.push(['roles', `reference[] → role · ${roles.length}`, refs(roles, () => sectionPath('experience', 'production'))]);
    if (projects.length) rows.push(['projects', `reference[] → project · ${projects.length}`, refs(projects, recordPath)]);
    rows.push(['sample', 'boolean', String(r.sample)]);
    return `<section class="model-view" aria-label="Content model"><table class="model-table"><thead><tr><th scope="col">Field</th><th scope="col">Value</th></tr></thead><tbody>${rows.map(([field, type, value]) => `<tr><th scope="row"><code>${escape(field)}</code><span class="model-type">${escape(type)}</span></th><td>${value}</td></tr>`).join('')}</tbody></table></section>`;
}
/** Human context for the document. Machine identifiers remain available in Model view. */
function docMeta(r: ContentRecord): string {
    const roles = related(r, 'experience').length, projects = related(r, 'work').length, evidence = related(r, 'artefacts').length;
    const parts = r.collection === 'work' ? ['Project', ...(evidence ? [plural(evidence, 'evidence', 'evidence')] : []), ...(roles ? [plural(roles, 'role')] : [])]
        : r.collection === 'artefacts' ? ['Evidence', ...(r.facets?.type ? [r.facets.type] : []), ...(projects ? [`used in ${plural(projects, 'project')}`] : [])]
        : [`Mix ${crateNumber(r)}`, ...(r.night ? [phaseLabel(r.night)] : [])];
    return `<p class="doc-meta">${parts.map((part, i) => `<span${i ? '' : ' class="doc-type"'}>${escape(part)}</span>`).join(' ')}</p>`;
}
/** The whole night at full width, this mix's stretch lit: her "think in hours, not tracks", drawn. */
function nightPlace(r: ContentRecord): string {
    if (!r.night) return '';
    return `<section class="night-place" aria-label="Place in the night"><div class="section-heading"><h2>In the night</h2><span class="night-stretch">${escape(phaseLabel(r.night))}</span></div><div class="night-chart">${nightRuler(r.night)}${nightChart(r.night, 'night-big')}</div></section>`;
}
function evidenceView(r: ContentRecord): string {
    const evidence = r.evidence!;
    return `<section class="evidence-view"><h2>${escape(evidence.title)}</h2>${evidence.kind === 'workflow' ? `<ol class="workflow-steps">${evidence.rows.map(row => `<li><span class="step-no">${escape(row[0])}</span><div><h3>${escape(row[1])}</h3><p>${escape(row[2])}</p></div></li>`).join('')}</ol>` : `<div class="evidence-table-scroll" role="region" tabindex="0" aria-label="${escape(evidence.title)} table"><table class="evidence-table"><thead><tr>${evidence.columns.map(c => `<th scope="col">${escape(c)}</th>`).join('')}</tr></thead><tbody>${evidence.rows.map(row => `<tr>${row.map((cell, i) => i ? `<td>${escape(cell)}</td>` : `<th scope="row"><code>${escape(cell)}</code></th>`).join('')}</tr>`).join('')}</tbody></table></div>`}</section>`;
}
