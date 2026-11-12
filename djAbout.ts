import { escape } from './html';
import type { DjHighlights } from '../content/schema';

/** Supplied names are typography, not recreated brand logos. */
export function djHighlights(data: DjHighlights): string {
    const letters = (name: string, row: number) => {
        let index = 0;
        const words = name.split(' ').map(word => `<span class="brand-word">${Array.from(word).map(letter => `<span class="brand-letter" style="--reveal-delay:${Math.min(700, row * 60 + index++ * 18)}ms">${escape(letter)}</span>`).join('')}</span>`).join(' ');
        return `<span class="visually-hidden">${escape(name)}</span><span aria-hidden="true">${words}</span>`;
    };
    return `<section class="dj-destinations" aria-labelledby="dj-cities-heading">
      <div class="dj-section-label"><span aria-hidden="true">↗</span><h2 id="dj-cities-heading">Cities played</h2></div>
      <ol class="dj-city-board">${data.cities.map((city, i) => `<li><span class="dj-city-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${escape(city)}</span><span class="dj-city-mark" aria-hidden="true">↗</span></li>`).join('')}</ol>
    </section>
    <section class="dj-brands" aria-labelledby="dj-brands-heading" data-dj-reveal>
      <h2 id="dj-brands-heading">In good company.</h2><p class="dj-highlight-intro">Brands and events I’ve played for.</p>
      <ul class="dj-brand-wall">${data.brands.map((name, i) => `<li>${letters(name, i)}</li>`).join('')}</ul>
    </section>
    <section class="dj-venues" aria-labelledby="dj-venues-heading"><h2 id="dj-venues-heading">Places with a pulse.</h2>
      <ul class="dj-venue-list">${data.venues.map(name => `<li>${escape(name)}</li>`).join('')}</ul>
    </section>`;
}

/** One gentle reveal per mount; the actual names are always readable. */
export function bindDjHighlights(root: HTMLElement): () => void {
    const wall = root.querySelector<HTMLElement>('[data-dj-reveal]');
    if (!wall || typeof IntersectionObserver === 'undefined') return () => {};
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
            wall.dataset.revealed = 'true';
            observer.disconnect();
        }
    }, { threshold: .15 });
    const sync = () => {
        if (motion.matches) {
            wall.dataset.revealed = 'false';
            observer.disconnect();
        }
    };
    if (!motion.matches) observer.observe(wall);
    motion.addEventListener('change', sync);
    return () => { observer.disconnect(); motion.removeEventListener('change', sync); };
}
