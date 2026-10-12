/** Content shape and relationship checks, run before building the public site. */
export const CONTENT_FILES = Object.freeze([
    'site.json', 'copy.json', 'notices.json', 'projects.json',
    'evidence.json', 'experience.json', 'mixes.json',
]);

export const MEDIA_EXTENSIONS = Object.freeze({
    audio: Object.freeze(['mp3', 'm4a', 'wav', 'ogg']),
    artwork: Object.freeze(['jpg', 'jpeg', 'png', 'webp']),
    cv: Object.freeze(['pdf']),
});

const recordCollections = { projects: 'work', evidence: 'artefacts', experience: 'experience', mixes: 'mixes' };
const collections = Object.values(recordCollections);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isAddress = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const own = (value, key) => Object.hasOwn(value, key);

/** The public site address: https, no login, query or fragment, ending in a slash. */
function siteAddress(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname.endsWith('/') && url.href === value;
    }
    catch {
        return false;
    }
}
function profileLink(value, domain) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password
            && (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
    } catch { return false; }
}

/** Match the public player's accepted page shapes, never a copied iframe or player address. */
function recordingLink(value) {
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
        const soundcloud = ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com'].includes(url.hostname);
        const mixcloud = ['mixcloud.com', 'www.mixcloud.com', 'm.mixcloud.com'].includes(url.hostname);
        if (!soundcloud && !mixcloud) return false;
        const parts = url.pathname.split('/').filter(Boolean);
        if (!parts.every(part => /^[A-Za-z0-9][\w.-]*$/.test(part))) return false;
        return parts.length === 2 || (soundcloud && parts.length === 3 && (parts[1] === 'sets' || parts[2].startsWith('s-')));
    } catch { return false; }
}

/**
 * `files` contains every canonical filename as a key, with its parsed JSON value.
 * Paths identify content fields: site.email, copy.production.home.title, projects.<id>.title.
 * Repeated fields append their index. A damaged record without an ID uses its list index.
 * Return all useful issues, including for malformed nested values, without throwing.
 */
