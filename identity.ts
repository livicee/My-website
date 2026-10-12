import { AMBIENT_STEP_MS, SOUND_STEP_MS, createAsciiField, readingEdge, type FieldComposition, type FieldPointer } from '../ascii/field';
import { POINTER_HOLD_MS, pointerFollow, pointerInfluenceAt, pointerStrengthAt } from '../ascii/pointer';
import type { DatasetId } from './model';
import { reducedMotionQuery } from './motion';

const sources: Record<DatasetId, string> = {
    production: new URL('../ascii/assets/content-source.png', import.meta.url).href,
    sound: new URL('../ascii/assets/livicee-source.png', import.meta.url).href,
};
/** The ambient letters run while the visitor is active, then the field rests and the loop stops. */
const AMBIENT_BURST_MS = 9000;
// The glyph atlas is baked from this face; build it again if it arrives after the first paint.
const GLYPH_FONT = '16px "Fragment Mono"';
const glyphFontLoaded = () => !document.fonts || document.fonts.check(GLYPH_FONT);
const glyphFontReady: Promise<unknown> = document.fonts ? document.fonts.load(GLYPH_FONT).catch(() => undefined) : Promise.resolve();
const images: Partial<Record<DatasetId, HTMLImageElement>> = {};
const pending: Partial<Record<DatasetId, Promise<HTMLImageElement>>> = {};
type Completion<T> = { subscribe: (ready: (value: T) => void, failed: (error: unknown) => void) => () => void };
type CompletionConsumer<T> = { ready: (value: T) => void; failed: (error: unknown) => void };
/** Shared requests retain a removable notification, rather than every canceled mount. */
function completion<T>(promise: Promise<T>): Completion<T> {
    const consumers = new Set<CompletionConsumer<T>>();
    let result: { value: T } | { error: unknown } | undefined;
    const deliver = (consumer: CompletionConsumer<T>) => {
        if (!result || !consumers.delete(consumer)) return;
        if ('error' in result) consumer.failed(result.error);
        else {
            try { consumer.ready(result.value); }
            catch (error) { consumer.failed(error); }
        }
    };
    const finish = (next: NonNullable<typeof result>) => {
        result = next;
        for (const consumer of [...consumers]) deliver(consumer);
    };
    void promise.then(value => finish({ value }), error => finish({ error }));
    return {
        subscribe(ready, failed) {
            const consumer = { ready, failed };
            consumers.add(consumer);
            if (result) queueMicrotask(() => deliver(consumer));
            return () => { consumers.delete(consumer); };
        },
    };
}
const fontCompletion = completion(glyphFontReady);
const imageCompletions = new WeakMap<Promise<HTMLImageElement>, Completion<HTMLImageElement>>();
function imageCompletion(dataset: DatasetId): Completion<HTMLImageElement> {
    const promise = load(dataset);
    let shared = imageCompletions.get(promise);
    if (!shared) { shared = completion(promise); imageCompletions.set(promise, shared); }
    return shared;
}
/** Data Saver visitors fetch the other portrait only if they switch to it. */
const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
function load(dataset: DatasetId): Promise<HTMLImageElement> {
    return pending[dataset] ??= new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => { images[dataset] = image; resolve(image); };
        image.onerror = () => { delete pending[dataset]; reject(new Error('Identity illustration unavailable')); };
        image.src = sources[dataset];
    });
}
type Mounted = { renderer: ReturnType<typeof createAsciiField>; active: boolean; diagnostics: () => { pointerStrength: number; paintAgeMs: number; inputAgeMs: number; rafPending: boolean } };
const renderers = new WeakMap<HTMLCanvasElement, Mounted>();
/** Follow the phone reading boundary without moving the portrait's source geometry. */
export function updateIdentityReadingMask() {
    const host = document.querySelector<HTMLElement>('.identity-field');
    const reading = document.querySelector<HTMLElement>('#view .home-page, #view .reading-page, #view .library-surface');
    if (!host || !reading) return;
    const frame = host.getBoundingClientRect(), readingRect = reading.getBoundingClientRect();
    const top = Math.max(0, Math.min(frame.height, readingRect.top - frame.top));
    host.style.setProperty('--identity-reading-top', `${top}px`);
}
export function identityStatus(canvas: HTMLCanvasElement) {
    const entry = renderers.get(canvas);
    const status = entry?.renderer.status(), diagnostics = entry?.diagnostics();
    return {
        morphing: status?.morphing ?? false,
        active: entry?.active ?? false,
        ...status,
        ...diagnostics,
        motionActive: !!status?.effectActive || (diagnostics?.pointerStrength ?? 0) > .005,
    };
}
function readComposition(target: HTMLCanvasElement): FieldComposition {
    const host = target.closest<HTMLElement>('.identity-field') ?? target;
    const style = getComputedStyle(host);
    const optional = (name: string) => { const value = Number.parseFloat(style.getPropertyValue(name)); return Number.isFinite(value) ? value : undefined; };
    const root = getComputedStyle(document.documentElement);
    const nav = Number.parseFloat(root.getPropertyValue('--nav')) || 0;
    const compositionWidth = Number.parseFloat(root.getPropertyValue('--composition-width')) || 1592;
    return {
        viewportWidth: window.innerWidth,
        readingEdge: readingEdge(window.innerWidth, nav, compositionWidth),
        figureWidth: optional('--identity-figure-width'),
        figureTop: optional('--identity-figure-top'),
    };
}

