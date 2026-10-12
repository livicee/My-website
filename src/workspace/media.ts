import { isPlayerUrl } from './embeds';
import { reducedMotionQuery } from './motion';
import { formatLength } from './waveform';
const boundAudio = new WeakSet<HTMLAudioElement>();
/** Swap the "Load player" button for the provider's player, and move focus into it. */
export function loadEmbed(button: HTMLElement): void {
    const slot = button.closest<HTMLElement>('[data-embed]');
    const src = slot?.dataset.embed;
    if (!slot || !src || !isPlayerUrl(src) || slot.dataset.embedLoaded !== undefined)
        return;
    const frame = document.createElement('iframe');
    frame.src = src;
    frame.title = slot.dataset.embedTitle || 'Mix player';
    frame.height = slot.dataset.embedHeight || '166';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    slot.dataset.embedLoaded = '';
    button.replaceWith(frame);
    frame.focus();
}
const boundImages = new WeakSet<HTMLImageElement>();
/** A cover that fails to load disappears. So does a failed crate thumbnail: the title beside it already names the mix. */
function hideImage(image: HTMLImageElement): void {
    const figure = image.closest('figure');
    if (figure) {
        figure.hidden = true;
        return;
    }
    image.closest('.has-art')?.classList.remove('has-art');
    image.remove();
}
/** Each recording's playhead sync, keyed by its audio element: a new recording in the same deck binds afresh. */
const syncs = new WeakMap<HTMLAudioElement, () => number>();
const seekable = new WeakSet<HTMLElement>();
/** Where a click asked to land before the recording's length was known; later clicks replace it. */
interface PendingSeek { ratio: number; loaded: () => void }
const pendingSeeks = new WeakMap<HTMLAudioElement, PendingSeek>();
function clearPendingSeek(audio: HTMLAudioElement): void {
    const pending = pendingSeeks.get(audio);
    if (!pending) return;
    audio.removeEventListener('loadedmetadata', pending.loaded);
    pendingSeeks.delete(audio);
}
const reducedMotion = reducedMotionQuery();
/**
 * The deck's playhead follows the native player: every frame while it plays (every time update under reduced
 * motion), and clicking the waveform seeks. The native controls stay the accessible way to play and seek.
 */
function followPlayhead(deck: HTMLElement, audio: HTMLAudioElement): () => number {
    const sync = () => {
        const wave = deck.querySelector<HTMLElement>('[data-deck-wave]'), now = deck.querySelector<HTMLElement>('[data-deck-now]');
        const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Number(wave?.dataset.duration) || 0;
        wave?.style.setProperty('--p', total ? String(Math.min(1, audio.currentTime / total)) : '0');
        if (now) now.textContent = formatLength(audio.currentTime);
        return total;
    };
    let frame = 0;
    const tick = () => { sync(); frame = audio.paused || reducedMotion.matches ? 0 : requestAnimationFrame(tick); };
    audio.addEventListener('play', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); });
    for (const type of ['pause', 'ended', 'seeked', 'loadedmetadata', 'timeupdate'] as const) audio.addEventListener(type, () => { if (!frame) sync(); });
    return sync;
}
function seek(audio: HTMLAudioElement, ratio: number): void {
    const sync = syncs.get(audio);
    if (!sync) return;
    if (audio.readyState >= 1) {
        clearPendingSeek(audio);
        audio.currentTime = ratio * sync();
        sync();
        return;
    }
    // Nothing has loaded yet (preload="none"): fetch just enough to know where to land, once, for the latest click.
    const waiting = pendingSeeks.get(audio);
    if (waiting) { waiting.ratio = ratio; return; }
    const pending: PendingSeek = { ratio, loaded: () => {
        if (pendingSeeks.get(audio) !== pending) return;
        clearPendingSeek(audio);
        seek(audio, pending.ratio);
    } };
    pendingSeeks.set(audio, pending);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', pending.loaded, { once: true });
    audio.load();
}
function bindDeck(deck: HTMLElement): void {
    const audio = deck.querySelector('audio');
    if (!audio) return;
    if (!syncs.has(audio)) syncs.set(audio, followPlayhead(deck, audio));
    syncs.get(audio)!();
    if (seekable.has(deck)) return;
    seekable.add(deck);
    // Clicking the waveform seeks whichever recording the deck holds at the time.
    deck.addEventListener('click', event => {
        const wave = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-deck-wave]') : null;
        const current = deck.querySelector('audio');
        if (!wave || !current) return;
        const rect = wave.getBoundingClientRect(), inset = 16;
        seek(current, Math.min(1, Math.max(0, (event.clientX - rect.left - inset) / (rect.width - inset * 2))));
    });
}
export function bindMediaEvents(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-deck]').forEach(bindDeck);
    root.querySelectorAll<HTMLImageElement>('img[data-media]').forEach(image => {
        if (image.complete && image.src && !image.naturalWidth)
            hideImage(image);
        if (boundImages.has(image))
            return;
        boundImages.add(image);
        image.addEventListener('error', () => hideImage(image));
    });
    root.querySelectorAll<HTMLAudioElement>('audio').forEach(audio => {
        const currentError = audio.parentElement?.querySelector<HTMLElement>('.audio-error');
        if (currentError && audio.error)
            currentError.hidden = false;
        if (boundAudio.has(audio))
            return;
        boundAudio.add(audio);
        const error = () => audio.parentElement?.querySelector<HTMLElement>('.audio-error');
        audio.addEventListener('error', () => { clearPendingSeek(audio); const message = error(); if (message)
            message.hidden = false; });
        audio.addEventListener('loadedmetadata', () => { const message = error(); if (message)
            message.hidden = true; });
    });
}
