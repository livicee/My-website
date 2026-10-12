import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { CONTENT_FILES, MEDIA_EXTENSIONS, validateContentFiles } from '../scripts/content-validation.mjs';

const live = Object.fromEntries(await Promise.all(CONTENT_FILES.map(async file => [file, JSON.parse(await readFile(new URL(`../src/content/${file}`, import.meta.url), 'utf8'))])));
// Mutation cases use frozen examples so removing real records never breaks the test setup.
const current = JSON.parse(await readFile(new URL('./review-content.json', import.meta.url), 'utf8')).content;
const fresh = () => structuredClone(current);
let passed = 0;
function test(name, run) {
    try { run(); passed += 1; console.log(`PASS ${name}`); }
    catch (error) { console.error(`FAIL ${name}`); throw error; }
}
function issueFor(files, path) {
    const issues = validateContentFiles(files);
    assert.ok(issues.some(issue => issue.path === path), `Expected ${path}; got ${JSON.stringify(issues)}`);
    for (const issue of issues) {
        assert.equal(typeof issue.path, 'string');
        assert.ok(typeof issue.message === 'string' && issue.message.trim());
    }
    return issues;
}

test('existing editable content is accepted without changes', () => {
    const before = JSON.stringify(live);
    assert.deepEqual(validateContentFiles(live), []);
    assert.equal(JSON.stringify(live), before);
});

test('all seven files are required and unknown files are refused', () => {
    for (const file of CONTENT_FILES) {
        const files = fresh(); delete files[file];
        issueFor(files, file.replace('.json', ''));
    }
    const files = fresh(); files['outside.json'] = {};
    issueFor(files, 'content');
    for (const invalid of [null, undefined, true, 5, 'content', []]) issueFor(invalid, 'content');
});

test('malformed page settings produce useful paths rather than exceptions', () => {
    const examples = [
        ['site.json', ['identities'], null, 'site.identities'],
        ['site.json', ['identities', 'sound'], [], 'site.identities.sound'],
        ['site.json', ['identities', 'production', 'status'], false, 'site.identities.production.status'],
        ['copy.json', ['production', 'home'], 4, 'copy.production.home'],
        ['copy.json', ['sound', 'about', 'principles'], {}, 'copy.sound.about.principles'],
        ['copy.json', ['production', 'about', 'principles', 0], null, 'copy.production.about.principles.0'],
        ['copy.json', ['production', 'about', 'principles', 0, 'body'], [], 'copy.production.about.principles.0.body'],
        ['copy.json', ['production', 'cv', 'download'], [], 'copy.production.cv.download'],
        ['notices.json', ['relatedProjectsHeading'], null, 'notices.relatedProjectsHeading'],
    ];
    for (const [file, path, value, expected] of examples) {
        const files = fresh(); let target = files[file];
        for (const key of path.slice(0, -1)) target = target[key];
        target[path.at(-1)] = value;
        issueFor(files, expected);
    }
});

test('empty visible titles are caught while optional text can be blank', () => {
    const files = fresh();
    files['site.json'].footerNote = '';
    files['site.json'].identities.production.status = '';
    files['copy.json'].sound.about.body = '';
    assert.deepEqual(validateContentFiles(files), []);
    files['copy.json'].sound.home.title = '   ';
    issueFor(files, 'copy.sound.home.title');
    files['projects.json'][0].title = '';
    issueFor(files, `projects.${files['projects.json'][0].id}.title`);
});

test('email address requires a plain complete email', () => {
    for (const email of ['no address', 'name@', '@example.com', 'name@example', 'mailto:name@example.com', 'name@example.com?subject=x', 'name@example.com\r\nBcc:other@example.com']) {
        const files = fresh(); files['site.json'].email = email; issueFor(files, 'site.email');
    }
    const files = fresh(); files['site.json'].email = 'livi+portfolio@example.co.uk';
    assert.deepEqual(validateContentFiles(files), []);
});

test('the website address is a full https address ending in a slash', () => {
    for (const siteUrl of ['', 'livi-cracknell.github.io', 'http://livi-cracknell.github.io/', 'https://livi-cracknell.github.io', 'https://livi-cracknell.github.io/?ref=x', 'https://livi-cracknell.github.io/#/', 'https://user:pw@livi-cracknell.github.io/']) {
        const files = fresh(); files['site.json'].siteUrl = siteUrl; issueFor(files, 'site.siteUrl');
    }
    for (const siteUrl of ['https://livi-cracknell.github.io/', 'https://example.github.io/livi-cracknell/', 'https://livicracknell.com/']) {
        const files = fresh(); files['site.json'].siteUrl = siteUrl; assert.deepEqual(validateContentFiles(files), [], siteUrl);
    }
});

