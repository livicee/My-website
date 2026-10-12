import { collectionPath, evidencePath, type Collection, type ContentRecord } from './model';
import { mixEmbed } from './embeds';
import { isNightPhase } from './night';
import type { CopyContent, NoticesContent, SiteContent, StoredRecord } from '../content/schema';
import siteJson from '../content/site.json';
import copyJson from '../content/copy.json';
import noticesJson from '../content/notices.json';
import projectsJson from '../content/projects.json';
import evidenceJson from '../content/evidence.json';
import experienceJson from '../content/experience.json';
import mixesJson from '../content/mixes.json';

export const site = siteJson as SiteContent;
export const copy = copyJson as CopyContent;
export const notices = noticesJson as NoticesContent;
export const email = site.email;

/** Content attachments live in src/content/media/. Vite includes matching files in the production build. */
export function mediaUrl(file: string): string | undefined {
    // Serve attachments directly in development; production resolves bundled assets below.
    if (import.meta.env?.DEV) return `/src/content/media/${encodeURIComponent(file)}`;
    const url = new URL(`../content/media/${file}`, import.meta.url).href;
    // Vite resolves a name with no matching file to ".../undefined": treat it as missing, not as a broken link.
    return url.endsWith('/undefined') ? undefined : url;
}

/** Measured peaks must be a bounded list of numbers from 0 to 1. */
const validPeaks = (peaks: unknown): peaks is number[] =>
    Array.isArray(peaks) && peaks.length >= 16 && peaks.length <= 4096 && peaks.every(p => typeof p === 'number' && p >= 0 && p <= 1);

export function hydrate(record: StoredRecord): ContentRecord {
    const { audio, artwork, night, ...stored } = record;
    const art = artwork?.file ? mediaUrl(artwork.file) : undefined;
    const placed: ContentRecord = isNightPhase(night) ? { ...stored, night } : stored;
    const rest: ContentRecord = art
        ? { ...placed, artwork: { src: art, alt: artwork?.alt?.trim() || `Cover art for ${stored.title}` } }
        : placed;
    const file = audio?.file ? mediaUrl(audio.file) : undefined;
    const duration = audio?.duration;
    const length = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? { duration } : {};
    if (file) {
        return {
            ...rest,
            audio: {
                kind: 'file',
                src: file,
                ...(validPeaks(audio?.peaks) ? { peaks: audio.peaks } : {}),
                ...length,
            },
        };
    }
    // An unrecognised link shows the missing-recording state rather than an unknown frame.
    const embed = audio?.link ? mixEmbed(audio.link) : null;
    return embed ? { ...rest, audio: { kind: 'embed', ...embed, ...length } } : rest;
}

export const records: ContentRecord[] = [
    ...(projectsJson as StoredRecord[]),
    ...(evidenceJson as StoredRecord[]),
    ...(experienceJson as StoredRecord[]),
    ...(mixesJson as StoredRecord[]),
].map(hydrate);

export function all(collection: Collection): ContentRecord[] {
    return records.filter(r => r.collection === collection);
}
export function get(collection: Collection, id: string): ContentRecord | undefined {
    return records.find(r => r.collection === collection && (r.id === id || r.slug === id));
}
export function related(record: ContentRecord, collection: Collection): ContentRecord[] {
    return (record.relations[collection] ?? []).map(id => get(collection, id)).filter((r): r is ContentRecord => !!r);
}
export function recordPath(record: ContentRecord): string {
    if (record.collection === 'artefacts') {
        const parent = related(record, 'work')[0];
        if (parent) return evidencePath(parent, record);
    }
    return `${collectionPath(record.collection)}/${record.slug}`;
}
