import '../src/workspace/workspace.css';
import { audioPlayer } from '../src/workspace/views';
import { all } from '../src/workspace/content';
import { bindMediaEvents } from '../src/workspace/media';
document.querySelector<HTMLElement>('#qa')!.style.cssText = 'padding:32px;max-width:850px;margin:auto';
document.querySelector('#media-fixtures')!.innerHTML = audioPlayer({ ...all('mixes')[0], audio: { kind: 'file', src: './test-tone.wav' } }) + audioPlayer({ ...all('mixes')[0], audio: { kind: 'file', src: './missing-test-audio.wav' } });
bindMediaEvents();
const [audio, invalid] = document.querySelectorAll('audio');
document.querySelector('#play-test')!.addEventListener('click', async () => {
    audio.muted = true;
    try {
        await audio.play();
        document.querySelector('#play-result')!.textContent = 'Native playback started.';
    }
    catch (error) {
        document.querySelector('#play-result')!.textContent = String(error);
    }
});
audio.addEventListener('ended', () => { document.querySelector('#play-result')!.textContent = `PASS: native playback advanced to ${audio.currentTime.toFixed(2)} seconds and ended.`; });
document.querySelector('#error-test')!.addEventListener('click', () => invalid.load());
