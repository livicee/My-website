import type { ContentRecord } from './model';
/** Ids and slugs become URL segments: lowercase letters and numbers, joined by single hyphens. */
const isValidId = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export function validateRecords(records: ContentRecord[]): void {
    const keys = new Set<string>();
    for (const record of records) {
        for (const [name, value] of [['ID', record.id], ['slug', record.slug]] as const) {
            if (!isValidId(value))
                throw new Error(`"${record.title}": the ${name} "${value}" can only use lowercase letters, numbers and single hyphens, as it becomes part of the address.`);
        }
        for (const id of new Set([record.id, record.slug])) {
            const key = `${record.collection}/${id}`;
            if (keys.has(key))
                throw new Error(`Duplicate record route: ${key}`);
            keys.add(key);
        }
    }
    for (const record of records) {
        for (const [collection, ids] of Object.entries(record.relations)) {
            for (const id of ids)
                if (!records.some(r => r.collection === collection && r.id === id))
                    throw new Error(`Broken relationship: ${record.id} → ${collection}/${id}`);
        }
        const evidence = record.evidence;
        if (evidence) {
            const width = evidence.kind === 'workflow' ? 3 : evidence.columns?.length;
            if (!width || evidence.rows.some(row => row.length !== width))
                throw new Error(`Invalid evidence width: ${record.id}`);
        }
    }
}
