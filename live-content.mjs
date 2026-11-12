import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createWorkspaceCompiler } from './transpile.mjs';

const files = {
  'site.json': 'SiteContent', 'copy.json': 'CopyContent', 'notices.json': 'NoticesContent',
  'projects.json': 'StoredRecord[]', 'evidence.json': 'StoredRecord[]',
  'experience.json': 'StoredRecord[]', 'mixes.json': 'StoredRecord[]',
};

/** Validate editable content independently of the frozen review examples used by behavior tests. */
export async function verifyLiveContent(directory) {
  await mkdir(directory, { recursive: true });
  const data = {};
  for (const file of Object.keys(files)) data[file] = JSON.parse(await readFile(new URL('../src/content/' + file, import.meta.url), 'utf8'));
  const schema = fileURLToPath(new URL('../src/content/schema.ts', import.meta.url)).replaceAll('\\', '/');
  const typed = join(directory, 'content-shape.ts');
  await writeFile(typed, `import type { SiteContent, CopyContent, NoticesContent, StoredRecord } from ${JSON.stringify(schema)};\n`
    + Object.entries(files).map(([file, type], index) => `const content${index}: ${type} = ${JSON.stringify(data[file])};`).join('\n'));
  const program = ts.createProgram([typed, fileURLToPath(new URL('../src/vite-env.d.ts', import.meta.url))], {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true, skipLibCheck: true, resolveJsonModule: true, allowSyntheticDefaultImports: true,
    allowImportingTsExtensions: true, noEmit: true,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => directory, getCanonicalFileName: file => file, getNewLine: () => '\n',
  }));

  const compile = createWorkspaceCompiler(import.meta.url, directory, { devMediaUrls: true });
  for (const name of ['content', 'routes', 'views', 'validation', 'seo']) await compile(name);
  const content = await import(pathToFileURL(join(directory, 'content.mjs')));
  const { parseRoute, hashFor } = await import(pathToFileURL(join(directory, 'routes.mjs')));
  const { shell, audioPlayer, pageTitle } = await import(pathToFileURL(join(directory, 'views.mjs')));
  const { validateRecords } = await import(pathToFileURL(join(directory, 'validation.mjs')));
  const { mixEmbed } = await import(pathToFileURL(join(directory, 'embeds.mjs')));
  const { escape } = await import(pathToFileURL(join(directory, 'html.mjs')));
  validateRecords(content.records);
  const { routeSeo, updateSeo } = await import(pathToFileURL(join(directory, 'seo.mjs')));
  assert.equal(routeSeo(parseRoute('#/')).canonical, 'https://www.livicracknell.com/');
  assert.notEqual(routeSeo(parseRoute('#/')).title, routeSeo(parseRoute('#/livicee')).title);
  const djHtml = shell(parseRoute('#/livicee/about'));
  assert.match(djHtml, /dj-city-board/);
  assert.match(djHtml, /dj-brand-wall/);
  assert.doesNotMatch(djHtml, /data-dj-setup/);
  assert.doesNotMatch(shell(parseRoute('#/about')), /dj-brand-wall/);
  const newMix = parseRoute('#/livicee/mixes/house-edits-oct-2026');
  assert.equal(newMix.page, 'record');
  assert.match(routeSeo(newMix).description, /Janet Jackson/);
  assert.match(audioPlayer(newMix.record), /data-play/);
  const tags = new Map();
  const previousDocument = globalThis.document;
  globalThis.document = {
    title: '',
    head: { querySelector: selector => tags.get(selector), append: element => {
      const selector = element.rel ? `link[rel="${element.rel}"]` : `meta[${element.attribute}="${element.key}"]`;
      tags.set(selector, element);
    } },
    createElement: () => ({ setAttribute(attribute, key) { this.attribute = attribute; this.key = key; } }),
  };
  try {
    updateSeo(parseRoute('#/livicee/about'));
    assert.match(document.title, /About DJ Livicee/);
    assert.match(tags.get('meta[name="description"]').content, /Printworks/);
    updateSeo(parseRoute('#/'));
    assert.equal(tags.get('meta[name="description"]').content, content.site.searchDescription);
    assert.equal(tags.get('link[rel="canonical"]').href, content.site.siteUrl);
    assert.equal(tags.size, 8, 'navigation updates tags without duplicating them');
  } finally { globalThis.document = previousDocument; }


  async function attachedFile(file) {
    if (!file) return;
    assert.equal(file, basename(file), `Attachment must be a stored filename: ${file}`);
    assert.ok(!file.includes('\\') && file.trim() === file, `Invalid attachment filename: ${file}`);
    assert.ok((await stat(new URL('../src/content/media/' + encodeURIComponent(file), import.meta.url))).isFile(), `Missing attachment: ${file}`);
  }
  const stored = ['projects.json', 'evidence.json', 'experience.json', 'mixes.json'].flatMap(file => data[file]);
  for (const record of stored) {
    await attachedFile(record.audio?.file); await attachedFile(record.artwork?.file);
    const hydrated = content.get(record.collection, record.id);
    assert.ok(hydrated, `Live record is retained: ${record.id}`);
    assert.equal(hydrated.sample, record.sample);
    assert.equal(hydrated.year, record.year);
    if (record.audio?.file) {
      assert.equal(hydrated.audio?.kind, 'file', record.id);
      assert.match(audioPlayer(hydrated), /<audio controls preload="none"/);
      assert.doesNotMatch(audioPlayer(hydrated), /autoplay/);
    } else if (record.audio?.link && mixEmbed(record.audio.link)) {
      assert.equal(hydrated.audio?.kind, 'embed', record.id);
      // SoundCloud sets play in the persistent bar; other providers keep the on-request player. Neither frames anything up front.
      assert.match(audioPlayer(hydrated), hydrated.audio.provider === 'SoundCloud' ? /data-play="/ : /data-load-embed/);
      assert.doesNotMatch(audioPlayer(hydrated), /<iframe/);
    } else assert.equal(hydrated.audio, undefined, `Unsupported or absent link retains the missing-recording state: ${record.id}`);
    if (record.artwork?.file) {
      assert.ok(hydrated.artwork?.src, record.id);
      assert.equal(hydrated.artwork.alt, record.artwork.alt?.trim() || `Cover art for ${record.title}`);
    }
    const route = parseRoute(hashFor(content.recordPath(hydrated)));
    assert.equal(route.page, record.collection === 'experience' ? 'experience' : 'record', record.id);
    if (route.page === 'record') assert.equal(route.record.id, record.id);
  }
  for (const dataset of ['production', 'sound']) await attachedFile(content.copy[dataset].cv?.download?.file);
  const cv = shell(parseRoute('#/experience'));
  if (content.copy.production.cv?.download?.file) assert.match(cv, /class="cv-download"|download=/);
  else assert.doesNotMatch(cv, /class="cv-download"/);

  for (const path of ['/', '/about', '/contact', '/work', '/experience', '/livicee', '/livicee/about', '/livicee/contact', '/livicee/mixes', ...content.records.map(content.recordPath)]) {
    const route = parseRoute(hashFor(path)), html = shell(route);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1, `${path}: one native main`);
    assert.match(html, /<h1>/, path);
    assert.match(html, /<article id="main"[^>]*tabindex="-1"/, path);
    assert.ok(pageTitle(route).endsWith(` · ${content.site.identities[route.dataset].name}`), path);
    assert.ok(html.includes(escape(content.site.identities[route.dataset].switchLabel)), path);
  }
}
