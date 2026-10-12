interface ViewPosition {
    y: number;
    index: number;
    focus: string | null;
}
type ViewportBucket = 'phone' | 'compact' | 'desktop';
/** Phone, compact desktop, and wide desktop keep independent scroll/focus. */
export function viewportBucket(width: number): ViewportBucket {
    if (width <= 760)
        return 'phone';
    if (width <= 1200)
        return 'compact';
    return 'desktop';
}
export function viewStateKey(hash: string, width: number): string {
    return `${viewportBucket(width)}:${hash}`;
}
/** Link clicks open at the top. Browser history reuses the last position. */
export function shouldRestoreView(source: 'push' | 'history'): boolean {
    return source === 'history';
}
/** A bounded session cache. Keys include viewport, collection path and query. */
export function createViewState(limit = 100) {
    const entries = new Map<string, ViewPosition>();
    return {
        get size() { return entries.size; },
        get(key: string) { return entries.get(key); },
        set(key: string, value: ViewPosition) {
            entries.delete(key);
            entries.set(key, value);
            while (entries.size > limit)
                entries.delete(entries.keys().next().value!);
        },
    };
}
