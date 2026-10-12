/** The approved portrait ink, also used by the rail's glyph lattice. */
export const LEVELS = 32;
export const TONES = Object.freeze(Array.from({ length: LEVELS }, (_, level) => {
    const t = level / (LEVELS - 1);
    return Object.freeze<[number, number, number, number]>(level === 0
        ? [92, 94, 105, .18]
        : [255, Math.round(80 + 68 * t), Math.round(178 + 35 * t), .48 + Math.sqrt(t) * .52]);
}));
/** Preserve the atlas's exact original CSS spelling, including the quiet level's alpha. */
export const TONE_STYLES = Object.freeze(TONES.map(([r, g, b, a], level) =>
    level === 0 ? 'rgba(92,94,105,.18)' : `rgba(${r},${g},${b},${a})`));