test('social fields use their provider domain and can be removed', () => {
    for (const [key, domain] of [['soundcloud', 'soundcloud.com'], ['instagram', 'instagram.com'], ['linkedin', 'linkedin.com']]) {
        for (const value of ['', `https://${domain}/livi`, `https://www.${domain}/livi`]) {
            const files = fresh(); files['site.json'].identities.sound[key] = value;
            assert.deepEqual(validateContentFiles(files), []);
        }
        for (const value of [`http://${domain}/livi`, `https://${domain}.evil.test/livi`, `https://evil${domain}/livi`, `https://user:password@${domain}/livi`, 'javascript:alert(1)', 5, {}]) {
            const files = fresh(); files['site.json'].identities.sound[key] = value;
            issueFor(files, `site.identities.sound.${key}`);
        }
    }
});

test('new roles accept realistic dates, empty optional details and no fixed sample count', () => {
    const files = fresh();
    files['experience.json'].push({
        id: 'storyblok', slug: 'storyblok', collection: 'experience', title: 'Implementation Success Manager',
        subtitle: 'Storyblok', summary: '', year: '2026–present', tags: [], sample: false,
        facts: [{ label: 'Location', value: '' }], relations: {}, story: [{ label: 'Role', title: '', body: '' }],
    });
    assert.deepEqual(validateContentFiles(files), []);
    for (const bucket of ['projects', 'evidence', 'experience', 'mixes']) files[`${bucket}.json`] = [];
    assert.deepEqual(validateContentFiles(files), []);
});

test('record identities and routes cannot collide within a collection', () => {
    for (const key of ['id', 'slug']) {
        const files = fresh(); const rows = files['projects.json'];
        rows[1][key] = rows[0].slug;
        issueFor(files, `projects.${rows[1].id}.${key}`);
    }
    const files = fresh(); const row = files['mixes.json'][0];
    row.slug = '../other'; issueFor(files, `mixes.${row.id}.slug`);
    row.id = 'Mixed Case'; issueFor(files, 'mixes.0.id');
    const duplicated = fresh(); duplicated['projects.json'].push(duplicated['projects.json'][0]);
    issueFor(duplicated, `projects.${duplicated['projects.json'][0].id}.id`);
});

test('different collections may use the same address segment', () => {
    const files = fresh(); const mix = files['mixes.json'][0];
    mix.id = files['projects.json'][0].id; mix.slug = mix.id;
    assert.deepEqual(validateContentFiles(files), []);
});

test('wrong collection, record types and malformed nested lists are refused safely', () => {
    const cases = [
        ['collection', 'mixes'], ['title', 5], ['summary', null], ['year', {}], ['tags', [1]], ['sample', 'yes'],
        ['facts', [null]], ['story', [{ label: 'Story', title: 'Story', body: null }]],
        ['metrics', [{ value: {}, label: 'Result' }]], ['facets', { style: [] }],
        ['relations', []], ['audio', []], ['artwork', null], ['evidence', false], ['night', 'morning'],
    ];
    for (const [key, value] of cases) {
        const files = fresh(); const row = files['projects.json'][0]; row[key] = value;
        assert.ok(validateContentFiles(files).some(issue => issue.path.startsWith(`projects.${row.id}.${key}`)), key);
    }
    const files = fresh(); files['projects.json'][0] = null;
    issueFor(files, 'projects.0');
});

test('linked records must exist in the selected collection', () => {
    const files = fresh(); const project = files['projects.json'][0];
    project.relations.artefacts = ['missing-evidence'];
    issueFor(files, `projects.${project.id}.relations.artefacts.0`);
    project.relations.unknown = [];
    issueFor(files, `projects.${project.id}.relations.unknown`);
    project.relations.experience = 'role';
    issueFor(files, `projects.${project.id}.relations.experience`);
});

test('removing linked content reports each broken reference before building', () => {
    const files = fresh(); const removed = files['evidence.json'].shift();
    const affected = files['projects.json'].filter(project => project.relations.artefacts?.includes(removed.id));
    assert.ok(affected.length);
    const issues = validateContentFiles(files);
    for (const project of affected) assert.ok(issues.some(issue => issue.path.startsWith(`projects.${project.id}.relations.artefacts.`)));
});

test('evidence cells match the headings or the three-part workflow shape', () => {
    const files = fresh(); const row = files['evidence.json'][0];
    row.evidence = { kind: 'table', title: 'Results', columns: ['Result', 'Detail'], rows: [['Only one']] };
    issueFor(files, `evidence.${row.id}.evidence.rows.0`);
    row.evidence = { kind: 'workflow', title: 'Process', rows: [['01', 'Start', 'Description']] };
    assert.deepEqual(validateContentFiles(files), []);
    row.evidence.rows[0][1] = null;
    issueFor(files, `evidence.${row.id}.evidence.rows.0.1`);
    row.evidence = { kind: 'table', title: 'Results', columns: [], rows: [] };
    issueFor(files, `evidence.${row.id}.evidence.columns`);
    row.evidence = { kind: 'table', title: 'Results', columns: null, rows: [null] };
    issueFor(files, `evidence.${row.id}.evidence.rows.0`);
});

