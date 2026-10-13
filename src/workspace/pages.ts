import { djSetup } from './djSetup';
import { all, copy, email, mediaUrl, notices, recordPath, related, site } from './content';
import { sectionPath, type Route, type ContentRecord } from './model';
import { escape, arrow, factsList, icon, instagramUrl, link, linkedinUrl, nightRuler, soundcloudUrl, statusNote } from './html';
import { hashFor } from './routes';
import { entryCard } from './cards';
import { nightSetChart, phaseIndex, phaseLabel } from './night';

function rich(text: string): string {
    return /<br\s*\/?\s*>/i.test(text) ? displayTitle(text) : escape(text);
}

/** About copy supports paragraphs, ## headings, **bold** and _emphasis_; HTML stays escaped. */
export function aboutBody(text: string): string {
    const inline = (value: string) => escape(value).replace(/\*\*([^*\n]+)\*\*|_([^_\n]+)_/g,
        (_match, bold: string | undefined, emphasis: string | undefined) => bold !== undefined
            ? `<strong>${bold}</strong>` : `<em>${emphasis}</em>`);
    return text.trim().split(/\r?\n\s*\r?\n/).filter(Boolean).map(block => {
        const heading = block.match(/^##\s+(.+)$/);
        return heading ? `<h2>${inline(heading[1])}</h2>` : `<p>${inline(block)}</p>`;
    }).join('');
}

/** Preserve the content title and line breaks, while giving each phrase its own display line. */
function displayTitle(text: string): string {
    return text.split(/<br\s*\/?\s*>/gi).map(line => `<span>${escape(line)}</span>`).join(' ');
}

export function home(route: Route): string {
    const sound = route.dataset === 'sound';
    const page = copy[route.dataset].home;
    const source = all(sound ? 'mixes' : 'work');
    const selected = sound ? source : source.slice(0, 3);
    return `<article id="main" class="home-page" tabindex="-1"><div class="overview-copy">
      <section class="home-intro">${statusNote(site.identities[route.dataset].status, 'home-status')}<h1>${displayTitle(page.title)}</h1><p>${escape(page.intro)}</p><div class="intro-actions">${link(sectionPath('work', route.dataset), escape(copy[route.dataset].about.workLink) + ' ' + arrow(), 'text-link intro-proof')}${link(sectionPath('contact', route.dataset), escape(page.contactLink) + ' ' + arrow(), 'text-link intro-contact')}</div></section>
      <section class="selected-work"><div class="section-heading"><h2>${escape(page.selectedHeading)} <span class="count" aria-hidden="true">${selected.length}</span></h2>${link(sectionPath('work', route.dataset), 'View all ' + arrow(), 'text-link')}</div>${sound ? nightSet(selected) : `<div class="work-table">${selected.map(overviewRow).join('')}</div>`}</section>
    </div></article>`;
}

/**
 * Livicee's Overview orders every mix through one night. The chart previews the arc, and each named row links
 * to its mix with the corresponding phase. Mixes not yet placed in the night follow the ordered selections.
 */
function nightSet(mixes: ContentRecord[]): string {
    const placed = mixes.filter(m => m.night).sort((a, b) => phaseIndex(a.night!) - phaseIndex(b.night!));
    const unplaced = mixes.filter(m => !m.night);
    const items = placed.map(m => `<li style="--phase:${phaseIndex(m.night!) + 1}"><a class="set-mix" data-phase="${m.night}" href="${escape(hashFor(recordPath(m)))}"><span class="visually-hidden">${escape(phaseLabel(m.night!))}: </span><strong>${escape(m.title)}</strong><span class="set-style">${escape(m.tags[0] ?? m.subtitle)}</span><span class="set-phase" aria-hidden="true">${escape(phaseLabel(m.night!))}</span>${arrow()}</a></li>`).join('');
    const set = placed.length ? `<div class="night-set">${nightRuler()}<div class="set-stage">${nightSetChart(placed.map(m => m.night!), 'set-chart')}<ol class="set-mixes">${items}</ol></div></div>` : '';
    return set + (unplaced.length ? `<div class="work-table">${unplaced.map(overviewRow).join('')}</div>` : '');
}

function overviewRow(record: ContentRecord): string {
    return link(recordPath(record), entryCard(record), 'project-row');
}

export function about(route: Route): string {
    const page = copy[route.dataset].about;
    const body = aboutBody(page.body);
    const sections = body.split(/(?=<h2>)/);
    if (route.dataset === 'sound') sections.splice(Math.min(2, sections.length), 0, djSetup());
    const formattedBody = sections.join('');
    return `<article id="main" class="reading-page" tabindex="-1"><div class="profile-document"><h1>${rich(page.title)}</h1><p class="lede">${escape(page.lede)}</p><div class="about-body">${formattedBody}</div><h2>${escape(page.principlesHeading)}</h2><dl class="principles">${page.principles.map(item => `<div><dt>${escape(item.title)}</dt><dd>${escape(item.body)}</dd></div>`).join('')}</dl>${link(sectionPath('work', route.dataset), escape(page.workLink) + ' ' + arrow(), 'button primary')}</div></article>`;
}

export function contact(route: Route): string {
    const page = copy[route.dataset].contact;
    const mailto = escape(`mailto:${email}?subject=${encodeURIComponent(page.subject)}`);
    const profiles = route.dataset === 'sound' ? [
        { href: soundcloudUrl(site.identities.sound.soundcloud), label: 'Listen on SoundCloud', glyph: 'soundcloud' },
        { href: instagramUrl(site.identities.sound.instagram), label: 'Instagram', glyph: 'instagram' },
    ] : [{ href: linkedinUrl(site.identities.production.linkedin), label: 'LinkedIn', glyph: 'linkedin' }];
    const socialLinks = profiles.filter(profile => profile.href).map(profile => `<a class="button" href="${escape(profile.href)}" target="_blank" rel="noopener noreferrer">${icon(profile.glyph)} ${profile.label} ${icon('diagonal')}<span class="visually-hidden"> (opens in a new tab)</span></a>`).join('');
    return `<article id="main" class="reading-page" tabindex="-1"><div class="profile-document"><h1>${rich(page.title)}</h1><p class="lede">${escape(page.lede)}</p><section class="contact-address" aria-label="Email contact"><a class="email-link" href="${mailto}">${escape(email)}${arrow()}</a><div class="contact-actions"><a class="button primary" href="${mailto}">${escape(page.emailAction)} ${icon('arrow')}</a><button class="button" data-copy>${icon('copy')} Copy email</button>${socialLinks}</div></section><div class="contact-notes"><p class="entity-name">${escape(site.entity)}</p></div></div></article>`;
}

/** The Experience tab restores the Pixel version's numbered, date-first CV disclosures. */
export function cv(): string {
    const page = copy.production.cv;
    if (!page) return '';
    const file = page.download?.file;
    const href = file ? mediaUrl(file) : undefined;
    const download = file && href ? `<div class="cv-download"><a class="button" href="${escape(href)}" download="${escape(file)}">${escape(page.download?.label || 'Download CV')} ${icon('arrow')}</a></div>` : '';
    return `<article id="main" class="reading-page" tabindex="-1"><div class="profile-document"><h1>${rich(page.title)}</h1>${download}${roles()}</div></article>`;
}

function roles(): string {
    const dates = (year: string) => year === 'To confirm' ? 'Dates to confirm' : year;
    return `<section class="profile-experience" aria-label="Roles">` + all('experience').map((r, index) => {
        const facts = factsList(r.facts);
        const projects = related(r, 'work');
        const linked = projects.length ? `<h3>${escape(notices.relatedProjectsHeading)}</h3>${projects.map(p => link(recordPath(p), escape(p.title) + arrow(), 'relation-row')).join('')}` : '';
        return `<details class="role-disclosure" data-record-id="${escape(r.id)}"><summary><span class="role-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div class="role-heading"><span class="role-dates">${escape(dates(r.year))}</span><h2 class="role-title">${escape(r.title)}</h2><small>${escape(r.subtitle)}</small></div>${icon('chevron')}</summary><div class="role-content"><p>${escape(r.summary)}</p>${r.story?.map(s => '<p>' + escape(s.body) + '</p>').join('') ?? ''}${facts}${linked}</div></details>`;
    }).join('') + '</section>';
}
