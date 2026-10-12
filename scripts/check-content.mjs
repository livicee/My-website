import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CONTENT_FILES, validateContentFiles } from './content-validation.mjs';

/** Read-only build gate. Errors always name the JSON file and the field to repair. */
export async function checkContentDirectory(directory) {
    const files = {};
    const issues = [];
    for (const file of CONTENT_FILES) {
        let source;
        try { source = await readFile(join(directory, file), 'utf8'); }
        catch { issues.push({ file, field: '$', message: 'Could not read this file. Restore it from file history.' }); continue; }
        try { files[file] = JSON.parse(source); }
        catch (error) {
            issues.push({ file, field: '$', message: `Invalid JSON: ${error.message}. Check double quotes, commas and brackets, or restore the previous version.` });
        }
    }
    // Avoid a wall of secondary errors when a file cannot be parsed at all.
    if (issues.length) return issues;
    for (const issue of validateContentFiles(files)) {
        const [bucket, ...field] = issue.path.split('.');
        issues.push({ file: `${bucket}.json`, field: field.join('.') || '$', message: issue.message });
    }

    const mediaDirectory = join(directory, 'media');
    let mediaNames;
    try { mediaNames = new Set(await readdir(mediaDirectory)); }
    catch { mediaNames = new Set(); }
    async function attachment(file, field, filename) {
        // Malformed names are already explained by the shape validator; never resolve them as paths.
        if (typeof filename !== 'string' || !/^[\w-][\w.-]*$/.test(filename) || filename.includes('..')) return;
        let exists = false;
        if (mediaNames.has(filename)) {
            try { exists = (await stat(join(mediaDirectory, filename))).isFile(); } catch { /* Report below. */ }
        }
        if (!exists) issues.push({ file, field, message: `Missing attachment "${filename}". Upload it to src/content/media/ with this exact spelling and capitalisation, or correct/remove this reference.` });
    }
    for (const file of ['projects.json', 'evidence.json', 'experience.json', 'mixes.json']) {
        if (!Array.isArray(files[file])) continue;
        for (const [index, record] of files[file].entries()) {
            for (const kind of ['audio', 'artwork']) {
                await attachment(file, `${record?.id || index}.${kind}.file`, record?.[kind]?.file);
            }
        }
    }
    for (const identity of ['production', 'sound']) {
        await attachment('copy.json', `${identity}.cv.download.file`, files['copy.json']?.[identity]?.cv?.download?.file);
    }
    return issues;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const directory = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../src/content/', import.meta.url));
    const issues = await checkContentDirectory(directory);
    if (issues.length) {
        console.error(`Content validation failed (${issues.length} ${issues.length === 1 ? 'problem' : 'problems'}):`);
        for (const { file, field, message } of issues) {
            console.error(`  src/content/${file} → ${field}: ${message}`);
            if (process.env.GITHUB_ACTIONS === 'true') {
                const escape = value => value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
                console.error(`::error file=src/content/${file},title=Invalid portfolio content::${escape(`${field}: ${message}`)}`);
            }
        }
        console.error('Fix these fields in GitHub and commit again. The previous successful deployment stays live. See src/content/README.md.');
        process.exitCode = 1;
    } else console.log(`Content validation passed: ${CONTENT_FILES.length} JSON files, relationships and attachments.`);
}
