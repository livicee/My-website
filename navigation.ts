import { canonicalHash, parseRoute } from './routes';
import { shouldRestoreView } from './viewState';
import type { DatasetId, Route } from './model';
export interface NavigationUpdate { preserveSearch?: boolean; restore?: boolean; previous?: DatasetId; focusMain?: boolean; transition?: 'view' }
/** Replace the history entry, keep the search field as it is, play the view veil, or return to the page's last position. */
interface NavigateOptions { replace?: boolean; preserveSearch?: boolean; transition?: 'view'; restore?: boolean }
/** Swaps an alias, legacy or untidy address for the site's own, in place, so the address bar and history match the page. */
export function replaceWithCanonical(route: Route): void {
  const canonical = canonicalHash(route);
  if (canonical && canonical !== location.hash) history.replaceState(null, '', canonical);
}
export function createNavigation(initial: Route, before: (preserveSearch: boolean) => void, changed: (route: Route, options: NavigationUpdate) => void) {
  let current = initial;
  let renderedHash = location.hash;
  function navigate(hash: string, { replace = false, preserveSearch = false, transition, restore = shouldRestoreView('push') }: NavigateOptions = {}): void {
    const next = parseRoute(hash);
    const target = canonicalHash(next) ?? hash;
    // Pushing the address already showing adds nothing: a pressed toggle leaves history as it was.
    if (target === location.hash && !replace) return;
    before(preserveSearch);
    const previous = current.dataset;
    history[replace ? 'replaceState' : 'pushState'](null, '', target);
    current = next;
    changed(current, { preserveSearch, restore, previous, focusMain: !preserveSearch, transition });
  }
  function onHistory(): void {
    if (location.hash === '#main') { document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true }); return; }
    if (renderedHash === location.hash) return;
    before(false);
    const previous = current.dataset;
    current = parseRoute(location.hash);
    replaceWithCanonical(current);
    changed(current, { restore: shouldRestoreView('history'), previous, focusMain: true });
  }
  window.addEventListener('popstate', onHistory);
  window.addEventListener('hashchange', onHistory);
  return { navigate, markRendered() { renderedHash = location.hash; } };
}
