import { site } from './content';
import type { Route } from './model';

/** These hash views share one indexable document; keep its canonical free of fragments. */
export function routeSeo(route: Route): { title: string; description: string; canonical: string } {
    const canonical = site.siteUrl;
    if (route.record) {
        const author = route.dataset === 'sound' ? 'DJ Livicee' : site.author;
        return { title: `${route.record.title} | ${author}`, description: route.record.summary, canonical };
    }
    const section = route.collection === 'work' ? 'projects' : route.collection === 'mixes' ? 'mixes' : route.page;
    const configured = site.pageSeo?.[`${route.dataset}.${section}`];
    return {
        title: configured?.title || site.searchTitle || site.author,
        description: configured?.description || site.searchDescription || '',
        canonical,
    };
}

/** Keep browser metadata in sync after navigation, with one tag for each field. */
export function updateSeo(route: Route): void {
    const seo = routeSeo(route);
    document.title = seo.title;
    const meta = (attribute: 'name' | 'property', key: string, content: string) => {
        let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attribute, key);
            document.head.append(element);
        }
        element.content = content;
    };
    meta('name', 'description', seo.description);
    meta('property', 'og:title', seo.title);
    meta('property', 'og:description', seo.description);
    meta('property', 'og:url', seo.canonical);
    meta('name', 'twitter:title', seo.title);
    meta('name', 'twitter:description', seo.description);
    // Hash routes cannot provide distinct server-rendered share previews.
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
    }
    canonical.href = seo.canonical;
    meta('name', 'robots', route.page === 'not-found' ? 'noindex,follow' : 'index,follow');
}
