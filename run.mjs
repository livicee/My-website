import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createWorkspaceCompiler } from './transpile.mjs';
import { verifyLiveContent } from './live-content.mjs';
import { CONTENT_FILES } from '../scripts/content-validation.mjs';

// Compile only the pure application modules using the project's existing TypeScript dependency.
const temp = await mkdtemp(join(tmpdir(), 'livi-contract-tests-'));
let passed = 0;
const check = (name, run) => { run(); passed++; console.log(`PASS ${name}`); };
try {
  const review = JSON.parse(await readFile(new URL('./review-content.json', import.meta.url), 'utf8'));
  const compile = createWorkspaceCompiler(import.meta.url, temp, { contentFixture: review.content });
  for (const name of ['model', 'content', 'routes', 'search', 'views', 'validation', 'viewState']) await compile(name);
  const { records, all, get, recordPath, copy, site, hydrate } = await import(pathToFileURL(join(temp, 'content.mjs')));
  const { NIGHT, phaseSpan, nightChart } = await import(pathToFileURL(join(temp, 'night.mjs')));
  const { formatLength } = await import(pathToFileURL(join(temp, 'waveform.mjs')));
  const { parseRoute, hashFor, listRecords, modeDestination, contextPath, canonicalHash } = await import(pathToFileURL(join(temp, 'routes.mjs')));
  const { matches, results, facetsFor, withFacets } = await import(pathToFileURL(join(temp, 'search.mjs')));
  const { escape } = await import(pathToFileURL(join(temp, 'html.mjs')));
  const { validateRecords } = await import(pathToFileURL(join(temp, 'validation.mjs')));
  const { createViewState, viewportBucket, viewStateKey, shouldRestoreView } = await import(pathToFileURL(join(temp, 'viewState.mjs')));
  const { shell, audioPlayer, pageTitle } = await import(pathToFileURL(join(temp, 'views.mjs')));
  await verifyLiveContent(join(temp, 'live'));
  passed++; console.log('PASS live content matches its schema, resolves relationships and renders supplied media without sample-only assumptions');
  const { filters } = await import(pathToFileURL(join(temp, 'library.mjs')));
  const { mixEmbed } = await import(pathToFileURL(join(temp, 'embeds.mjs')));
  await compile('../ascii/field');
  const {figureBounds, registeredFigureBounds, readingEdge, createAsciiField, soundBand, SOUND_BEAT_MS, SOUND_GROOVE_CYCLE_MS, soundPointerGroove, soundClickGroove} = await import(pathToFileURL(join(temp, 'ascii__field.mjs')));
  const pointerSource = await readFile(new URL('../src/ascii/pointer.ts', import.meta.url), 'utf8');
  await writeFile(join(temp, 'pointer.mjs'), ts.transpileModule(pointerSource, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {pointerInfluenceAt, pointerFollow, POINTER_ATTACK_MS, POINTER_RELEASE_MS} = await import(pathToFileURL(join(temp, 'pointer.mjs')));
  check('pointer influence enters smoothly and an early exit cannot jump to full strength', () => {
    const start = 1000, leave = start + 15;
    assert.equal(pointerInfluenceAt(start, start, Infinity, start), 0);
    let previous = 0;
    for (let now = start; now <= start + POINTER_ATTACK_MS; now++) {
      const strength = pointerInfluenceAt(now, now, Infinity, start);
      assert.ok(strength >= previous && strength <= 1, 'attack grows without overshoot');
      assert.ok(strength - previous < .02, 'attack has no visible strength jump');
      previous = strength;
    }
    assert.equal(previous, 1);
    const earlyStrength = pointerInfluenceAt(leave, start, Infinity, start);
    assert.ok(earlyStrength > 0 && earlyStrength < .1, 'a brief pass remains a light touch');
    assert.equal(pointerInfluenceAt(leave, start, leave, start), earlyStrength, 'release starts from the visible attack strength');
    previous = earlyStrength;
    for (let now = leave; now <= leave + POINTER_RELEASE_MS; now++) {
      const strength = pointerInfluenceAt(now, start, leave, start);
      assert.ok(strength <= previous && strength >= 0, 'early release never swells after leaving');
      previous = strength;
    }
    assert.equal(previous, 0);
  });
  check('pointer re-entry continues the current release without a pop', () => {
    const oldStrength = pointerInfluenceAt(1260, 1100, 1200, 1000);
    assert.ok(oldStrength > 0 && oldStrength < 1);
    assert.equal(pointerInfluenceAt(1260, 1260, Infinity, 1260, oldStrength), oldStrength);
    assert.ok(pointerInfluenceAt(1300, 1300, Infinity, 1260, oldStrength) > oldStrength);
    assert.equal(pointerInfluenceAt(1800, 1300, 1350, 1260, oldStrength), 0, 'late frames cannot prolong release');
  });
  check('pointer tracking stays continuous across frame rates and rapid direction changes', () => {
    const oneFrame = pointerFollow(0, 100, 32);
    const twoFrames = pointerFollow(pointerFollow(0, 100, 16), 100, 16);
    assert.ok(Math.abs(oneFrame - twoFrames) < 1e-10, 'elapsed time produces the same position across frame subdivisions');
    assert.ok(oneFrame > 0 && oneFrame < 100, 'position follows rather than teleporting');
    const reversed = pointerFollow(oneFrame, -100, 16);
    assert.ok(reversed < oneFrame && reversed > -100, 'reversal begins at the current position without overshoot');
    assert.equal(pointerFollow(42, 100, 0), 42, 'a zero-duration frame preserves position');
  });
  check('source registration preserves the original head fit at desktop and phone drawing scales', () => {
    // Crown, nose and bun rim from the original v2 fit, not new measurements of shoulder-length option B.
    // The current source's actual glyph rendering is checked in the browser fixtures.
    const landmarks = [ [[473, 33], [482, 31]], [[300, 321], [288, 348]], [[738, 315], [763, 344]] ];
    for (const [width, height, composition] of [
      // 192px rail + 12px right return; 56px header + 44px footer.
      [1300, 900, {viewportWidth:1440, readingEdge:readingEdge(1440, 192, 1592)}],
      [1780, 980, {viewportWidth:1920, readingEdge:readingEdge(1920, 192, 1592)}],
      // Phones have a 56px header and one 64px dock, with no separate footer.
      [390, 724, {viewportWidth:390, readingEdge:0, figureWidth:430, figureTop:14}],
      [360, 680, {viewportWidth:360, readingEdge:0, figureWidth:430, figureTop:14}],
    ]) {
      const content = registeredFigureBounds(width, height, composition, 'production');
      const dj = registeredFigureBounds(width, height, composition, 'sound');
      assert.deepEqual(content, figureBounds(width, height, composition), 'the established Content crop stays fixed');
      const verticalStretch = dj.height / dj.width / 1.5;
      assert.ok(verticalStretch > 1.02 && verticalStretch < 1.03, 'the DJ source receives only a subtle vertical correction');
      // Independent crown/chin measurements catch the shorter head that a profile-only fit missed.
      const crown = dj.y + 33 / 1536 * dj.height;
      const chin = dj.y + 444 / 1536 * dj.height;
      const contentCrown = content.y + 31 / 1536 * content.height;
      const contentChin = content.y + 492 / 1536 * content.height;
      assert.ok(Math.abs(crown - contentCrown) <= 1, `${width}px crown stays anchored`);
      assert.ok(Math.abs(chin - contentChin) <= 1, `${width}px chin ends at the same height`);
      assert.ok(Math.abs((chin - crown) - (contentChin - contentCrown)) <= 1, `${width}px head height matches within one CSS pixel`);
      for (const [[sx, sy], [px, py]] of landmarks) {
        const error = Math.hypot(dj.x + sx / 1024 * dj.width - content.x - px / 1024 * content.width,
          dj.y + sy / 1536 * dj.height - content.y - py / 1536 * content.height);
        assert.ok(error < 6, `${width}px head landmark remains within one glyph (${error.toFixed(2)}px)`);
      }
    }
  });
  check('Livicee equalizer has a steady kick, distinct vertical bands and finite repeating levels', () => {
    assert.equal(SOUND_BEAT_MS, 500, 'the authored silent rhythm has a 120bpm pulse');
    assert.equal(SOUND_GROOVE_CYCLE_MS, SOUND_BEAT_MS * 4, 'the pattern repeats after four beats');
    const positions = [0, .13, .3, .5, .72, .91, 1];
    for (let time = -SOUND_GROOVE_CYCLE_MS; time <= SOUND_GROOVE_CYCLE_MS * 2; time += 16) {
      for (const position of positions) {
        const frame = soundBand(position, time), repeated = soundBand(position, time + SOUND_GROOVE_CYCLE_MS);
        for (const key of ['level', 'peak']) {
          assert.ok(Number.isFinite(frame[key]) && frame[key] >= 0 && frame[key] <= 1, `${key} stays within the portrait`);
          assert.ok(Math.abs(frame[key] - repeated[key]) < 1e-10, `${key} repeats at exactly four beats`);
        }
      }
    }
    for (let beat = 0; beat < 4; beat++) {
      const average = age => positions.reduce((sum, position) => sum + soundBand(position, beat * SOUND_BEAT_MS + age).level, 0) / positions.length;
      assert.ok(average(40) > average(400) + .12, `beat ${beat + 1} rises on the kick and falls before the next kick`);
    }
    const levels = positions.map(position => soundBand(position, 40).level);
    assert.ok(Math.max(...levels) - Math.min(...levels) > .08, 'individual bands have distinct heights rather than one global brightness pulse');
  });
  check('Livicee pointer and click stay local, bounded and independent of the equalizer', () => {
    for (const distance of [0, 40, 100, 168, 300]) {
      assert.deepEqual(soundPointerGroove(distance, 0, 1000), { offset: 0, light: 0 });
      for (let time = 0; time < 900; time += 16) {
        const pointer = soundPointerGroove(distance, 1, time), click = soundClickGroove(distance, time);
        assert.ok(Math.abs(pointer.offset) <= 4.5 && pointer.light >= 0 && pointer.light <= .24);
        assert.ok(Math.abs(click.offset) <= 8 && click.light >= 0 && click.light <= .65);
      }
      assert.deepEqual(soundClickGroove(distance, 900), { offset: 0, light: 0 });
    }
  });
  check('Livicee paints cached vertical bands and restores a single resting image when motion stops', () => {
    const previousDocument = globalThis.document, previousWindow = globalThis.window;
    const makeCanvas = () => {
      const target = { width: 0, height: 0, clientWidth: 1200, clientHeight: 720, paints: 0 };
      const context = {
        drawImage() { target.paints++; }, clearRect() {}, fillRect() {}, fillText() {},
        getImageData(_x, _y, width, height) {
          const data = new Uint8ClampedArray(width * height * 4);
          for (let row = 0; row < height; row++) for (let column = Math.floor(width * .6); column < width * .9; column++) {
            const index = (row * width + column) * 4;
            data[index] = data[index + 1] = data[index + 2] = 150; data[index + 3] = 255;
          }
          return { data };
        },
      };
      target.getContext = () => context;
      return target;
    };
    try {
      globalThis.document = { createElement: makeCanvas };
      globalThis.window = { devicePixelRatio: 1 };
      const canvas = makeCanvas(), renderer = createAsciiField(canvas);
      renderer.resize({ viewportWidth: 1200, readingEdge: 600 });
      renderer.setSource({}, undefined, false, 'sound');
      const now = performance.now() + 1000;
      renderer.setAmbient(true, now + 9000); canvas.paints = 0;
      assert.equal(renderer.draw(now), true);
      assert.ok(renderer.status().cells > 10000, 'a substantial source is sampled');
      assert.ok(canvas.paints > 1 && canvas.paints <= 4, `${canvas.paints} visible-canvas draws use the cached composite, independent of the number of bands or cells`);
      renderer.setAmbient(false); canvas.paints = 0;
      assert.equal(renderer.draw(now + 20), false);
      assert.equal(canvas.paints, 1, 'reduced/idle motion renders only the cached resting portrait');
      renderer.ripple(800, 200); renderer.settle(); canvas.paints = 0;
      assert.equal(renderer.draw(now + 40), false);
      assert.equal(canvas.paints, 1, 'settling cancels any pending click effect');
      renderer.destroy();
    } finally {
      if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
      if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    }
  });
  check('the portrait takes one composition per viewport, centred beside the reading pane on desktop', () => {
    // The composition the app passes: the viewport, spine, right return and reading edge. Nothing about the route.
    const compose = (viewportWidth, height, nav) => {
      const width = viewportWidth - nav - 12, edge = readingEdge(viewportWidth, nav, 1592);
      return { edge, width, bounds: figureBounds(width, height, { viewportWidth, readingEdge: edge }) };
    };
    for (const [viewportWidth, height] of [[1920, 980], [2557, 1300]]) {
      const { edge, width, bounds } = compose(viewportWidth, height, 128);
      assert.ok(bounds.width >= 580 && bounds.width <= 850, `${viewportWidth}px keeps its drawing scale`);
      // Equal space either side of the figure, whatever is left beside the pane.
      assert.ok(Math.abs((bounds.x - edge) - (width - bounds.x - bounds.width)) < 0.001, `${viewportWidth}px centres the figure`);
    }
    // Only the widest screens leave room for the whole figure beside the pane; narrower ones let the pane overlap it.
    const wide = compose(2557, 1300, 128);
    assert.ok(wide.bounds.x >= wide.edge, 'an ultra-wide screen keeps the figure clear of the reading pane');
    // A sidebar must not turn a tablet into a phone-sized portrait.
    for (const viewportWidth of [761, 800, 834, 859]) assert.ok(compose(viewportWidth, 1040, 128).bounds.width >= 580, `${viewportWidth}px tablet preserves drawing scale`);
    // Phones use the centred head-and-shoulders composition fixed by the stylesheet.
    const phone = figureBounds(390, 724, { viewportWidth: 390, readingEdge: 0, figureWidth: 430, figureTop: 14 });
    assert.deepEqual(phone, { x: -20, y: 14, width: 430, height: 645 });
  });
  check('default route opens Content home', () => assert.equal(parseRoute('').page, 'home'));
  check('mode switches preserve the section in both directions', () => {
    for (const [content, sound] of [['/', '/livicee'], ['/about', '/livicee/about'], ['/contact', '/livicee/contact'], ['/work', '/livicee/mixes']]) {
      assert.equal(modeDestination(parseRoute(`#${content}`), 'sound'), `#${sound}`);
      assert.equal(modeDestination(parseRoute(`#${sound}`), 'production'), `#${content}`);
    }
    assert.equal(parseRoute('').dataset, 'production');
    assert.equal(parseRoute('#/livicee/about').dataset, 'sound');
    // The CV has no Livicee equivalent, so it switches to About.
    assert.equal(modeDestination(parseRoute('#/experience'), 'sound'), '#/livicee/about');
  });
  check('records switch to the corresponding Work and profile sections', () => {
    for (const record of records) {
      const route = parseRoute(hashFor(recordPath(record)));
      const target = route.dataset === 'sound' ? 'production' : 'sound';
      const expected = record.collection === 'experience' ? '/livicee/about' : target === 'sound' ? '/livicee/mixes' : '/work';
      assert.equal(parseRoute(modeDestination(route, target)).path, expected, record.id);
      assert.equal(modeDestination(route, route.dataset), hashFor(route.path, route.query));
    }
    assert.equal(modeDestination(parseRoute('#/unknown'), 'sound'), '#/livicee');
  });
  check('sidebar links remain inside the active persona', () => {
    for (const path of ['/', '/about', '/livicee', '/livicee/about']) {
      const route = parseRoute(`#${path}`);
      const nav = shell(route).match(/<div class="nav-links">(.*?)<\/div>/s)[1];
      const destinations = [...nav.matchAll(/href="(#[^"]+)"/g)].map(match => parseRoute(match[1]));
      assert.equal((nav.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 1, 'each identity offers one outside profile (LinkedIn or SoundCloud), and it opens outside the site safely');
      assert.equal(destinations.length, route.dataset === 'sound' ? 4 : 5);
      assert.ok(destinations.every(destination => destination.dataset === route.dataset));
    }
    const projectsNav = shell(parseRoute('#/work')).match(/<div class="nav-links">(.*?)<\/div>/s)[1];
    const mixesNav = shell(parseRoute('#/livicee/mixes')).match(/<div class="nav-links">(.*?)<\/div>/s)[1];
    assert.match(projectsNav, />Projects<\/span>/);
    assert.match(projectsNav, /href="#\/experience"[^>]*>(?:(?!<\/a>).)*<span>Work<\/span>/s);
    assert.match(mixesNav, />Mixes<\/span>/);
    assert.doesNotMatch(mixesNav, /experience/);
  });
  check('the Work tab is the CV: every role with dates and linked projects, no longer inside About', () => {
    const route = parseRoute('#/experience');
    assert.equal(route.page, 'experience');
    const html = shell(route);
    assert.match(html, /<a\b(?=[^>]*class="[^"]*\bnav-item\b[^"]*\bactive\b[^"]*")(?=[^>]*aria-current="page")[^>]*>(?:(?!<\/a>).)*<span>Work<\/span>/s);
    for (const role of all('experience')) {
      assert.ok(html.includes(`data-record-id="${role.id}"`), role.id);
      const roleMarkup = html.split(`data-record-id="${role.id}"`)[1].split('</details>')[0];
      const dates = role.year === 'To confirm' ? 'Dates to confirm' : role.year;
      assert.ok(roleMarkup.includes(`<span class="role-dates">${escape(dates)}</span>`), `${role.id}: dates remain explicit`);
      assert.ok(roleMarkup.includes(`<h2 class="role-title">${escape(role.title)}</h2>`), `${role.id}: role title remains visible`);
      assert.ok(roleMarkup.includes(`<small>${escape(role.subtitle)}</small>`), `${role.id}: organisation remains separate from dates`);
      assert.ok(roleMarkup.indexOf('class="role-dates"') < roleMarkup.indexOf('class="role-title"') && roleMarkup.indexOf('class="role-title"') < roleMarkup.indexOf('<small>'), `${role.id}: date, title and organisation read in that order`);
      for (const id of role.relations.work) assert.ok(html.includes(`href="#/work/${get('work', id).slug}"`), `${role.id} -> ${id}`);
    }
    assert.doesNotMatch(shell(parseRoute('#/about')), /role-disclosure/);
    for (const role of all('experience')) assert.equal(parseRoute(hashFor(recordPath(role))).page, 'experience', role.id);
    // A CV download appears only once a file is attached.
    assert.doesNotMatch(html, /cv-download/);
    copy.production.cv.download = { file: 'livi-cv.pdf', label: 'Download CV (PDF)' };
    const withCv = shell(parseRoute('#/experience'));
    delete copy.production.cv.download;
    assert.match(withCv, /<a class="button" href="[^"]*content\/media\/livi-cv\.pdf" download="livi-cv\.pdf">Download CV \(PDF\)/);
  });
  check('the footer carries the sample note, a copyright line and a direct contact action, and the header the availability', () => {
    const content = shell(parseRoute('#/')), sound = shell(parseRoute('#/livicee'));
    for (const [html, dataset, label] of [[content, 'production', 'Email Livi'], [sound, 'sound', 'Booking enquiry']]) {
      const footer = html.match(/<footer\b[^>]*class="workspace-footer"[^>]*>(.*?)<\/footer>/s)?.[1];
      assert.ok(footer, `${dataset}: persistent footer`);
      assert.doesNotMatch(footer, /footer-brand|brand-name/, `${dataset}: the footer carries no second label for the practice`);
      assert.match(footer, new RegExp(`<span class="footer-copy">© ${new Date().getFullYear()} ${escape(site.author)}</span>`), `${dataset}: a quiet copyright line sits in the middle`);
      assert.match(footer, /class="footer-note"/);
      assert.ok(footer.includes(escape(site.footerNote)));
      const contact = footer.match(/<a\b(?=[^>]*class="[^"]*\bfooter-contact\b[^"]*")(?=[^>]*href="mailto:[^"]+")[^>]*>(.*?)<\/a>/s)?.[1];
      assert.ok(contact?.includes(label), `${dataset}: labelled mail contact`);
      assert.ok(footer.includes(`mailto:${site.email}`), `${dataset}: correct contact address`);
      assert.match(footer, /<button type="button" class="footer-copy-action" data-copy>.*?<span>Copy email<\/span><\/button>/s, `${dataset}: the address can be copied without opening a mail app`);
      assert.doesNotMatch(html, /class="(?:nav-status|nav-bottom|nav-count)"/);
    }
    assert.ok(content.includes(escape(site.identities.production.status)));
    assert.ok(sound.includes(escape(site.identities.sound.status)), 'Livicee shows its own availability line');
    // Where an identity has no status, its header says so with the copyright line instead of leaving a gap.
    const kept = site.identities.sound.status;
    site.identities.sound.status = '';
    try { assert.ok(shell(parseRoute('#/livicee')).includes(`© ${new Date().getFullYear()} ${escape(site.author)}`)); }
    finally { site.identities.sound.status = kept; }
  });
  check('persona identity, About content and secondary mode links agree', () => {
    const content = shell(parseRoute('#/about')), sound = shell(parseRoute('#/livicee/about'));
    assert.match(content, /data-dataset="production"/);
    assert.match(sound, /data-dataset="sound"/);
    assert.match(content, /<h1>About Livi\.<\/h1>/);
    assert.match(sound, /<h1>About Livicee\.<\/h1>/);
    assert.match(content, /Content operations, CMS, DAM and digital platforms/);
    assert.match(sound, /Livi Cracknell, behind the decks/);
    for (const [html, dataset] of [[content, 'production'], [sound, 'sound']]) {
      const header = html.match(/<header\b[^>]*class="topbar"[^>]*>(.*?)<\/header>/s)?.[1];
      assert.ok(header);
      const status = header.match(/^\s*<span class="header-status"[^>]*>(.*?)<\/span>/s);
      assert.ok(status, 'the availability line is first in the header');
      assert.equal(status[1], site.identities[dataset].status || `© ${new Date().getFullYear()} ${site.author}`, `${dataset}: availability, or copyright where there is none`);
      assert.equal((html.match(/data-global-search/g) ?? []).length, 1, 'one persistent search field');
      const navigation = html.match(/<nav\b[^>]*class="navigation"[^>]*>(.*?)<\/nav>/s)?.[1];
      assert.ok(navigation);
      assert.match(header, /<div class="mode-switch" role="group" aria-label="Choose identity">/);
      const modes = header.match(/<div class="mode-switch"[^>]*>(.*?)<\/div>/s)?.[1];
      assert.ok(modes);
      assert.equal((modes.match(/<button\b[^>]*data-mode=/g) ?? []).length, 2, 'both identities stay in the shared switch');
      for (const [identity, name] of [['production', 'Livi Cracknell'], ['sound', 'DJ Livicee']]) {
        assert.equal(site.identities[identity].switchLabel, name);
        assert.match(modes, new RegExp(`<button data-mode="${identity}" aria-label="${name}"[^>]*><span>${name}</span></button>`), 'visible and accessible identity names agree');
      }
      assert.equal((html.match(/class="mode-switch"/g) ?? []).length, 1, 'one persistent switch serves both desktop and phone');
      assert.match(navigation, /^\s*<div class="nav-links">/, 'the rail starts with site destinations');
      assert.doesNotMatch(navigation, /class="mode-switch"/, 'identity controls stay in the masthead');
      assert.ok(header.indexOf('class="header-status"') < header.indexOf('class="mode-switch"') && header.indexOf('class="mode-switch"') < header.indexOf('class="global-search"'), 'availability, identity and search keep a predictable DOM order');
      assert.match(header, /data-global-search/, 'search remains in the header');
      assert.doesNotMatch(html, /class="(?:mobile-brand|identity-caption)"/);
      assert.match(html, /<figure\b[^>]*class="identity-field"[^>]*aria-label="[^"]+"/);
    }
    assert.match(content, /<button data-mode="production"[^>]*aria-label="Livi Cracknell"/);
    assert.match(sound, /<button data-mode="sound"[^>]*aria-label="DJ Livicee"/);
    assert.match(content, /data-global-search[^>]*placeholder="Search projects"/);
    assert.match(sound, /data-global-search[^>]*placeholder="Search mixes"/);
    assert.doesNotMatch(content, /<kbd>/);
    for (const path of ['/', '/about', '/livicee', '/livicee/about']) {
      const route = parseRoute(`#${path}`), target = route.dataset === 'sound' ? 'production' : 'sound';
      const html = shell(route);
      if (route.page === "about") assert.doesNotMatch(html, /mode-gateway/, "the header switch is the only way across; About repeats no gateway");
      assert.match(html, new RegExp(`<button[^>]*data-mode="${route.dataset}"[^>]*aria-pressed="true"`));
      assert.match(html, new RegExp(`<button[^>]*data-mode="${target}"[^>]*aria-pressed="false"`));
    }
  });
  check('record breadcrumbs expose a useful collection or parent route', () => {
    for (const [path, parent] of [
      ['#/work/dam-migration', '#/work'],
      ['#/work/dam-migration/artefacts/asset-model', '#/work/dam-migration'],
      ['#/livicee/mixes/first-light', '#/livicee/mixes'],
    ]) {
      const html = shell(parseRoute(path));
      const crumbs = html.match(/<nav\b(?=[^>]*class="breadcrumb")(?=[^>]*aria-label="Page location")[^>]*>(.*?)<\/nav>/s)?.[1];
      assert.ok(crumbs?.includes(`href="${parent}"`), `${path}: usable parent link`);
      assert.match(html, /<main\b(?=[^>]*id="view")[^>]*>\s*<nav class="breadcrumb"/, `${path}: path starts the native reading main`);
      const header = html.match(/<header\b[^>]*class="topbar"[^>]*>(.*?)<\/header>/s)?.[1];
      assert.doesNotMatch(header, /class="breadcrumb"/, `${path}: masthead stays free of record-specific path text`);
    }
    for (const path of ['#/', '#/about', '#/work', '#/livicee', '#/livicee/mixes']) {
      const crumbs = shell(parseRoute(path)).match(/<nav\b[^>]*class="breadcrumb"[^>]*>(.*?)<\/nav>/s)?.[1];
      assert.equal(crumbs, '', `${path}: no duplicate page label in the persistent breadcrumb slot`);
    }
  });
  check('overview counts describe the visible selection rather than the complete collection', () => {
    const content = shell(parseRoute('#/')), sound = shell(parseRoute('#/livicee'));
    assert.equal((content.match(/class="project-row"/g) ?? []).length, 3);
    assert.match(content, /class="section-heading"[\s\S]*?<h2>[^<]*<span class="count"[^>]*>3<\/span>/);
    assert.equal((sound.match(/class="set-mix"/g) ?? []).length, 5);
    assert.match(sound, /class="section-heading"[\s\S]*?<h2>[^<]*<span class="count"[^>]*>5<\/span>/);
    assert.equal((shell(parseRoute('#/work')).match(/class="overview-item"/g) ?? []).length, 10, 'the complete project collection remains available');
  });
  check('collections do not select a first record', () => {
    for (const path of ['/work', '/livicee/mixes', '/work/dam-migration/artefacts']) {
      const r = parseRoute(`#${path}`); assert.equal(r.page, 'collection', path); assert.equal(r.record, undefined);
    }
  });
  check('the agreed ten projects and five mixes have valid, unique public routes', () => {
    assert.equal(all('work').length, 10);
    assert.equal(all('mixes').length, 5);
    assert.equal(new Set(all('work').map(r => r.title)).size, 10);
    assert.equal(new Set(all('mixes').map(r => r.title)).size, 5);
    assert.equal(new Set(records.map(r => `${r.collection}/${r.id}`)).size, records.length);
    for (const r of records.filter(r => r.collection !== 'experience')) { const route = parseRoute(hashFor(recordPath(r))); assert.equal(route.page, 'record', r.id); assert.equal(route.record.id, r.id); }
  });
  check('all relationships resolve within the specified collection', () => {
    for (const r of records) for (const [collection, ids] of Object.entries(r.relations)) for (const id of ids) assert.ok(get(collection, id), `${r.id} -> ${collection}/${id}`);
  });
  check('each project has a visible description, one contribution block and connected evidence', () => {
    for (const r of all('work')) {
      assert.ok(r.summary.trim(), r.id);
      assert.ok(r.relations.artefacts.length, r.id);
      assert.equal(r.relations.capabilities, undefined, r.id);
      assert.equal(r.story.length, 1, r.id);
      assert.equal(r.story[0].label, 'Contribution', r.id);
      assert.ok(r.story[0].body.trim(), r.id);
      const html = shell(parseRoute(hashFor(recordPath(r))));
      const heading = html.match(/<div class="record-heading">(.*?)<\/div>/s)?.[1];
      assert.ok(heading?.includes(`<h1>${escape(r.title)}</h1>`), r.id);
      assert.ok(heading?.includes(escape(r.summary)), r.id);
      assert.ok(!heading?.includes('<details'), r.id);
      for (const id of r.relations.artefacts) {
        const evidence = get('artefacts', id);
        assert.ok(evidence.evidence?.rows.length, `${r.id} -> ${id}`);
        assert.ok(evidence.relations.work.includes(r.id), `${id} -> ${r.id}`);
      }
    }
  });
  check('review content does not invent metrics, chronology or recordings', () => {
    for (const r of records) {
      assert.equal(r.sample, true, r.id);
      assert.equal(r.year, 'To confirm', r.id);
      assert.ok(!r.metrics?.length, r.id);
      assert.equal(r.audio, undefined, r.id);
    }
    for (const path of ['/', '/livicee', '/experience', ...records.map(recordPath)]) {
      const html = shell(parseRoute(hashFor(path)));
      assert.match(html, /[Ss]ample|[Rr]eview example|[Pp]rovisional/, path);
      const visibleText = html.replace(/<[^>]*>/g, ' ');
      assert.doesNotMatch(visibleText, /\b40\s*%|\b12\s*k\b|less search time|assets organised|ILLUSTRATIVE OUTCOMES/i, path);
    }
  });
  check('project evidence is scoped to the originating project', () => {
    const r = parseRoute('#/work/dam-migration/artefacts'); assert.equal(r.page, 'collection'); assert.equal(listRecords(r).length, 3);
    assert.equal(parseRoute('#/work/dam-migration/artefacts/editor-guide').page, 'not-found');
    assert.equal(parseRoute('#/work/shared-language/artefacts/governance-matrix').project.id, 'shared-language');
    assert.match(shell(parseRoute('#/work/shared-language/artefacts')), /href="#\/work\/shared-language\/artefacts\/governance-matrix"/);
    const project = shell(parseRoute('#/work/shared-language'));
    const preview = project.match(/<a\b[^>]*class="evidence-preview-link"[^>]*>/)?.[0];
    assert.ok(preview, 'The shared evidence has an actionable preview');
    assert.match(preview, /href="#\/work\/shared-language\/artefacts\/governance-matrix"/);
    assert.doesNotMatch(preview, /dam-migration/);
  });
  check('missing and malformed paths return not-found', () => {
    for (const path of ['/does-not-exist', '/work/no-such-project', '/work/%E0%A4%A', '/livicee/unknown', '/work/dam-migration/extra', '/work/dam-migration/artefacts/asset-model/extra']) assert.equal(parseRoute(`#${path}`).page, 'not-found', path);
  });
  check('evidence always opens inside a project that uses it, whatever the address', () => {
    for (const hash of ['#/artefacts/asset-model', '#/production/artefact/art-dam-schema']) {
      const route = parseRoute(hash);
      assert.equal(route.project?.id, 'dam-migration', hash);
      assert.equal(route.path, '/work/dam-migration/artefacts/asset-model', hash);
    }
    // Aliases resolve to the address the site uses, which the app writes back into the address bar.
    assert.equal(canonicalHash(parseRoute('#/work/proj-dam-migration')), '#/work/dam-migration');
    assert.equal(canonicalHash(parseRoute('#/work/?capability=cms')), '#/work');
    assert.equal(canonicalHash(parseRoute('#/work/no-such-project')), undefined);
  });
  check('legacy links resolve without selecting an unrelated record', () => {
    assert.equal(parseRoute('#/production/caseStudy/proj-dam-migration').record.id, 'dam-migration');
    assert.equal(parseRoute('#/sound/mix/mix-01').record.id, 'after-hours');
    assert.equal(parseRoute('#/production/siteHome/home-content').page, 'home');
    assert.equal(parseRoute('#/production/caseStudy/unknown').page, 'not-found');
    assert.equal(parseRoute('#/sound/locationRecord/loc-nyc').page, 'collection');
    assert.equal(parseRoute('#/production/platform/plat-bynder').path, '/work');
    assert.equal(parseRoute('#/livicee/mixes/mix-04').record.id, 'soft-focus');
  });
  check('about and contact retain the dataset', () => {
    for (const page of ['about', 'contact']) { assert.equal(parseRoute(`#/livicee/${page}`).dataset, 'sound'); assert.equal(parseRoute(`#/${page}`).dataset, 'production'); }
  });
  check('search finds project copy and related evidence without retired categories', () => {
    const ids = path => results(parseRoute(path)).map(r => r.id);
    assert.deepEqual(ids('#/work?q=ASSET+LIBRARY+MIGRATION'), ids('#/work?q=asset+library+migration'));
    assert.deepEqual(ids('#/work?q=asset+library+migration'), ['dam-migration']);
    assert.ok(ids('#/work?q=ownership').includes('dam-migration'));
    assert.equal(all('capabilities').length + all('platforms').length + all('events').length + all('locations').length, 0);
  });
  check('OR within mix styles and AND across style and year', () => {
    const fixtures = [{...get('mixes','after-hours'),year:'2001'}, {...get('mixes','open-air'),year:'2002'}, {...get('mixes','night-shift'),year:'2002'}];
    const q = new URLSearchParams('style=Deep+house&style=House&year=2002');
    assert.deepEqual(fixtures.filter(r => matches(r,q)).map(r=>r.id), ['open-air']);
  });
  check('mix search and style filters survive record navigation', () => {
    const address = '#/livicee/mixes?q=selection&style=House';
    const route = parseRoute(address);
    assert.deepEqual(results(route).map(r => r.id), ['open-air']);
    assert.equal(hashFor(route.path, route.query), address);
    assert.ok(shell(route).includes('href="' + escape(hashFor(recordPath(get('mixes','open-air')),route.query)) + '"'));
  });
  check('only useful filters remain and retired collection links redirect', () => {
    assert.deepEqual(results(parseRoute('#/livicee/mixes?style=Ambient')).map(r => r.id), ['first-light']);
    assert.deepEqual(facetsFor(parseRoute('#/livicee/mixes')).map(f=>f.key), ['style']);
    assert.deepEqual(facetsFor(parseRoute('#/work')).map(f => f.key), ['tag']);
    assert.equal(parseRoute('#/work?capability=taxonomy&platform=headless-cms').query.size, 0);
    assert.equal(parseRoute('#/livicee/mixes?location=brisbane').query.size, 0);
    for (const path of ['/capabilities','/platforms/asset-manager']) assert.equal(parseRoute('#'+path).path,'/work');
    for (const path of ['/livicee/events','/livicee/locations/brisbane']) assert.equal(parseRoute('#'+path).path,'/livicee/mixes');
    // Each retired category opens the list it folded into, and only under its own identity.
    assert.equal(parseRoute('#/capabilities').collection, 'work');
    assert.equal(parseRoute('#/livicee/events').collection, 'mixes');
    assert.equal(parseRoute('#/sound/eventBrand/evt-01').path, '/livicee/mixes');
    for (const path of ['/events', '/livicee/capabilities']) assert.equal(parseRoute('#'+path).page, 'not-found', path);
    assert.equal(parseRoute('#/experience').path,'/experience');
    assert.equal(parseRoute('#/experience/content-operations').path,'/experience');
    for (const path of ['/', '/work', '/livicee', '/livicee/mixes', '/work/dam-migration']) {
      const html = shell(parseRoute('#'+path));
      assert.doesNotMatch(html, new RegExp('class="collection-tabs"|class="structure-links"|href="#/(capabilities|platforms|livicee/events|livicee/locations)'));
    }
  });
  check('filtering replaces only the filters: the search, the order and the Model view stay', () => {
    const query = new URLSearchParams('q=selection&order=night&style=House&view=model');
    assert.equal(withFacets(query, 'mixes', [['style', 'Ambient'], ['style', 'Deep house']]).toString(), 'q=selection&order=night&view=model&style=Ambient&style=Deep+house');
    assert.equal(withFacets(query, 'mixes', []).toString(), 'q=selection&order=night&view=model');
    assert.equal(withFacets(new URLSearchParams('tag=CMS'), 'work', [['tag', 'DAM']]).toString(), 'tag=DAM');
  });
  check('zero results are an explicit recoverable state', () => {
    const r = parseRoute('#/work?q=zzzz-no-match'); assert.equal(results(r).length, 0); assert.match(shell(r), /No matches./); assert.match(shell(r), /data-clear/);
  });
  check('missing recordings never display a pretend player', () => {
    for (const mix of all('mixes')) { const html = audioPlayer(mix); assert.match(html, /Recording not supplied/); assert.doesNotMatch(html, /<audio/); }
  });
  check('supplied recordings use native controls without autoplay', () => {
    for (const src of ['./recording.wav', '/assets/recording.mp3', 'https://media.example.test/mix.mp3']) {
      const html = audioPlayer({ ...all('mixes')[0], audio: { kind: 'file', src } });
      assert.match(html, /<audio controls preload="none"/); assert.doesNotMatch(html, /autoplay/); assert.match(html, /audio-error/);
    }
    assert.doesNotMatch(audioPlayer({ ...all('mixes')[0], audio: { kind: 'file', src: 'javascript:alert(1)' } }), /<audio/);
  });
  check('capabilities are evidence-backed queries: each opens exactly the projects that prove it', () => {
    const facet = facetsFor(parseRoute('#/work')).find(f => f.key === 'tag');
    for (const option of facet.options) {
      const proving = all('work').filter(p => p.tags.includes(option.value)).map(p => p.id).sort();
      assert.equal(option.count, proving.length, option.value);
      assert.deepEqual(results(parseRoute(hashFor('/work', new URLSearchParams([['tag', option.value]])))).map(r => r.id).sort(), proving, option.value);
    }
    assert.ok(facet.options.every((o, i, list) => !i || list[i - 1].count >= o.count), 'most-proven capabilities lead');
    // Each project lists its own capabilities, linking to the projects that prove them.
    const project = get('work', 'dam-migration'), page = shell(parseRoute('#/work/dam-migration'));
    for (const tag of project.tags) assert.ok(page.includes(`href="${escape(hashFor('/work', new URLSearchParams([['tag', tag]])))}"`), tag);
    // One native filter surface retains all capabilities and their checked state.
    const overview = shell(parseRoute('#/work')), governance = shell(parseRoute('#/work?tag=Governance'));
    const options = filters(parseRoute('#/work?tag=Governance'));
    assert.match(overview, /data-filters aria-label="Filter Projects"/);
    assert.doesNotMatch(overview, /data-query="#\/work/);
    assert.match(options, /name="tag" value="Governance" checked/);
    assert.match(options, /name="tag" value="Audit"/);
    assert.match(governance, /id="result-status" aria-live="polite">4 projects</);
  });
  check('the crate numbers every mix and fills only its own stretch of the night, drawn rather than typed', () => {
    const html = shell(parseRoute('#/livicee/mixes'));
    const rows = [...html.matchAll(/<li data-key="([^"]+)"><a class="crate-row"[^>]*><span class="crate-no" aria-hidden="true">(\d\d)<\/span>/g)].map(m => [m[1], m[2]]);
    assert.deepEqual(rows, all('mixes').map((m, i) => [m.id, String(i + 1).padStart(2, '0')]));
    for (const mix of all('mixes')) {
      assert.ok(NIGHT.some(p => p.id === mix.night), `${mix.id} has a place in the night`);
      const lit = nightChart(mix.night).match(/<path class="night-lit" d="([^"]+)"/)[1];
      const xs = [...lit.matchAll(/[ML]([\d.]+) /g)].map(m => Number(m[1]));
      const [from, to] = phaseSpan(mix.night);
      assert.deepEqual([Math.min(...xs), Math.max(...xs)], [from * 1000, to * 1000], mix.id);
    }
    assert.doesNotMatch(nightChart(undefined), /night-lit/);
    // No text art anywhere in the crate: its lanes are vector drawings with no characters in them.
    assert.doesNotMatch(html, /class="glyphs|class="g-/);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ' '), /[.:;i1tfx08#@]{8,}/);
    // No mix has a measured length yet, so none shows one.
    assert.equal((html.match(/<span class="crate-time"><span aria-hidden="true">--:--<\/span><\/span>/g) ?? []).length, all('mixes').length);
    assert.doesNotMatch(html, /class="overview-item/);
    const mix = get('mixes', 'night-shift');
    mix.audio = { kind: 'file', src: 'https://cdn.test/mix.mp3', duration: 4331.6 };
    const measured = shell(parseRoute('#/livicee/mixes'));
    delete mix.audio;
    assert.match(measured, /<span class="crate-time"><span class="visually-hidden">Length <\/span>1:12:11<\/span>/);
    assert.equal(formatLength(754.4), '12:34');
  });
  check('the crate orders through the night in place, keeping numbers, filters and the clear control honest', () => {
    const ids = hash => results(parseRoute(hash)).map(r => r.id);
    assert.deepEqual(ids('#/livicee/mixes?order=night'), ['first-light', 'open-air', 'after-hours', 'night-shift', 'soft-focus']);
    assert.deepEqual(ids('#/livicee/mixes?order=night&style=House&style=Electronic'), ['open-air', 'night-shift']);
    assert.deepEqual(ids('#/work?order=night'), ids('#/work'));
    const html = shell(parseRoute('#/livicee/mixes?order=night'));
    assert.match(html, /<li data-key="first-light"><a class="crate-row" href="#\/livicee\/mixes\/first-light\?order=night"><span class="crate-no" aria-hidden="true">05<\/span>/);
    assert.match(html, /data-query="#\/livicee\/mixes" data-reorder aria-pressed="false">As listed/);
    assert.match(html, /data-query="#\/livicee\/mixes\?order=night" data-reorder aria-pressed="true">Through the night/);
    assert.doesNotMatch(html, /data-clear aria-label="Clear search and filters">Clear/);
    assert.match(shell(parseRoute('#/livicee/mixes?order=night&style=House')), /data-clear aria-label="Clear search and filters">Clear/);
    // The record page's index keeps the night order, and its previous and next follow it.
    const record = shell(parseRoute('#/livicee/mixes/after-hours?order=night'));
    assert.match(record, /<small>Previous<\/small>Open air/);
    assert.match(record, /<small>Next<\/small>Night shift/);
  });
  check('the deck draws a waveform only from measured peaks, and every mix page places the mix in the night', () => {
    const mix = all('mixes')[0];
    const peaks = Array.from({ length: 240 }, (_, i) => Math.round(Math.abs(Math.sin(i / 9)) * 1000) / 1000);
    const measured = audioPlayer({ ...mix, audio: { kind: 'file', src: 'media/mix.mp3', peaks, duration: 185.8 } });
    assert.match(measured, /class="deck-wave has-peaks" data-deck-wave data-duration="185.8"/);
    assert.equal((measured.match(/<svg class="wave-svg /g) ?? []).length, 2, 'the waveform and its pink, played copy');
    assert.equal((measured.match(/<svg class="wave-svg wave-dim"[^>]*><path d="([^"]+)"/)[1].match(/M/g) ?? []).length, 96, 'one bar per slice of the measured peaks');
    assert.match(measured, /class="deck-playhead"/);
    assert.match(measured, /<span data-deck-now>0:00<\/span> \/ 3:05/);
    assert.match(measured, /<audio controls preload="none"/);
    // A file with no measurements and a missing recording get the empty deck: no shape is invented.
    for (const audio of [{ kind: 'file', src: 'media/mix.mp3' }, undefined]) {
      const html = audioPlayer({ ...mix, audio });
      assert.doesNotMatch(html, /wave-svg|has-peaks|deck-played|deck-playhead/, audio?.kind ?? 'none');
      assert.match(html, /<span class="deck-flat" aria-hidden="true"><\/span>/, audio?.kind ?? 'none');
    }
    // A SoundCloud set offers a play control for the persistent player and its page, with its reported length; still no frame or invented shape.
    const linked = audioPlayer({ ...mix, audio: { kind: 'embed', ...mixEmbed('https://soundcloud.com/forss/flickermood'), duration: 185.8 } });
    assert.match(linked, new RegExp(`data-play="${mix.id}"`));
    assert.match(linked, /href="https:\/\/soundcloud\.com\/forss\/flickermood"/);
    assert.match(linked, /<span class="deck-time">3:05<\/span>/);
    assert.doesNotMatch(linked, /<iframe|wave-svg|data-load-embed/);
    const mixcloud = audioPlayer({ ...mix, audio: { kind: 'embed', ...mixEmbed('https://www.mixcloud.com/livicee/mix/') } });
    assert.match(mixcloud, /data-load-embed/);
    assert.doesNotMatch(mixcloud, /data-play=/);
    for (const m of all('mixes')) {
      const page = shell(parseRoute(hashFor(recordPath(m))));
      assert.match(page, /<section class="night-place" aria-label="Place in the night">/, m.id);
      assert.match(page, new RegExp(`<span class="is-here">${NIGHT.find(p => p.id === m.night).label}</span>`), m.id);
      assert.ok(page.indexOf('class="deck') < page.indexOf('class="night-place"') && page.indexOf('class="night-place"') < page.indexOf('class="story"'), m.id);
    }
  });
  check('Livicee Overview lays every mix across one night, each column linking its mix and its stretch', () => {
    const html = shell(parseRoute('#/livicee'));
    const links = [...html.matchAll(/<a class="set-mix" data-phase="([a-z]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]);
    const byNight = [...all('mixes')].sort((a, b) => NIGHT.findIndex(p => p.id === a.night) - NIGHT.findIndex(p => p.id === b.night));
    assert.deepEqual(links, byNight.map(m => [m.night, hashFor(recordPath(m))]));
    for (const mix of all('mixes')) assert.match(html, new RegExp(`<path class="night-lit" data-phase="${mix.night}"`), mix.id);
    // Each link names its stretch for screen readers; the chart itself is decorative.
    assert.match(html, /<span class="visually-hidden">Peak: <\/span><strong>Night shift<\/strong>/);
    assert.match(html, /<svg class="night-svg set-chart"[^>]*aria-hidden="true"/);
    // Content's Overview keeps its project rows.
    assert.doesNotMatch(shell(parseRoute('#/')), /night-set/);
    // A mix with no place in the night still appears, as a row after the chart.
    const mix = get('mixes', 'soft-focus'), night = mix.night;
    delete mix.night;
    const partial = shell(parseRoute('#/livicee'));
    mix.night = night;
    assert.doesNotMatch(partial, /data-phase="winddown" href/);
    assert.match(partial, /class="project-row" href="#\/livicee\/mixes\/soft-focus"/);
  });
  check('records carry a document header and can be inspected as their content model, in place', () => {
    const project = get('work', 'dam-migration');
    const page = shell(parseRoute('#/work/dam-migration'));
    assert.match(page, /<p class="doc-meta"><span class="doc-type">Project<\/span> <span>3 evidence<\/span> <span>1 role<\/span><\/p>/);
    assert.doesNotMatch(page, /doc-status|sample-note/, "records carry no sample status or disclaimer");
    assert.match(shell(parseRoute('#/work/dam-migration/artefacts/governance-matrix')), /<span class="doc-type">Evidence<\/span> <span>Governance<\/span> <span>used in 2 projects<\/span>/);
    assert.match(page, /data-query="#\/work\/dam-migration" data-flip aria-pressed="true">Document/);
    assert.match(page, /data-query="#\/work\/dam-migration\?view=model" data-flip aria-pressed="false">Model/);
    assert.doesNotMatch(page, /class="model-view"/);
    // Mixes are for listening: no Document/Model toggle, and an old ?view=model address still shows the page.
    const mixPage = shell(parseRoute('#/livicee/mixes/after-hours?view=model'));
    assert.doesNotMatch(mixPage, /data-flip|class="model-view"/);
    assert.match(mixPage, /class="record-document">/);
    // Only view=model survives, and it follows the visitor between records without counting as a filter.
    assert.equal(parseRoute('#/work/dam-migration?view=json').query.size, 0);
    const route = parseRoute('#/work/dam-migration?view=model');
    const model = shell(route);
    assert.match(model, /<section class="model-view" aria-label="Content model">/);
    // The document stays, hidden, so what it holds (a playing mix, a loaded player) is still there on the way back.
    assert.match(model, /<div class="record-document" hidden>/);
    assert.match(page, /<div class="record-document">/);
    assert.doesNotMatch(model, /data-clear aria-label="Clear search and filters">Clear/);
    for (const field of ['_type', '_id', 'title', 'subtitle', 'summary', 'year', 'tags', 'facts', 'story', 'evidence', 'roles', 'sample']) assert.match(model, new RegExp(`<th scope="row"><code>${field}</code>`), field);
    for (const id of project.relations.artefacts) assert.match(model, new RegExp(`class="query-chip model-ref" href="#/work/dam-migration/artefacts/${id}"`), id);
    assert.match(model, /<small>Next<\/small>Reusable content model/);
    assert.match(model, /href="#\/work\/structured-content\?view=model"/);
  });
  check('only measured peaks, real lengths and a known place in the night survive loading', () => {
    const base = { collection: 'mixes', id: 'x', slug: 'x', title: 'X', subtitle: '', summary: '', year: 'To confirm', tags: [], sample: true, facts: [], relations: {} };
    assert.equal(hydrate({ ...base, night: 'midnight' }).night, undefined);
    assert.equal(hydrate({ ...base, night: 'peak' }).night, 'peak');
    const withFile = audio => hydrate({ ...base, audio: { file: 'mix.mp3', ...audio } }).audio;
    const kept = withFile({ peaks: Array(64).fill(.5), duration: 60 });
    assert.equal(kept.kind, 'file'); assert.equal(kept.peaks.length, 64); assert.equal(kept.duration, 60);
    for (const peaks of [Array(8).fill(.5), [...Array(63).fill(.5), 1.5], [...Array(63).fill(.5), '1'], 'loud']) assert.equal(withFile({ peaks }).peaks, undefined);
    for (const duration of [-5, 0, Infinity, '60']) assert.equal(withFile({ duration }).duration, undefined);
    // Peaks never attach to a link: only a file can be measured.
    assert.equal(hydrate({ ...base, audio: { link: 'https://soundcloud.com/forss/flickermood', peaks: Array(64).fill(.5) } }).audio.peaks, undefined);
  });
  check('mix artwork shows on the mix and as a decorative list thumbnail, only when attached', () => {
    const mix = get('mixes', 'after-hours');
    assert.equal(mix.artwork, undefined);
    assert.doesNotMatch(shell(parseRoute('#/livicee/mixes/after-hours')) + shell(parseRoute('#/livicee/mixes')), /<img/);
    mix.artwork = { src: 'https://cdn.test/a"b.jpg', alt: 'Cover <art>' };
    const detail = shell(parseRoute('#/livicee/mixes/after-hours')), list = shell(parseRoute('#/livicee/mixes'));
    delete mix.artwork;
    assert.match(detail, /<figure class="mix-cover"><img src="https:\/\/cdn.test\/a&quot;b.jpg" alt="Cover &lt;art&gt;"/);
    assert.match(list, /class="crate-row has-art"[^>]*>(?:(?!<\/a>).)*<img class="record-thumb" src="https:\/\/cdn.test\/a&quot;b.jpg" alt=""/s);
    assert.equal((list.match(/<img/g) ?? []).length, 1);
  });
  check('mix links become SoundCloud play controls and click-to-load Mixcloud players; anything else is ignored', () => {
    const sc = mixEmbed('https://soundcloud.com/forss/flickermood');
    assert.equal(sc.provider, 'SoundCloud');
    assert.ok(sc.player.startsWith('https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood'));
    assert.match(sc.player, /auto_play=false/);
    const mc = mixEmbed('https://www.mixcloud.com/spartacus/party-time/');
    assert.equal(mc.provider, 'Mixcloud');
    assert.equal(mc.player, 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=%2Fspartacus%2Fparty-time%2F');
    assert.equal(mixEmbed(' https://soundcloud.com/forss/sets/demo ').provider, 'SoundCloud');
    for (const bad of ['http://soundcloud.com/forss/flickermood', 'https://soundcloud.com.evil.test/forss/flickermood', 'https://evil.test/soundcloud.com/forss', 'https://user:pw@soundcloud.com/forss/flickermood', 'https://soundcloud.com:8443/forss/flickermood', 'https://soundcloud.com/', 'https://soundcloud.com/forss', 'https://soundcloud.com/forss/%3Cscript%3E', 'https://www.mixcloud.com/spartacus/', 'javascript:alert(1)', 'soundcloud.com/forss/flickermood'])
      assert.equal(mixEmbed(bad), null, bad);
    const html = audioPlayer({ ...all('mixes')[0], audio: { kind: 'embed', ...sc } });
    assert.match(html, /data-play="/);
    assert.match(html, /href="https:\/\/soundcloud.com\/forss\/flickermood" target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(html, /<iframe|autoplay|auto_play=true/);
    assert.doesNotMatch(audioPlayer({ ...all('mixes')[0], audio: { kind: 'embed', ...sc, player: 'https://evil.test/player' } }), /data-embed=/);
  });
  check('content text reaches the page escaped, wherever it lands', () => {
    // Every field an editor can type into that the shell prints, set to markup that would break out if unescaped.
    const hostile = `<b>"&'`;
    const saved = structuredClone({ site, copy });
    site.email = hostile; site.identities.production.workLabel = hostile; site.identities.production.cvLabel = hostile;
    for (const identity of ['production', 'sound']) { copy[identity].home.contactLink = hostile; copy[identity].about.workLink = hostile; copy[identity].contact.emailAction = hostile; }
    try {
      for (const path of ['/', '/about', '/contact', '/work/dam-migration', '/livicee', '/livicee/about', '/livicee/contact']) {
        const html = shell(parseRoute(hashFor(path)));
        assert.doesNotMatch(html, /<b>/, path);
        assert.ok(!html.includes(`"&'`), path);
      }
    } finally { Object.assign(site, saved.site); Object.assign(copy, saved.copy); }
  });
  check('every tab title names the page, then its identity once, as plain text', () => {
    for (const path of ['/', '/about', '/contact', '/work', '/experience', '/nope', '/livicee', '/livicee/about', '/livicee/contact', '/livicee/mixes', ...records.map(recordPath)]) {
      const route = parseRoute(hashFor(path)), identity = site.identities[route.dataset].name, title = pageTitle(route);
      assert.ok(title.endsWith(` · ${identity}`), `${path}: ${title}`);
      assert.equal(title.split(identity).length, 2, `${path}: ${title}`);
      assert.doesNotMatch(title, /[<>]/, path);
    }
    assert.equal(pageTitle(parseRoute('#/livicee')), 'Selected sound · Livicee');
    const cvTitle = copy.production.cv.title;
    copy.production.cv.title = 'Work<br>history.';
    try { assert.equal(pageTitle(parseRoute('#/experience')), 'Work history · Livi Cracknell'); } finally { copy.production.cv.title = cvTitle; }
  });
  check('contact uses the confirmed address and distinct subjects', () => {
    assert.match(shell(parseRoute('#/contact')), /mailto:livicracknell91@gmail.com\?subject=Content/);
    assert.match(shell(parseRoute('#/livicee/contact')), /subject=Livicee/);
  });
  check('Instagram is optional, restricted to its profile domain and shared by the DJ rail and Contact', () => {
    const saved = Object.fromEntries(['production', 'sound'].map(identity => [identity, {
      present: Object.hasOwn(site.identities[identity], 'instagram'), value: site.identities[identity].instagram,
    }]));
    const surfaces = () => {
      const html = shell(parseRoute('#/livicee/contact'));
      const rail = html.match(/<nav class="navigation"[^>]*>(.*?)<\/nav>/s)?.[1];
      const contact = html.match(/<div class="contact-actions">(.*?)<\/div>/s)?.[1];
      assert.ok(rail && contact, 'both profile surfaces render');
      return [rail, contact];
    };
    try {
      site.identities.production.instagram = 'https://instagram.com/livicee';
      for (const url of ['https://instagram.com/livicee', 'https://www.instagram.com/livicee']) {
        site.identities.sound.instagram = url;
        const [rail, contact] = surfaces();
        for (const markup of [rail, contact]) {
          const links = [...markup.matchAll(/<a\b[^>]*>.*?<\/a>/gs)].map(match => match[0]);
          const instagram = links.filter(link => link.includes(`href="${url}"`));
          assert.equal(instagram.length, 1, 'one Instagram destination per surface');
          assert.match(instagram[0], /target="_blank" rel="noopener noreferrer"/);
          assert.match(instagram[0], /Instagram/);
          assert.match(instagram[0], /opens in a new tab/);
        }
        assert.ok(rail.indexOf('class="rail-art"') < rail.indexOf(`href="${url}"`) && rail.indexOf(`href="${url}"`) < rail.indexOf('href="#/livicee/contact"'), 'profile links remain between rail art and Contact');
        assert.doesNotMatch(shell(parseRoute('#/contact')), /instagram\.com|>Instagram</, 'DJ Instagram never leaks into the professional identity');
      }
      for (const value of [undefined, '', 'http://instagram.com/livicee', 'ftp://instagram.com/livicee', 'javascript:alert(1)', 'https://evilinstagram.com/livicee', 'https://instagram.com.evil.test/livicee', 'https://evil.test/instagram.com/livicee', 'https://user:password@instagram.com/livicee']) {
        site.identities.sound.instagram = value;
        for (const markup of surfaces()) {
          assert.doesNotMatch(markup, /Instagram/, `missing or unsafe profile stays hidden: ${value}`);
          assert.match(markup, /SoundCloud/, 'the existing profile remains available');
        }
      }
    } finally {
      for (const identity of ['production', 'sound']) {
        if (saved[identity].present) site.identities[identity].instagram = saved[identity].value;
        else delete site.identities[identity].instagram;
      }
    }
  });
  check('all published screens have a main region and title', () => {
    for (const path of ['/', '/about', '/contact', '/work', '/experience', '/capabilities', '/platforms', '/livicee', '/livicee/about', '/livicee/contact', '/livicee/mixes', '/livicee/events', '/livicee/locations', ...records.map(recordPath)]) {
      const html = shell(parseRoute(hashFor(path))); assert.match(html, /id="main"/); assert.match(html, /<h1>/);
      assert.equal((html.match(/<main\b/g) ?? []).length, 1, `${path}: one native main landmark`);
      assert.match(html, /<main[^>]*id="view"[^>]*tabindex="0"[^>]*aria-label="Page content"/, `${path}: named reading scroll pane owns main`);
      assert.match(html, /<article id="main"[^>]*tabindex="-1"/, `${path}: retained skip/focus target`);
    }
  });
  check('route boundaries, decoding and malformed persona recovery', () => {
    assert.equal(parseRoute('#/work/%64am-migration').record.id, 'dam-migration');
    for (const path of ['/liviceevil/mixes', '/production/caseStudy/proj-dam-migration/garbage', '/production/toString', '/work/constructor']) assert.equal(parseRoute(`#${path}`).page, 'not-found', path);
    assert.equal(parseRoute('#/livicee/%E0%A4%A').dataset, 'sound');
    assert.equal(parseRoute('#/sound/%E0%A4%A').dataset, 'sound');
  });
  check('facet membership survives tag reordering and ignores unrelated keys', () => {
    const mix = all('mixes')[0];
    assert.ok(matches({ ...mix, tags: [...mix.tags].reverse() }, new URLSearchParams('style=Deep+house')));
    assert.equal(results(parseRoute('#/work?country=Australia&unknown=yes')).length, all('work').length);
    assert.ok(facetsFor(parseRoute('#/work?year=2099')).some(f => f.options.some(o => o.value === '2099')));
  });
  check('excluded record does not invent a next peer', () => {
    const html = shell(parseRoute('#/work/dam-migration?q=impossible-result'));
    const pagination = html.match(/<nav[^>]*aria-label="Browse records"[^>]*>(.*?)<\/nav>/s)?.[1];
    assert.ok(pagination !== undefined);
    assert.doesNotMatch(pagination, /<a\b/);
  });
  const [schemaSource, sheet] = await Promise.all(['../src/content/schema.ts', '../src/workspace/workspace.css'].map(p => readFile(new URL(p, import.meta.url), 'utf8')));
  check('validation covers the schema files, and reading pane arithmetic agrees', () => {
    const listed = (text, name) => {
      const open = text.indexOf('[', text.indexOf(name));
      return [...text.slice(open, text.indexOf(']', open)).matchAll(/'([a-z]+\.json)'/g)].map(m => m[1]).sort();
    };
    assert.deepEqual([...CONTENT_FILES].sort(), listed(schemaSource, 'export const contentFiles'));
    // readingEdge() in field.ts repeats the stylesheet's reading width; if these declarations change, it must too.
    for (const declaration of ['--composition-width: 1592px', '--reading-width-base: min(840px, (100vw - var(--nav)) * .56)', '--reading-width-base: min(740px, (100vw - var(--nav)) * .77)', '--reading-width-base: calc((100vw - var(--nav)) * .86)'])
      assert.ok(sheet.includes(declaration), declaration);
    assert.equal(readingEdge(1440, 192, 1592), 1248 * .56);
    assert.equal(readingEdge(1100, 192, 1592), 908 * .77, 'compact reading width follows the available space beside the wider rail');
    assert.equal(readingEdge(900, 192, 1592), 708 * .86);
  });
  check('content validation detects invalid fixtures', () => {
    validateRecords(records);
    assert.throws(() => validateRecords([...records, records[0]]), /Duplicate/);
    assert.throws(() => validateRecords([{ ...records[0], relations: { work: ['missing'] } }]), /relationship/);
    for (const [id, slug] of [['bad/id', 'ok'], ['ok', 'bad slug'], ['ok', 'Upper'], ['ok', 'a.b'], ['ok', 'a--b'], ['ok', '-a'], ['ok', 'a?b']])
      assert.throws(() => validateRecords([{ ...records[0], id, slug }]), /lowercase letters/, `${id} ${slug}`);
    assert.throws(() => validateRecords([{ ...records[0], relations: {}, evidence: { kind: 'table', title: 'Invalid', columns: ['one'], rows: [['one', 'two']] } }]), /width/);
  });
  check('view state is bounded and isolated', () => {
    const store = createViewState(2);
    store.set('a', { y: 1, index: 2, focus: null }); store.set('b', { y: 3, index: 4, focus: null });
    store.set('c', { y: 5, index: 6, focus: null });
    assert.equal(store.get('a'), undefined); assert.equal(store.get('b').index, 4); assert.equal(store.size, 2);
  });
  check('view restore is history-only and keyed by viewport', () => {
    assert.equal(shouldRestoreView('push'), false);
    assert.equal(shouldRestoreView('history'), true);
    assert.equal(viewportBucket(390), 'phone');
    assert.equal(viewportBucket(760), 'phone');
    assert.equal(viewportBucket(1024), 'compact');
    assert.equal(viewportBucket(1440), 'desktop');
    const store = createViewState();
    store.set(viewStateKey('#/work/dam-migration', 1440), { y: 589, index: 0, focus: 'main:#/work/x' });
    assert.equal(store.get(viewStateKey('#/work/dam-migration', 390)), undefined);
    assert.equal(store.get(viewStateKey('#/work/dam-migration', 1440)).y, 589);
  });
  check('filter controls name the current collection', () => {
    const evidence = shell(parseRoute('#/work/dam-migration/artefacts/asset-model'));
    assert.match(evidence, /aria-label="Filter Project evidence"/);
    assert.doesNotMatch(evidence, /aria-label="Filter Mixes"/);
    assert.match(shell(parseRoute('#/livicee/mixes')), /aria-label="Filter Mixes"/);
    assert.match(evidence, /id="result-status" aria-live="polite">3 records</);
    assert.doesNotMatch(evidence, /<h[12]>Project evidence<span class="count"/);
  });
  check('a matching record stays selected after a type filter', () => {
    const route = parseRoute('#/work/dam-migration/artefacts/asset-model');
    const keep = new URLSearchParams('type=Model');
    assert.ok(route.record && matches(route.record, keep));
    assert.equal(hashFor(contextPath(route.record, route), keep), '#/work/dam-migration/artefacts/asset-model?type=Model');
    const miss = new URLSearchParams('type=Workflow');
    assert.ok(route.record && !matches(route.record, miss));
  });
  check('audio plays relative files from its own src, with no ignored source markup', () => {
    const html = audioPlayer({ ...all('mixes')[0], audio: { kind: 'file', src: 'media/mix.mp3' } });
    assert.match(html, /<audio controls preload="none" src="media\/mix\.mp3">/);
    // A <source> child is ignored whenever <audio> has src, so none is written.
    assert.doesNotMatch(html, /<source|<audio[^>]* type=/);
    for (const src of ['//example.test/a.mp3', 'javascript:alert(1)', 'data:audio/wav;base64,AAAA']) assert.doesNotMatch(audioPlayer({ ...all('mixes')[0], audio: { kind: 'file', src } }), /<audio/);
  });
  const mediaGlobals = new Map(['Element', 'matchMedia'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    class MediaElement {
      listeners = new Map();
      addEventListener(type, callback, options = {}) {
        const listeners = this.listeners.get(type) ?? [];
        listeners.push({ callback, once: !!options.once }); this.listeners.set(type, listeners);
      }
      removeEventListener(type, callback) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item.callback !== callback));
      }
      emit(type, detail = {}) {
        for (const item of [...(this.listeners.get(type) ?? [])]) {
          if (item.once) this.removeEventListener(type, item.callback);
          item.callback({ type, ...detail });
        }
      }
    }
    globalThis.Element = MediaElement;
    globalThis.matchMedia = () => ({ matches: true });
    await compile('media');
    const { bindMediaEvents } = await import(pathToFileURL(join(temp, 'media.mjs')));
    check('waveform metadata seeks retry after failure, keep the latest click and release stale listeners', () => {
      const audio = new MediaElement(), wave = new MediaElement(), deck = new MediaElement();
      Object.assign(audio, { readyState: 0, duration: NaN, currentTime: 0, paused: true, error: null, loads: 0, load() { this.loads++; } });
      const message = { hidden: true }, now = { textContent: '' };
      wave.dataset = {}; wave.style = { setProperty() {} }; wave.closest = () => wave;
      wave.getBoundingClientRect = () => ({ left: 0, width: 132 });
      audio.parentElement = { querySelector: () => message };
      deck.querySelector = selector => ({ audio, '[data-deck-wave]': wave, '[data-deck-now]': now })[selector] ?? null;
      const root = { querySelectorAll: selector => ({ '[data-deck]': [deck], 'img[data-media]': [], audio: [audio] })[selector] };
      bindMediaEvents(root); bindMediaEvents(root);
      const click = ratio => deck.emit('click', { target: wave, clientX: 16 + ratio * 100 });
      const listenerCount = () => audio.listeners.get('loadedmetadata').length;
      const baselineListeners = listenerCount();
      click(.25); const oldListener = audio.listeners.get('loadedmetadata').at(-1).callback;
      assert.equal(audio.loads, 1);
      audio.error = { code: 2 }; audio.emit('error');
      assert.equal(message.hidden, false);
      assert.equal(listenerCount(), baselineListeners, 'a failed metadata request releases its seek listener');
      audio.error = null; click(.5); click(.75);
      assert.equal(audio.loads, 2, 'retry loads once; later pending clicks replace the ratio');
      oldListener();
      assert.equal(listenerCount(), baselineListeners + 1, 'a retired callback cannot consume the new request');
      audio.readyState = 1; audio.duration = 100; audio.emit('loadedmetadata');
      assert.equal(audio.currentTime, 75);
      assert.equal(message.hidden, true);
      assert.equal(listenerCount(), baselineListeners);
      audio.readyState = 0; click(.25);
      const stale = audio.listeners.get('loadedmetadata').at(-1).callback;
      audio.readyState = 1; click(.9); stale();
      assert.equal(audio.currentTime, 90, 'a direct ready-state seek cannot be overwritten by queued metadata');
      assert.equal(listenerCount(), baselineListeners);
      assert.equal(deck.listeners.get('click').length, 1, 'repeat binding does not duplicate waveform handlers');
    });
  } finally {
    for (const [key, descriptor] of mediaGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
  console.log(`\n${passed} contract checks passed.`);
} finally {
  // Delete only the exact test directory created above, inside the OS temp directory.
  assert.equal(dirname(resolve(temp)), resolve(tmpdir()));
  assert.ok(temp.split(/[\\/]/).at(-1).startsWith('livi-contract-tests-'));
  await rm(temp, { recursive: true });
}