test('CV labels may be prepared without attaching a file', () => {
    for (const download of [{ label: 'Download my CV' }, {}, { file: '', label: '' }, { file: 'Livi-Cracknell-CV.PDF', label: 'CV' }]) {
        const files = fresh(); files['copy.json'].production.cv.download = download;
        assert.deepEqual(validateContentFiles(files), []);
    }
});

test('attachments use safe filenames and supported file types', () => {
    assert.deepEqual(MEDIA_EXTENSIONS, { audio: ['mp3', 'm4a', 'wav', 'ogg'], artwork: ['jpg', 'jpeg', 'png', 'webp'], cv: ['pdf'] });
    const files = fresh(); const mix = files['mixes.json'][0];
    mix.audio = { file: 'my-mix.MP3' }; mix.artwork = { file: 'cover.webp', alt: '' };
    assert.deepEqual(validateContentFiles(files), []);
    for (const file of ['../mix.mp3', '..\\mix.mp3', '/mix.mp3', 'C:\\mix.mp3', '.mix.mp3', 'mix..mp3', 'bad name.mp3', 'mix.exe']) {
        mix.audio.file = file; issueFor(files, `mixes.${mix.id}.audio.file`);
    }
    mix.audio.file = 'mix.mp3'; mix.artwork.file = 'cover.svg';
    issueFor(files, `mixes.${mix.id}.artwork.file`);
    files['copy.json'].production.cv.download = { file: 'cv.html' };
    issueFor(files, 'copy.production.cv.download.file');
});

test('measured recording metadata is finite and bounded', () => {
    const files = fresh(); const mix = files['mixes.json'][0];
    mix.audio = { file: 'mix.mp3', duration: 3600.5, peaks: Array(16).fill(0.5) };
    assert.deepEqual(validateContentFiles(files), []);
    for (const duration of [0, -1, Infinity, NaN, '3600', null]) {
        mix.audio.duration = duration; issueFor(files, `mixes.${mix.id}.audio.duration`);
    }
    mix.audio.duration = 3600;
    for (const peaks of [null, [], Array(15).fill(0), Array(4097).fill(0), Array(16).fill(1.1), Array(16).fill(NaN), Array(16).fill('1')]) {
        mix.audio.peaks = peaks; issueFor(files, `mixes.${mix.id}.audio.peaks`);
    }
});

const embedSource = await readFile(new URL('../src/workspace/embeds.ts', import.meta.url), 'utf8');
const { mixEmbed } = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(embedSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText).toString('base64')}`);
test('recording link validation agrees with the actual public player', () => {
    const links = [
        'https://soundcloud.com/livicee/my-mix', 'https://m.soundcloud.com/livicee/my-mix?utm_source=clipboard',
        'https://soundcloud.com/livicee/sets/collection', 'https://soundcloud.com/livicee/mix/s-secret',
        'https://www.mixcloud.com/livicee/my-mix/', 'https://mixcloud.com/livicee/my-mix',
        'https://soundcloud.com/livicee', 'http://soundcloud.com/livicee/mix',
        'https://soundcloud.com.evil.test/livicee/mix', 'https://soundcloud.com:8443/livicee/mix',
        'https://soundcloud.com/livicee/mix/other', 'https://mixcloud.com/livicee/mix/other',
        'https://user:password@soundcloud.com/livicee/mix', 'javascript:alert(1)',
        'https://soundcloud.com/livicee/%2F', '<iframe src="https://soundcloud.com/livicee/mix"></iframe>',
    ];
    for (const link of links) {
        const files = fresh(); const mix = files['mixes.json'][0]; mix.audio = { link };
        const refused = validateContentFiles(files).some(issue => issue.path === `mixes.${mix.id}.audio.link`);
        assert.equal(refused, !mixEmbed(link), link);
    }
});

test('bad deeply nested values never throw during validation', () => {
    const paths = [];
    function collect(value, path) {
        paths.push(path);
        if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) collect(child, [...path, key]);
    }
    collect(current, []);
    for (const path of paths.filter(path => path.length && (!['projects.json', 'evidence.json', 'experience.json', 'mixes.json'].includes(path[0]) || path[1] === '0'))) {
        for (const replacement of [null, true, 3, [], {}]) {
            const files = fresh(); let target = files;
            for (const key of path.slice(0, -1)) target = target[key];
            target[path.at(-1)] = replacement;
            assert.doesNotThrow(() => validateContentFiles(files), path.join('.'));
        }
    }
});

console.log(`${passed} content-validation checks passed.`);
