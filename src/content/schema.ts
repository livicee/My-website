import type { ContentRecord, DatasetId } from '../workspace/model';

type StoredAudio = {
    /** Uploaded recording in src/content/media/. Wins over a link. */
    file?: string;
    /** Optional measured loudness peaks (0 to 1) and length in seconds for this recording. */
    peaks?: number[];
    duration?: number;
    /** Public SoundCloud or Mixcloud page for the mix. */
    link?: string;
};

type StoredArtwork = {
    /** Image in src/content/media/. */
    file?: string;
    /** Describes the image; defaults to "Cover art for <title>". */
    alt?: string;
};

export type StoredRecord = Omit<ContentRecord, 'audio' | 'artwork'> & {
    audio?: StoredAudio;
    artwork?: StoredArtwork;
};

interface IdentityCopy {
    name: string;
    shortName: string;
    captionPractice: string;
    crumb: string;
    switchLabel: string;
    searchLabel: string;
    portraitLabel: string;
    otherIdentityLabel: string;
    workLabel: string;
    workCountLabel: string;
    /** Desktop header availability; empty falls back to copyright. Nonempty status also appears on mobile Home. */
    status: string;
    /** Nav label for the CV page. Only identities with a CV set it. */
    cvLabel?: string;
    /** Public SoundCloud profile, offered beside Contact. Only https soundcloud.com addresses are used. */
    soundcloud?: string;
    /** Public LinkedIn profile, offered beside Contact. Only https linkedin.com addresses are used. */
    linkedin?: string;
    /** Public Instagram profile, offered beside Contact. Only https instagram.com addresses are used. */
    instagram?: string;
}

export interface SiteContent {
    author: string;
    /** The site's public address, ending in /. Search, link previews, robots.txt and the sitemap are built from it. */
    siteUrl: string;
    /** Browser tab and search-result title, also used for link previews. */
    searchTitle?: string;
    /** Search-result and link-preview description. */
    searchDescription?: string;
    entity: string;
    email: string;
    footerNote: string;
    identities: Record<DatasetId, IdentityCopy>;
}

interface PageHomeCopy {
    title: string;
    intro: string;
    selectedHeading: string;
    contactLink: string;
}

interface PageAboutCopy {
    title: string;
    lede: string;
    body: string;
    principlesHeading: string;
    principles: {
        title: string;
        body: string;
    }[];
    workLink: string;
}

interface PageContactCopy {
    title: string;
    lede: string;
    subject: string;
    emailAction: string;
}

interface PageCvCopy {
    title: string;
    /** Optional CV file in src/content/media/, offered as a download on the Experience page. */
    download?: {
        file?: string;
        label?: string;
    };
}

interface DatasetCopy {
    home: PageHomeCopy;
    about: PageAboutCopy;
    contact: PageContactCopy;
    cv?: PageCvCopy;
}

export type CopyContent = Record<DatasetId, DatasetCopy>;

export interface NoticesContent {
    relatedProjectsHeading: string;
}

export const contentFiles = [
    'site.json',
    'copy.json',
    'notices.json',
    'projects.json',
    'evidence.json',
    'experience.json',
    'mixes.json',
] as const;

