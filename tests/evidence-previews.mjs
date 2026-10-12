import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createWorkspaceCompiler } from './transpile.mjs';

const directory = await mkdtemp(join(tmpdir(), 'livi-evidence-previews-'));
const compile = createWorkspaceCompiler(import.meta.url, directory);

function events(object = {}) {
    object.listeners = new Map();
    object.addEventListener = (name, callback) => {
        const callbacks = object.listeners.get(name) || new Set();
        callbacks.add(callback);
        object.listeners.set(name, callbacks);
    };
    object.removeEventListener = (name, callback) => object.listeners.get(name)?.delete(callback);
    object.emit = name => { for (const callback of object.listeners.get(name) || []) callback(); };
    return object;
}
const previewRoot = image => {
    const message = { hidden: true };
    const figure = { querySelector: selector => ({ img: image, '.evidence-preview-unavailable': message })[selector] };
    return { root: { querySelectorAll: () => [figure] }, message };
};

try {
    await compile('evidencePreviews');
    const { evidenceSvg, evidencePreview, bindEvidencePreviews } = await import(pathToFileURL(join(directory, 'evidencePreviews.mjs')));
    const record = { id: 'test', slug: 'test', collection: 'artefacts', title: 'Test evidence', summary: '', subtitle: '', year: '', tags: [], sample: true, facts: [], relations: {},
        evidence: { kind: 'schema', title: 'Asset record', columns: ['Field', 'Type'], rows: [['title', 'text'], ['owner', 'reference']] } };
    assert.equal(evidencePreview({ ...record, evidence: undefined }), '');
    assert.equal(evidencePreview({ ...record, evidence: { ...record.evidence, rows: [] } }), '');
    assert.match(evidenceSvg(record), />owner<\/text>/);
    assert.doesNotMatch(evidencePreview(record), /Sample/, 'the diagram carries no disclaimer of its own');
    assert.match(evidencePreview(record), /href="#\/artefacts\/test"/);
    assert.match(evidencePreview(record, '/work/another-project/artefacts/test'), /href="#\/work\/another-project\/artefacts\/test"/);
    assert.match(evidencePreview(record, '#/work/another-project/artefacts/test'), /href="#\/work\/another-project\/artefacts\/test"/);
    for (const unsafe of ['javascript:alert(1)', 'https://example.test', '//example.test', '/\\example.test', '/path\nwith-control']) {
        assert.match(evidencePreview(record, unsafe), /href="#\/artefacts\/test"/);
    }
    // The diagram itself is the preview: no character layer over it, nothing that waits for a hover.
    assert.match(evidencePreview(record), /<img class="evidence-preview-image" src="data:image\/svg\+xml;charset=utf-8,/);
    assert.doesNotMatch(evidencePreview(record), /<canvas|__ascii|data-ascii/);
    const hostile = { ...record, title: '<img src=x onerror="attack()">', evidence: { ...record.evidence, title: '</text><script>x</script>', rows: [['<svg onload="x">', 'text']] } };
    const html = evidencePreview(hostile);
    const svg = evidenceSvg(hostile);
    assert.doesNotMatch(svg, /<script|onload="x"/);
    assert.match(svg, /&lt;svg onload=&quot;x&quot;&gt;/);
    assert.doesNotMatch(html, /<img src=x|aria-label="[^"]*"attack/);
    const encoded = html.match(/src="data:image\/svg\+xml;charset=utf-8,([^"]+)"/)[1];
    assert.match(decodeURIComponent(encoded.replaceAll('&#39;', "'")), /&lt;svg/);
    console.log('PASS the original diagram, shown as it is: no-evidence fallback, safe routes and hostile source encoding');

    const image = events({ complete: false, naturalWidth: 0 });
    const live = previewRoot(image);
    const cleanup = bindEvidencePreviews(live.root);
    assert.equal(live.message.hidden, true, 'A diagram still loading is not reported as failed');
    image.emit('error');
    assert.equal(live.message.hidden, false);
    image.emit('load');
    assert.equal(live.message.hidden, true);
    cleanup();
    assert.ok([...image.listeners.values()].every(callbacks => !callbacks.size), 'Route cleanup removes every listener');
    const broken = previewRoot(events({ complete: true, naturalWidth: 0 }));
    bindEvidencePreviews(broken.root);
    assert.equal(broken.message.hidden, false, 'A diagram that failed before binding says so at once');
    console.log('PASS a failed diagram says so, and route cleanup removes its listeners');
} finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('livi-evidence-previews-'));
    await rm(directory, { recursive: true, force: true });
}
