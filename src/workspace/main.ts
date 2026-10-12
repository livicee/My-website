import { createNavigation, replaceWithCanonical, type NavigationUpdate } from './navigation';
import './workspace.css';
import './identity.css';
import './evidencePreviews.css';
import './expression.css';
import './cards.css';
import './rail.css';
import './player.css';
import { bindEvidencePreviews } from './evidencePreviews';
import { email } from './content';
import { sectionPath, type DatasetId, type Route } from './model';
import { parseRoute, hashFor, libraryPath, modeDestination } from './routes';
import { withFacets } from './search';
import { pageTitle, shell } from './views';
import { createFilterDialog } from './filterDialog';
import { updateMarkup } from './dom';
import { createViewState, viewStateKey } from './viewState';
import { mountIdentity, updateIdentityReadingMask } from './identity';
import { mountRailField } from './railField';
import { bindMediaEvents, loadEmbed } from './media';
import { createMixPlayer } from './player';
import { createVeil } from './veil';
import { reducedMotionQuery } from './motion';
const app = document.querySelector<HTMLDivElement>('#app')!;
const dialog = document.querySelector<HTMLDialogElement>('#filter-dialog')!;
const toast = document.querySelector<HTMLDivElement>('#toast')!;
history.scrollRestoration = 'manual';
let route = parseRoute(location.hash);
replaceWithCanonical(route);
let disposeIdentity = () => { };
let disposeRail = () => { };
let railDataset: DatasetId | undefined;
let railCanvas: Element | null = null;
let disposePreviews = () => { };
let searchTimer = 0, toastTimer = 0;
const positions = createViewState();
const veil = createVeil();
const player = createMixPlayer();
let composing = false;
let mountedDataset: DatasetId | undefined;
let renderedRoute: Route | undefined;
const navigation = createNavigation(route, preserveSearch => {
    clearTimeout(searchTimer);
    filterSheet.cancel();
    if (!preserveSearch) savePosition();
}, (next, options) => { route = next; render(options); });
const navigate = navigation.navigate;
const filterSheet = createFilterDialog(dialog, () => route, navigate, () => clearTimeout(searchTimer));
function positionKey(value: Route): string { return viewStateKey(hashFor(value.path, value.query), innerWidth); }
const viewScroller = () => document.querySelector<HTMLElement>('#view');
const viewScrollTop = () => viewScroller()?.scrollTop ?? 0;
const scrollView = (top: number) => viewScroller()?.scrollTo({ top, behavior: 'instant' });
function savePosition(): void {
    const focused = document.activeElement instanceof HTMLAnchorElement ? document.activeElement.dataset.focusKey ?? null : null;
    positions.set(positionKey(route), { y: viewScrollTop(), index: document.querySelector('#index-records')?.scrollTop ?? 0, focus: focused });
}
function render(options: NavigationUpdate = {}): void {
    veil.cancel();
    cancelViewAnimations();
    const activeElement = document.activeElement;
    const activeSearch = activeElement instanceof HTMLInputElement && activeElement.matches('[data-global-search]');
    const selection = activeSearch ? {
        start: activeElement.selectionStart,
        end: activeElement.selectionEnd,
        direction: activeElement.selectionDirection,
    } : null;
    const savedY = viewScrollTop();
    const oldIndex = document.querySelector('#index-records')?.scrollTop ?? 0;
    const previousCanvas = app.querySelector('#identity-grid');
    disposePreviews();
    updateMarkup(app, shell(route));
    disposePreviews = bindEvidencePreviews(app);
    document.title = pageTitle(route);
    if (mountedDataset !== route.dataset || previousCanvas !== app.querySelector('#identity-grid')) {
        disposeIdentity();
        disposeIdentity = mountIdentity(route.dataset, options.previous);
        mountedDataset = route.dataset;
    }
    // The rail's ASCII field follows the identity, and is redrawn only when its canvas or identity changes.
    const railNow = app.querySelector('canvas.rail-field');
    if (railDataset !== route.dataset || railCanvas !== railNow) {
        disposeRail();
        disposeRail = mountRailField(app);
        railDataset = route.dataset;
        railCanvas = railNow;
    }
    bindMediaEvents(app);
    player.sync(app);
    app.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
        const region = a.closest('.collection-index') ? 'index' : a.closest('#main') ? 'main' : 'shell';
        a.dataset.focusKey = `${region}:${a.getAttribute('href')}`;
    });
    if (options.preserveSearch && activeSearch) {
        const input = document.querySelector<HTMLInputElement>('[data-global-search]');
        input?.focus({ preventScroll: true });
        // Search inputs do not expose a selection range in every browser.
        if (selection?.start != null && selection.end != null) {
            try {
                input?.setSelectionRange(selection.start, selection.end, selection.direction ?? 'none');
            }
            catch { /* Browser restriction. */ }
        }
        scrollView(savedY);
        const list = document.querySelector('#index-records');
        if (list)
            list.scrollTop = oldIndex;
    }
    else {
        const saved = options.restore ? positions.get(positionKey(route)) : undefined;
        const index = document.querySelector<HTMLElement>('#index-records');
        scrollView(saved?.y ?? 0);
        if (index) {
            // Moving from record to record in the same list keeps the list where the reader left it.
            const sameList = renderedRoute?.page === 'record' && route.page === 'record' && libraryPath(renderedRoute) === libraryPath(route);
            index.scrollTop = saved?.index ?? (sameList ? oldIndex : 0);
            if (!saved) revealSelected(index);
        }
        if (options.focusMain) {
            const anchor = saved?.focus ? [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].find(a => a.dataset.focusKey === saved.focus && a.getClientRects().length) : undefined;
            (anchor ?? document.querySelector<HTMLElement>('#main'))?.focus({ preventScroll: true });
        }
    }
    updateIdentityReadingMask();
    navigation.markRendered();
    renderedRoute = route;
    if (options.previous && options.previous !== route.dataset) veil.play(app.querySelector('.workspace'), 'mode');
    else if (options.transition === 'view') veil.play(app.querySelector('#view'), 'view');
}
/** Scrolls the index list, and only the list, just far enough to show the selected record. */
function revealSelected(list: HTMLElement): void {
    const selected = list.querySelector('.index-record.selected');
    if (!selected) return;
    const row = selected.getBoundingClientRect();
    // The list's content box, inside its top border.
    const top = list.getBoundingClientRect().top + list.clientTop, bottom = top + list.clientHeight;
    // A row taller than the list (short windows) shows from its title down.
    if (row.top < top || row.height > list.clientHeight) list.scrollTop -= top - row.top;
    else if (row.bottom > bottom) list.scrollTop += row.bottom - bottom;
}
function changeMode(target: DatasetId): void {
    if (target === route.dataset)
        return;
    navigate(modeDestination(route, target));
}
const reducedMotion = reducedMotionQuery();
const viewAnimations = new Map<Animation, () => void>();
/** These small content animations must also honour a preference changed while they are running. */
function trackViewAnimation(animation: Animation, cleanup = () => {}): void {
    const settle = () => { if (viewAnimations.delete(animation)) cleanup(); };
    viewAnimations.set(animation, settle);
    void animation.finished.then(settle, settle);
}
function cancelViewAnimations(): void {
    for (const [animation, settle] of viewAnimations) { settle(); animation.cancel(); }
}
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) cancelViewAnimations(); });
const crateRows = () => new Map([...document.querySelectorAll<HTMLElement>('.crate-rows > li[data-key]')].map(li => [li.dataset.key!, li.getBoundingClientRect().top]));
/** Reordering the crate slides each mix from where it was to where it now sits. */
function glideRows(before: Map<string, number>): void {
    if (reducedMotion.matches) return;
    document.querySelectorAll<HTMLElement>('.crate-rows > li[data-key]').forEach((li, i) => {
        const from = before.get(li.dataset.key!);
        const dy = from === undefined ? 0 : from - li.getBoundingClientRect().top;
        if (Math.abs(dy) < 1) return;
        // Rows cross on the way, so each travels on its own backing, rising rows above falling ones.
        li.classList.add('gliding');
        li.style.zIndex = dy > 0 ? '2' : '1';
        const settle = () => { li.classList.remove('gliding'); li.style.zIndex = ''; };
        trackViewAnimation(li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 620, delay: i * 24, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }), settle);
    });
}
function showToast(message: string): void {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 4000);
}
/** Copies the address, or shows it to copy by hand where the clipboard is unavailable. */
async function copyEmail(): Promise<void> {
    try {
        await navigator.clipboard.writeText(email);
        showToast('Email address copied');
    }
    catch {
        showToast(`Copy this address: ${email}`);
    }
}
document.addEventListener('click', event => {
    const element = event.target instanceof Element ? event.target : null;
    if (!element)
        return;
    if (element.closest('a[href="#main"]')) {
        event.preventDefault();
        document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true });
        return;
    }
    const mode = element.closest<HTMLElement>('[data-mode]');
    if (mode) {
        if (element.closest('a') && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0))
            return;
        event.preventDefault();
        changeMode(mode.dataset.mode as DatasetId);
        return;
    }
    if (element.closest('[data-filters]')) {
        filterSheet.open();
        return;
    }
    if (element.closest('[data-clear]')) {
        if (!route.collection) return;
        // Clearing drops the search term and filters; the order and the Model view are how the list is read, so they stay.
        const cleared = withFacets(route.query, route.collection, []);
        cleared.delete('q');
        navigate(hashFor(libraryPath(route), cleared));
        return;
    }
    if (element.closest('[data-reset-filters]')) {
        dialog.querySelectorAll<HTMLInputElement>('input').forEach(input => input.checked = false);
        return;
    }
    const play = element.closest<HTMLElement>('[data-play]');
    if (play?.dataset.play) {
        player.toggle(play.dataset.play);
        return;
    }
    const loadButton = element.closest<HTMLElement>('[data-load-embed]');
    if (loadButton) {
        loadEmbed(loadButton);
        return;
    }
    // Capability queries and the crate order change in place: no veil, same scroll, focus stays on the toggle; Back undoes it.
    const queryToggle = element.closest<HTMLElement>('[data-query]');
    if (queryToggle?.dataset.query) {
        const y = viewScrollTop(), list = document.querySelector('#index-records')?.scrollTop ?? 0;
        const rows = queryToggle.hasAttribute('data-reorder') ? crateRows() : undefined;
        navigate(queryToggle.dataset.query, { preserveSearch: true });
        scrollView(y);
        const index = document.querySelector('#index-records');
        if (index) index.scrollTop = list;
        if (rows) glideRows(rows);
        // Document and Model swap with a short settle, never a veil: the record itself has not changed.
        if (queryToggle.hasAttribute('data-flip') && !reducedMotion.matches) {
            const body = document.querySelector('.record-body');
            if (body) trackViewAnimation(body.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.16, 1, .3, 1)' }));
        }
        return;
    }
    if (element.closest('[data-copy]')) {
        void copyEmail();
        return;
    }
    const anchor = element.closest<HTMLAnchorElement>('a[href^="#/"]');
    if (anchor && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
        event.preventDefault();
        // A back link returns the reader to their place and focus on that page; other links open at the top.
        navigate(anchor.getAttribute('href')!, { transition: 'view', restore: anchor.hasAttribute('data-return') });
    }
});
document.addEventListener('compositionstart', () => { composing = true; clearTimeout(searchTimer); });
document.addEventListener('compositionend', event => { composing = false; scheduleSearch(event.target); });
function scheduleSearch(input: EventTarget | null): void {
    if (composing || !(input instanceof HTMLInputElement) || !input.matches('[data-global-search]'))
        return;
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
        const query = new URLSearchParams(route.query);
        const value = input.value.trim();
        if (value)
            query.set('q', value);
        else
            query.delete('q');
        const destination = sectionPath('work', route.dataset);
        const openingCollection = route.path !== destination || route.page !== 'collection';
        navigate(hashFor(destination, query), { replace: true, preserveSearch: true, transition: openingCollection ? 'view' : undefined });
    }, 180);
}
document.addEventListener('input', event => scheduleSearch(event.target));
document.addEventListener('keydown', event => {
    const target = event.target;
    if (event.key === 'Escape' && target instanceof HTMLInputElement && target.matches('[data-global-search]') && matchMedia('(width <= 960px)').matches) {
        event.preventDefault();
        target.blur();
        document.querySelector<HTMLButtonElement>('.mode-switch [aria-pressed="true"]')?.focus({ preventScroll: true });
        return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !dialog.open) {
        event.preventDefault();
        focusHeaderSearch();
        return;
    }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !dialog.open && !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable))) {
        event.preventDefault();
        focusHeaderSearch();
    }
});
function focusHeaderSearch(): void {
    document.querySelector<HTMLInputElement>('[data-global-search]')?.focus();
}
window.addEventListener('pagehide', () => { disposeIdentity(); disposeRail(); disposePreviews(); veil.cancel(); cancelViewAnimations(); clearTimeout(searchTimer); clearTimeout(toastTimer); });
window.addEventListener('pageshow', event => {
    if (event.persisted) {
        disposeIdentity();
        disposeIdentity = mountIdentity(route.dataset);
        disposeRail();
        disposeRail = mountRailField(app);
        disposePreviews = bindEvidencePreviews(app);
    }
});
render();
