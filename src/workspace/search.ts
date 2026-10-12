import { facetDefinitions } from './query';
import { related } from './content';
import { type Collection, type ContentRecord, type Facet, type FacetKey, type Route } from './model';
import { listRecords } from './routes';
import { NIGHT, phaseIndex } from './night';
const documents = new WeakMap<ContentRecord, string>();
export function searchable(record: ContentRecord): string {
    const cached = documents.get(record);
    if (cached !== undefined)
        return cached;
    const linked = Object.keys(record.relations).flatMap(c => related(record, c as Collection)).map(r => `${r.title} ${r.subtitle}`).join(' ');
    const text = [record.title, record.subtitle, record.summary, ...record.tags, record.year, linked, ...record.facts.map(f => f.value)].join(' ').toLowerCase();
    documents.set(record, text);
    return text;
}
export function valuesFor(record: ContentRecord, key: FacetKey): string[] {
    if (key === 'year')
        return [record.year];
    if (key === 'tag')
        return record.tags;
    const value = record.facets?.[key];
    return value ? [value] : [];
}
export function matches(record: ContentRecord, query: URLSearchParams): boolean {
    const terms = (query.get('q') ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const text = terms.length ? searchable(record) : '';
    if (!terms.every(t => text.includes(t)))
        return false;
    return facetDefinitions[record.collection].every(([key]) => {
        const selected = query.getAll(key);
        return !selected.length || selected.some(value => valuesFor(record, key).includes(value));
    });
}
/** Mixes can be listed as supplied or through the night, earliest stretch first; unplaced mixes keep their order after. */
export const isNightOrder = (route: Route) => route.collection === 'mixes' && route.query.get('order') === 'night';
export function results(route: Route): ContentRecord[] {
    const list = listRecords(route).filter(r => matches(r, route.query));
    if (!isNightOrder(route)) return list;
    const place = (r: ContentRecord) => r.night ? phaseIndex(r.night) : NIGHT.length;
    return list.map((r, i) => ({ r, i })).sort((a, b) => place(a.r) - place(b.r) || a.i - b.i).map(({ r }) => r);
}
export function facetsFor(route: Route): Facet[] {
    if (!route.collection)
        return [];
    const source = listRecords(route);
    return facetDefinitions[route.collection].map(([key, label]) => {
        const selected = route.query.getAll(key);
        const values = [...new Set([...source.flatMap(r => valuesFor(r, key)), ...selected])].sort();
        const options = values.map(value => ({ value, label: value, count: source.filter(r => valuesFor(r, key).includes(value)).length }));
        // Capabilities lead with the ones the most work proves.
        if (key === 'tag') options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        return { key, label, options };
    }).filter(facet => facet.options.length > 1 || route.query.has(facet.key));
}
/** The query with its filter choices replaced by `chosen`; the search term, order and view stay as they were. */
export function withFacets(query: URLSearchParams, collection: Collection, chosen: [string, string][]): URLSearchParams {
    const facets = new Set<string>(facetDefinitions[collection].map(([key]) => key));
    const next = new URLSearchParams([...query].filter(([key]) => !facets.has(key)));
    for (const [key, value] of chosen) next.append(key, value);
    return next;
}
export function selectedCount(query: URLSearchParams, collection: Collection): number {
    const keys = facetDefinitions[collection].map(([key]) => key);
    return new Set([...query.entries()].filter(([key]) => keys.includes(key as FacetKey)).map(([key, value]) => `${key}=${value}`)).size;
}
