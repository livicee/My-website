import { recordPath } from './content';
import { escape, icon } from './html';
import type { ContentRecord, Evidence } from './model';

const WIDTH = 600;
const HEIGHT = 420;
const BACKGROUND = '#151419';
const INK = '#f3eaf0';
const ACCENT = '#ec72b2';
const LINE = '#735269';

function label(value: string, limit = 22): string {
    return escape(value.length > limit ? `${value.slice(0, limit - 1)}…` : value);
}

function text(x: number, y: number, value: string, size = 28, color = INK): string {
    return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="Arial, sans-serif">${label(value)}</text>`;
}

function connector(x1: number, y1: number, x2: number, y2: number): string {
    return `<path d="M${x1} ${y1}H${(x1 + x2) / 2}V${y2}H${x2}" fill="none" stroke="${LINE}" stroke-width="2"/>`;
}

function schemaDiagram(evidence: Extract<Evidence, { kind: 'schema' | 'table' }>): string {
    const fields = evidence.rows.slice(0, 4);
    const middle = 225;
    const root = `<rect x="35" y="${middle - 49}" width="204" height="98" fill="#352031" stroke="${ACCENT}" stroke-width="2"/>${text(54, middle - 6, evidence.title.split(' ').slice(0, 2).join(' '), 28, ACCENT)}${text(54, middle + 27, `${evidence.rows.length} fields`, 24)}`;
    return fields.map((row, index) => {
        const y = 106 + index * 79;
        return `${connector(239, middle, 317, y + 29)}<rect x="317" y="${y}" width="249" height="58" fill="#211c25" stroke="${LINE}"/>${text(336, y + 38, row[0] ?? '', 30)}`;
    }).join('') + root;
}

function workflowDiagram(evidence: Extract<Evidence, { kind: 'workflow' }>): string {
    const steps = evidence.rows.slice(0, 5);
    return steps.map((row, index) => {
        const y = 101 + index * 62;
        return `${index < steps.length - 1 ? `<path d="M62 ${y + 35}v27" stroke="${LINE}" stroke-width="2"/>` : ''}<rect x="46" y="${y}" width="32" height="35" fill="${index === 0 ? ACCENT : '#392535'}" stroke="${ACCENT}"/>${text(102, y + 28, row[1], 31, index === 0 ? ACCENT : INK)}<path d="M435 ${y + 18}H552" stroke="${LINE}" stroke-width="2"/>`;
    }).join('');
}

function tableDiagram(evidence: Extract<Evidence, { kind: 'schema' | 'table' }>): string {
    const rows = evidence.rows.slice(0, 4);
    const columns = evidence.columns.slice(0, 2);
    return `<rect x="34" y="111" width="532" height="53" fill="#352031"/>${text(51, 146, columns[0] ?? 'Record', 28, ACCENT)}${text(328, 146, columns[1] ?? 'Value', 28, ACCENT)}<path d="M310 111V${178 + rows.length * 49}" stroke="${LINE}"/>` + rows.map((row, index) => {
        const y = 187 + index * 51;
        return `${text(51, y, row[0] ?? '', 25)}${text(328, y, row[1] ?? '', 25)}<path d="M34 ${y + 17}H566" stroke="${LINE}"/>`;
    }).join('');
}

/** Original geometric media derived only from the supplied structured evidence. */
/** A generated diagram as an image address. */
export const svgSource = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function evidenceSvg(record: ContentRecord): string {
    const evidence = record.evidence;
    if (!evidence || !evidence.rows.length) return '';
    const diagram = evidence.kind === 'workflow' ? workflowDiagram(evidence)
        : evidence.kind === 'schema' ? schemaDiagram(evidence) : tableDiagram(evidence);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>${text(34, 56, evidence.title, 33)}<path d="M34 78H566" stroke="${LINE}" stroke-width="2"/>${diagram}</svg>`;
}

/**
 * The evidence's image (its `artwork` in the JSON), or without one its own diagram, shown as it is.
 * Place on overview surfaces only; opened evidence remains the full HTML document.
 */
export function evidencePreview(record: ContentRecord, evidencePath?: string): string {
    const svg = record.artwork ? '' : evidenceSvg(record);
    if (!record.artwork && !svg) return '';
    const src = record.artwork?.src ?? svgSource(svg);
    const art = record.artwork ? ' is-art' : '';
    const requested = evidencePath?.replace(/^#/, '');
    const path = requested?.startsWith('/') && !requested.startsWith('//') && !/[\\\u0000- ]/.test(requested)
        ? requested : recordPath(record);
    return `<figure class="evidence-preview" data-evidence-preview>
        <a class="evidence-preview-link" href="${escape(`#${path}`)}" aria-label="${escape(`Open ${record.title}`)}">
            <span class="evidence-preview-media">
                <img class="evidence-preview-image${art}" src="${escape(src)}" alt="" width="${WIDTH}" height="${HEIGHT}" loading="lazy" decoding="async">
                <span class="evidence-preview-unavailable" hidden>Preview unavailable. Open the evidence document.</span>
            </span>
            <span class="evidence-preview-caption"><span aria-hidden="true">Open evidence ${icon('diagonal')}</span></span>
        </a>
    </figure>`;
}

/** A diagram that fails to load says so; its link still opens the evidence. Returns the cleanup for the next route. */
export function bindEvidencePreviews(root: ParentNode): () => void {
    const cleanups: (() => void)[] = [];
    for (const figure of root.querySelectorAll<HTMLElement>('[data-evidence-preview]')) {
        const image = figure.querySelector<HTMLImageElement>('img');
        const message = figure.querySelector<HTMLElement>('.evidence-preview-unavailable');
        if (!image || !message) continue;
        const failed = () => { message.hidden = false; };
        const loaded = () => { message.hidden = true; };
        image.addEventListener('error', failed);
        image.addEventListener('load', loaded);
        cleanups.push(() => {
            image.removeEventListener('error', failed);
            image.removeEventListener('load', loaded);
        });
        if (image.complete && !image.naturalWidth) failed();
    }
    return () => { for (const cleanup of cleanups) cleanup(); };
}
