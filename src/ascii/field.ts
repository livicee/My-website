// Original ASCII identity field. Sources are sampled, never drawn as a visible texture.
import type { DatasetId } from '../workspace/model';
import { LEVELS, TONE_STYLES } from './ink';

/** The viewport the field sits in and where its reading pane ends; phones may also fix the figure's size and top. */
export interface FieldComposition { viewportWidth: number; readingEdge: number; figureWidth?: number; figureTop?: number }
export interface FieldPointer { x: number; y: number; strength: number }
interface Pulse { x: number; y: number; started: number }
export const MORPH_MS = 560;
/** The glyphs from darkest to brightest; the text veil draws with them too. */
export const RAMP = '.:;i1tfx08#@';
/** The face the glyphs are drawn in, with fallbacks; the portrait and the veil share it. */
export const GLYPH_FAMILY = '"Fragment Mono", Consolas, "Courier New", monospace';
const PHRASES: Record<DatasetId, string> = {
    production: 'content operations / digital platforms / cms / asset library / content model / editorial workflow / governance / ownership / evidence / ',
    sound: 'livicee / sound / selection / connection / after hours / open air / night shift / soft focus / first light / ',
};
const GLYPHS = [...new Set(`${RAMP}${PHRASES.production}${PHRASES.sound}`)];
const GLYPH_INDEX = new Map(GLYPHS.map((glyph, index) => [glyph, index]));
// Dark face interiors traced in each approved 1024×1536 source. Reactions and near-black interior
// glyphs stay neutral; hair and the profile outline remain pink. Registration preserves the crop.
const FACE_INTERIORS: Record<DatasetId, readonly (readonly [number, number])[]> = {
    production: [[338,134],[386,128],[427,208],[490,274],[525,328],[527,374],[503,420],[464,451],
        [413,475],[367,488],[346,472],[336,429],[321,406],[316,376],[291,352],[315,304],[294,275],[295,218]],
    sound: [[345,127],[390,128],[430,191],[488,246],[520,285],[524,316],[507,361],[493,383],
        [460,405],[417,426],[374,442],[351,435],[343,405],[330,389],[326,366],[314,343],[299,328],[318,288],[317,256],[302,231],[311,188]],
};
/** The ambient current's step: a small group of letters changes this often. */
export const AMBIENT_STEP_MS = 100;
/** Livicee's glyph equalizer paints at 30fps; its authored beat does not depend on audio. */
export const SOUND_STEP_MS = 1000 / 30;
export const SOUND_BEAT_MS = 500;
export const SOUND_GROOVE_CYCLE_MS = SOUND_BEAT_MS * 4;
const AMBIENT_CYCLE_MS = 400;
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const seed = (x: number, y: number) => {
    let n = Math.imul(x + 73, 374761393) ^ Math.imul(y + 97, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

/** Four-on-the-floor kick with shorter offbeat accents. Columns rise together, then decay at different levels. */
export function soundBand(position: number, elapsedMs: number) {
    const time = ((elapsedMs % SOUND_GROOVE_CYCLE_MS) + SOUND_GROOVE_CYCLE_MS) % SOUND_GROOVE_CYCLE_MS;
    const beat = Math.floor(time / SOUND_BEAT_MS), age = time % SOUND_BEAT_MS;
    const band = Math.floor(clamp(position) * 28);
    const envelope = (t: number, attack: number, decay: number) => t < 0 ? 0
        : ease(t / attack) * Math.exp(-Math.max(0, t - attack) / decay) * ease((SOUND_BEAT_MS - age) / 80);
    const weight = .42 + seed(band + 91, beat + 47) * .4;
    const kick = envelope(age, 35, 145), hat = envelope(age - 250, 25, 75);
    const floor = .1 + seed(band, 83) * .06;
    const level = clamp(floor + kick * weight + hat * (.1 + .18 * seed(band, 179)));
    const peak = clamp(floor + envelope(age, 35, 310) * weight + hat * .08);
    return { level, peak: Math.max(level, peak) };
}

/** A cursor bends the existing glyph rows without erasing them or introducing pixels outside the portrait. */
export function soundPointerGroove(distance: number, strength: number, _elapsedMs: number) {
    const influence = ease(1 - distance / 168) * clamp(strength);
    if (influence === 0) return { offset: 0, light: 0 };
    return { offset: influence * 4.5, light: influence * .24 };
}

/** A single plucked ring, with a smooth arrival and a finite lifetime. */
export function soundClickGroove(distance: number, ageMs: number) {
    if (ageMs < 0 || ageMs >= 900) return { offset: 0, light: 0 };
    const delta = distance - ageMs * .65;
    const ring = ease(1 - Math.abs(delta) / 110) * Math.pow(1 - ageMs / 900, 1.4) * ease(ageMs / 95);
    return { offset: Math.sin(delta / 36) * ring * 8, light: ring * .65 };
}

/**
 * Where the reading pane ends, measured from the field's left edge: the same arithmetic as --reading-width in
 * workspace.css, so the portrait can centre itself in the space the pane leaves.
 */
export function readingEdge(viewportWidth: number, nav: number, compositionWidth: number): number {
    const available = Math.max(1, viewportWidth - nav);
    const inset = Math.max(0, (available - compositionWidth) / 2);
    const base = viewportWidth <= 960 ? available * .86 : viewportWidth <= 1200 ? Math.min(740, available * .77) : Math.min(840, available * .56);
    return inset + base;
}

/** A single viewport composition: changing a document never moves or resizes the identity. */
export function figureBounds(width: number, height: number, composition: FieldComposition) {
    const mobile = composition.viewportWidth <= 760;
    const figureWidth = composition.figureWidth ?? (mobile
        ? Math.max(340, Math.min(480, width * 1.04))
        : Math.max(580, Math.min(850, height * .86)));
    // Phones centre the full drawing so the crown, chin and shoulders have balanced room.
    // Desktop keeps the figure centred in the space right of the reading pane.
    const x = mobile ? (width - figureWidth) / 2 : composition.readingEdge + (width - composition.readingEdge - figureWidth) / 2;
    const y = composition.figureTop ?? (mobile ? 5 : Math.max(8, height * .018));
    return { x, y, width: figureWidth, height: figureWidth * 1.5 };
}

/** Register the generated DJ head to Content in the original 1024×1536 source space.
 * A slight additional vertical stretch matches crown and chin height. Both sources still pass through the glyph sampler.
 */
export function registeredFigureBounds(width: number, height: number, composition: FieldComposition, identity: DatasetId) {
    const bounds = figureBounds(width, height, composition);
    if (identity === 'production') return bounds;
    return { x: bounds.x - bounds.width * 41 / 1024, y: bounds.y - bounds.height * 6 / 1536,
        width: bounds.width * 1.095, height: bounds.height * 1.122 };
}

const outputOwners = new WeakMap<HTMLCanvasElement, symbol>();

export function createAsciiField(canvas: HTMLCanvasElement, lattice?: HTMLCanvasElement, monochrome?: HTMLCanvasElement, response?: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas unavailable');
    const atlas = document.createElement('canvas'), neutralAtlas = document.createElement('canvas'), base = document.createElement('canvas'), background = document.createElement('canvas'), morphBase = document.createElement('canvas'), sampler = document.createElement('canvas');
    const soundPortrait = document.createElement('canvas'), soundLight = document.createElement('canvas');
    const soundFrame = document.createElement('canvas'), soundTint = document.createElement('canvas');
    const atlasCtx = atlas.getContext('2d'), neutralAtlasCtx = neutralAtlas.getContext('2d'), baseCtx = base.getContext('2d'), backgroundCtx = background.getContext('2d'), morphBaseCtx = morphBase.getContext('2d');
    const sampleCtx = sampler.getContext('2d', { willReadFrequently: true });
    const soundPortraitCtx = soundPortrait.getContext('2d'), soundLightCtx = soundLight.getContext('2d');
    const soundFrameCtx = soundFrame.getContext('2d'), soundTintCtx = soundTint.getContext('2d'), latticeCtx = lattice?.getContext('2d'), monochromeCtx = monochrome?.getContext('2d'), responseCtx = response?.getContext('2d');
    if (!atlasCtx || !neutralAtlasCtx || !baseCtx || !backgroundCtx || !morphBaseCtx || !sampleCtx || !soundPortraitCtx || !soundLightCtx || !soundFrameCtx || !soundTintCtx || lattice && !latticeCtx || monochrome && !monochromeCtx || response && !responseCtx) throw new Error('Canvas unavailable');
    const owner = Symbol();
    for (const output of [canvas, lattice, monochrome, response]) if (output) outputOwners.set(output, owner);
    let width = 0, height = 0, dpr = 1, cellW = 6, cellH = 9;
    let columns = 0, rows = 0, glyphW = 0, glyphH = 0;
    let field = new Float32Array(0), from = new Float32Array(0), seeds = new Float32Array(0);
    let faceMask = new Float32Array(0), fromFaceMask = new Float32Array(0);
    let faceCells: number[] = [];
    // Cells that may ever carry an ambient letter; the per-frame pass skips the rest of the lattice.
    let ambientCells = new Int32Array(0);
    let morphStart = -Infinity, currentSource: HTMLImageElement | undefined;
    let identity: DatasetId = 'production', ambient = true, ambientFrame = -1;
    let grooveStart = 0, ambientDeadline = Infinity;
    let soundStrips: { x: number; y: number; width: number; position: number }[] = [];
    const soundGlyphs = new Map<number, string>();
    let soundGlyphFrame = -1;
    // Replaced by the first resize(), which always runs before a source is sampled.
    let composition: FieldComposition = { viewportWidth: 0, readingEdge: 0 }, pulse: Pulse | undefined;
    let alive = true, lastFrameMs = 0, sizeKey = '';
    /** Only background reactions feed the monochrome treatment. The portrait stays in its own pink layer. */
    function syncMonochrome() {
        if (!monochrome || !monochromeCtx) return;
        monochromeCtx.clearRect(0, 0, monochrome.width, monochrome.height);
        if (response) monochromeCtx.drawImage(response, 0, 0);
    }

    function buildAtlas() {
        glyphW = Math.ceil(cellW * dpr); glyphH = Math.ceil(cellH * dpr);
        atlas.width = GLYPHS.length * glyphW; atlas.height = LEVELS * glyphH;
        atlasCtx!.font = `${cellH * dpr}px ${GLYPH_FAMILY}`;
        atlasCtx!.textAlign = 'center'; atlasCtx!.textBaseline = 'middle';
        for (let level = 0; level < LEVELS; level++) {
            // Keep the surrounding lattice quiet while figure glyphs retain luminous midtones.
            atlasCtx!.fillStyle = TONE_STYLES[level];
            for (let glyph = 0; glyph < GLYPHS.length; glyph++)
                atlasCtx!.fillText(GLYPHS[glyph], (glyph + .5) * glyphW, (level + .47) * glyphH);
        }
        neutralAtlas.width = atlas.width; neutralAtlas.height = atlas.height;
        neutralAtlasCtx!.filter = 'grayscale(1) brightness(.34)';
        neutralAtlasCtx!.drawImage(atlas, 0, 0);
    }
    function sampleFaceMask(sourceIdentity: DatasetId) {
        const bounds = registeredFigureBounds(width, height, composition, sourceIdentity);
        const polygon = FACE_INTERIORS[sourceIdentity], values = new Float32Array(columns * rows);
        for (let i = 0; i < values.length; i++) {
            const x = ((i % columns + .5) * cellW - bounds.x) / bounds.width * 1024;
            const y = ((Math.floor(i / columns) + .5) * cellH - bounds.y) / bounds.height * 1536;
            if (x < 290 || x > 530 || y < 125 || y > 490) continue;
            let inside = false, distance = Infinity;
            for (let a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
                const [ax, ay] = polygon[a], [bx, by] = polygon[b];
                if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
                const dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
                distance = Math.min(distance, Math.hypot(x - ax - dx * t, y - ay - dy * t));
            }
            if (inside) values[i] = ease(distance / 8);
        }
        return values;
    }
    function sample(source: HTMLImageElement, sourceIdentity: DatasetId) {
        sampler.width = columns; sampler.height = rows;
        sampleCtx!.fillStyle = '#000'; sampleCtx!.fillRect(0, 0, columns, rows);
        const bounds = registeredFigureBounds(width, height, composition, sourceIdentity);
        sampleCtx!.imageSmoothingEnabled = true; sampleCtx!.imageSmoothingQuality = 'high';
        sampleCtx!.drawImage(source, bounds.x / cellW, bounds.y / cellH, bounds.width / cellW, bounds.height / cellH);
        const data = sampleCtx!.getImageData(0, 0, columns, rows).data;
        const values = new Float32Array(columns * rows);
        for (let i = 0; i < values.length; i++) {
            const offset = i * 4;
            const luminance = (.2126 * data[offset] + .7152 * data[offset + 1] + .0722 * data[offset + 2]) / 255;
            values[i] = luminance < .018 ? 0 : Math.pow(luminance, .72);
        }
        return values;
    }
    function drawCell(context: CanvasRenderingContext2D, index: number, luminance: number, scramble = 0, semanticGlyph?: string, lightBoost = false, neutral = luminance > 0 ? (faceMask[index] ?? 0) : 0) {
        const s = seeds[index];
        let level = Math.round(clamp(luminance) * (LEVELS - 1));
        let glyph = level === 0 ? (s > .76 ? 1 : 0) : Math.round(clamp(luminance * 1.15 + (s - .5) * .18) * (RAMP.length - 1));
        if (semanticGlyph) glyph = GLYPH_INDEX.get(semanticGlyph) ?? glyph;
        if (scramble > .15) glyph = Math.floor((s + scramble * .71) * 37) % RAMP.length;
        // Bright bands change the tone of the very same glyph, keeping their light inside its original ink.
        if (lightBoost) level = Math.round(clamp(luminance * 1.65 + .14) * (LEVELS - 1));
        if (level === 0 && s < .16) return;
        const x = (index % columns) * cellW, y = Math.floor(index / columns) * cellH;
        if (neutral < 1) {
            context.globalAlpha = 1 - neutral;
            context.drawImage(atlas, glyph * glyphW, level * glyphH, glyphW, glyphH, x * dpr, y * dpr, cellW * dpr, cellH * dpr);
        }
        if (neutral > 0) {
            context.globalAlpha = neutral;
            context.drawImage(neutralAtlas, glyph * glyphW, level * glyphH, glyphW, glyphH, x * dpr, y * dpr, cellW * dpr, cellH * dpr);
        }
        context.globalAlpha = 1;
    }
    function cacheBase() {
        base.width = canvas.width; base.height = canvas.height;
        baseCtx!.drawImage(background, 0, 0);
        faceCells = [];
        for (let i = 0; i < field.length; i++) if (field[i] > 0) {
            if (faceMask[i] > 0) faceCells.push(i);
            baseCtx!.clearRect((i % columns) * cellW * dpr, Math.floor(i / columns) * cellH * dpr, cellW * dpr, cellH * dpr);
            drawCell(baseCtx!, i, field[i]);
        }
        // Only source-bearing glyphs enter these transparent layers. A moving strip can never turn the lattice
        // into an invented silhouette, and no per-frame pass through the 100k-cell viewport is necessary.
        soundStrips = [];
        soundGlyphs.clear(); soundGlyphFrame = -1;
        if (identity !== 'sound') {
            soundPortrait.width = soundPortrait.height = soundLight.width = soundLight.height = soundFrame.width = soundFrame.height = soundTint.width = soundTint.height = 0;
            return;
        }
        soundPortrait.width = soundLight.width = soundFrame.width = soundTint.width = canvas.width;
        soundPortrait.height = soundLight.height = soundFrame.height = soundTint.height = canvas.height;
        const bounds = figureBounds(width, height, composition);
        for (let row = 0; row < rows; row++) {
            let first = -1;
            for (let column = 0; column <= columns; column++) {
                const i = row * columns + column;
                if (column === columns || field[i] <= 0) {
                    if (first >= 0) soundStrips.push({ x: first * cellW, y: row * cellH, width: (column - first) * cellW, position: (row * cellH - bounds.y) / bounds.height });
                    first = -1; continue;
                }
                if (first < 0) first = column;
                drawCell(soundPortraitCtx!, i, field[i]);
                drawCell(soundLightCtx!, i, field[i], 0, undefined, true);
            }
        }
        tintSoundGlyphs();
    }
    /** A restrained lilac tint uses the exact current glyph alpha, never a rectangle over the portrait. */
    function tintSoundGlyphs() {
        soundTintCtx!.clearRect(0, 0, canvas.width, canvas.height);
        soundTintCtx!.drawImage(soundPortrait, 0, 0);
        soundTintCtx!.globalCompositeOperation = 'source-in';
        soundTintCtx!.fillStyle = '#bda0e6';
        soundTintCtx!.fillRect(0, 0, canvas.width, canvas.height);
        soundTintCtx!.globalCompositeOperation = 'source-over';
        // Equalizer colour must not relight the deliberately dark face interior.
        for (const i of faceCells) {
            const x = (i % columns) * cellW * dpr, y = Math.floor(i / columns) * cellH * dpr;
            const w = cellW * dpr, h = cellH * dpr;
            soundTintCtx!.clearRect(x, y, w, h);
            soundTintCtx!.drawImage(soundPortrait, x, y, w, h, x, y, w, h);
        }
    }
    function indexAmbient() {
        const cells: number[] = [];
        for (let i = 0; i < field.length; i++) if (seeds[i] >= .18 && field[i] >= .055) cells.push(i);
        ambientCells = Int32Array.from(cells);
    }
    /** Atlas, lattice and resting portrait for the current size; also rerun when the glyph font arrives. */
    function paintStatic() {
        buildAtlas();
        background.width = canvas.width; background.height = canvas.height;
        if (lattice) { lattice.width = canvas.width; lattice.height = canvas.height; }
        for (let i = 0; i < seeds.length; i++) drawCell(latticeCtx ?? backgroundCtx!, i, 0);
        if (currentSource) { field = sample(currentSource, identity); from = field; faceMask = sampleFaceMask(identity); fromFaceMask = faceMask; morphStart = -Infinity; cacheBase(); indexAmbient(); }
    }
    function resize(next: FieldComposition) {
        if (!alive) return;
        const nextKey = `${canvas.clientWidth}:${canvas.clientHeight}:${window.devicePixelRatio}:${next.viewportWidth}:${next.readingEdge}:${next.figureWidth}:${next.figureTop}`;
        if (nextKey === sizeKey) return;
        sizeKey = nextKey;
        composition = next;
        width = Math.max(1, Math.round(canvas.clientWidth)); height = Math.max(1, Math.round(canvas.clientHeight));
        dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        cellW = width < 700 ? 5 : 6; cellH = width < 700 ? 8 : 9;
        columns = Math.ceil(width / cellW); rows = Math.ceil(height / cellH);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        if (monochrome) { monochrome.width = canvas.width; monochrome.height = canvas.height; }
        if (response) { response.width = canvas.width; response.height = canvas.height; }
        seeds = new Float32Array(columns * rows);
        for (let i = 0; i < seeds.length; i++) seeds[i] = seed(i % columns, Math.floor(i / columns));
        paintStatic();
        // Resizing blanks the canvas, and this runs after the frame's animation callbacks; draw the resting portrait now
        // so no frame shows it empty. The next animation frame adds any motion.
        if (currentSource) { ctx!.drawImage(base, 0, 0); syncMonochrome(); ambientFrame = -1; }
    }
    function setSource(source: HTMLImageElement, previous?: HTMLImageElement, animate = false, nextIdentity: DatasetId = 'production') {
        if (!alive) return;
        identity = nextIdentity; ambientFrame = -1;
        currentSource = source; field = sample(source, identity); indexAmbient();
        // A previous source is the other side of the Content/Livicee switch, with its own registration.
        from = previous && animate ? sample(previous, identity === 'sound' ? 'production' : 'sound') : field;
        faceMask = sampleFaceMask(identity);
        fromFaceMask = previous && animate ? sampleFaceMask(identity === 'sound' ? 'production' : 'sound') : faceMask;
        morphStart = previous && animate ? performance.now() : -Infinity;
        grooveStart = performance.now() + (previous && animate ? MORPH_MS : 0);
        morphBase.width = canvas.width; morphBase.height = canvas.height;
        morphBaseCtx!.drawImage(background, 0, 0);
        for (let i = 0; i < field.length; i++) if (field[i] || from[i])
            morphBaseCtx!.clearRect((i % columns) * cellW * dpr, Math.floor(i / columns) * cellH * dpr, cellW * dpr, cellH * dpr);
        cacheBase();
    }
    function ambientGlyph(index: number, now: number) {
        const column = index % columns, row = Math.floor(index / columns);
        const clusterX = Math.floor(column / 6), clusterY = Math.floor(row / 3);
        const phase = seed(clusterX + 311, clusterY + 719) * AMBIENT_CYCLE_MS;
        const localFrame = Math.floor((now + phase) / AMBIENT_CYCLE_MS);
        const cluster = seed(clusterX + localFrame * 19, clusterY + localFrame * 11);
        // Only cells indexAmbient() kept reach here, so the cluster alone decides.
        if (cluster < .86) return undefined;
        const phrase = PHRASES[identity];
        const rowOffset = Math.floor(seed(0, row + 43) * phrase.length);
        return phrase[(column + rowOffset + localFrame * 3) % phrase.length];
    }
    function drawAmbient(now: number) {
        ctx!.drawImage(base, 0, 0);
        for (const i of ambientCells) {
            const glyph = ambientGlyph(i, now);
            if (!glyph || glyph === ' ') continue;
            const x = (i % columns) * cellW * dpr, y = Math.floor(i / columns) * cellH * dpr;
            ctx!.clearRect(x, y, cellW * dpr, cellH * dpr);
            drawCell(ctx!, i, field[i], 0, glyph);
        }
    }
    /** Update only changed letters in both moving layers; the groove never replaces the ASCII current. */
    function updateSoundGlyphs(now: number) {
        const frame = ambient ? Math.floor(now / AMBIENT_STEP_MS) : -1;
        if (frame === soundGlyphFrame) return;
        soundGlyphFrame = frame;
        for (const i of ambientCells) {
            const candidate = ambient ? ambientGlyph(i, frame * AMBIENT_STEP_MS) : undefined;
            const glyph = candidate === ' ' ? undefined : candidate;
            if (glyph === soundGlyphs.get(i)) continue;
            const x = (i % columns) * cellW * dpr, y = Math.floor(i / columns) * cellH * dpr;
            soundPortraitCtx!.clearRect(x, y, cellW * dpr, cellH * dpr);
            soundLightCtx!.clearRect(x, y, cellW * dpr, cellH * dpr);
            drawCell(soundPortraitCtx!, i, field[i], 0, glyph);
            drawCell(soundLightCtx!, i, field[i], 0, glyph, true);
            if (glyph) soundGlyphs.set(i, glyph); else soundGlyphs.delete(i);
        }
        tintSoundGlyphs();
    }
    function drawSound(now: number, pointer?: FieldPointer) {
        updateSoundGlyphs(now);
        ctx!.drawImage(background, 0, 0);
        const elapsed = now - grooveStart;
        const motion = ambient ? ease(elapsed / 650) * ease((ambientDeadline - now) / 900) : 0;
        const age = pulse ? now - pulse.started : Infinity;
        const bounds = figureBounds(width, height, composition);
        const floor = Math.min(height, bounds.y + bounds.height * .9), ceiling = Math.max(0, bounds.y);
        const span = Math.max(1, floor - ceiling), bandWidth = cellW * 4;
        soundFrameCtx!.clearRect(0, 0, canvas.width, canvas.height);
        // Keep the original portrait at full strength. Bars are a subtle colour pass over its existing ink.
        soundFrameCtx!.drawImage(soundPortrait, 0, 0);
        soundFrameCtx!.globalCompositeOperation = 'source-atop';
        if (motion > 0) for (let x = Math.max(0, Math.floor(bounds.x / bandWidth) * bandWidth); x < Math.min(width, bounds.x + bounds.width); x += bandWidth) {
            const band = soundBand((x + bandWidth / 2 - bounds.x) / bounds.width, elapsed);
            const barWidth = Math.min(cellW * 3, width - x);
            const top = floor - band.level * span, cap = Math.max(ceiling, floor - band.peak * span);
            soundFrameCtx!.globalAlpha = motion * .16;
            soundFrameCtx!.drawImage(soundTint, x * dpr, top * dpr, barWidth * dpr, (floor - top) * dpr,
                x * dpr, top * dpr, barWidth * dpr, (floor - top) * dpr);
            soundFrameCtx!.globalAlpha = motion * .22;
            const capHeight = Math.min(cellH * 1.5, floor - cap);
            soundFrameCtx!.drawImage(soundTint, x * dpr, cap * dpr, barWidth * dpr, capHeight * dpr,
                x * dpr, cap * dpr, barWidth * dpr, capHeight * dpr);
        }
        soundFrameCtx!.globalAlpha = 1; soundFrameCtx!.globalCompositeOperation = 'source-over';
        for (const strip of soundStrips) ctx!.clearRect(strip.x * dpr, strip.y * dpr, strip.width * dpr, cellH * dpr);
        if (!pointer && age >= 900) { ctx!.drawImage(soundFrame, 0, 0); return; }
        for (const strip of soundStrips) {
            const give = .35 + ease((strip.position - .28) / .38) * .65;
            // Local effects use short runs; ordinary frames keep whole rows cached. A click retains this
            // sampling until its ring ends, so releasing hover cannot change the ring's geometry.
            const localEffect = pointer && Math.abs(strip.y + cellH / 2 - pointer.y) < 168 || pulse && age < 900;
            const segmentWidth = localEffect ? cellW * 8 : strip.width;
            for (let segmentX = strip.x; segmentX < strip.x + strip.width; segmentX += segmentWidth) {
                const segmentW = Math.min(segmentWidth, strip.x + strip.width - segmentX);
                let offset = 0, light = 0;
                const centerX = segmentX + segmentW / 2, centerY = strip.y + cellH / 2;
                if (pointer && pointer.strength > .005) {
                    const response = soundPointerGroove(Math.hypot(centerX - pointer.x, centerY - pointer.y), pointer.strength, now);
                    offset += response.offset * give * clamp((pointer.x - centerX) / 70, -1, 1); light += response.light;
                }
                if (pulse && age < 900) {
                    const response = soundClickGroove(Math.hypot(centerX - pulse.x, centerY - pulse.y), age);
                    offset += response.offset * give; light += response.light;
                }
                offset = clamp(offset, -8.5, 8.5);
                const x = segmentX * dpr, y = strip.y * dpr, w = segmentW * dpr, h = Math.min(cellH * dpr, canvas.height - y);
                // Both cached layers contain real atlas glyphs derived from the PNG. Blend luminance, never a photo.
                ctx!.drawImage(soundFrame, x, y, w, h, x + offset * dpr, y, w, h);
                if (light > .005) {
                    ctx!.globalAlpha = clamp(light);
                    ctx!.drawImage(soundLight, x, y, w, h, x + offset * dpr, y, w, h);
                    ctx!.globalAlpha = 1;
                }
            }
        }
    }
    /** Empty parts of the lattice respond too, including where a reading pane overlaps the field. */
    function drawLatticeInteraction(now: number, pointer?: FieldPointer, morphing = false) {
        const reactionCtx = responseCtx ?? ctx!;
        const age = pulse ? now - pulse.started : Infinity, pulsing = age >= 0 && age < 900;
        if (!pointer && !pulsing) return;
        const radius = age * .7;
        let c0 = columns, c1 = -1, r0 = rows, r1 = -1;
        const include = (x: number, y: number, reach: number) => {
            c0 = Math.min(c0, Math.floor((x - reach) / cellW)); c1 = Math.max(c1, Math.ceil((x + reach) / cellW));
            r0 = Math.min(r0, Math.floor((y - reach) / cellH)); r1 = Math.max(r1, Math.ceil((y + reach) / cellH));
        };
        if (pointer) include(pointer.x, pointer.y, 94);
        if (pulsing && pulse) include(pulse.x, pulse.y, radius + 37);
        for (let row = Math.max(0, r0); row <= Math.min(rows - 1, r1); row++) for (let column = Math.max(0, c0); column <= Math.min(columns - 1, c1); column++) {
            const i = row * columns + column;
            if (field[i] > 0 || morphing && from[i] > 0) continue;
            const x = (column + .5) * cellW, y = (row + .5) * cellH;
            const hover = pointer ? ease(1 - Math.hypot(x - pointer.x, y - pointer.y) / 94) * pointer.strength : 0;
            const ring = pulsing && pulse ? clamp(1 - Math.abs(Math.hypot(x - pulse.x, y - pulse.y) - radius) / 37) * (1 - age / 900) : 0;
            if (hover <= .005 && ring <= .005) continue;
            reactionCtx.clearRect(column * cellW * dpr, row * cellH * dpr, cellW * dpr, cellH * dpr);
            const neutral = morphing ? Math.max(faceMask[i], fromFaceMask[i]) : faceMask[i];
            drawCell(reactionCtx, i, Math.max(hover * .075, ring * .32), Math.max(hover * .2, ring), undefined, false, neutral);
        }
    }
    function draw(now: number, pointer?: FieldPointer) {
        if (!alive || !currentSource) return false;
        const start = performance.now(), morphing = now - morphStart < MORPH_MS;
        const pulsing = pulse && now - pulse.started < 900, interacting = !!pointer && pointer.strength > .005;
        const step = identity === 'sound' ? SOUND_STEP_MS : AMBIENT_STEP_MS;
        const nextAmbientFrame = Math.floor(now / step);
        if (ambient && !morphing && !pulsing && !interacting && nextAmbientFrame === ambientFrame) return true;
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        responseCtx?.clearRect(0, 0, canvas.width, canvas.height);
        if (identity === 'sound' && !morphing && (ambient || pulsing || interacting)) {
            drawSound(now, interacting ? pointer : undefined);
            drawLatticeInteraction(now, interacting ? pointer : undefined);
            if (!pulsing) pulse = undefined;
            syncMonochrome();
            ambientFrame = nextAmbientFrame; lastFrameMs = performance.now() - start;
            return true;
        }
        if (!morphing && !pulsing && !interacting) {
            if (ambient) { drawAmbient(now); ambientFrame = nextAmbientFrame; }
            else ctx!.drawImage(base, 0, 0);
            syncMonochrome();
            pulse = undefined; lastFrameMs = performance.now() - start; return ambient;
        }
        if (!morphing && ambient) drawAmbient(now);
        else ctx!.drawImage(morphing ? morphBase : base, 0, 0);
        const time = clamp((now - morphStart) / MORPH_MS), waveRadius = pulse ? (now - pulse.started) * .7 : 0;
        const visit = (i: number) => {
            if (responseCtx && !field[i] && (!morphing || !from[i])) return;
            if (morphing && !field[i] && !from[i] && !pulsing && !interacting) return;
            const x = (i % columns + .5) * cellW, y = (Math.floor(i / columns) + .5) * cellH;
            let value = field[i], scramble = 0;
            if (morphing) {
                const row = Math.floor(i / columns), neighbourhood = seed(Math.floor((i % columns) / 7), Math.floor(row / 5));
                const delay = .24 * (.55 * neighbourhood + .45 * x / width), mix = ease((time - delay) / .76);
                // The whole portrait participates in the ASCII transition; registration aligns its endpoints.
                const seam = Math.sin(mix * Math.PI);
                value = (from[i] * (1 - mix) + field[i] * mix) * (1 - seam * .62); scramble = seam;
            }
            let affected = false;
            if (interacting) {
                const distance = Math.hypot(x - pointer!.x, y - pointer!.y);
                if (distance < 94) {
                    const influence = ease(1 - distance / 94) * pointer!.strength;
                    value = value > 0 ? value * (1 - influence * .46) : influence * .075;
                    scramble = Math.max(scramble, influence * .2); affected = true;
                }
            }
            if (pulsing && pulse) {
                const distance = Math.hypot(x - pulse.x, y - pulse.y), ring = clamp(1 - Math.abs(distance - waveRadius) / 37) * (1 - (now - pulse.started) / 900);
                if (ring > 0) { value = Math.max(value, ring * .52); scramble = Math.max(scramble, ring); affected = true; }
            }
            if (morphing || affected) {
                // morphBase only clears figure cells, so an affected lattice cell must be cleared before redrawing.
                if (!morphing || (!field[i] && !from[i])) ctx!.clearRect(Math.floor(x / cellW) * cellW * dpr, Math.floor(y / cellH) * cellH * dpr, cellW * dpr, cellH * dpr);
                const glyph = !morphing && ambient && seeds[i] >= .18 && field[i] >= .055 ? ambientGlyph(i, now) : undefined;
                const neutral = Math.max(faceMask[i], morphing ? fromFaceMask[i] : 0);
                drawCell(ctx!, i, value, scramble, glyph === ' ' ? undefined : glyph, false, neutral);
            }
        };
        if (morphing) for (let i = 0; i < field.length; i++) visit(i);
        else {
            // Pointer and wave frames only visit cells their reach can touch.
            let c0 = columns, c1 = -1, r0 = rows, r1 = -1;
            const include = (cx: number, cy: number, reach: number) => {
                c0 = Math.min(c0, Math.floor((cx - reach) / cellW)); c1 = Math.max(c1, Math.ceil((cx + reach) / cellW));
                r0 = Math.min(r0, Math.floor((cy - reach) / cellH)); r1 = Math.max(r1, Math.ceil((cy + reach) / cellH));
            };
            if (interacting) include(pointer!.x, pointer!.y, 94);
            if (pulsing && pulse) include(pulse.x, pulse.y, waveRadius + 37);
            c0 = Math.max(0, c0); r0 = Math.max(0, r0); c1 = Math.min(columns - 1, c1); r1 = Math.min(rows - 1, r1);
            for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) visit(r * columns + c);
        }
        if (responseCtx) drawLatticeInteraction(now, interacting ? pointer : undefined, morphing);
        syncMonochrome(); lastFrameMs = performance.now() - start;
        ambientFrame = -1;
        return ambient || morphing || !!pulsing || interacting;
    }
    return {
        resize, setSource, draw,
        setAmbient(next: boolean, expiresAt = Infinity) {
            if (ambient !== next) { ambientFrame = -1; if (next) grooveStart = performance.now(); }
            ambient = next; ambientDeadline = expiresAt;
        },
        ripple(x: number, y: number) { pulse = { x, y, started: performance.now() }; },
        /** Rebuild glyphs once the real glyph font has loaded, without changing size. */
        refreshGlyphs() { if (alive && sizeKey) paintStatic(); },
        settle() { morphStart = -Infinity; pulse = undefined; },
        status() {
            const now = performance.now();
            return { morphing: now - morphStart < MORPH_MS, effectActive: now - morphStart < MORPH_MS || !!pulse && now - pulse.started < 900, ambient, cells: field.length, cachedStrips: soundStrips.length, lastFrameMs, columns, rows, dpr };
        },
        destroy() {
            if (!alive) return;
            alive = false; field = from = faceMask = fromFaceMask = seeds = new Float32Array(0);
            ambientCells = new Int32Array(0); soundStrips = []; faceCells = []; soundGlyphs.clear();
            currentSource = undefined; pulse = undefined;
            for (const buffer of [atlas, neutralAtlas, base, background, morphBase, sampler, soundPortrait, soundLight, soundFrame, soundTint])
                buffer.width = buffer.height = 0;
            for (const output of [canvas, lattice, monochrome, response]) {
                if (!output || outputOwners.get(output) !== owner) continue;
                outputOwners.delete(output);
                if (output === canvas) output.width = output.width;
                else output.width = output.height = 0;
            }
        },
    };
}
