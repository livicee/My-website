/** Public mix pages that can stand in for an uploaded recording. Only these hosts ever become players. */
type MixProvider = 'SoundCloud' | 'Mixcloud';
export interface MixEmbed {
    provider: MixProvider;
    /** Canonical public page, for the "Open on" link. */
    page: string;
    /** Official player URL, built here rather than taken from content. */
    player: string;
    height: number;
}

const hosts: Record<string, MixProvider> = Object.assign(Object.create(null), {
    'soundcloud.com': 'SoundCloud', 'www.soundcloud.com': 'SoundCloud', 'm.soundcloud.com': 'SoundCloud',
    'mixcloud.com': 'Mixcloud', 'www.mixcloud.com': 'Mixcloud', 'm.mixcloud.com': 'Mixcloud',
});
const segment = /^[A-Za-z0-9][\w.-]*$/;
const players = ['https://w.soundcloud.com/player/?', 'https://player-widget.mixcloud.com/widget/iframe/?'];

export function mixEmbed(link: string): MixEmbed | null {
    let url: URL;
    try {
        url = new URL(link.trim());
    }
    catch {
        return null;
    }
    const provider = hosts[url.hostname];
    if (!provider || url.protocol !== 'https:' || url.username || url.password || url.port)
        return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (!parts.every(part => segment.test(part)))
        return null;
    if (provider === 'SoundCloud') {
        // artist/track, artist/track/s-secret (private share link) or artist/sets/playlist
        const shape = parts.length === 2 || (parts.length === 3 && (parts[1] === 'sets' || parts[2].startsWith('s-')));
        if (!shape)
            return null;
        const page = `https://soundcloud.com/${parts.join('/')}`;
        const player = `${players[0]}url=${encodeURIComponent(page)}&color=%23ff3d9b&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
        return { provider, page, player, height: 166 };
    }
    if (parts.length !== 2)
        return null;
    const feed = `/${parts.join('/')}/`;
    return { provider, page: `https://www.mixcloud.com${feed}`, player: `${players[1]}hide_cover=1&light=0&feed=${encodeURIComponent(feed)}`, height: 120 };
}

/** Defence in depth for the click handler: only players built by mixEmbed may be framed. */
export function isPlayerUrl(src: string): boolean {
    return players.some(prefix => src.startsWith(prefix));
}
