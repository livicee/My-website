import type { ContentRecord } from './model';
import { escape, icon } from './html';
import { isPlayerUrl } from './embeds';
import { playButton, playsInBar } from './player';
import { formatLength, resample, waveformSvg } from './waveform';

const DECK_BARS = 96;
/** An empty deck is a flat centre line, as DJ software shows a deck with nothing loaded. */
const flatline = () => '<span class="deck-flat" aria-hidden="true"></span>';
const note = (text: string) => `<p class="deck-note"><span>${text}</span></p>`;
const deckBar = (state: string, time = '') => `<div class="deck-bar"><span class="deck-name">Deck</span><span class="deck-state">${state}</span>${time}</div>`;

/**
 * The mix page's deck. A waveform is drawn only from measured peaks for the attached file; a linked or
 * missing recording gets the empty deck, never an invented shape. Playback is always the native or provider player.
 */
export function audioPlayer(r: ContentRecord): string {
    const audio = r.audio;
    // SoundCloud sets play in the persistent bar; nothing from SoundCloud loads until the visitor presses play.
    if (audio?.kind === 'embed' && isPlayerUrl(audio.player) && playsInBar(r)) {
        const length = audio.duration ? `<span class="deck-time">${escape(formatLength(audio.duration))}</span>` : '';
        return `<section class="deck deck-linked" aria-label="Mix recording">${deckBar(`${icon('soundcloud')}<span>On SoundCloud</span>`, length)}<div class="deck-actions">${playButton(r, 'button primary deck-play', 'Play set')}<a class="text-link" href="${escape(audio.page)}" target="_blank" rel="noopener noreferrer">Open on SoundCloud ${icon('diagonal')}<span class="visually-hidden"> (opens in a new tab)</span></a></div></section>`;
    }
    // Other linked mixes load the provider's player only on request, so no third-party frame or cookies until then.
    if (audio?.kind === 'embed' && isPlayerUrl(audio.player)) {
        const provider = escape(audio.provider);
        return `<section class="deck" aria-label="Mix recording">${deckBar(`${icon('sound')}<span>Listen on ${provider}</span>`)}<div class="deck-wave">${flatline()}${note(`The ${provider} player loads when you open it. Nothing plays until you press play.`)}</div><div class="embed-slot" data-embed="${escape(audio.player)}" data-embed-height="${audio.height}" data-embed-title="${escape(`${r.title} on ${audio.provider}`)}"><button type="button" class="button" data-load-embed>${icon('sound')} Load player</button><a class="text-link" href="${escape(audio.page)}" target="_blank" rel="noopener noreferrer">Open on ${provider} ${icon('diagonal')}</a></div></section>`;
    }
    const src = audio?.kind === 'file' ? audio.src : undefined;
    if (!src || !isAudioSource(src) || audio?.kind !== 'file') {
        return `<section class="deck" aria-label="Mix recording">${deckBar(`${icon('sound')}<span>Recording not supplied</span>`, '<span class="deck-time" aria-hidden="true">--:--</span>')}<div class="deck-wave">${flatline()}</div></section>`;
    }
    const length = audio.duration ? formatLength(audio.duration) : '';
    const values = audio.peaks ? resample(audio.peaks, DECK_BARS) : undefined;
    // Two copies of the same measured shape: the played part is the pink copy, revealed up to the playhead.
    const wave = values
        ? `<div class="deck-wave has-peaks" data-deck-wave${audio.duration ? ` data-duration="${audio.duration}"` : ''}>${waveformSvg(values, 'wave-dim')}<span class="deck-played" aria-hidden="true">${waveformSvg(values, 'wave-lit')}</span><span class="deck-playhead" aria-hidden="true"></span></div>`
        : `<div class="deck-wave">${flatline()}${note('Press play to listen.')}</div>`;
    const time = `<span class="deck-time"><span data-deck-now>0:00</span>${length ? ` / ${escape(length)}` : ''}</span>`;
    // Like a DJ deck, the bar names what is loaded.
    return `<section class="deck is-loaded" aria-label="Mix recording" data-deck>${deckBar(`${icon('sound')}<span>${escape(r.title)}</span>`, time)}${wave}<audio controls preload="none" src="${escape(src)}">Your browser does not support audio playback.</audio><p class="audio-error" hidden role="status">This recording could not be loaded. Please try again later.</p></section>`;
}
function isAudioSource(src: string): boolean {
    if (!src.trim() || src !== src.trim() || src.startsWith('//') || src.includes('\\'))
        return false;
    try {
        // Bundled files resolve against the page, so the local preview (plain http) plays them too.
        const page = typeof location === 'undefined' ? undefined : location;
        const url = new URL(src, page?.href ?? 'https://local.invalid/');
        return url.protocol === 'https:' || url.protocol === 'blob:' || (!!page && url.origin === page.origin);
    }
    catch {
        return false;
    }
}
