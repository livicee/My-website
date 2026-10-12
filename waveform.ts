/**
 * Waveforms, drawn only from measured loudness peaks for a real recording, and the lengths that go
 * with them.
 */
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/** Measured values as mirrored bars around a centre line, as a deck draws a track. */
export function waveformSvg(values: number[], cls = ''): string {
    const step = 10, bar = 7, H = 100;
    const d = values.map((value, i) => {
        const h = Math.max(2, clamp(value) * 96);
        return `M${i * step + (step - bar) / 2} ${+(50 - h / 2).toFixed(1)}h${bar}v${+h.toFixed(1)}h-${bar}z`;
    }).join('');
    return `<svg class="wave-svg ${cls}" viewBox="0 0 ${values.length * step} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
}
/** Measured peaks, one value per bar: the loudest bucket in each, so transients survive. */
export function resample(peaks: number[], columns: number): number[] {
    return Array.from({ length: columns }, (_, c) => {
        const start = Math.floor(c * peaks.length / columns), end = Math.max(start + 1, Math.floor((c + 1) * peaks.length / columns));
        return Math.max(...peaks.slice(start, end));
    });
}
/** Length as m:ss, or h:mm:ss for a long set; whole seconds, counted as the native player counts them. */
export function formatLength(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds)), h = Math.floor(total / 3600), m = Math.floor(total / 60) % 60, s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