export function mountIdentity(dataset: DatasetId, previous?: DatasetId): () => void {
    const target = document.querySelector<HTMLCanvasElement>('#identity-grid');
    if (!target) return () => {};
    const host = target.closest<HTMLElement>('.identity-field') ?? target;
    const fallback = host.querySelector<HTMLElement>('.identity-fallback');
    const fail = (error?: unknown) => {
        // The page reads fine without the portrait; say so on the page and, for whoever investigates, in the console.
        if (error) console.warn('Identity illustration unavailable:', error);
        host.classList.remove('identity-ready'); host.dataset.renderer = 'unavailable';
        if (fallback) fallback.textContent = 'Illustration unavailable.';
    };
    let renderer: ReturnType<typeof createAsciiField>;
    try {
        renderer = createAsciiField(
            target,
            host.querySelector<HTMLCanvasElement>('.identity-lattice') ?? undefined,
            host.querySelector<HTMLCanvasElement>('.identity-mono') ?? undefined,
            host.querySelector<HTMLCanvasElement>('.identity-response') ?? undefined,
        );
    } catch (error) { fail(error); return () => {}; }
    let raf = 0, timer = 0, fontTimer = 0, disposed = false, intersecting = true, ready = false, lastPaint = 0;
    let cancelImage = () => {}, cancelFontPaint = () => {};
    let lastMove = -Infinity, releasedAt = Infinity;
    let engagedAt = 0, engagementStrength = 0, pointerFrameAt = performance.now();
    let pointerTargetX = 0, pointerTargetY = 0;
    const protectedPointers = new Set<number>();
    const pointer: FieldPointer = { x: 0, y: 0, strength: 0 };
    const reducedMotion = reducedMotionQuery();
    let awakeUntil = performance.now() + AMBIENT_BURST_MS;
    let glyphsCurrent = glyphFontLoaded();
    renderer.setAmbient(!reducedMotion.matches, awakeUntil);
    const entry: Mounted = { renderer, active: false, diagnostics: () => ({ pointerStrength: pointer.strength, paintAgeMs: performance.now() - lastPaint, inputAgeMs: performance.now() - lastMove, rafPending: !!raf }) };
    renderers.set(target, entry); host.dataset.renderer = 'loading';
    // The other identity's portrait is only needed for a switch. It waits until this one is drawn and the page is
    // idle, so the first view never shares its bandwidth.
    const other: DatasetId = dataset === 'sound' ? 'production' : 'sound';
    // Safari has no requestIdleCallback; a short timer stands in.
    const idle = typeof requestIdleCallback === 'function';
    let prefetch = 0;
    const cancelPrefetch = () => { if (!prefetch) return; if (idle) cancelIdleCallback(prefetch); else clearTimeout(prefetch); prefetch = 0; };
    const prefetchOther = () => {
        if (prefetch || images[other] || pending[other] || saveData()) return;
        const fetchOther = () => { prefetch = 0; if (!disposed) void load(other).catch(() => {}); };
        prefetch = idle ? requestIdleCallback(fetchOther, { timeout: 3000 }) : window.setTimeout(fetchOther, 1000);
    };

    const render = (now: number) => {
        raf = 0;
        if (disposed || document.hidden || !intersecting || !ready) return;
        if (now - lastPaint < 30 && entry.active) { raf = requestAnimationFrame(render); return; }
        lastPaint = now;
        pointer.strength = reducedMotion.matches ? 0 : pointerInfluenceAt(now, lastMove, releasedAt, engagedAt, engagementStrength);
        pointer.x = pointerFollow(pointer.x, pointerTargetX, now - pointerFrameAt);
        pointer.y = pointerFollow(pointer.y, pointerTargetY, now - pointerFrameAt);
        pointerFrameAt = now;
        const pointerEngaged = !reducedMotion.matches && pointerStrengthAt(now, lastMove, releasedAt) > 0;
        const ambient = !reducedMotion.matches && now < awakeUntil;
        renderer.setAmbient(ambient, awakeUntil);
        try {
            entry.active = renderer.draw(now, pointer.strength > 0 ? pointer : undefined);
            host.classList.add('identity-ready'); host.dataset.renderer = 'ready';
        } catch (error) { fail(error); entry.active = false; return; }
        if (!entry.active || reducedMotion.matches) return;
        // Both modes sleep between paints. Livicee's equalizer paints at 30fps; Content keeps its quiet 100ms step.
        if (renderer.status().effectActive || pointerEngaged) raf = requestAnimationFrame(render);
        else {
            const step = dataset === 'sound' ? SOUND_STEP_MS : AMBIENT_STEP_MS;
            schedule(step - (now % step) + 1);
        }
    };
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = 0; } };
    const schedule = (delay: number) => {
        if (disposed || raf || timer) return;
        timer = window.setTimeout(() => { timer = 0; if (!raf && !disposed) raf = requestAnimationFrame(render); }, delay);
    };
    const request = () => { clearTimer(); if (!raf && !disposed) raf = requestAnimationFrame(render); };
    /** Any sign of an active visitor keeps the ambient current running for another burst. */
    const wake = () => { awakeUntil = performance.now() + AMBIENT_BURST_MS; if (!raf && !timer) request(); };
    const refreshGlyphs = () => {
        if (disposed || glyphsCurrent || !glyphFontLoaded()) return;
        glyphsCurrent = true; renderer.refreshGlyphs(); request();
    };
    const cancelFontRefresh = fontCompletion.subscribe(refreshGlyphs, fail);
    const clearPointer = () => {
        pointer.strength = 0; lastMove = -Infinity; releasedAt = -Infinity;
        engagedAt = 0; engagementStrength = 0; pointerFrameAt = performance.now();
    };
    const resize = () => { if (disposed) return; renderer.resize(readComposition(target)); updateIdentityReadingMask(); clearPointer(); request(); };
    const onScroll = () => { updateIdentityReadingMask(); wake(); };
    const allowed = (event: PointerEvent) => {
        const node = event.target instanceof Element ? event.target : null;
        // Reading copy belongs to the interactive field. Only usable controls and copyable text shield it.
        const shield = 'a,button,input,textarea,select,label,summary,audio,video,dialog,[role="dialog"],[role="button"],[role="slider"],[role="checkbox"],[role="switch"],[role="tab"],[data-ascii-shield],[data-deck-wave],[contenteditable]:not([contenteditable="false"]),.email-link,pre,code,[data-selectable]';
        return !reducedMotion.matches && event.pointerType !== 'touch' && !node?.closest(shield);
    };
    const move = (event: PointerEvent) => {
        wake();
        // A control or text-selection drag remains protected after it leaves the original element.
        // buttons also recovers from a release outside the document, where pointerup cannot reach us.
        if (event.buttons === 0) protectedPointers.delete(event.pointerId);
        if (protectedPointers.has(event.pointerId) || (event.buttons & ~1) !== 0 || !allowed(event)) { releasedAt = Math.min(releasedAt, performance.now()); if (pointer.strength || entry.active) request(); return; }
        const rect = target.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) { releasedAt = Math.min(releasedAt, performance.now()); if (pointer.strength || entry.active) request(); return; }
        const now = performance.now();
        const influence = pointerInfluenceAt(now, lastMove, releasedAt, engagedAt, engagementStrength);
        if (now >= Math.min(lastMove + POINTER_HOLD_MS, releasedAt)) {
            engagedAt = now; engagementStrength = influence;
        }
        // A fresh hover begins under the cursor at zero influence, never travelling from the canvas origin.
        if (influence === 0) { pointer.x = x; pointer.y = y; pointerFrameAt = now; }
        pointerTargetX = x; pointerTargetY = y;
        lastMove = now; releasedAt = Infinity; request();
    };
    const leave = () => { releasedAt = Math.min(releasedAt, performance.now()); request(); };
    const press = (event: PointerEvent) => {
        wake();
        if (event.button !== 0 || !allowed(event)) {
            protectedPointers.add(event.pointerId);
            leave();
            return;
        }
        protectedPointers.delete(event.pointerId);
        const rect = target.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
        if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) { renderer.ripple(x, y); request(); }
    };
    const endPointer = (event: PointerEvent) => {
        const protectedDrag = protectedPointers.delete(event.pointerId);
        if (protectedDrag || event.type === 'pointercancel') leave();
    };
    const visibility = () => {
        protectedPointers.clear();
        clearPointer();
        if (document.hidden) { cancelAnimationFrame(raf); raf = 0; clearTimer(); entry.active = false; renderer.settle(); }
        else wake();
    };
    const onMotion = () => {
        clearPointer(); renderer.settle();
        renderer.setAmbient(!reducedMotion.matches && performance.now() < awakeUntil, awakeUntil);
        request();
    };
    // The canvas ignores hit tests (pointer-events: none), so the pointer is followed on the document.
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', press, { passive: true });
    document.addEventListener('pointerup', endPointer, { passive: true });
    document.addEventListener('pointercancel', endPointer, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('keydown', wake);
    reducedMotion.addEventListener('change', onMotion);
    const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(target);
    const intersection = new IntersectionObserver(entries => {
        // Several changes can arrive together; the last one is the current state.
        intersecting = entries.at(-1)?.isIntersecting ?? true;
        if (intersecting) request();
        else { clearPointer(); cancelAnimationFrame(raf); raf = 0; clearTimer(); entry.active = false; renderer.settle(); }
    });
    intersection.observe(target);
    renderer.resize(readComposition(target));
    const loaded = (image: HTMLImageElement) => {
        if (disposed) return;
        const show = () => {
            if (disposed) return;
            refreshGlyphs();
            renderer.setSource(image, previous && previous !== dataset ? images[previous] : undefined, !reducedMotion.matches, dataset);
            ready = true; wake();
            prefetchOther();
        };
        // Paint with the real glyph face; never wait more than 1.5s for it.
        if (glyphFontLoaded()) show();
        else {
            let waiting = true;
            const paint = () => {
                if (!waiting) return;
                waiting = false;
                cancelFontPaint();
                clearTimeout(fontTimer); fontTimer = 0;
                show();
            };
            const paintSoon = () => queueMicrotask(() => { try { paint(); } catch (error) { fail(error); } });
            cancelFontPaint = fontCompletion.subscribe(paintSoon, fail);
            fontTimer = window.setTimeout(() => {
                fontTimer = 0;
                paintSoon();
            }, 1500);
        }
    };
    if (images[dataset]) loaded(images[dataset]!);
    else cancelImage = imageCompletion(dataset).subscribe(loaded, error => { if (!disposed) fail(error); });
    return () => {
        disposed = true; cancelAnimationFrame(raf); clearTimer(); cancelPrefetch();
        cancelImage(); cancelFontRefresh(); cancelFontPaint(); clearTimeout(fontTimer); fontTimer = 0;
        sizeObserver.disconnect(); intersection.disconnect();
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerdown', press);
        document.removeEventListener('pointerup', endPointer); document.removeEventListener('pointercancel', endPointer);
        document.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility);
        document.removeEventListener('scroll', onScroll, true); document.removeEventListener('keydown', wake);
        reducedMotion.removeEventListener('change', onMotion);
        if (renderers.get(target) === entry) renderers.delete(target);
        renderer.destroy();
    };
}
