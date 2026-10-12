/**
 * Livicee's night: the stretches a mix can be placed in, the shape of a night's energy, and the vector charts that
 * show where a selection sits in it, in the site's charcoal and pink. Nothing here is audio.
 */
export type NightPhase = 'early' | 'day' | 'late' | 'peak' | 'winddown';
/** The stretches of a night, in order. Each mix names its own in its night field. */
export const NIGHT: readonly { id: NightPhase; label: string }[] = [
    { id: 'early', label: 'Early' },
    { id: 'day', label: 'Day' },
    { id: 'late', label: 'Late' },
    { id: 'peak', label: 'Peak' },
    { id: 'winddown', label: 'Wind-down' },
];
export const isNightPhase = (value: unknown): value is NightPhase => NIGHT.some(phase => phase.id === value);
export const phaseIndex = (phase: NightPhase) => NIGHT.findIndex(p => p.id === phase);
export const phaseLabel = (phase: NightPhase) => NIGHT[phaseIndex(phase)].label;
/** Where a phase's stretch starts and ends across the night, from 0 to 1. */
export function phaseSpan(phase: NightPhase): [number, number] {
    const i = phaseIndex(phase);
    return [i / NIGHT.length, (i + 1) / NIGHT.length];
}

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/** The shape of a night: a slow open, a long climb, the peak, then the room let down gently. */
const ARC: [number, number][] = [[0, .05], [.1, .1], [.3, .3], [.5, .62], [.66, .95], [.74, .96], [.9, .32], [1, .04]];
export function energyAt(t: number): number {
    const x = clamp(t);
    let i = 1;
    while (i < ARC.length - 1 && x > ARC[i][0]) i++;
    const [t0, e0] = ARC[i - 1], [t1, e1] = ARC[i];
    // Catmull-Rom through the neighbouring points keeps the curve smooth across every stretch.
    const before = ARC[Math.max(0, i - 2)][1], after = ARC[Math.min(ARC.length - 1, i + 1)][1];
    const k = (x - t0) / (t1 - t0), k2 = k * k, k3 = k2 * k;
    const m0 = (e1 - before) / 2, m1 = (after - e0) / 2;
    return clamp((2 * k3 - 3 * k2 + 1) * e0 + (k3 - 2 * k2 + k) * m0 + (-2 * k3 + 3 * k2) * e1 + (k3 - k2) * m1);
}

// Charts draw in a 1000 x 100 box that CSS stretches to fit; strokes keep their width while it stretches.
const W = 1000, H = 100;
const px = (t: number) => +(t * W).toFixed(1);
const py = (t: number) => +(H - 3 - energyAt(t) * (H - 8)).toFixed(1);
function curve(from: number, to: number): string {
    const steps = Math.max(2, Math.round((to - from) * 120));
    return Array.from({ length: steps + 1 }, (_, k) => { const t = from + (to - from) * k / steps; return `${px(t)} ${py(t)}`; }).join('L');
}
const area = (from: number, to: number) => `M${px(from)} ${H}L${curve(from, to)}L${px(to)} ${H}Z`;
const edge = (from: number, to: number) => `M${curve(from, to)}`;
const crisp = 'vector-effect="non-scaling-stroke"';
/** The ruler's lines between the stretches of the night. */
const cuts = NIGHT.slice(1).map((_, i) => `M${px((i + 1) / NIGHT.length)} 0V${H}`).join('');
/** The whole night as a quiet area, the mix's stretch filled pink. Decorative: the caller supplies the words. */
export function nightChart(phase: NightPhase | undefined, cls = ''): string {
    const lit = phase ? phaseSpan(phase) : undefined;
    // A faint column marks the stretch even where the night is quiet and its fill is low.
    const band = lit ? `<rect class="night-band" x="${px(lit[0])}" y="0" width="${px(lit[1] - lit[0])}" height="${H}"/>` : '';
    return `<svg class="night-svg ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${band}<path class="night-grid" d="${cuts}" ${crisp}/><path class="night-area" d="${area(0, 1)}"/><path class="night-edge" d="${edge(0, 1)}" ${crisp}/>${lit ? `<path class="night-lit" d="${area(lit[0], lit[1])}"/><path class="night-lit-edge" d="${edge(lit[0], lit[1])}" ${crisp}/>` : ''}<path class="night-base" d="M0 ${H - .5}H${W}" ${crisp}/></svg>`;
}
/** Every mix across one night: each occupied stretch filled and tagged with its phase, cut at the ruler's lines. */
export function nightSetChart(phases: NightPhase[], cls = ''): string {
    const stretches = NIGHT.filter(p => phases.includes(p.id)).map(({ id }) => {
        const [from, to] = phaseSpan(id);
        return `<path class="night-lit" data-phase="${id}" d="${area(from, to)}"/><path class="night-lit-edge" data-phase="${id}" d="${edge(from, to)}" ${crisp}/>`;
    }).join('');
    return `<svg class="night-svg ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="night-area" d="${area(0, 1)}"/><path class="night-edge" d="${edge(0, 1)}" ${crisp}/>${stretches}<path class="night-cut" d="${cuts}" ${crisp}/><path class="night-base" d="M0 ${H - .5}H${W}" ${crisp}/></svg>`;
}
