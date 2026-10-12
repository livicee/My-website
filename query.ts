import type { Collection, FacetKey } from './model';
export const facetDefinitions: Record<Collection, [
    FacetKey,
    string
][]> = {
    // Livi's brief: skills are evidence-backed queries. A project's tags are the capabilities it proves.
    work: [['tag', 'Capability'], ['year', 'Year']],
    mixes: [['style', 'Style'], ['year', 'Year']],
    artefacts: [['type', 'Evidence type']],
    // Roles have no list page to filter.
    experience: [],
};
/** Orders a collection can be listed in besides its own (search.ts `isNightOrder`). */
const orders: Partial<Record<Collection, string[]>> = { mixes: ['night'] };
export function normalizeQuery(query: URLSearchParams, collection: Collection): URLSearchParams {
    const allowed = new Set<string>(['q', ...facetDefinitions[collection].map(([key]) => key)]);
    const normalized = new URLSearchParams();
    for (const [key, value] of query) {
        if (key === 'order') {
            if (orders[collection]?.includes(value) && !normalized.has('order')) normalized.append(key, value);
            continue;
        }
        // Any record can be inspected as its content model, and the view follows the visitor between records.
        if (key === 'view') {
            if (value === 'model' && !normalized.has('view')) normalized.append(key, value);
            continue;
        }
        if (!allowed.has(key) || !value || normalized.getAll(key).includes(value))
            continue;
        if (key === 'q' && normalized.has('q'))
            continue;
        normalized.append(key, value);
    }
    return normalized;
}
