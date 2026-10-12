import type { ContentRecord } from './model';
import { NIGHT, type NightPhase } from './night';
import { hashFor } from './routes';
export const escape = (text: unknown): string => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const iconPaths: Record<string, string> = {
    document: '<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h6"/>',
    home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/>',
    work: '<rect x="3" y="5" width="18" height="15" rx="1"/><path d="M8 5V3h8v2M3 10h18M9 10v3h6v-3"/>',
    experience: '<path d="M5 3v18M5 6h14M5 12h10M5 18h14"/><path d="M3 6h4M3 12h4M3 18h4"/>',
    about: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    contact: '<rect x="3" y="5" width="18" height="14"/><path d="m3 5 9 8 9-8"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    diagonal: '<path d="M5 19 19 5M5 5h14v14"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    filters: '<path d="M3 7h18M3 17h18M8 3v8M16 13v8"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    play: '<path d="M7 4.5v15L19.5 12z"/>',
    pause: '<path d="M8.5 5v14M15.5 5v14"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    sound: '<path d="M4 9v6M8 5v14M12 2v20M16 6v12M20 9v6"/>',
    link: '<path d="m9 15 6-6M8 14l-2 2a3 3 0 0 0 4 4l4-4M10 8l4-4a3 3 0 0 1 4 4l-2 2"/>',
    grid: '<path d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h6v6h-6z"/>',
    copy: '<rect x="8" y="8" width="12" height="13"/><path d="M15 8V3H3v13h5"/>',
    content: '<rect x="3" y="4" width="18" height="16"/><path d="M9 4v16M12 8h6M12 12h5"/>',
    soundcloud: '<path d="M7 18h10.5a3.75 3.75 0 0 0 .5-7.47A6 6 0 0 0 6.4 9.9 4.05 4.05 0 0 0 7 18Z"/>',
    linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.2a2.6 2.6 0 0 1 5 0V17"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".75" fill="currentColor" stroke="none"/>',
};
export const icon = (name: string) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${iconPaths[name] ?? iconPaths.grid}</svg>`;
export const arrow = () => icon('diagonal');
/**
 * A profile address, or nothing: only https on the given domain (or a subdomain of it), with no embedded login, is
 * ever linked to. Compared as whole labels, so "evilsoundcloud.com" and "soundcloud.com.evil.test" are refused.
 */
function profileUrl(value: string | undefined, domain: string): string | undefined {
    try {
        const url = new URL(value ?? '');
        const onDomain = url.hostname === domain || url.hostname.endsWith(`.${domain}`);
        return url.protocol === 'https:' && onDomain && !url.username && !url.password ? url.href : undefined;
    }
    catch {
        return undefined;
    }
}
export const soundcloudUrl = (value: string | undefined) => profileUrl(value, 'soundcloud.com');
export const linkedinUrl = (value: string | undefined) => profileUrl(value, 'linkedin.com');
export const instagramUrl = (value: string | undefined) => profileUrl(value, 'instagram.com');
/** "1 project", "3 projects": a count with its noun. */
export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
/** A record's facts as a definition list; nothing when it has none. */
export const factsList = (facts: ContentRecord['facts'], cls = 'record-facts') => facts.length ? `<dl class="${cls}">${facts.map(f => `<div><dt>${escape(f.label)}</dt><dd>${escape(f.value)}</dd></div>`).join('')}</dl>` : '';
/** The night's stretches as column labels over a chart, with the given stretch marked. Decorative: the chart beside it is labelled. */
export const nightRuler = (here?: NightPhase) => `<span class="crate-ruler" aria-hidden="true">${NIGHT.map(p => `<span${p.id === here ? ' class="is-here"' : ''}>${escape(p.label)}</span>`).join('')}</span>`;
/** Availability line with the pink cell mark; renders nothing when the text is empty. */
export const statusNote = (text: string, cls: string) => text.trim() ? `<p class="${cls}"><span class="status-mark" aria-hidden="true"></span><span>${escape(text)}</span></p>` : '';
export const link = (path: string, label: string, cls = '', query?: URLSearchParams) => `<a${cls ? ` class="${cls}"` : ''} href="${escape(hashFor(path, query))}"${cls.split(' ').includes('selected') ? ' aria-current="page"' : ''}>${label}</a>`;
