// Runs the browser fixture pages headlessly against the running dev server and prints their PASS/FAIL lines.
// Playwright is not a dependency of this project: install it anywhere and point PLAYWRIGHT at the package folder,
// e.g. PLAYWRIGHT=C:/tools/node_modules/playwright npm run fixtures. Start `npm run dev` first.
// Usage: node tests/fixtures.mjs [chromium|webkit|firefox ...]
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.env.PLAYWRIGHT ? pathToFileURL(join(process.env.PLAYWRIGHT, 'index.mjs')).href : 'playwright';
const engines = await import(source).catch(() => {
    console.error('Playwright was not found. Set PLAYWRIGHT to an installed playwright package folder.');
    process.exit(2);
});
const BASE = process.env.BASE ?? 'http://127.0.0.1:5193/';
const chosen = process.argv.slice(2).length ? process.argv.slice(2) : ['chromium'];
// [page, press its Run button]. The failure variants report on their own.
const PAGES = [
    ['tests/regression.html', true], ['tests/refinement.html', true], ['tests/identity.html', true], ['tests/identity.html?missing', true],
    ['tests/proof.html', true], ['tests/proof.html?failure=image', false], ['tests/proof.html?failure=canvas', false], ['tests/browser.html', false],
];
let failures = 0;
for (const name of chosen) {
    const browser = await engines[name].launch();
    try {
        for (const [path, pressRun] of PAGES) {
            const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
            const page = await context.newPage();
            const errors = [];
            const waitFailures = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
            await page.goto(BASE + path);
            let text;
            if (path === 'tests/browser.html') {
                await page.click('#play-test');
                await page.waitForFunction(() => /PASS|Error/.test(document.querySelector('#play-result')?.textContent ?? ''), null, { timeout: 15000 }).catch(error => waitFailures.push('FAIL: playback result wait did not complete: ' + error.message));
                await page.click('#error-test');
                await page.waitForTimeout(1500);
                const shown = await page.evaluate(() => [...document.querySelectorAll('.audio-error')].map(e => !e.hidden));
                text = `${await page.textContent('#play-result')}\n${shown[1] && !shown[0] ? 'PASS' : 'FAIL'}: only the missing recording shows its message`;
            } else {
                if (pressRun) {
                    await page.waitForLoadState('networkidle');
                    await page.click('#run');
                }
                await page.waitForSelector('#results[data-complete]', { timeout: 180000 }).catch(error => waitFailures.push('FAIL: fixture did not reach terminal completion: ' + error.message));
                text = (await page.textContent('#results')) ?? '';
            }
            const lines = text.split('\n').filter(Boolean);
            lines.push(...waitFailures);
            if (path === 'tests/browser.html' && !lines[0]?.startsWith('PASS')) lines.push('FAIL: playback did not report success');
            const failed = lines.filter(line => line.startsWith('FAIL')).length + (lines.some(line => line.startsWith('PASS')) ? 0 : 1) + errors.length;
            failures += failed;
            console.log(`\n[${name}] ${path}${errors.length ? `  (console errors: ${errors.join(' | ')})` : ''}\n${lines.map(line => '  ' + line).join('\n')}`);
            await context.close();
        }
    } finally {
        await browser.close();
    }
}
console.log(`\n${failures ? `${failures} failure(s).` : 'All fixture checks passed.'}`);
process.exitCode = failures ? 1 : 0;
