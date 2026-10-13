import { RAMP, GLYPH_FAMILY } from '../ascii/field';
import { TONE_STYLES } from '../ascii/ink';

/** Decorative deck setup: SVG geometry stays sharp at every screen size. */
export function djSetup(): string {
    const deck = (x: number, side: string) => `<g transform="translate(${x} 0)">
      <rect class="dj-case" x="0" y="0" width="220" height="280" rx="8"/>
      <rect x="18" y="18" width="136" height="46" rx="3"/>
      <path class="dj-detail" d="M28 42h14l6-9 8 18 7-14 8 10h16l7-10 7 12h38"/>
      <circle cx="185" cy="36" r="9"/><path d="M175 57h20"/>
      <circle class="dj-jog-rim" cx="103" cy="145" r="63"/>
      <g class="dj-jog dj-jog-${side}"><circle cx="103" cy="145" r="51"/>
        <circle class="dj-jog-dashes" cx="103" cy="145" r="43"/>
        <path d="M103 94v12M103 184v12M52 145h12M142 145h12"/>
      </g><circle class="dj-hub" cx="103" cy="145" r="13"/>
      <path d="M189 92v110"/><rect class="dj-solid" x="181" y="119" width="16" height="8" rx="1"/>
      <circle cx="30" cy="244" r="13"/><path class="dj-solid" d="m27 237 9 7-9 7z"/>
      <circle cx="67" cy="244" r="10"/><path d="M63 240h8v8h-8z"/>
      <rect x="112" y="232" width="22" height="16" rx="2"/><rect x="143" y="232" width="22" height="16" rx="2"/>
    </g>`;
    const channel = (x: number, i: number) => `<g transform="translate(${x} 0)">
      <circle cx="0" cy="39" r="7"/><circle cx="0" cy="67" r="7"/><circle cx="0" cy="95" r="7"/>
      <path class="dj-detail" d="M0 33v6M0 61v6M0 89v6M0 128v85"/>
      <rect class="dj-solid" x="-7" y="${160 + i * 7}" width="14" height="6" rx="1"/>
      <rect class="dj-meter" style="--meter-delay:-${i * .47}s" x="-4" y="226" width="8" height="24"/>
    </g>`;
    return `<figure class="dj-setup" data-dj-setup aria-label="Decorative illustration of two CDJs and a mixer">
      <canvas class="dj-glyphs" aria-hidden="true"></canvas><svg viewBox="0 0 680 310" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <g transform="translate(10 15)">${deck(0, 'left')}${deck(440, 'right')}
          <g transform="translate(236 0)"><rect class="dj-case" width="188" height="280" rx="8"/>
            ${[40, 76, 112, 148].map(channel).join('')}
            <path d="M28 263h132"/><rect class="dj-solid" x="89" y="258" width="10" height="10" rx="1"/>
          </g>
        </g>
      </svg>
    </figure>`;
}

