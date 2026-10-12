import { GLYPH_FAMILY, MORPH_MS, RAMP } from '../ascii/field';
import { reducedMotionQuery } from './motion';
import './veil.css';

type Glyph = { x: number; y: number; w: number; h: number; delay: number; seed: number; mask: string };
type Clip = { left: number; top: number; right: number; bottom: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const transparent = (color: string) => color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
function surfaceColor(element: Element): string {
    let current: Element | null = element;
    while (current) {
        const color = getComputedStyle(current).backgroundColor;
        if (!transparent(color)) return color;
        current = current.parentElement;
    }
    return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111113';
}
function shellRegion(element: Element): string {
    if (element.closest('.navigation')) return 'navigation';
    if (element.closest('.topbar')) return 'topbar';
    if (element.closest('.workspace-footer')) return 'footer';
    if (element.closest('.collection-index')) return 'index';
    if (element.closest('#view')) return 'view';
    return 'shell';
}

/** A decorative character veil; real copy, focus and hit targets never change. */
export function createVeil() {
    const canvas = document.createElement('canvas');
    canvas.className = 'veil';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.hidden = true;
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    const reducedMotion = reducedMotionQuery();
    let raf = 0, stopTimer = 0, glyphs: Glyph[] = [], start = 0, dpr = 1, initialScroll = '', ink = '#f0eef1';
    const scrollPosition = () => `${scrollX}:${scrollY}:` + [...document.querySelectorAll<HTMLElement>('#view, #index-records, .evidence-table-scroll')].map(element => `${element.scrollLeft}:${element.scrollTop}`).join('|');
    function cancel() {
        cancelAnimationFrame(raf); clearTimeout(stopTimer);
        raf = 0; canvas.hidden = true; glyphs = [];
        canvas.dataset.state = 'idle';
    }
    function play(root: Element | Element[] | null, scope: 'mode' | 'view' = 'mode') {
        cancel();
        if (!ctx || !root || reducedMotion.matches || document.hidden) return;
        const range = document.createRange();
        const regions = new Set<string>();
        const clips = new Map<Element, Clip>();
        const clipFor = (element: Element): Clip => {
            const cached = clips.get(element);
            if (cached) return cached;
            const clip = element.parentElement ? { ...clipFor(element.parentElement) } : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
            const style = getComputedStyle(element), rect = element.getBoundingClientRect();
            if (/auto|scroll|hidden|clip/.test(style.overflowX)) {
                clip.left = Math.max(clip.left, rect.left + element.clientLeft);
                clip.right = Math.min(clip.right, rect.left + element.clientLeft + element.clientWidth);
            }
            if (/auto|scroll|hidden|clip/.test(style.overflowY)) {
                clip.top = Math.max(clip.top, rect.top + element.clientTop);
                clip.bottom = Math.min(clip.bottom, rect.top + element.clientTop + element.clientHeight);
            }
            clips.set(element, clip);
            return clip;
        };
        let seen = 0;
        // Only visible text is measured. A bounded budget avoids work on long documents.
        for (const entry of Array.isArray(root) ? root : [root]) {
            if (seen >= 2400) break;
            const walker = document.createTreeWalker(entry, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode()) && seen < 2400) {
                const parent = node.parentElement;
                if (!parent || !node.textContent?.trim() || parent.closest('svg,script,style,input,textarea,code,kbd')) continue;
                const rect = parent.getBoundingClientRect(), clip = clipFor(parent);
                if (!rect.width || rect.bottom <= clip.top || rect.top >= clip.bottom || rect.right <= clip.left || rect.left >= clip.right) continue;
                const mask = surfaceColor(parent);
                for (let i = 0; i < node.textContent.length && seen < 2400; i++) {
                    if (/\s/.test(node.textContent[i])) continue;
                    range.setStart(node, i); range.setEnd(node, i + 1);
                    const r = range.getBoundingClientRect();
                    if (!r.width || r.top < clip.top || r.bottom > clip.bottom || r.right < clip.left || r.left > clip.right) continue;
                    const seed = ((seen * 137 + i * 31) % 997) / 997;
                    glyphs.push({ x: r.left, y: r.top, w: r.width, h: r.height, seed, mask, delay: .15 * seed + .22 * (r.left / innerWidth) + .1 * (r.top / innerHeight) });
                    regions.add(shellRegion(parent));
                    seen++;
                }
            }
        }
        if (!glyphs.length) return;
        ink = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || '#f0eef1';
        dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        canvas.hidden = false; canvas.dataset.state = 'resolving';
        canvas.dataset.scope = scope;
        canvas.dataset.glyphs = String(glyphs.length);
        canvas.dataset.regions = [...regions].join(',');
        initialScroll = scrollPosition();
        start = performance.now();
        draw(start);
        // Completion does not depend on receiving another animation frame.
        stopTimer = window.setTimeout(cancel, MORPH_MS + 40);
    }
    function draw(now: number) {
        if (!ctx) return;
        const progress = clamp((now - start) / MORPH_MS);
        if (progress >= 1) { cancel(); return; }
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (const g of glyphs) {
            const resolved = clamp((progress - g.delay) / .52);
            if (resolved >= 1) continue;
            const alpha = 1 - resolved * resolved;
            // Mask each character in place; its layout and accessible source stay intact.
            ctx.globalAlpha = alpha;
            ctx.fillStyle = g.mask;
            ctx.fillRect(g.x - .4, g.y, g.w + .8, g.h);
            ctx.fillStyle = g.seed > .72 ? ink : '#ce86ac';
            ctx.font = `${Math.round(g.h * .70)}px ${GLYPH_FAMILY}`;
            ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
            const glyph = Math.floor(g.seed * 31 + (now - start) / 55) % RAMP.length;
            ctx.fillText(RAMP[glyph], g.x + g.w / 2, g.y + g.h * .51, g.w);
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(draw);
    }
    const visibility = () => { if (document.hidden) cancel(); };
    // Ignore the delayed event from the route's own scroll restoration.
    const scroll = () => { if (scrollPosition() !== initialScroll) cancel(); };
    window.addEventListener('resize', cancel);
    document.addEventListener('scroll', scroll, { passive: true, capture: true });
    document.addEventListener('visibilitychange', visibility);
    reducedMotion.addEventListener('change', cancel);
    return {
        play, cancel,
        destroy() {
            cancel(); canvas.remove();
            window.removeEventListener('resize', cancel);
            document.removeEventListener('scroll', scroll, true);
            document.removeEventListener('visibilitychange', visibility);
            reducedMotion.removeEventListener('change', cancel);
        },
    };
}
