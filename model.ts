import type { MixEmbed } from './embeds';
import type { NightPhase } from './night';
export type DatasetId = 'production' | 'sound';
export type Collection = 'work' | 'artefacts' | 'experience' | 'mixes';
/** Collections with a list page. Roles are read on the CV page instead. */
export type ListedCollection = Exclude<Collection, 'experience'>;
interface StoryBlock {
    label: string;
    title: string;
    body: string;
}
export type Evidence = {
    kind: 'workflow';
    title: string;
    rows: [
        string,
        string,
        string
    ][];
} | {
    kind: 'schema' | 'table';
    title: string;
    columns: string[];
    rows: string[][];
};
export type FacetKey = 'year' | 'style' | 'type' | 'tag';
export interface ContentRecord {
    id: string;
    slug: string;
    collection: Collection;
    title: string;
    subtitle: string;
    summary: string;
    year: string;
    tags: string[];
    sample: boolean;
    facets?: Partial<Record<'style' | 'type', string>>;
    facts: {
        label: string;
        value: string;
    }[];
    relations: Partial<Record<Collection, string[]>>;
    story?: StoryBlock[];
    metrics?: {
        value: string;
        label: string;
    }[];
    evidence?: Evidence;
    audio?: {
        kind: 'file';
        src: string;
        /** Measured loudness peaks (0 to 1) for this file; the only source of a waveform. */
        peaks?: number[];
        /** Seconds, measured from the file. */
        duration?: number;
    } | ({
        kind: 'embed';
        /** Seconds, as the provider reports for this recording. */
        duration?: number;
    } & MixEmbed);
    /** Mixes: the stretch of a night the selection is for. */
    night?: NightPhase;
    /** Optional cover art (mixes), shown on the record and as its list thumbnail. */
    artwork?: {
        src: string;
        alt: string;
    };
}
interface RouteBase {
    dataset: DatasetId;
    path: string;
    query: URLSearchParams;
}
export type Route = RouteBase & ({
    page: 'home' | 'about' | 'contact' | 'experience' | 'not-found';
    collection?: never;
    record?: never;
    project?: never;
} | {
    page: 'collection';
    collection: ListedCollection;
    record?: never;
    project?: ContentRecord;
} | {
    page: 'record';
    collection: ListedCollection;
    record: ContentRecord;
    project?: ContentRecord;
});
export interface Facet {
    key: FacetKey;
    label: string;
    options: {
        value: string;
        label: string;
        /** Records in the unfiltered collection carrying this value: the evidence behind the option. */
        count: number;
    }[];
}
export const collectionNames: Record<ListedCollection, string> = { work: 'Projects', artefacts: 'Project artefacts', mixes: 'Mixes' };
export function datasetFor(collection: Collection): DatasetId {
    return collection === 'mixes' ? 'sound' : 'production';
}
export function collectionPath(collection: Collection): string {
    return datasetFor(collection) === 'sound' ? `/livicee/${collection}` : `/${collection}`;
}
/** An evidence record's address inside a project that uses it, or that project's evidence list. */
export function evidencePath(project: Pick<ContentRecord, 'slug'>, evidence?: Pick<ContentRecord, 'slug'>): string {
    return `/work/${project.slug}/artefacts${evidence ? `/${evidence.slug}` : ''}`;
}
export type Section = 'home' | 'work' | 'experience' | 'about' | 'contact';
export function sectionFor(route: Route): Section {
    if (route.collection)
        return 'work';
    return route.page === 'about' || route.page === 'contact' || route.page === 'experience' ? route.page : 'home';
}
export function sectionPath(section: Section, dataset: DatasetId): string {
    const sound = dataset === 'sound';
    if (section === 'home')
        return sound ? '/livicee' : '/';
    if (section === 'work')
        return sound ? '/livicee/mixes' : '/work';
    // The CV (public "Work" tab) is Content-only; Livicee's nearest page is About.
    if (section === 'experience')
        return sound ? '/livicee/about' : '/experience';
    return `${sound ? '/livicee' : ''}/${section}`;
}
