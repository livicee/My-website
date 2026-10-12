export const POINTER_HOLD_MS = 160;
export const POINTER_RELEASE_MS = 220;
export const POINTER_ATTACK_MS = 110;
const POINTER_FOLLOW_MS = 55;

/** Release is based on elapsed time, so a delayed frame cannot prolong the effect. */
export function pointerStrengthAt(now: number, lastMove: number, releasedAt = Infinity): number {
    const releaseStart = Math.min(lastMove + POINTER_HOLD_MS, releasedAt);
    const progress = Math.min(1, Math.max(0, (now - releaseStart) / POINTER_RELEASE_MS));
    return 1 - progress * progress * (3 - 2 * progress);
}

/** Start from the current influence on re-entry; leaving early freezes the partial attack. */
export function pointerInfluenceAt(now: number, lastMove: number, releasedAt: number, engagedAt: number, engagementStrength = 0): number {
    const release = pointerStrengthAt(now, lastMove, releasedAt);
    if (release === 0) return 0;
    const releaseStart = Math.min(lastMove + POINTER_HOLD_MS, releasedAt);
    const progress = Math.min(1, Math.max(0, (Math.min(now, releaseStart) - engagedAt) / POINTER_ATTACK_MS));
    const attack = progress * progress * (3 - 2 * progress);
    return (engagementStrength + (1 - engagementStrength) * attack) * release;
}

/** A frame-rate-independent follower avoids jumping the distortion to each incoming cursor sample. */
export function pointerFollow(current: number, target: number, elapsedMs: number): number {
    return target + (current - target) * Math.exp(-Math.max(0, elapsedMs) / POINTER_FOLLOW_MS);
}
