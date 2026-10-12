import type { DatasetId } from './model';

/**
 * The rail's middle: a canvas that `railField.ts` fills with the identity's ASCII field. Decorative only, so it
 * is hidden from assistive technology and holds nothing focusable.
 */
export function railArt(dataset: DatasetId): string {
    return `<span class="rail-art" aria-hidden="true"><canvas class="rail-field" data-scene="${dataset}"></canvas></span>`;
}