export function validateContentFiles(files) {
    const issues = [];
    const issue = (path, message) => issues.push({ path, message });
    const object = (value, path, label) => {
        if (isObject(value)) return value;
        issue(path, `Expected an object for ${label}. Check the field or restore it from file history.`);
        return undefined;
    };
    const list = (value, path, label) => {
        if (Array.isArray(value)) return value;
        issue(path, `Expected a JSON array for ${label}, using square brackets [ ].`);
        return undefined;
    };
    const text = (value, path, label, required = false) => {
        if (typeof value !== 'string') { issue(path, `Enter ${label} as text.`); return false; }
        if (required && !value.trim()) { issue(path, `Add ${label}.`); return false; }
        return true;
    };
    const textFields = (value, path, fields, required = []) => {
        for (const [key, label] of Object.entries(fields)) text(value[key], `${path}.${key}`, label, required.includes(key));
    };
    const optionalText = (value, path, key, label) => {
        if (own(value, key)) text(value[key], `${path}.${key}`, label);
    };
    const attachment = (value, path, kind) => {
        if (!text(value, path, 'the attached file name') || !value) return;
        const safe = /^[\w-][\w.-]*$/.test(value) && !value.includes('..');
        const extension = value.split('.').at(-1)?.toLowerCase();
        if (!safe || !MEDIA_EXTENSIONS[kind].includes(extension)) {
            const formats = { audio: 'an MP3, M4A, WAV or OGG recording', artwork: 'a JPG, PNG or WebP image', cv: 'a PDF' };
            issue(path, `Use the filename of ${formats[kind]} in src/content/media/. Use letters, numbers, hyphens or underscores, with no spaces or folders.`);
        }
    };
    const objects = (value, path, label, fields) => {
        list(value, path, label)?.forEach((item, index) => {
            const at = `${path}.${index}`;
            if (object(item, at, label)) textFields(item, at, fields);
        });
    };

    if (!object(files, 'content', 'portfolio content')) return issues;
    for (const name of Object.keys(files)) {
        if (!CONTENT_FILES.includes(name)) issue('content', `Unknown content file: ${name}. Use the seven canonical JSON files.`);
    }

    const site = object(files['site.json'], 'site', 'site settings');
    if (site) {
        textFields(site, 'site', { author: 'your name', siteUrl: 'the website address', entity: 'the business name', email: 'your email address', footerNote: 'the footer note' }, ['author', 'siteUrl', 'email']);
        optionalText(site, 'site', 'searchTitle', 'the browser tab and search title');
        optionalText(site, 'site', 'searchDescription', 'the search and link-preview description');
        if (typeof site.siteUrl === 'string' && site.siteUrl.trim() && !siteAddress(site.siteUrl)) {
            issue('site.siteUrl', 'Enter the full website address, starting https:// and ending with /, such as https://livi-cracknell.github.io/.');
        }
        if (typeof site.email === 'string' && site.email.trim() && !/^[^\s@<>:;,?]+@[^\s@<>:;,?]+\.[^\s@<>:;,?]+$/.test(site.email)) {
            issue('site.email', 'Enter an email address such as name@example.com.');
        }
        const identities = object(site.identities, 'site.identities', 'identity settings');
        if (identities) for (const dataset of ['production', 'sound']) {
            const path = `site.identities.${dataset}`;
            const identity = object(identities[dataset], path, `${dataset === 'production' ? 'Livi' : 'Livicee'} settings`);
            if (!identity) continue;
            textFields(identity, path, {
                name: 'the displayed name', shortName: 'the short name', captionPractice: 'the practice description',
                crumb: 'the navigation name', switchLabel: 'the identity button label', searchLabel: 'the search label',
                portraitLabel: 'the portrait description', otherIdentityLabel: 'the link to the other identity',
                workLabel: 'the collection name', workCountLabel: 'the collection count label', status: 'the status line',
            }, ['name', 'switchLabel', 'searchLabel', 'portraitLabel', 'workLabel', 'workCountLabel']);
            optionalText(identity, path, 'cvLabel', 'the Experience tab label');
            for (const [key, domain, label] of [['soundcloud', 'soundcloud.com', 'SoundCloud'], ['linkedin', 'linkedin.com', 'LinkedIn'], ['instagram', 'instagram.com', 'Instagram']]) {
                if (!own(identity, key)) continue;
                const at = `${path}.${key}`, value = identity[key];
                if (text(value, at, `the ${label} link`) && value && !profileLink(value, domain)) issue(at, `Use a full https://${domain}/ profile link, or leave this empty.`);
            }
        }
    }

    const copy = object(files['copy.json'], 'copy', 'page text');
    if (copy) for (const dataset of ['production', 'sound']) {
        const path = `copy.${dataset}`;
        const pages = object(copy[dataset], path, `${dataset === 'production' ? 'Livi' : 'Livicee'} page text`);
        if (!pages) continue;
        const home = object(pages.home, `${path}.home`, 'Overview page');
        if (home) textFields(home, `${path}.home`, { title: 'the page title', intro: 'the introduction', selectedHeading: 'the selected items heading', contactLink: 'the contact button label' }, ['title', 'contactLink']);
        const about = object(pages.about, `${path}.about`, 'About page');
        if (about) {
            textFields(about, `${path}.about`, { title: 'the page title', lede: 'the introduction', body: 'the About text', principlesHeading: 'the principles heading', workLink: 'the collection link label' }, ['title', 'workLink']);
            objects(about.principles, `${path}.about.principles`, 'principles', { title: 'the principle title', body: 'the principle text' });
        }
        const contact = object(pages.contact, `${path}.contact`, 'Contact page');
        if (contact) textFields(contact, `${path}.contact`, { title: 'the page title', lede: 'the introduction', subject: 'the email subject', emailAction: 'the email button label' }, ['title', 'emailAction']);
        if (own(pages, 'cv')) {
            const cv = object(pages.cv, `${path}.cv`, 'Experience page');
            if (cv) {
                text(cv.title, `${path}.cv.title`, 'the page title', true);
                if (own(cv, 'download')) {
                    const download = object(cv.download, `${path}.cv.download`, 'CV download');
                    if (download) {
                        if (own(download, 'file')) attachment(download.file, `${path}.cv.download.file`, 'cv');
                        optionalText(download, `${path}.cv.download`, 'label', 'the CV download label');
                    }
                }
            }
        }
    }
    const notices = object(files['notices.json'], 'notices', 'shared labels');
    if (notices) text(notices.relatedProjectsHeading, 'notices.relatedProjectsHeading', 'the related projects heading');

    const records = [];
    const routes = new Map();
    for (const [bucket, collection] of Object.entries(recordCollections)) {
        list(files[`${bucket}.json`], bucket, bucket === 'experience' ? 'roles' : bucket)?.forEach((record, index) => {
            const path = `${bucket}.${isAddress(record?.id) ? record.id : index}`;
            if (!object(record, path, 'item')) return;
            records.push({ record, path, collection });
            const owner = `${bucket}.${index}`;
            if (record.collection !== collection) issue(`${path}.collection`, `Set collection to "${collection}" for records in ${bucket}.json.`);
            for (const key of ['id', 'slug']) {
                if (!isAddress(record[key])) issue(`${path}.${key}`, 'Use lowercase letters and numbers with single hyphens for this address.');
                else {
                    const route = `${collection}/${record[key]}`;
                    const previous = routes.get(route);
                    if (previous && previous !== owner) issue(`${path}.${key}`, 'This address is already used by another item. Choose a different address.');
                    else routes.set(route, owner);
                }
            }
            textFields(record, path, { title: 'a title', subtitle: 'the subtitle', summary: 'the summary', year: 'the date or year' }, ['title']);
            list(record.tags, `${path}.tags`, 'tags')?.forEach((tag, i) => text(tag, `${path}.tags.${i}`, 'the tag'));
            if (typeof record.sample !== 'boolean') issue(`${path}.sample`, 'Set sample to true or false, without quotation marks.');
            objects(record.facts, `${path}.facts`, 'key facts', { label: 'the fact label', value: 'the fact text' });
            if (own(record, 'story')) objects(record.story, `${path}.story`, 'story sections', { label: 'the section label', title: 'the section title', body: 'the section text' });
            if (own(record, 'metrics')) objects(record.metrics, `${path}.metrics`, 'results', { value: 'the result', label: 'the result label' });
            if (own(record, 'facets')) {
                const facets = object(record.facets, `${path}.facets`, 'filter labels');
                if (facets) for (const [key, value] of Object.entries(facets)) {
                    if (!['type', 'style'].includes(key)) issue(`${path}.facets.${key}`, 'Choose a supported filter label.');
                    else text(value, `${path}.facets.${key}`, 'the filter label');
                }
            }
            if (own(record, 'night') && !['early', 'day', 'late', 'peak', 'winddown'].includes(record.night)) issue(`${path}.night`, 'Choose a place in the night from the list.');
            if (own(record, 'evidence')) {
                const evidence = object(record.evidence, `${path}.evidence`, 'evidence');
                if (evidence) {
                    if (!['workflow', 'schema', 'table'].includes(evidence.kind)) issue(`${path}.evidence.kind`, 'Choose Workflow, Schema or Table for this evidence.');
                    text(evidence.title, `${path}.evidence.title`, 'the evidence title');
                    let width;
                    if (evidence.kind === 'workflow') width = 3;
                    else if (['schema', 'table'].includes(evidence.kind)) {
                        const columns = list(evidence.columns, `${path}.evidence.columns`, 'column headings');
                        if (columns) {
                            width = columns.length;
                            if (!width) issue(`${path}.evidence.columns`, 'Add at least one column heading.');
                            columns.forEach((column, i) => text(column, `${path}.evidence.columns.${i}`, 'the column heading'));
                        }
                    }
                    list(evidence.rows, `${path}.evidence.rows`, 'evidence rows')?.forEach((row, i) => {
                        const at = `${path}.evidence.rows.${i}`;
                        if (!list(row, at, 'cells in this row')) return;
                        if (width !== undefined && row.length !== width) issue(at, evidence.kind === 'workflow' ? 'Give each workflow step its number, title and description.' : 'Give each row one cell for every column heading.');
                        row.forEach((cell, j) => text(cell, `${at}.${j}`, 'the cell text'));
                    });
                }
            }
            if (own(record, 'audio')) {
                const audio = object(record.audio, `${path}.audio`, 'recording');
                if (audio) {
                    if (own(audio, 'file')) attachment(audio.file, `${path}.audio.file`, 'audio');
                    if (own(audio, 'link') && text(audio.link, `${path}.audio.link`, 'the recording link') && audio.link && !recordingLink(audio.link)) issue(`${path}.audio.link`, 'Use the full SoundCloud or Mixcloud page for this mix, or leave the link empty.');
                    if (own(audio, 'duration') && !(typeof audio.duration === 'number' && Number.isFinite(audio.duration) && audio.duration > 0)) issue(`${path}.audio.duration`, 'Use the measured length in seconds as a positive number, or remove duration.');
                    if (own(audio, 'peaks') && !(Array.isArray(audio.peaks) && audio.peaks.length >= 16 && audio.peaks.length <= 4096 && audio.peaks.every(peak => typeof peak === 'number' && Number.isFinite(peak) && peak >= 0 && peak <= 1))) issue(`${path}.audio.peaks`, 'Use 16–4096 measured peaks between 0 and 1, or remove peaks. A recording does not need waveform metadata.');
                }
            }
            if (own(record, 'artwork')) {
                const artwork = object(record.artwork, `${path}.artwork`, 'cover image');
                if (artwork) {
                    if (own(artwork, 'file')) attachment(artwork.file, `${path}.artwork.file`, 'artwork');
                    optionalText(artwork, `${path}.artwork`, 'alt', 'the image description');
                }
            }
        });
    }
    for (const { record, path } of records) {
        const relations = object(record.relations, `${path}.relations`, 'linked items');
        if (!relations) continue;
        for (const [collection, ids] of Object.entries(relations)) {
            const at = `${path}.relations.${collection}`;
            if (!collections.includes(collection)) { issue(at, `Use a relationship key from: ${collections.join(', ')}.`); continue; }
            list(ids, at, 'linked items')?.forEach((id, i) => {
                if (!isAddress(id) || !records.some(item => item.collection === collection && item.record.id === id)) issue(`${at}.${i}`, 'This linked item no longer exists. Remove the link or choose another item.');
            });
        }
    }
    return issues;
}
