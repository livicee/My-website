import { get, recordPath } from './content';
import { escape, icon } from './html';
import type { ContentRecord } from './model';
import { hashFor } from './routes';
import { formatLength } from './waveform';

/**
 * Livicee's persistent player. A SoundCloud set plays in a hidden official widget, driven over its postMessage
 * protocol, while this bar (outside the re-rendered workspace) carries the controls, so playback survives navigation
 * and identity changes. Nothing from SoundCloud loads until a visitor presses play.
 */
const WIDGET = 'https://w.soundcloud.com';
/** A widget that never reports ready is treated as unavailable; the bar then offers the SoundCloud page instead. */
const READY_TIMEOUT_MS = 15000;
/** Some browsers refuse to start audio a frame was not tapped for. If nothing plays by then, show play again. */
const AUTOPLAY_GRACE_MS = 4000;
const SCRUB_STEPS = 1000;

type PlayerState = 'loading' | 'playing' | 'paused' | 'error';
type SoundCloudMix = ContentRecord & { audio: Extract<ContentRecord['audio'], { kind: 'embed' }> };

/** Only SoundCloud links play here; Mixcloud keeps its own on-page player. */
export const playsInBar = (r: ContentRecord): r is SoundCloudMix => r.audio?.kind === 'embed' && r.audio.provider === 'SoundCloud';

interface MixPlayer {
    toggle(id: string): void;
    /** Re-apply play/pause state to the buttons a render has just drawn. */
    sync(root?: ParentNode): void;
}

