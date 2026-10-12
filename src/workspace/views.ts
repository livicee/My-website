import { copy, email, recordPath, site } from './content';
import { collectionNames, sectionFor, sectionPath, type Section, type Route } from './model';
import { escape, icon, link, linkedinUrl, soundcloudUrl, instagramUrl } from './html';
import { home, about, contact, cv } from './pages';
import { library } from './library';
import { railArt } from './railArt';
export { audioPlayer } from './audio';

export function shell(route: Route): string {
    const sound = route.dataset === 'sound';
    const identity = site.identities[route.dataset];
    const searchValue = escape(route.query.get('q') ?? '');
    // Only an identity with a CV label gets the CV tab.
    const nav: Section[] = identity.cvLabel ? ['home', 'work', 'experience', 'about', 'contact'] : ['home', 'work', 'about', 'contact'];
    const navLabel = (key: Section) => key === 'work' ? identity.workLabel : key === 'experience' ? identity.cvLabel ?? 'Experience' : key[0].toUpperCase() + key.slice(1);
    const current = route.collection ? collectionNames[route.collection] : route.page === 'home' ? 'Overview' : route.page === 'not-found' ? 'Not found' : route.page === 'experience' ? navLabel('experience') : route.page[0].toUpperCase() + route.page.slice(1);
    const year = new Date().getFullYear();
    // The switch supplies identity; this path supplies actual parent destinations.
    const crumbs = route.record || route.project
        ? `${link(sectionPath('work', route.dataset), escape(identity.workLabel), '', route.query)}${route.project ? `<span aria-hidden="true">/</span>${link(recordPath(route.project), escape(route.project.title), 'crumb-parent')}` : ''}<span aria-hidden="true">/</span><span class="crumb-record" aria-current="page">${escape(route.record?.title ?? current)}</span>`
        : '';
    // Outside profiles sit before Contact at the foot of the desktop rail and open in their own tabs.
    const profiles = sound ? [
        { href: soundcloudUrl(identity.soundcloud), label: 'SoundCloud', glyph: 'soundcloud' },
        { href: instagramUrl(identity.instagram), label: 'Instagram', glyph: 'instagram' },
    ] : [{ href: linkedinUrl(identity.linkedin), label: 'LinkedIn', glyph: 'linkedin' }];
    const external = profiles.map(profile => profile.href ? `<a class="nav-item nav-external nav-foot" href="${escape(profile.href)}" target="_blank" rel="noopener noreferrer">${icon(profile.glyph)}<span>${profile.label}</span>${icon('diagonal')}<span class="visually-hidden"> (opens in a new tab)</span></a>` : '').join('');
    const art = railArt(route.dataset);
    const enquiry = `mailto:${email}?subject=${encodeURIComponent(copy[route.dataset].contact.subject)}`;
    return `<div class="workspace" data-dataset="${route.dataset}">
      <header class="topbar">
        <span class="header-status"${identity.status ? ' data-status' : ''}>${escape(identity.status || `© ${year} ${site.author}`)}</span>
        <div class="mode-switch" role="group" aria-label="Choose identity"><button data-mode="production" aria-label="${escape(site.identities.production.switchLabel)}" aria-pressed="${!sound}"><span>${escape(site.identities.production.switchLabel)}</span></button><button data-mode="sound" aria-label="${escape(site.identities.sound.switchLabel)}" aria-pressed="${sound}"><span>${escape(site.identities.sound.switchLabel)}</span></button></div>
        <label class="global-search">${icon('search')}<input type="search" data-global-search value="${searchValue}" placeholder="${escape(identity.searchLabel)}" aria-label="${escape(identity.searchLabel)}" autocomplete="off"></label>
      </header>
      <nav class="navigation" aria-label="Main">
        <div class="nav-links">${nav.map(key => `${key === 'contact' ? art + external : ''}<a href="#${sectionPath(key, route.dataset)}" class="nav-item ${key === 'work' ? 'nav-primary' : ''} ${key === 'contact' ? 'nav-foot' : ''} ${sectionFor(route) === key ? 'active' : ''}" ${sectionFor(route) === key ? 'aria-current="page"' : ''}>${icon(key === 'work' && sound ? 'sound' : key)}${key === 'home' ? '<span class="nav-label-desktop">Overview</span><span class="nav-label-mobile">Home</span>' : '<span>' + escape(navLabel(key)) + '</span>' + (key === 'experience' ? '<small class="nav-hint">CV</small>' : '')}</a>`).join('')}</div>
      </nav>
      <div class="workspace-body">
        <aside aria-label="Portrait"><figure class="identity-field" aria-label="${escape(identity.portraitLabel)}"><canvas class="identity-lattice" aria-hidden="true"></canvas><canvas class="identity-response" aria-hidden="true"></canvas><canvas class="identity-mono" aria-hidden="true"></canvas><canvas id="identity-grid" aria-hidden="true"></canvas><p class="identity-fallback">${escape(identity.name)}</p></figure></aside>
        <main class="view${route.record ? ' view--record' : ''}" id="view" tabindex="0" aria-label="Page content"><nav class="breadcrumb" aria-label="Page location">${crumbs}</nav>${view(route)}</main>
      </div>
      <footer class="workspace-footer"><span class="footer-note">${escape(site.footerNote)}</span><span class="footer-copy">© ${year} ${escape(site.author)}</span><span class="footer-actions"><a class="footer-contact" href="${escape(enquiry)}">${sound ? 'Booking enquiry' : 'Email Livi'}${icon('diagonal')}</a><button type="button" class="footer-copy-action" data-copy>${icon('copy')}<span>Copy email</span></button></span></footer>
    </div>`;
}

/** The tab title: the page, then the identity it belongs to, as plain text. */
export function pageTitle(route: Route): string {
    // Content titles may carry <br> for a line break; a tab shows one line.
    const plain = (text: string) => text.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
    const page = route.record?.title
        ?? (route.page === 'home' ? (route.dataset === 'sound' ? 'Selected sound' : 'Content & digital platforms')
            : route.collection ? collectionNames[route.collection]
            : route.page === 'not-found' ? 'Record not found'
            : route.page === 'experience' ? plain(copy.production.cv?.title ?? '').replace(/\.$/, '') || 'Work history'
            : route.page[0].toUpperCase() + route.page.slice(1));
    return `${page} · ${site.identities[route.dataset].name}`;
}

export function view(route: Route): string {
    if (route.page === 'home') return home(route);
    if (route.page === 'about') return about(route);
    if (route.page === 'contact') return contact(route);
    if (route.page === 'experience') return cv();
    if (route.page === 'not-found') return `<article id="main" class="reading-page empty-page" tabindex="-1"><h1>Record not found.</h1><p>There is no record at this address.</p>${link(sectionPath('work', route.dataset), 'Back to the collection ' + icon('arrow'), 'button primary')}</article>`;
    return library(route);
}
