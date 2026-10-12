import { updateMarkup } from '../src/workspace/dom';
import { records, recordPath } from '../src/workspace/content';
const output = document.querySelector<HTMLPreElement>('#results')!;
const run = document.querySelector<HTMLButtonElement>('#run')!;
const host = document.querySelector('#frames')!;
const wait = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));
const report = (pass: boolean, label: string) => { output.textContent += `${pass ? 'PASS' : 'FAIL'}: ${label}\n`; };
async function until(test: () => boolean, label: string) {
    for (let i = 0; i < 100; i++) {
        if (test())
            return;
        await wait();
    }
    throw new Error(`Timed out: ${label}`);
}
function frame(src: string): HTMLIFrameElement {
    const element = document.createElement('iframe');
    element.src = src;
    element.style.cssText = 'display:block;border:0;height:1000px;width:1440px';
    host.append(element);
    return element;
}
function click(doc: Document, selector: string) {
    const element = doc.querySelector<HTMLElement>(selector);
    if (!element)
        throw new Error(`Missing control: ${selector}`);
    element.click();
}
run.addEventListener('click', async () => {
    run.disabled = true;
    output.textContent = '';
    output.removeAttribute('data-complete');
    host.replaceChildren();
    const current = frame(new URLSearchParams(location.search).has('production') ? './.current/index.html#/' : '../index.html#/');
    try {
        await until(() => !!current.contentDocument?.querySelector('#main'), 'workspace mount');
        const doc = current.contentDocument!, win = current.contentWindow!;
        const topbar = doc.querySelector('.topbar');
        const originalSearch = doc.querySelector('[data-global-search]');
        for (const path of ['/', '/about', '/contact', '/work', '/experience', '/capabilities', '/platforms', '/livicee', '/livicee/about', '/livicee/contact', '/livicee/mixes', '/livicee/events', '/livicee/locations', ...records.map(recordPath)]) {
            win.location.hash = `#${path}`;
            await wait();
            if (!doc.querySelector('h1') || doc.querySelector('.topbar') !== topbar)
                throw new Error(`Route or shell identity failed: ${path}`);
            const sound = path.startsWith('/livicee');
            if (doc.querySelector('[data-mode="sound"]')?.getAttribute('aria-pressed') !== String(sound))
                throw new Error(`Wrong persona: ${path}`);
            if (doc.querySelectorAll('[data-global-search]').length !== 1 || doc.querySelector('[data-global-search]') !== originalSearch)
                throw new Error(`Search replaced or duplicated: ${path}`);
            if (doc.querySelectorAll('.nav-item[aria-current="page"]').length !== 1)
                throw new Error(`Navigation must expose one current section: ${path}`);
        }
        report(true, 'All public record/collection routes mount with anchored shell and matching persona.');
        win.location.hash = '#/work';
        await wait();
        const search = doc.querySelector<HTMLInputElement>('[data-global-search]')!;
        search.focus();
        search.value = 'taxonomy';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(240);
        report(doc.querySelector('[data-global-search]') === search && doc.activeElement === search && win.location.hash.includes('q=taxonomy') && !doc.querySelector('[data-search]'), 'Header search retains its input and focus without a duplicate collection field.');
        for (const width of [390, 1440]) {
            current.style.width = `${width}px`; await wait(100);
            for (const [index, [start, end, direction]] of ([
                [0, 9, 'forward'], [1, 4, 'forward'], [1, 4, 'backward'], [0, 0, 'forward'],
            ] as const).entries()) {
                search.focus(); search.value = `taxonomy${width}${index}`;
                search.dispatchEvent(new Event('input', { bubbles: true }));
                search.setSelectionRange(start, end, direction);
                const expected = [search.selectionStart, search.selectionEnd, search.selectionDirection];
                await wait(240);
                report(doc.activeElement === search && search.selectionStart === expected[0]
                    && search.selectionEnd === expected[1] && search.selectionDirection === expected[2],
                    `${width}px: search refresh preserves native selection ${start}–${end} ${direction}, including its focus.`);
            }
        }
        win.location.hash = '#/livicee/mixes'; await wait();
        click(doc, '[data-filters]');
        const dialog = doc.querySelector<HTMLDialogElement>('dialog')!;
        report(dialog.open, 'Filter sheet opens.');
        win.location.hash = '#/work';
        await wait();
        report(!dialog.open && !win.location.hash.includes('capability'), 'History navigation cancels the previous collection filter context.');
        win.location.hash = '#/about';
        await wait();
        for (let i = 0; i < 10; i++)
            click(doc, `[data-mode="${i % 2 ? 'production' : 'sound'}"]`);
        await wait(750);
        report(win.location.hash === '#/about' && !!doc.querySelector('.identity-field.identity-ready') && doc.querySelector('[data-mode="production"]')?.getAttribute('aria-pressed') === 'true', 'Rapid mode switches settle consistently.');
        win.location.hash = '#/work?q=taxonomy'; await wait();
        doc.querySelector<HTMLElement>('#view')!.scrollTo(0, 120);
        const origin = [...doc.querySelectorAll<HTMLAnchorElement>('.overview-item, .index-record')].find(a => a.getClientRects().length)!;
        const originHref = origin.getAttribute('href');
        origin.focus({ preventScroll: true }); origin.click(); await wait();
        click(doc, '.back-link'); await wait();
        report(win.location.hash === '#/work?q=taxonomy' && doc.activeElement?.getAttribute('href') === originHref, 'Record return preserves query and originating focus.');
        win.location.hash = '#/experience'; await wait();
        click(doc, '.role-disclosure summary');
        const role = doc.querySelector<HTMLDetailsElement>('.role-disclosure')!;
        click(doc, '.nav-item[href="#/experience"]');
        report(role.open && doc.querySelector('.role-disclosure') === role, 'Same-route navigation retains disclosure state.');
        const holder = document.createElement('div');
        updateMarkup(holder, '<details data-record-id="one"><summary>One</summary></details><audio controls preload="none" src="./test-tone.wav"></audio>');
        const details = holder.querySelector('details')!, audio = holder.querySelector('audio')!;
        details.open = true;
        updateMarkup(holder, '<details data-record-id="one"><summary>Updated</summary></details><audio controls preload="none" src="./test-tone.wav"></audio>');
        report(holder.querySelector('audio') === audio && details.open, 'DOM updates retain native audio and matching disclosure nodes.');
        updateMarkup(holder, '<details data-record-id="two"><summary>Two</summary></details><audio controls preload="none" src="./other.wav"></audio>');
        report(holder.querySelector('audio') !== audio && !holder.querySelector('details')!.open, 'Different media and records do not inherit native state.');
        let checked = 0;
        const routes = ['/', '/about', '/contact', '/work', '/work/dam-migration', '/work/dam-migration/artefacts/asset-model', '/experience', '/livicee', '/livicee/about', '/livicee/mixes', '/livicee/events'];
        const widths = [1920, 1440, 1366, 1024, 834, 761, 760, 640, 390, 360, 320];
        for (const width of widths) {
            current.style.width = width + 'px';
            for (const path of routes) {
                win.location.hash = '#' + path;
                await wait(70);
                if (doc.documentElement.scrollWidth > width + 1) throw new Error('Horizontal overflow: ' + width + 'px ' + path);
                const descriptions = [...doc.querySelectorAll<HTMLElement>('.home-intro>p:not(.home-status),.row-title>span,.record-heading>.lede,.profile-document>.lede,.crate-summary')].filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none');
                for (const element of descriptions) {
                    if (Number.parseFloat(getComputedStyle(element).fontSize) < 17) throw new Error('Description below 17px: ' + width + 'px ' + path);
                }
                checked++;
            }
        }
        report(checked === widths.length * routes.length, `${checked}/${widths.length * routes.length} desktop/tablet/mobile layouts, including the navigation breakpoint and 320px, fit without horizontal overflow and keep descriptions readable.`);
        current.style.width = '390px';
        win.location.hash = '#/work/dam-migration'; await wait(100);
        const list = doc.querySelector<HTMLElement>('.collection-index')!;
        report(getComputedStyle(list).display === 'none' && !!doc.querySelector('.record-detail'), 'Mobile opens the document without a miniature desktop list beside it.');
        doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
        await until(() => !!doc.activeElement?.matches('[data-global-search]') && !!doc.activeElement.getClientRects().length, 'visible mobile header search focus');
        const mobileSearch = doc.activeElement as HTMLInputElement;
        mobileSearch.value = 'asset';
        mobileSearch.dispatchEvent(new Event('input', { bubbles: true }));
        await until(() => win.location.hash.includes('/work?q=asset'), 'header search collection navigation');
        report(mobileSearch.matches('[data-global-search]') && doc.activeElement === mobileSearch && !!doc.querySelector('.collection-view'), 'Keyboard search stays in the header and opens the filtered project collection.');
        const mode = doc.querySelector<HTMLButtonElement>('[data-mode="sound"]')!;
        mobileSearch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        report(doc.activeElement?.matches('.mode-switch [aria-pressed="true"]') === true && win.location.hash.includes('q=asset'), 'Escape closes phone search, preserves the query and returns focus to the current identity.');
        mode.focus({ preventScroll: true });
        await wait();
        const modeStyle = getComputedStyle(mode), modeGroupStyle = getComputedStyle(mode.parentElement!);
        report(doc.activeElement === mode && mode.getBoundingClientRect().height >= 44 && modeStyle.visibility === 'visible'
            && Number(modeStyle.opacity) > 0 && Number(modeGroupStyle.opacity) > 0,
            'Leaving phone search for an identity control restores a visible, operable focus target.');
        current.style.width = '1440px';

    }
    catch (error) {
        report(false, String(error));
    }
    finally {
        run.disabled = false;
        output.dataset.complete = 'true';
    }
});
