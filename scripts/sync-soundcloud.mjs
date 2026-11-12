import { readFile, writeFile, rename } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const file = new URL('../src/content/mixes.json', import.meta.url);
export function mergeTracks(existing, tracks) {
  const urlKey = value => { try { const u = new URL(value); return u.hostname === 'soundcloud.com' ? u.origin + u.pathname.replace(/\/$/, '') : ''; } catch { return ''; } };
  const seen = new Set();
  const imported = tracks.filter(t => t.sharing === 'public' && t.user?.permalink === 'livicee' && t.title && urlKey(t.permalink_url) && (t.urn || t.id)).sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at)).flatMap(t => {
    const key = urlKey(t.permalink_url);
    if (seen.has(key)) return [];
    seen.add(key);
    const id = 'soundcloud-' + String(t.urn || t.id).split(':').pop();
    const old = existing.find(r => r.id === id || urlKey(r.audio?.link) === key);
    // Existing editorial text, slugs, artwork and relationships remain authoritative.
    if (old) return [{ ...old, audio: { ...old.audio, link: t.permalink_url, ...(t.duration > 0 ? {duration: t.duration / 1000} : {}) } }];
    const style = t.genre?.trim() || 'DJ mix';
    return [{ collection: 'mixes', id, slug: id, title: t.title, subtitle: style,
      summary: t.description?.trim() || `Listen to ${t.title} by Livicee on SoundCloud.`,
      year: String(new Date(t.created_at).getUTCFullYear()), tags: [style], sample: false,
      facts: [{label:'Listen',value:'SoundCloud'}], relations: {}, facets: {style},
      audio: {link:t.permalink_url, ...(t.duration > 0 ? {duration:t.duration/1000} : {})},
      ...(t.artwork_url?.startsWith('https://i1.sndcdn.com/') ? {artwork:{url:t.artwork_url,alt:`Cover art for ${t.title}`}} : {}) }];
  });
  return [...imported, ...existing.filter(r => !seen.has(urlKey(r.audio?.link)))];
}
export async function sync() {
  const {SOUNDCLOUD_CLIENT_ID:id, SOUNDCLOUD_CLIENT_SECRET:secret} = process.env;
  if (!id || !secret) { console.log('SoundCloud sync skipped: add both repository secrets to enable it.'); return; }
  const request = async (url, options={}) => {
    const response = await fetch(url, {...options, signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`SoundCloud request failed (${response.status}).`);
    return response.json();
  };
  const auth = await request('https://secure.soundcloud.com/oauth/token', {method:'POST',headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
  if (!auth.access_token) throw new Error('SoundCloud did not return an access token.');
  const headers = {Authorization:`OAuth ${auth.access_token}`};
  const user = await request('https://api.soundcloud.com/resolve?url=https%3A%2F%2Fsoundcloud.com%2Flivicee', {headers});
  if (user.permalink !== 'livicee' || !(user.urn || user.id)) throw new Error('Unexpected SoundCloud profile.');
  let next = `https://api.soundcloud.com/users/${encodeURIComponent(user.urn || user.id)}/tracks?linked_partitioning=true&limit=200`;
  const visited = new Set(), tracks=[];
  while (next) {
    if (new URL(next).origin !== 'https://api.soundcloud.com' || visited.has(next) || visited.size >= 100) throw new Error('Invalid SoundCloud pagination.');
    visited.add(next);
    const page = await request(next,{headers});
    const rows = Array.isArray(page) ? page : page.collection;
    if (!Array.isArray(rows)) throw new Error('Unexpected SoundCloud track response.');
    tracks.push(...rows);
    next = Array.isArray(page) ? null : page.next_href;
  }
  const existing = JSON.parse(await readFile(file,'utf8'));
  const merged = mergeTracks(existing, tracks);
  // Fetch all pages successfully before changing any content. Never remove existing entries.
  const tmp = new URL('../src/content/mixes.json.tmp', import.meta.url);
  await writeFile(tmp, JSON.stringify(merged,null,2)+'\n');
  await rename(tmp,file);
  console.log(`SoundCloud sync complete: ${merged.length} mixes available.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sync().catch(() => { console.warn('SoundCloud sync unavailable; keeping repository mix content. Check credentials and API access, then run again.'); });
}
