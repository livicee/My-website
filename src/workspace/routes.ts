import { normalizeQuery } from './query';
import { all, get, recordPath, related } from './content';
import { collectionPath, datasetFor, evidencePath, sectionFor, sectionPath, type ListedCollection, type Route, type ContentRecord, type DatasetId } from './model';
const aliases: Record<string, string> = Object.assign(Object.create(null), {
    'proj-dam-migration': 'dam-migration', 'omnichannel-dam-migration': 'dam-migration',
    'proj-sanity-headless': 'structured-content', 'headless-cms-architecture': 'structured-content',
    'proj-taxonomy-governance': 'shared-language', 'enterprise-taxonomy-governance': 'shared-language',
    'proj-editorial-workflow': 'editorial-workflow', 'editorial-workflow-automation': 'editorial-workflow',
    'art-dam-schema': 'asset-model', 'cap-dam-arch': 'asset-operations', 'plat-sanity': 'headless-cms',
    'exp-01': 'content-operations', 'mix-01': 'after-hours', 'evt-01': 'intimate-session', 'loc-london': 'london',
    'art-sanity-model': 'content-schema', 'art-gov-matrix': 'governance-matrix', 'art-workflow-pipeline': 'editorial-flow',
    'cap-cms-arch': 'content-modelling', 'cap-taxonomy': 'taxonomy', 'cap-governance': 'taxonomy', 'cap-content-ops': 'workflow-design',
    'plat-bynder': 'asset-manager', 'plat-contentful': 'headless-cms', 'exp-02': 'platform-specialist', 'exp-03': 'editorial-operations',
    'mix-02': 'open-air', 'mix-03': 'night-shift', 'mix-04': 'soft-focus', 'evt-02': 'open-air-session', 'evt-03': 'brand-gathering', 'evt-04': 'regular-residency',
    'loc-melbourne': 'melbourne', 'loc-brisbane': 'brisbane',
    // Known records not carried into this fresh dataset resolve to their collection, never to an unrelated record.
    'cap-localization': '', 'plat-algolia': '', 'plat-figma': '', 'evt-05': '', 'evt-06': '', 'loc-ibiza': '', 'loc-sydney': '', 'loc-nyc': '',
});
// The first build's record types, by the URL segment each now lives under.
const legacyTypes: Record<string, string> = { caseStudy: 'work', artefact: 'artefacts', capability: 'capabilities', platform: 'platforms', experienceRole: 'experience', mix: 'mixes', eventBrand: 'events', locationRecord: 'locations' };
/** Categories this build retired, and the list each folded into. */
const retired: Record<string, ListedCollection> = Object.assign(Object.create(null), { capabilities: 'work', platforms: 'work', events: 'mixes', locations: 'mixes' });
const segmentPath = (segment: string) => ['mixes', 'events', 'locations'].includes(segment) ? `/livicee/${segment}` : `/${segment}`;
export function parseRoute(hash: string): Route {
    const clean = hash.replace(/^#/, '') || '/';
    const qIndex = clean.indexOf('?');
    let path = (qIndex < 0 ? clean : clean.slice(0, qIndex)).replace(/\/+$/, '') || '/';
    const query = new URLSearchParams(qIndex < 0 ? '' : clean.slice(qIndex + 1));
    const rawRoot = path.split('/')[1];
    const fallbackDataset = rawRoot === 'livicee' || rawRoot === 'sound' ? 'sound' : 'production';
    let segments: string[];
    try {
        segments = path.split('/').filter(Boolean).map(decodeURIComponent);
    }
    catch {
        return { dataset: fallbackDataset, page: 'not-found', path, query };
    }
    if (segments[0] === 'production' || segments[0] === 'sound') {
        const sound = segments[0] === 'sound';
        const type = segments[1];
        const segment = Object.hasOwn(legacyTypes, type) ? legacyTypes[type] : undefined;
        if (segments.length > 3)
            return { dataset: sound ? 'sound' : 'production', page: 'not-found', path, query };
        if (segment) {
            const id = aliases[segments[2]] ?? segments[2];
            path = segmentPath(segment) + (id ? `/${id}` : '');
        }
        else if (['siteHome', 'liviceeHome'].includes(type) || !type)
            path = sound ? '/livicee' : '/';
        else if (type === 'aboutDoc')
            path = sound ? '/livicee/about' : '/about';
        else if (['contactDoc', 'djBooking'].includes(type))
            path = sound ? '/livicee/contact' : '/contact';
        else
            return { dataset: sound ? 'sound' : 'production', page: 'not-found', path, query };
        segments = path.split('/').filter(Boolean);
    }
    if (path === '/home')
        path = '/';
    const dataset = segments[0] === 'livicee' ? 'sound' : 'production';
    const base: Route = { dataset, page: 'not-found', path, query };
    if (path === '/' || path === '/livicee')
        return { ...base, page: 'home' };
    if (path === '/about' || path === '/livicee/about')
        return { ...base, page: 'about' };
    if (path === '/contact' || path === '/livicee/contact')
        return { ...base, page: 'contact' };
    const relative = dataset === 'sound' ? segments.slice(1) : segments;
    // Saved links to retired categories lead to the list they folded into.
    const folded = retired[relative[0]];
    if (folded && datasetFor(folded) === dataset)
        return { ...base, page: 'collection', path: collectionPath(folded), collection: folded, query: new URLSearchParams() };
    // Experience is one CV page; saved role links open it.
    if (dataset === 'production' && relative[0] === 'experience')
        return { ...base, page: 'experience', path: '/experience', query: new URLSearchParams() };
    const valid: ListedCollection[] = dataset === 'sound' ? ['mixes'] : ['work', 'artefacts'];
    const collection = valid.find(c => c === relative[0]);
    if (!collection)
        return base;
    base.query = normalizeQuery(query, collection === 'work' && relative[2] === 'artefacts' ? 'artefacts' : collection);
    if (collection === 'work' && relative[2] === 'artefacts') {
        const project = get('work', aliases[relative[1]] ?? relative[1]);
        if (!project || relative.length > 4)
            return base;
        if (!relative[3])
            return { ...base, page: 'collection', collection: 'artefacts', project };
        const evidence = get('artefacts', aliases[relative[3]] ?? relative[3]);
        if (!evidence || !project.relations.artefacts?.includes(evidence.id))
            return base;
        return { ...base, page: 'record', collection: 'artefacts', project, record: evidence };
    }
    if (relative.length > 2)
        return base;
    if (!relative[1])
        return { ...base, page: 'collection', collection };
    const resolvedId = aliases[relative[1]] ?? relative[1];
    if (resolvedId === '')
        return { ...base, page: 'collection', collection, path: collectionPath(collection) };
    const item = get(collection, resolvedId);
    if (!item)
        return base;
    // Evidence opens inside a project that uses it, so its list, neighbours and way back are that project's.
    const project = collection === 'artefacts' ? related(item, 'work')[0] : undefined;
    if (project)
        return { ...base, page: 'record', collection, project, record: item, path: evidencePath(project, item) };
    return { ...base, page: 'record', collection, record: item, path: recordPath(item) };
}
/** The address the site itself uses for a route; a typed, saved or legacy one may differ. */
export function canonicalHash(route: Route): string | undefined {
    return route.page === 'not-found' ? undefined : hashFor(route.path, route.query);
}
export function hashFor(path: string, query = new URLSearchParams()): string {
    return `#${path}${query.size ? `?${query.toString()}` : ''}`;
}
/** Switch persona within the current section; records have no cross-mode equivalent. */
export function modeDestination(route: Route, target: DatasetId): string {
    if (target === route.dataset)
        return hashFor(route.path, route.query);
    return hashFor(sectionPath(sectionFor(route), target));
}
export function libraryPath(route: Route): string {
    if (route.project)
        return evidencePath(route.project);
    return route.collection ? collectionPath(route.collection) : sectionPath('work', route.dataset);
}
export function contextPath(record: ContentRecord, route: Route): string {
    return record.collection === 'artefacts' && route.project ? evidencePath(route.project, record) : recordPath(record);
}
export function listRecords(route: Route) {
    if (!route.collection)
        return [];
    const source = all(route.collection);
    return route.project ? source.filter(r => route.project!.relations.artefacts?.includes(r.id)) : source;
}
