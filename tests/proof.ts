import { mountIdentity, identityStatus } from '../src/workspace/identity';
import type { DatasetId } from '../src/workspace/model';
const canvas = document.querySelector<HTMLCanvasElement>('#identity-grid')!;
const output = document.querySelector<HTMLElement>('#results')!;
const failure = new URLSearchParams(location.search).get('failure');
if (failure === 'image') {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
    Object.defineProperty(HTMLImageElement.prototype, 'src', { ...descriptor, set(value: string) { descriptor.set!.call(this, value.includes('-source.png') ? './missing-source.png' : value); } });
}
if (failure === 'canvas') canvas.getContext = (() => null) as typeof canvas.getContext;
let current: DatasetId = 'production', dispose = mountIdentity(current);
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const pixels = () => canvas.toDataURL();
if (failure) {
    void wait(800).then(() => {
        const message = document.querySelector('.identity-fallback')?.textContent;
        const unavailable = document.querySelector<HTMLElement>('.identity-field')?.dataset.renderer === 'unavailable';
        output.textContent = `${unavailable && message?.includes('unavailable') ? 'PASS' : 'FAIL'}: ${failure} failure leaves a visible, explicit fallback.\n${message}`;
        output.dataset.complete = 'true';
    });
}
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const previous = current; current = button.dataset.mode as DatasetId; dispose(); dispose = mountIdentity(current, previous);
}));
document.querySelector<HTMLButtonElement>('#run')!.addEventListener('click', async event => {
    const button = event.currentTarget as HTMLButtonElement; button.disabled = true; output.textContent = '';
    const report = (ok: boolean, label: string) => { output.textContent += `${ok ? 'PASS' : 'FAIL'}: ${label}\n`; };
    const match = window.matchMedia;
    try {
        dispose(); dispose = mountIdentity('production'); await wait(300);
        const professional = pixels();
        report(!!document.querySelector('.identity-ready') && !identityStatus(canvas).active, 'Professional source settles to an idle glyph field.');
        dispose(); dispose = mountIdentity('sound', 'production'); await wait(120);
        const morphPaintMs = identityStatus(canvas).lastFrameMs;
        report(identityStatus(canvas).morphing, 'Dataset change runs the bounded morph.');
        await wait(550); const sound = pixels();
        report(professional !== sound && !identityStatus(canvas).morphing && !identityStatus(canvas).active, 'Livicee is distinct and settled after 670ms.');
        for (let i = 0; i < 9; i++) { dispose(); dispose = mountIdentity(i % 2 ? 'sound' : 'production', i % 2 ? 'production' : 'sound'); await wait(20); }
        await wait(650);
        report(pixels() === professional && !identityStatus(canvas).morphing, 'Nine interrupted changes settle to the exact final source.');
        const bounds = canvas.getBoundingClientRect();
        document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: bounds.right - 250, clientY: bounds.top + 250 }));
        await wait(90); report(pixels() !== professional, 'Pointer changes the actual glyph rendering.');
        document.dispatchEvent(new PointerEvent('pointerleave')); await wait(600);
        report(pixels() === professional && !identityStatus(canvas).active, 'Pointer exit restores the exact idle field.');
        canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', clientX: bounds.right - 250, clientY: bounds.top + 250 }));
        await wait(120); report(pixels() !== professional && identityStatus(canvas).active, 'Click produces a bounded travelling glyph wave.');
        await wait(900); report(pixels() === professional && !identityStatus(canvas).active, 'The click wave restores the exact idle field.');
        window.matchMedia = query => query.includes('prefers-reduced-motion') ? ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList) : match(query);
        dispose(); dispose = mountIdentity('sound', 'production'); await wait(100);
        report(pixels() === sound && !identityStatus(canvas).morphing && !identityStatus(canvas).active, 'Reduced motion renders the stable destination immediately.');
        window.matchMedia = match;
        dispose(); dispose = mountIdentity('production'); await wait(100);
        const stable = pixels(); await wait(1000);
        report(pixels() === stable && !identityStatus(canvas).active, 'Idle field remains identical with no continuous loop.');
        output.textContent += `\nObserved morph draw: ${morphPaintMs}ms.\nMeasured idle status: ${JSON.stringify(identityStatus(canvas))}`;
    } catch (error) { report(false, String(error)); }
    finally { window.matchMedia = match; current = 'production'; button.disabled = false; output.dataset.complete = 'true'; }
});
