import { related } from './content';
import { arrow, escape, icon, plural } from './html';
import { evidenceSvg, svgSource } from './evidencePreviews';
import type { ContentRecord } from './model';

/** The glyph a content type carries, as a CMS shows it beside every entry. */
const typeIcon = (record: ContentRecord) => record.collection === 'mixes' ? 'sound' : record.collection === 'artefacts' ? 'grid' : record.collection === 'experience' ? 'experience' : 'document';

/**
 * The record's own image (its `artwork` in the JSON) as its thumbnail. Without one, a project borrows its first
 * evidence record's image, then falls back to an evidence diagram, so a card shows the work before it is opened.
 * Records with nothing to show keep the type tile alone.
 */
function thumbnail(record: ContentRecord): string {
    const evidence = related(record, 'artefacts');
    const artwork = record.artwork ?? evidence.find(item => item.artwork)?.artwork;
    if (artwork) return `<img class="entry-art" src="${escape(artwork.src)}" alt="" width="1600" height="900" loading="lazy" decoding="async" data-media>`;
    const source = record.evidence ? record : evidence.find(item => item.evidence?.rows.length);
    const svg = source ? evidenceSvg(source) : '';
    return svg ? `<img src="${svgSource(svg)}" alt="" width="600" height="420" loading="lazy" decoding="async">` : '';
}

/** The inside of an entry card: thumbnail and type, field label, title and summary, then tags and counts. Set inside a link. */
export function entryCard(record: ContentRecord): string {
    const evidence = related(record, 'artefacts').length;
    const chips = record.tags.slice(0, 3).map(tag => `<span class="chip">${escape(tag)}</span>`).join('');
    const count = record.collection === 'work' ? `<span class="entry-count">${icon('document')}<span aria-hidden="true">${evidence}</span><span class="visually-hidden">${escape(plural(evidence, 'evidence record'))}</span></span>` : '';
    return `<span class="entry-media"><span class="entry-type" aria-hidden="true">${icon(typeIcon(record))}</span>${thumbnail(record)}${count}</span>`
        + `<span class="entry-body"><span class="entry-eyebrow">${escape(record.subtitle)}</span><span class="row-title"><strong>${escape(record.title)}</strong><span>${escape(record.summary)}</span></span>`
        + (chips ? `<span class="entry-foot">${chips}</span>` : '') + `</span>${arrow()}`;
}
