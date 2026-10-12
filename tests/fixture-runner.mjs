import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

// Exercise the runner's exit contract without requiring Playwright or network access.
const root = await mkdtemp(join(tmpdir(), 'livi-fixture-runner-'));
try {
    await writeFile(join(root, 'fixtures.mjs'), await readFile(new URL('./fixtures.mjs', import.meta.url)));
    const mock = join(root, 'playwright');
    await mkdir(mock);
    await writeFile(join(mock, 'index.mjs'), `
const mode = process.env.FIXTURE_RUNNER_CASE;
let closed = 0;
export const chromium = {
    async launch() { return {
        async newContext() { return {
            async newPage() { return {
                on(kind, fn) {
                    if (mode === kind) fn(kind === 'console'
                        ? { type: () => 'error', text: () => 'injected console error' }
                        : new Error('injected page error'));
                },
                async goto() {}, async click() {}, async waitForLoadState() {}, async waitForTimeout() {},
                async evaluate() { return [false, true]; },
                async waitForFunction() { if (mode === 'playback-timeout') throw Error('injected playback timeout'); },
                async waitForSelector() { if (mode === 'partial') throw Error('injected terminal timeout'); },
                async textContent(selector) {
                    if (selector === '#play-result') return mode === 'playback-error' ? 'Error: recording failed' : 'PASS: playback succeeded';
                    return mode === 'explicit-failure' ? 'PASS: first assertion\\nFAIL: real renderer failure' : 'PASS: completed fixture';
                }
            }; },
            async close() { closed++; }
        }; },
        async close() { console.log('CLOSED CONTEXTS ' + closed); }
    }; }
};
`);
    for (const mode of ['complete', 'partial', 'playback-timeout', 'playback-error', 'explicit-failure', 'pageerror', 'console']) {
        const result = spawnSync(process.execPath, [join(root, 'fixtures.mjs')], {
            env: { ...process.env, PLAYWRIGHT: mock, FIXTURE_RUNNER_CASE: mode },
            encoding: 'utf8', timeout: 10000,
        });
        assert.ifError(result.error);
        assert.equal(result.status, mode === 'complete' ? 0 : 1, `${mode}: ${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout, /CLOSED CONTEXTS 8/, `${mode} must close every fixture context`);
        console.log(`PASS fixture runner ${mode}`);
    }
} finally {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(root.split(/[\\/]/).at(-1).startsWith('livi-fixture-runner-'));
    await rm(root, { recursive: true, force: true });
}
