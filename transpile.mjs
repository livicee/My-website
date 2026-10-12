import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export function createWorkspaceCompiler(importMetaUrl, dest, { contentFixture, devMediaUrls = false } = {}) {
  const srcRoot = fileURLToPath(new URL('../src/', importMetaUrl));
  const seen = new Set();

  function outName(absPath) {
    const rel = relative(srcRoot, absPath).replace(/\\/g, '/');
    if (rel.startsWith('workspace/') && rel.endsWith('.ts')) return `${rel.slice('workspace/'.length, -3)}.mjs`;
    return `${rel.replace(/\//g, '__').replace(/\.ts$/, '.mjs').replace(/\.json$/, '.json.mjs')}`;
  }

  async function compileAbs(absPath) {
    const abs = resolve(absPath);
    if (seen.has(abs)) return;
    seen.add(abs);
    if (abs.endsWith('.json')) {
      const key = relative(srcRoot, abs).replace(/\\/g, '/');
      const file = key.startsWith('content/') ? key.slice('content/'.length) : '';
      const json = contentFixture && Object.hasOwn(contentFixture, file)
        ? JSON.stringify(contentFixture[file]) : await readFile(abs, 'utf8');
      await writeFile(join(dest, outName(abs)), `export default ${json}`);
      return;
    }
    const source = await readFile(abs, 'utf8');
    let compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
    // The live-content check uses the same relative media addresses as Vite's local preview.
    if (devMediaUrls && abs === resolve(srcRoot, 'workspace/content.ts')) compiled = `import.meta.env = { DEV: true };\n${compiled}`;
    const dir = dirname(abs);
    for (const match of compiled.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)) {
      const spec = match[1];
      let resolved = resolve(dir, spec);
      if (!resolved.endsWith('.ts') && !resolved.endsWith('.json')) resolved += '.ts';
      await compileAbs(resolved);
      const relImport = `./${relative(dirname(join(dest, outName(abs))), join(dest, outName(resolved))).replace(/\\/g, '/')}`;
      compiled = compiled.replaceAll(`from '${spec}'`, `from '${relImport}'`);
      compiled = compiled.replaceAll(`from "${spec}"`, `from '${relImport}'`);
    }
    await writeFile(join(dest, outName(abs)), compiled);
  }

  return name => compileAbs(join(srcRoot, 'workspace', `${name}.ts`));
}
