import { all, copy, email, mediaUrl, notices, recordPath, related, site } from './content';
import { sectionPath, type Route, type ContentRecord } from './model';
import { escape, arrow, factsList, icon, instagramUrl, link, linkedinUrl, soundcloudUrl, statusNote } from './html';
import { entryCard } from './cards';

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
      ${sound ? '' : `<section class="selected-work"><div class="section-heading"><h2>${escape(page.selectedHeading)} <span class="count" aria-hidden="true">${selected.length}</span></h2>${link(sectionPath('work', route.dataset), 'View all ' + arrow(), 'text-link')}</div><div class="work-table">${selected.map(overviewRow).join('')}</div></section>`}
    </div></article>`;
}

function overviewRow(record: ContentRecord): string {
    return link(recordPath(record), entryCard(record), 'project-row');
}

export function about(route: Route): string {
    const page = copy[route.dataset].about;
    const body = aboutBody(page.body);
    const formattedBody = route.dataset === 'sound' && page.highlights
        ? body + djHighlights(page.highlights) + aboutBody(page.highlights.after)
        : body;
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

/** Supplied names are typography, not recreated brand logos. */
function djHighlights(data: { cities: string[]; brands: string[]; venues: string[]; after: string }): string {
    const letters = (name: string, row: number) => {
        let index = 0;
        const words = name.split(' ').map(word => `<span class="brand-word">${Array.from(word).map(letter => `<span class="brand-letter" style="--reveal-delay:${Math.min(700, row * 60 + index++ * 18)}ms">${escape(letter)}</span>`).join('')}</span>`).join(' ');
        return `<span class="visually-hidden">${escape(name)}</span><span aria-hidden="true">${words}</span>`;
    };
    return `<style>.dj-destinations, .dj-brands, .dj-venues { margin-block: 36px; }
.about-body .dj-section-label { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.dj-section-label > span { color: var(--pink); font: 22px var(--mono); }
.about-body .dj-section-label h2 { margin: 0; }
.dj-city-board, .dj-brand-wall, .dj-venue-list { list-style: none; padding: 0; margin: 0; }
.dj-city-board { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--line); column-gap: 24px; }
.dj-city-board li { display: grid; grid-template-columns: 24px minmax(0, 1fr) 14px; align-items: center; gap: 10px; padding-block: 14px; border-bottom: 1px solid var(--line); color: var(--text-soft); font: 14px/1.5 var(--mono); }
.dj-city-number { color: var(--pink); font-size: 12px; }
.dj-city-mark { color: var(--muted); }
.about-body .dj-brands h2, .about-body .dj-venues h2 { margin: 0 0 12px; }
.about-body .dj-highlight-intro { margin-bottom: 20px; font-size: var(--type-detail); }
.dj-brand-wall { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--line); }
.dj-brand-wall li { padding: 22px 16px 22px 0; border-bottom: 1px solid var(--line); color: var(--foreground); font: 600 clamp(20px, 2vw, 27px)/1.2 var(--sans); letter-spacing: -.025em; overflow-wrap: anywhere; }
.dj-brand-wall li:nth-child(3n + 2) { color: var(--pink); }
.brand-word { display: inline-block; }
.brand-letter { display: inline-block; }
[data-revealed='true'] .brand-letter { animation: dj-brand-reveal 480ms ease-out both; animation-delay: var(--reveal-delay); }
.dj-venue-list { display: flex; flex-wrap: wrap; gap: 10px 20px; color: var(--text-soft); font-size: var(--type-detail); }
.dj-venue-list li { padding-bottom: 6px; border-bottom: 1px solid var(--line); }
@keyframes dj-brand-reveal { from { transform: translateY(3px); color: var(--pink); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) { [data-revealed='true'] .brand-letter { animation: none; } }
@media (max-width: 480px) { .dj-city-board { grid-template-columns: 1fr; } .dj-brand-wall li { font-size: 21px; padding-block: 18px; } }
</style><section class="dj-destinations" aria-labelledby="dj-cities-heading">
      <div class="dj-section-label"><span aria-hidden="true">↗</span><h2 id="dj-cities-heading">Cities played</h2></div>
      <ol class="dj-city-board">${data.cities.map((city, i) => `<li><span class="dj-city-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${escape(city)}</span><span class="dj-city-mark" aria-hidden="true">↗</span></li>`).join('')}</ol>
    </section>
    <section class="dj-brands" aria-labelledby="dj-brands-heading" data-dj-reveal data-revealed="true">
      <h2 id="dj-brands-heading">In good company.</h2><p class="dj-highlight-intro">Brands and events I’ve played for.</p>
      <ul class="dj-brand-wall">${data.brands.map((name, i) => `<li>${letters(name, i)}</li>`).join('')}</ul>
    </section>
    <section class="dj-venues" aria-labelledby="dj-venues-heading"><h2 id="dj-venues-heading">Places with a pulse.</h2>
      <ul class="dj-venue-list">${data.venues.map(name => `<li>${escape(name)}</li>`).join('')}</ul>
    </section>`;
}