/** Draw the deck geometry through the same glyph ramp, font and ink as the portraits. */
export function bindDjSetup(root: HTMLElement): () => void {
    const setup = root.querySelector<HTMLElement>('[data-dj-setup]');
    const canvas = setup?.querySelector<HTMLCanvasElement>('canvas');
    if (!setup || !canvas) return () => {};
    const ctx = canvas.getContext('2d');
    const mask = document.createElement('canvas');
    const pen = mask.getContext('2d', { willReadFrequently: true });
    if (!ctx || !pen) return () => {};
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, stopped = false, frame = 0, last = 0, elapsed = 0, previous = 0;
    let width = 0, height = 0;
    const box = (x: number, y: number, w: number, h: number) => pen.strokeRect(x, y, w, h);
    const circle = (x: number, y: number, r: number) => {
        pen.beginPath(); pen.arc(x, y, r, 0, Math.PI * 2); pen.stroke();
    };
    const line = (x: number, y: number, xx: number, yy: number) => {
        pen.beginPath(); pen.moveTo(x, y); pen.lineTo(xx, yy); pen.stroke();
    };
    function draw() {
        if (!ctx || !pen || !canvas || !setup || !width) return;
        pen.setTransform(1, 0, 0, 1, 0, 0);
        pen.clearRect(0, 0, width, height);
        pen.setTransform(width / 680, 0, 0, width / 680, 0, 0);
        pen.strokeStyle = '#fff'; pen.fillStyle = '#fff'; pen.lineWidth = 4;
        pen.lineJoin = 'round';
        const t = elapsed / 1000;
        for (const [x, direction] of [[10, 1], [450, -1]]) {
            pen.save(); pen.translate(x, 15);
            box(0, 0, 220, 280); box(18, 18, 136, 46);
            line(28, 40, 145, 40); line(28, 52, 98, 52);
            circle(185, 36, 9); circle(103, 145, 63); circle(103, 145, 51); circle(103, 145, 13);
            for (let i = 0; i < 12; i++) {
                const angle = i * Math.PI / 6 + t * .38 * direction;
                line(103 + Math.cos(angle) * 41, 145 + Math.sin(angle) * 41,
                    103 + Math.cos(angle) * 47, 145 + Math.sin(angle) * 47);
            }
            line(189, 92, 189, 202); pen.fillRect(181, 119, 16, 8);
            circle(30, 244, 13); circle(67, 244, 10);
            pen.beginPath(); pen.moveTo(27, 237); pen.lineTo(36, 244); pen.lineTo(27, 251); pen.closePath(); pen.fill();
            box(112, 232, 22, 16); box(143, 232, 22, 16);
            pen.restore();
        }
        pen.save(); pen.translate(246, 15); box(0, 0, 188, 280);
        [40, 76, 112, 148].forEach((x, i) => {
            [39, 67, 95].forEach(y => circle(x, y, 7));
            line(x, 128, x, 213); pen.fillRect(x - 7, 160 + i * 7, 14, 6);
            const level = motion.matches ? .6 : .35 + .65 * (Math.sin(t * 2.1 + i * 1.7) + 1) / 2;
            pen.fillRect(x - 4, 250 - 24 * level, 8, 24 * level);
        });
        line(28, 263, 160, 263); pen.fillRect(89, 258, 10, 10); pen.restore();
        const pixels = pen.getImageData(0, 0, width, height).data;
        ctx.clearRect(0, 0, width, height);
        const cw = 5.5, ch = 8.25;
        ctx.font = `8px ${GLYPH_FAMILY}`; ctx.textBaseline = 'top';
        for (let y = 0; y + ch < height; y += ch) {
            for (let x = 0; x + cw < width; x += cw) {
                let sum = 0, count = 0;
                for (let yy = Math.floor(y); yy < y + ch && yy < height; yy++) {
                    for (let xx = Math.floor(x); xx < x + cw && xx < width; xx++) {
                        sum += pixels[(yy * width + xx) * 4 + 3]; count++;
                    }
                }
                const brightness = Math.min(1, sum / (count * 255) * 2.4);
                if (brightness < .06) continue;
                const level = Math.max(1, Math.round(brightness * (TONE_STYLES.length - 1)));
                ctx.fillStyle = TONE_STYLES[level];
                ctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(brightness * (RAMP.length - 1)))], x, y);
            }
        }
        setup.dataset.glyphs = 'true';
    }
    function resize() {
        if (!canvas || !setup || !ctx) return;
        width = Math.max(1, Math.min(680, Math.floor(setup.clientWidth)));
        height = Math.round(width * 310 / 680);
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        mask.width = width; mask.height = height;
        draw();
    }
    const active = () => visible && !document.hidden && !motion.matches && !stopped;
    function tick(now: number) {
        frame = 0;
        if (!active()) { previous = 0; return; }
        if (previous) elapsed += Math.min(100, now - previous);
        previous = now;
        if (now - last >= 1000 / 12) { draw(); last = now; }
        frame = requestAnimationFrame(tick);
    }
    function sync() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0; previous = 0;
        if (active()) frame = requestAnimationFrame(tick);
        else draw();
    }
    const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting); sync();
    }, { threshold: .1 });
    observer?.observe(setup);
    const sizing = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
    sizing?.observe(setup);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    resize();
    return () => {
        stopped = true;
        if (frame) cancelAnimationFrame(frame);
        observer?.disconnect(); sizing?.disconnect();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', sync);
        motion.removeEventListener('change', sync);
    };
}
