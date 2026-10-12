import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const readSite = () => JSON.parse(readFileSync(new URL('./src/content/site.json', import.meta.url), 'utf8'));
const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export default defineConfig({
    base: './',
    // Copied to the site root unchanged: icons, the web manifest and the link-preview image.
    publicDir: 'public',
    build: {
        rollupOptions: {
            input: 'index.html',
        },
    },
    plugins: [
        {
            // Search, link previews and profile data, all built from site.json so Livi's edits (including a new address) flow through.
            name: 'site-from-content',
            transformIndexHtml(html) {
                const site = readSite();
                const { production, sound } = site.identities;
                const searchTitle = site.searchTitle?.trim() || site.author;
                const searchDescription = site.searchDescription?.trim() || site.author;
                const profiles = [production.linkedin, sound.soundcloud, sound.instagram]
                    .filter((url): url is string => typeof url === 'string' && /^https:\/\/[^/]+\/./.test(url));
                const person = {
                    '@context': 'https://schema.org', '@type': 'Person', name: site.author, alternateName: sound.name,
                    url: site.siteUrl, image: `${site.siteUrl}og-image.png`,
                    description: searchDescription, sameAs: profiles,
                };
                const links = profiles.map(url => `<a href="${escape(url)}">${escape(new URL(url).hostname.replace(/^www\./, ''))}</a>`).join(' · ');
                // "<" is escaped so no profile text can close the script element early.
                const data = JSON.stringify(person).replace(/</g, '\\u003c');
                return html
                    .replaceAll('%SITE_URL%', escape(site.siteUrl))
                    .replaceAll('%SITE_TITLE%', escape(searchTitle))
                    .replaceAll('%SITE_DESCRIPTION%', escape(searchDescription))
                    .replaceAll('%SITE_AUTHOR%', escape(site.author))
                    .replace('</head>', `  <script type="application/ld+json">${data}</script>\n  </head>`)
                    .replace('<div id="app"></div>', `<div id="app"></div>\n    <noscript><p>${escape(searchDescription)} This portfolio needs JavaScript. <a href="mailto:${escape(site.email)}">${escape(site.email)}</a> · ${links}</p></noscript>`);
            },
            generateBundle() {
                const { siteUrl } = readSite();
                this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n` });
                this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escape(siteUrl)}</loc></url>\n</urlset>\n` });
            },
        },
        {
            name: 'include-font-licenses',
            generateBundle() {
                for (const font of ['instrument-sans', 'fragment-mono']) {
                    this.emitFile({
                        type: 'asset',
                        fileName: `licenses/${font}-OFL.txt`,
                        source: readFileSync(new URL(`./src/assets/fonts/${font}-OFL.txt`, import.meta.url), 'utf8'),
                    });
                }
            },
        },
    ],
});