export function createMixPlayer(): MixPlayer {
    let bar: HTMLElement | undefined, frame: HTMLIFrameElement | undefined;
    let current: SoundCloudMix | undefined, state: PlayerState = 'paused';
    let position = 0, duration = 0, scrubbing = false;
    let readyTimer = 0, graceTimer = 0;

    const send = (method: string, value?: unknown) => frame?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), WIDGET);
    const clearTimers = () => { clearTimeout(readyTimer); clearTimeout(graceTimer); };

    function build(): HTMLElement {
        const element = document.createElement('section');
        element.className = 'mix-player';
        element.setAttribute('aria-label', 'Now playing');
        element.innerHTML = `<button type="button" class="mix-player-toggle" data-player-toggle>${icon('play')}${icon('pause')}</button>
<div class="mix-player-meta"><a class="mix-player-title" data-player-title href="#"></a><span class="mix-player-status" data-player-status aria-live="polite"></span></div>
<input class="mix-player-scrub" data-player-scrub type="range" min="0" max="${SCRUB_STEPS}" step="1" value="0" aria-label="Position in the set">
<span class="mix-player-time" data-player-time></span>
<a class="mix-player-open" data-player-open target="_blank" rel="noopener noreferrer">${icon('soundcloud')}<span>SoundCloud</span>${icon('diagonal')}<span class="visually-hidden"> (opens in a new tab)</span></a>
<button type="button" class="mix-player-close" data-player-close aria-label="Stop and close the player">${icon('close')}</button>`;
        element.querySelector('[data-player-toggle]')!.addEventListener('click', () => { if (current) toggle(current.id); });
        element.querySelector('[data-player-close]')!.addEventListener('click', close);
        const scrub = element.querySelector<HTMLInputElement>('[data-player-scrub]')!;
        scrub.addEventListener('input', () => { scrubbing = true; position = Number(scrub.value) / SCRUB_STEPS * duration; render(); });
        scrub.addEventListener('change', () => {
            scrubbing = false;
            position = Number(scrub.value) / SCRUB_STEPS * duration;
            send('seekTo', Math.round(position));
            render();
        });
        document.body.append(element);
        addEventListener('message', receive);
        return element;
    }

    function receive(event: MessageEvent): void {
        if (event.origin !== WIDGET || !frame || event.source !== frame.contentWindow || typeof event.data !== 'string') return;
        let message: { method?: string; value?: unknown };
        try { message = JSON.parse(event.data); }
        catch { return; }
        switch (message.method) {
            case 'ready':
                clearTimeout(readyTimer);
                for (const name of ['play', 'pause', 'finish', 'playProgress', 'error']) send('addEventListener', name);
                send('getDuration');
                send('play');
                clearTimeout(graceTimer);
                graceTimer = window.setTimeout(() => { if (state === 'loading') setState('paused'); }, AUTOPLAY_GRACE_MS);
                return;
            case 'getDuration':
                if (typeof message.value === 'number' && message.value > 0) duration = message.value;
                render();
                return;
            case 'play':
                clearTimeout(graceTimer);
                setState('playing');
                return;
            case 'pause':
                if (state !== 'error') setState('paused');
                return;
            case 'finish':
                position = 0;
                setState('paused');
                return;
            case 'playProgress': {
                const value = message.value as { currentPosition?: number } | undefined;
                if (!scrubbing && typeof value?.currentPosition === 'number') { position = value.currentPosition; render(); }
                return;
            }
            case 'error':
                clearTimers();
                setState('error');
                return;
        }
    }

    function start(mix: SoundCloudMix): void {
        bar ??= build();
        clearTimers();
        frame?.remove();
        current = mix;
        position = 0;
        duration = (mix.audio.duration ?? 0) * 1000;
        frame = document.createElement('iframe');
        frame.className = 'mix-player-frame';
        frame.title = `SoundCloud player for ${mix.title}`;
        frame.tabIndex = -1;
        frame.setAttribute('aria-hidden', 'true');
        frame.allow = 'autoplay; encrypted-media';
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.src = mix.audio.player.replace('auto_play=false', 'auto_play=true');
        document.body.append(frame);
        readyTimer = window.setTimeout(() => setState('error'), READY_TIMEOUT_MS);
        bar.hidden = false;
        document.documentElement.classList.add('has-mix-player');
        setState('loading');
    }

    function toggle(id: string): void {
        if (current?.id === id && frame) {
            if (state === 'playing') send('pause');
            else if (state === 'paused') send('play');
            else if (state === 'error') start(current);
            return;
        }
        const mix = get('mixes', id);
        if (mix && playsInBar(mix)) start(mix);
    }

    function close(): void {
        clearTimers();
        frame?.remove();
        frame = undefined;
        const id = current?.id;
        current = undefined;
        if (bar) bar.hidden = true;
        document.documentElement.classList.remove('has-mix-player');
        sync();
        // Focus returns to the set's play button when it is on screen, otherwise to the page.
        const origin = id ? document.querySelector<HTMLElement>(`[data-play="${CSS.escape(id)}"]`) : null;
        (origin ?? document.querySelector<HTMLElement>('#view'))?.focus();
    }

    function setState(next: PlayerState): void {
        state = next;
        render();
        sync();
    }

    function render(): void {
        if (!bar || !current) return;
        bar.dataset.state = state;
        const toggleButton = bar.querySelector<HTMLButtonElement>('[data-player-toggle]')!;
        toggleButton.setAttribute('aria-label', `${state === 'playing' ? 'Pause' : 'Play'} ${current.title}`);
        toggleButton.disabled = state === 'loading';
        const title = bar.querySelector<HTMLAnchorElement>('[data-player-title]')!;
        title.textContent = current.title;
        title.href = hashFor(recordPath(current));
        bar.querySelector<HTMLAnchorElement>('[data-player-open]')!.href = current.audio.page;
        bar.querySelector('[data-player-status]')!.textContent = state === 'loading' ? 'Loading…' : state === 'error' ? 'Could not play here. Try SoundCloud.' : '';
        const total = duration ? formatLength(duration / 1000) : '--:--';
        const now = formatLength(Math.min(position, duration || position) / 1000);
        bar.querySelector('[data-player-time]')!.textContent = `${now} / ${total}`;
        const scrub = bar.querySelector<HTMLInputElement>('[data-player-scrub]')!;
        scrub.disabled = !duration || state === 'loading' || state === 'error';
        if (!scrubbing) scrub.value = String(duration ? Math.round(position / duration * SCRUB_STEPS) : 0);
        scrub.setAttribute('aria-valuetext', `${now} of ${total}`);
        bar.style.setProperty('--progress', String(duration ? Math.min(1, position / duration) : 0));
    }

    function sync(root: ParentNode = document): void {
        root.querySelectorAll<HTMLButtonElement>('[data-play]').forEach(button => {
            const mine = current?.id === button.dataset.play;
            const shown = mine ? state : 'idle';
            button.dataset.state = shown;
            const label = button.dataset.playLabel ?? '';
            button.setAttribute('aria-label', `${shown === 'playing' ? 'Pause' : 'Play'} ${label}`);
        });
    }

    return { toggle, sync };
}

/** A play control for a SoundCloud set; its state is applied by the player after each render. */
export function playButton(r: ContentRecord, cls: string, text = ''): string {
    if (!playsInBar(r)) return '';
    const words = text ? `<span class="play-word play-word-play">${escape(text)}</span><span class="play-word play-word-pause">Pause</span>` : '';
    return `<button type="button" class="${cls}" data-play="${escape(r.id)}" data-play-label="${escape(r.title)}" aria-label="Play ${escape(r.title)}">${icon('play')}${icon('pause')}${words}</button>`;
}
