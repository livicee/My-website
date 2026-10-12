import { createVeil } from '../src/workspace/veil';
const run = document.querySelector<HTMLButtonElement>('#run')!;
const out = document.querySelector<HTMLElement>('#results')!;
const wait = (ms = 70) => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok: boolean, label: string) => { out.textContent += `${ok ? 'PASS' : 'FAIL'}: ${label}\n`; if (!ok) throw new Error(label); };
run.addEventListener('click', async () => {
    run.disabled = true; out.textContent = ''; delete out.dataset.complete;
    const frame = document.createElement('iframe');
    frame.style.cssText = 'border:0;width:1440px;height:900px;display:block';
    frame.src = '../index.html#/work';
    document.querySelector('#frames')!.replaceChildren(frame);
    try {
        await new Promise<void>(resolve => frame.onload = () => resolve());
        const doc = frame.contentDocument!, win = frame.contentWindow!;
        for (let i=0;i<100 && !doc.querySelector('.identity-ready');i++) await wait();
        await wait(700);
        const canvas = doc.querySelector<HTMLCanvasElement>('#identity-grid')!;
        const original = { width: canvas.width, height: canvas.height, bounds: canvas.getBoundingClientRect() };
        // Ambient letters intentionally change pixels. Route stability concerns the persistent canvas and its
        // composition; source registration and exact settled frames are exercised by proof.html and identity.html.
        const portraitAnchored = () => {
            const bounds = canvas.getBoundingClientRect();
            return doc.querySelector('#identity-grid') === canvas && canvas.width === original.width && canvas.height === original.height
                && (['left', 'top', 'width', 'height'] as const).every(key => Math.abs(bounds[key] - original.bounds[key]) <= .5);
        };
        const nav = doc.querySelector('.navigation')!, header = doc.querySelector('.topbar')!;
        const footer = doc.querySelector('.workspace-footer')!, search = doc.querySelector('[data-global-search]')!;
        const click = (selector: string) => doc.querySelector<HTMLElement>(selector)!.click();
        assert(doc.querySelectorAll('.overview-item').length === 10, 'Content Work shows all 10 projects.');
        for (const path of ['/', '/about', '/contact', '/work/dam-migration', '/work/dam-migration/artefacts/asset-model']) {
            win.location.hash = '#' + path; await wait();
            assert(portraitAnchored(), `Portrait canvas, backing dimensions and viewport anchor stay identical on ${path}.`);
        }
        assert(doc.querySelector('.navigation') === nav && doc.querySelector('.topbar') === header
            && doc.querySelector('.workspace-footer') === footer && doc.querySelector('[data-global-search]') === search,
            'Navigation, header, footer and search nodes persist across page routes.');
        assert(doc.querySelectorAll('.structure-links,.collection-tabs').length === 0, 'No redundant collection bars.');
        win.location.hash = '#/work'; await wait();
        click('[data-mode="sound"]');
        const veil = doc.querySelector<HTMLCanvasElement>('.veil')!;
        assert(!veil.hidden && Number(veil.dataset.glyphs)>100, 'Mode change resolves visible copy through real ASCII glyphs.');
        const regions = new Set((veil.dataset.regions ?? '').split(','));
        assert(['navigation','topbar','index','view','footer'].every(region => regions.has(region)), 'Mode change covers navigation, header, collection index, main copy and persistent footer as one shell transition.');
        assert(!doc.querySelector('.identity-caption') && !!doc.querySelector('.identity-field[aria-label]'), 'The portrait keeps its accessible name without a duplicate visible caption.');
        assert(win.location.hash === '#/livicee/mixes' && doc.querySelectorAll('.crate-row').length === 5, 'Livicee Work immediately exposes exactly 5 mixes.');
        assert(getComputedStyle(veil).pointerEvents === 'none' && veil.getAttribute('aria-hidden') === 'true', 'Transition does not intercept controls or replace accessible text.');
        await wait(750);
        assert(veil.hidden && veil.dataset.state === 'idle', 'Text transition ends and becomes idle.');
        click('.nav-item[href="#/livicee/about"]');
        const viewRegions = new Set((veil.dataset.regions ?? '').split(','));
        assert(!veil.hidden && veil.dataset.scope === 'view' && viewRegions.has('view') && !['navigation','topbar','footer'].some(region => viewRegions.has(region)), 'Left navigation resolves only the content view while the shell remains stable.');
        await wait(750);
        click('.nav-item[href="#/livicee/mixes"]'); await wait(750);
        win.location.hash = '#/livicee'; await wait();
        click('#view a[href="#/livicee/mixes"]');
        assert(!veil.hidden && veil.dataset.scope === 'view' && win.location.hash === '#/livicee/mixes', 'Inline route links use the same content-only transition.');
        await wait(750);
        for (let i=0;i<9;i++) click(`[data-mode="${i%2 ? 'sound' : 'production'}"]`);
        await wait(750);
        assert(win.location.hash === '#/work' && doc.querySelector('[data-mode="production"]')?.getAttribute('aria-pressed') === 'true'
            && veil.hidden && veil.dataset.state === 'idle' && portraitAnchored()
            && doc.querySelector<HTMLElement>('.identity-field')?.dataset.renderer === 'ready',
            'Rapid switches settle to the requested identity and copy, with an idle veil and ready portrait at the original anchor.');
        doc.querySelector<HTMLElement>('#view')!.scrollTo(0,180); await wait();
        click('[data-mode="sound"]'); await wait();
        assert(!veil.hidden, 'Mode transition survives navigation scroll restoration.');
        doc.querySelector<HTMLElement>('#view')!.scrollTo(0,180); await wait();
        assert(veil.hidden, 'User scrolling cancels the veil so it cannot drift off the text.');
        click('[data-mode="production"]');
        click('[data-mode="sound"]'); click('.nav-item[href="#/livicee/about"]');
        assert(!veil.hidden && veil.dataset.scope === 'view' && win.location.hash === '#/livicee/about', 'Navigation replaces an active mode effect with the scoped content transition.');
        const initial = window.matchMedia;
        window.matchMedia = q => ({matches:true,media:q,addEventListener(){},removeEventListener(){}} as unknown as MediaQueryList);
        const reduced = createVeil(); reduced.play(document.querySelector('#results'));
        assert(document.querySelector<HTMLCanvasElement>('.veil')!.hidden, 'Reduced motion leaves original text immediately visible.');
        reduced.destroy(); window.matchMedia = initial;
    } catch(error) { out.textContent += String(error) + '\n'; }
    finally { run.disabled = false; out.dataset.complete = 'true'; }
});
