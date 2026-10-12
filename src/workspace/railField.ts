import { GLYPH_FAMILY, RAMP } from '../ascii/field';
import { LEVELS, TONES } from '../ascii/ink';
import { reducedMotionQuery } from './motion';

/**
 * The rail's middle is one real ASCII field that fills the whole gap between its two rules, on the portrait's own
 * 6 by 9 cell, glyph ramp and pink: a lattice of dots with a soft wave sweeping down through it. Both identities share
 * it, and inks itself with the avatar's tone levels. It rests on a single still frame for reduced motion and whenever
 * it cannot be seen.
 */
const CELL_W = 6;
const CELL_H = 9;
/** One sweep of the wave, in milliseconds. */
const WAVE_MS = 6800;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const hash = (x: number, y: number) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };

/** A still lattice of dots with a soft wave sweeping down through it, leaving a fading trail. */
function cell(col: number, row: number, rows: number, t: number): number {
    const trail = Math.max(8, rows * .3);
    const front = ((t / WAVE_MS) % 1) * (rows + trail + 2) - 2;
    const behind = front - row;
    const wave = behind >= 0 && behind < trail ? Math.exp(-behind / (trail / 3.2)) * (.55 + .45 * hash(col, row)) : 0;
    const shimmer = hash(col, row + Math.floor(t / 1400)) > .93 ? .3 : 0;
    return clamp(.07 + wave + shimmer * .8);
}

export function mountRailField(host: ParentNode): () => void {
    const canvas = host.querySelector<HTMLCanvasElement>('canvas.rail-field');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return () => {};
    const motion = reducedMotionQuery();
    let width = 0, height = 0, dpr = 1, raf = 0, last = 0, visible = true, disposed = false;
    const started = performance.now();

    function size(): void {
        const box = canvas!.getBoundingClientRect();
        dpr = Math.min(2, devicePixelRatio || 1);
        width = Math.max(0, Math.round(box.width)); height = Math.max(0, Math.round(box.height));
        canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now: number): void {
        if (!width || !height) return;
        const cols = Math.floor(width / CELL_W), rows = Math.floor(height / CELL_H);
        if (cols < 2 || rows < 2) return;
        const t = motion.matches ? 2600 : now - started;
        const x0 = (width - cols * CELL_W) / 2, y0 = (height - rows * CELL_H) / 2;
        ctx!.clearRect(0, 0, width, height);
        ctx!.font = `${CELL_H}px ${GLYPH_FAMILY}`;
        ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
        for (let row = 0; row < rows; row++) {
            // The field melts into the rules above and below it, and into the rail's edges.
            const rowFade = Math.min(1, row / 2.5, (rows - 1 - row) / 2.5);
            for (let col = 0; col < cols; col++) {
                const edge = Math.min(1, col / 2, (cols - 1 - col) / 2);
                const v = cell(col, row, rows, t);
                const alpha = clamp(rowFade) * clamp(edge);
                if (alpha <= .02) continue;
                const glyph = RAMP[Math.round(v * (RAMP.length - 1))];
                // Empty lattice cells take the avatar's quiet grey; anything the wave lights takes its pink for that level.
                const [r, g, b, a] = TONES[v < .12 ? 0 : Math.max(1, Math.round(v * (LEVELS - 1)))];
                ctx!.fillStyle = `rgba(${r},${g},${b},${a * alpha})`;
                ctx!.fillText(glyph, x0 + col * CELL_W + CELL_W / 2, y0 + row * CELL_H + CELL_H / 2);
            }
        }
    }
    function frame(now: number): void {
        raf = 0;
        if (disposed) return;
        // About 24 frames a second is plenty for a drawing this quiet.
        if (now - last >= 42) { last = now; draw(now); }
        schedule();
    }
    function schedule(): void {
        if (!raf && !disposed && visible && !motion.matches) raf = requestAnimationFrame(frame);
    }
    const resizer = new ResizeObserver(() => { size(); draw(performance.now()); schedule(); });
    resizer.observe(canvas);
    // Nothing is drawn while the tab or the rail is out of sight.
    const observer = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); if (visible) schedule(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } });
    observer.observe(canvas);
    const onVisibility = () => { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else schedule(); };
    const onMotion = () => { if (motion.matches) { if (raf) { cancelAnimationFrame(raf); raf = 0; } draw(performance.now()); } else schedule(); };
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    void document.fonts?.load(`${CELL_H}px ${GLYPH_FAMILY}`).then(() => { if (!disposed) { size(); draw(performance.now()); } }).catch(() => {});
    size(); draw(performance.now()); schedule();
    return () => {
        disposed = true;
        if (raf) cancelAnimationFrame(raf);
        resizer.disconnect(); observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', onMotion);
    };
}
