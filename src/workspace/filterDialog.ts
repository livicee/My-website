import { collectionTitle, filters } from './library';
import { escape, icon } from './html';
import { hashFor, libraryPath, contextPath } from './routes';
import { matches, withFacets } from './search';
import type { Route } from './model';
export function createFilterDialog(dialog: HTMLDialogElement, currentRoute: () => Route, navigate: (hash: string) => void, beforeOpen: () => void) {
    let dialogContext: Route | undefined;
    // Focus goes back to the Filter button when the visitor closes the dialog, not when navigation closes it for them.
    let returnFocus = true;
    function openFilters(): void {
        beforeOpen();
        dialogContext = currentRoute();
        const title = collectionTitle(dialogContext);
        dialog.innerHTML = `<form method="dialog"><header class="dialog-head"><h2 id="filter-title">Filter ${escape(title)}</h2><button value="cancel" aria-label="Close filters">${icon('close')}</button></header><div class="dialog-body">${filters(dialogContext)}</div><footer class="dialog-foot"><button type="button" class="text-link" data-reset-filters aria-label="Clear filters">Clear</button><button class="button primary" value="apply">Show results ${icon('arrow')}</button></footer></form>`;
        dialog.returnValue = '';
        dialog.showModal();
    }
    dialog.addEventListener('close', () => {
        const context = dialogContext;
        dialogContext = undefined;
        if (dialog.returnValue === 'apply' && context?.collection) {
            const chosen = [...dialog.querySelectorAll<HTMLInputElement>('input:checked')].map((input): [string, string] => [input.name, input.value]);
            const query = withFacets(context.query, context.collection, chosen);
            const keep = context.record && matches(context.record, query);
            const path = keep ? contextPath(context.record, context) : libraryPath(context);
            navigate(hashFor(path, query));
        }
        if (returnFocus) document.querySelector<HTMLButtonElement>('[data-filters]')?.focus({ preventScroll: true });
        returnFocus = true;
    });
    dialog.addEventListener('click', event => {
        if (event.target !== dialog)
            return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
            dialog.close();
    });
    return {
        open: openFilters,
        cancel() {
            dialogContext = undefined;
            if (!dialog.open) return;
            returnFocus = false;
            dialog.close('cancel');
        },
    };
}
