import '../src/workspace/workspace.css';
import '../src/workspace/identity.css';
import { mountIdentity, identityStatus } from '../src/workspace/identity';
import { MORPH_MS } from '../src/ascii/field';
const output = document.querySelector('#results')!;
const canvas = document.querySelector<HTMLCanvasElement>('#identity-grid')!;
const identityMorphActive = () => identityStatus(canvas).morphing;
const mousePhysicsActive = () => identityStatus(canvas).motionActive;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const pixels = () => canvas.toDataURL();
const renderedReady = () => document.querySelector('.identity-field')?.getAttribute('data-renderer') === 'ready';
async function until(test: () => boolean, timeout = 2500) {
    const start = performance.now();
    while (!test() && performance.now() - start < timeout) await wait(40);
    return test();
}
const resting = () => {
    const status = identityStatus(canvas);
    return renderedReady() && !status.active && !status.ambient && !status.morphing && !status.motionActive && !status.rafPending;
};
async function waitFor(test: () => boolean, label: string, timeout = 2500) {
    if (!await until(test, timeout)) throw new Error(`Timed out: ${label}`);
}
function occupiedPoint() {
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d')!;
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let y = Math.floor(canvas.height * .25); y < canvas.height * .85; y += 3) {
        for (let x = Math.floor(canvas.width * .35); x < canvas.width * .9; x += 3) {
            const offset = (y * canvas.width + x) * 4;
            if (data[offset] > 150 && data[offset + 3] > 120)
                return { clientX: rect.left + x * rect.width / canvas.width, clientY: rect.top + y * rect.height / canvas.height };
        }
    }
    throw new Error('No substantial illuminated portrait cells found.');
}
const report = (ok: boolean, label: string) => { output.textContent += (ok ? 'PASS: ' : 'FAIL: ') + label + '\n'; };
let dispose = () => { };
const run = document.querySelector<HTMLButtonElement>('#run')!;
run.addEventListener('click', async () => {
    if (run.disabled)
        return;
    run.disabled = true;
    const initialMatchMedia = window.matchMedia;
    const initialSource = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
    const initialContext = canvas.getContext;
    let reduced = true;
    const motionListeners = new Set<(event: MediaQueryListEvent) => void>();
    const motionQuery = {
        get matches() { return reduced; },
        media: '(prefers-reduced-motion: reduce)',
        addEventListener(_type: string, listener: (event: MediaQueryListEvent) => void) { motionListeners.add(listener); },
        removeEventListener(_type: string, listener: (event: MediaQueryListEvent) => void) { motionListeners.delete(listener); },
    } as unknown as MediaQueryList;
    const setReduced = (next: boolean) => {
        reduced = next;
        const event = new MediaQueryListEvent('change', { matches: next, media: motionQuery.media });
        for (const listener of motionListeners) listener(event);
    };
    try {
        output.textContent = '';
        output.removeAttribute('data-complete');
        await document.fonts.ready;
        if (new URLSearchParams(location.search).has('missing')) {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
            Object.defineProperty(HTMLImageElement.prototype, 'src', { ...descriptor, set(value: string) { descriptor.set!.call(this, value.includes('-source.png') ? './missing-identity-source.png' : value); } });
            dispose = mountIdentity('production');
            for (let i = 0; i < 40 && !document.querySelector('.identity-fallback')!.textContent!.includes('unavailable'); i++)
                await wait(50);
            report(document.querySelector('.identity-fallback')!.textContent!.includes('unavailable') && !document.querySelector('.identity-ready'), 'Actual image-load failure leaves a readable fallback.');
            dispose();
            Object.defineProperty(HTMLImageElement.prototype, 'src', descriptor);
            return;
        }
        // Resting references are captured with a real rendered frame, never during the ambient burst.
        window.matchMedia = query => query.includes('prefers-reduced-motion') ? motionQuery : initialMatchMedia.call(window, query);
        dispose();
        dispose = mountIdentity('production');
        await waitFor(resting, 'reduced-motion professional baseline');
        const professional = pixels();
        report(!!document.querySelector('.identity-ready') && identityStatus(canvas).cells! > 1000, 'Professional ASCII identity loads a substantial character field.');
        dispose();
        dispose = mountIdentity('sound', 'production');
        await waitFor(resting, 'reduced-motion Livicee baseline');
        const dj = pixels();
        report(professional !== dj && !identityMorphActive(), 'Reduced motion immediately renders a distinct stable DJ identity without a morph.');
        setReduced(false);
        await waitFor(() => identityStatus(canvas).active && pixels() !== dj, 'Livicee ambient motion');
        const animatedDj = pixels();
        await wait(250);
        report(pixels() !== animatedDj && identityStatus(canvas).cachedStrips! > 0, 'Livicee visibly pulses through actual cached portrait glyphs without pointer input.');
        dispose();
        dispose = mountIdentity('sound', 'sound');
        await waitFor(renderedReady, 'same-identity remount');
        report(!identityMorphActive() && identityStatus(canvas).cachedStrips! > 0, 'Mounting the same identity does not run a cross-identity morph.');
        await waitFor(resting, 'Livicee nine-second activity burst to rest', 11000);
        report(pixels() === dj, 'Livicee returns to its exact reduced-motion source after the ambient burst.');
        const quietDj = pixels();
        await wait(250);
        report(resting() && pixels() === quietDj, 'Resting Livicee pixels stay identical with no pending animation frame.');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
        await waitFor(() => identityStatus(canvas).active && pixels() !== dj, 'keyboard activity to wake Livicee');
        setReduced(true);
        await waitFor(resting, 'live reduced-motion preference to stop Livicee');
        report(pixels() === dj, 'A live reduced-motion change cancels movement and restores the exact resting portrait.');
        setReduced(false);
        dispose();
        dispose = mountIdentity('production', 'sound');
        await waitFor(() => renderedReady() && identityMorphActive(), 'cross-identity morph to begin', 1500);
        await waitFor(() => identityMorphActive() && pixels() !== professional && pixels() !== dj, 'intermediate glyph morph', MORPH_MS + 800);
        report(true, 'Switching identities renders a real intermediate glyph morph.');
        await waitFor(() => renderedReady() && !identityMorphActive(), 'bounded morph to end', MORPH_MS + 1500);
        for (let i = 0; i < 9; i++) {
            dispose();
            dispose = mountIdentity(i % 2 ? 'sound' : 'production', i % 2 ? 'production' : 'sound');
            await wait(20);
        }
        await waitFor(() => renderedReady() && !identityMorphActive() && !mousePhysicsActive(), 'nine rapid switches to finish morphing', MORPH_MS + 1000);
        const point = occupiedPoint();
        document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', ...point }));
        await wait(80);
        report(identityStatus(canvas).pointerStrength === 0 && !mousePhysicsActive(), 'Touch exploration never creates pointer or click distortion while ambience continues.');
        for (let i = 0; i < 12; i++) {
            document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', ...point }));
            await wait(40);
            if (mousePhysicsActive()) break;
        }
        const moved = pixels() !== professional && (identityStatus(canvas).pointerStrength ?? 0) > 0;
        report(moved, 'Mouse movement dissolves occupied character cells.');
        if (!moved) output.textContent += `DETAIL: mouse ${JSON.stringify({ status: identityStatus(canvas), point, visibility: document.visibilityState })}\n`;
        document.dispatchEvent(new PointerEvent('pointerleave'));
        await waitFor(() => !mousePhysicsActive() && identityStatus(canvas).pointerStrength === 0, 'pointer release', 1000);
        report(identityStatus(canvas).active && !mousePhysicsActive(), 'Mouse influence releases promptly while the separate ambient burst continues.');
        const shield = document.querySelector('[data-ascii-shield]')!;
        shield.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', ...point }));
        await wait(80);
        report(identityStatus(canvas).pointerStrength === 0 && !mousePhysicsActive(), 'Controls shield the identity from pointer interaction.');
        for (const [button, buttons, name] of [[1, 4, 'Middle'], [2, 2, 'Right']] as const) {
            canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', pointerId: 7, button, buttons, ...point }));
            document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', pointerId: 7, buttons, ...point }));
            await wait(100);
            report(!mousePhysicsActive(), `${name}-button press and drag do not start a decorative ripple or hover distortion.`);
            document.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse', pointerId: 7, button, buttons: 0, ...point }));
        }
        const protectedText = document.createElement('span');
        protectedText.dataset.selectable = '';
        protectedText.textContent = 'Selectable contact detail';
        const wave = document.createElement('div');
        wave.dataset.deckWave = '';
        canvas.parentElement!.append(protectedText, wave);
        try {
            protectedText.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', pointerId: 7, button: 0, buttons: 1, ...point }));
            const range = document.createRange();
            range.selectNodeContents(protectedText);
            document.getSelection()?.removeAllRanges();
            document.getSelection()?.addRange(range);
            document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', pointerId: 7, buttons: 1, ...point }));
            await wait(140);
            report(!mousePhysicsActive() && document.getSelection()?.toString() === protectedText.textContent, 'Dragging selected text into the field keeps the selection and suppresses portrait distortion.');
            document.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse', pointerId: 7, button: 0, buttons: 0, ...point }));
            document.getSelection()?.removeAllRanges();
            document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', pointerId: 7, buttons: 0, ...point }));
            await waitFor(() => (identityStatus(canvas).pointerStrength ?? 0) > 0, 'ordinary hover after selection drag');
            report(true, 'Normal hover resumes after the protected drag ends.');
            document.dispatchEvent(new PointerEvent('pointerleave'));
            await waitFor(() => !mousePhysicsActive(), 'post-drag hover release', 1000);
            wave.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', pointerId: 7, button: 0, buttons: 1, ...point }));
            document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', pointerId: 7, buttons: 1, ...point }));
            await wait(100);
            report(!mousePhysicsActive(), 'A real waveform seek target and its drag do not also distort the portrait.');
            document.dispatchEvent(new PointerEvent('pointercancel', { pointerType: 'mouse', pointerId: 7, buttons: 0, ...point }));
        } finally {
            document.getSelection()?.removeAllRanges();
            protectedText.remove(); wave.remove();
        }
        canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', ...point }));
        await waitFor(mousePhysicsActive, 'click ripple to begin', 700);
        await wait(120);
        const rippled = pixels() !== professional && identityStatus(canvas).effectActive;
        await waitFor(() => !mousePhysicsActive(), 'click ripple to finish', 1800);
        report(!!rippled && !identityStatus(canvas).effectActive, 'A click produces visible glyph motion and its finite effect finishes.');
        await waitFor(resting, 'professional nine-second activity burst to rest', 11000);
        report(pixels() === professional, 'Nine rapid switches, mouse, touch, shield and click input all leave the exact original professional portrait at rest.');
        const quietProfessional = pixels();
        await wait(250);
        report(resting() && pixels() === quietProfessional, 'The professional field remains identical and stops scheduling frames at rest.');
        setReduced(true);
        dispose();
        dispose = mountIdentity('sound', 'production');
        await waitFor(resting, 'reduced-motion destination', 1500);
        report(pixels() === dj, 'Reduced motion renders the exact stable destination without a flip.');
        dispose();
        window.matchMedia = initialMatchMedia;
        const getContext = canvas.getContext.bind(canvas);
        canvas.getContext = (() => null) as typeof canvas.getContext;
        dispose = mountIdentity('production');
        report(document.querySelector('.identity-fallback')!.textContent!.includes('unavailable'), 'Canvas failure leaves an explicit fallback.');
        canvas.getContext = getContext;
        dispose();
        dispose = mountIdentity('sound');
    }
    catch (error) {
        report(false, String(error));
    }
    finally {
        window.matchMedia = initialMatchMedia;
        Object.defineProperty(HTMLImageElement.prototype, 'src', initialSource);
        canvas.getContext = initialContext;
        run.disabled = false;
        output.setAttribute('data-complete', 'true');
    }
});
