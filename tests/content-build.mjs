import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createWorkspaceCompiler } from './transpile.mjs';

// Exercise the actual build gate on isolated frozen examples, never the live portfolio files.
const root = await mkdtemp(join(tmpdir(), 'livi-content-build-'));
const current = JSON.parse(await readFile(new URL('./review-content.json', import.meta.url), 'utf8')).content;
const script = fileURLToPath(new URL('../scripts/check-content.mjs', import.meta.url));
let passed = 0;
async function check(name, mutate, expected = []) {
    const files = structuredClone(current);
    await mutate(files);
    for (const [file, value] of Object.entries(files)) await writeFile(join(root, file), typeof value === 'string' ? value : JSON.stringify(value));
    const result = spawnSync(process.execPath, [script, root], { encoding: 'utf8', timeout: 10000, env: { ...process.env, GITHUB_ACTIONS: 'true' } });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    assert.equal(result.status, expected.length ? 1 : 0, output);
    for (const pattern of expected) assert.match(output, pattern);
    passed++; console.log(`PASS ${name}`);
    return files;
}
try {
    const punctuation = `I'm Livi — a systems mind, a human touch. “Content & people” <script>alert("test")</script>`;
    const files = await check('ordinary punctuation passes the build gate', files => {
        files['copy.json'].production.about.body = punctuation;
        files['projects.json'][0].summary = punctuation;
    });
    const compiled = join(root, 'render'); await mkdir(compiled);
    const compile = createWorkspaceCompiler(import.meta.url, compiled, { contentFixture: files });
    await compile('views'); await compile('routes');
    const { shell } = await import(pathToFileURL(join(compiled, 'views.mjs')));
    const { parseRoute } = await import(pathToFileURL(join(compiled, 'routes.mjs')));
    const { escape } = await import(pathToFileURL(join(compiled, 'html.mjs')));
    for (const route of ['#/about', `#/work/${files['projects.json'][0].slug}`]) {
        const html = shell(parseRoute(route));
        assert.ok(html.includes(escape(punctuation)), route);
        assert.ok(!html.includes('<script>alert'), route);
    }
    passed++; console.log('PASS edited page and project text render with punctuation and safe escaping');
    await check('malformed JSON identifies the filename and syntax problem', files => {
        files['copy.json'] = '{"production": }';
    }, [/src\/content\/copy\.json → \$: Invalid JSON/, /::error file=src\/content\/copy\.json/]);
    await check('duplicate IDs identify the record field', files => {
        files['projects.json'][1].id = files['projects.json'][0].id;
    }, [/src\/content\/projects\.json → [\w-]+\.id: This address is already used/]);
    await check('broken references identify the relationship field', files => {
        files['projects.json'][0].relations.artefacts = ['missing-evidence'];
    }, [/projects\.json → [\w-]+\.relations\.artefacts\.0: This linked item no longer exists/]);
    await check('missing recordings, cover images and CV files all identify their fields', files => {
        files['mixes.json'][0].audio = { file: 'missing.mp3' };
        files['mixes.json'][0].artwork = { file: 'missing.jpg', alt: '' };
        files['copy.json'].production.cv.download = { file: 'missing.pdf' };
    }, [/mixes\.json → [\w-]+\.audio\.file: Missing attachment "missing.mp3"/, /mixes\.json → [\w-]+\.artwork\.file: Missing attachment "missing.jpg"/, /copy\.json → production\.cv\.download\.file: Missing attachment "missing.pdf"/]);
    const media = join(root, 'media'); await mkdir(media);
    // Only filename resolution is under test; media decoding remains a public-player responsibility.
    for (const file of ['mix.mp3', 'cover.jpg', 'CV.pdf']) await writeFile(join(media, file), 'attachment fixture');
    await check('uploaded filenames resolve without waveform metadata', files => {
        files['mixes.json'][0].audio = { file: 'mix.mp3' };
        files['mixes.json'][0].artwork = { file: 'cover.jpg' };
        files['copy.json'].production.cv.download = { file: 'CV.pdf' };
    });
    await check('filename case is checked even on Windows', files => {
        files['copy.json'].production.cv.download = { file: 'cv.pdf' };
    }, [/copy\.json → production\.cv\.download\.file: Missing attachment "cv.pdf"/]);
    await check('structural errors identify the filename and nested field', files => {
        files['site.json'].identities.sound.status = false;
    }, [/site\.json → identities\.sound\.status: Enter the status line as text/]);
    await check('removing all records and their references is allowed', files => {
        for (const bucket of ['projects', 'evidence', 'experience', 'mixes']) files[`${bucket}.json`] = [];
    });
    console.log(`${passed} content-build checks passed.`);
} finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(root.split(/[\\/]/).at(-1).startsWith('livi-content-build-'));
    await rm(root, { recursive: true, force: true });
}
