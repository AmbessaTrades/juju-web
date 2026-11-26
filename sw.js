/* Juju in a browser, with the Mac off (docs/PHONE-CORE.md 5). This service worker answers the rooms' /api in the shapes of
   juju-serve and the APK (apps/juju-shell/android/rust/src/tap.rs): the Gate, the lists and the Purse come from the Door; the
   design systems, kinds and theme frames from the seed this site was built with. Nothing reaches the Mac.
   Until juju-core runs here as WASM (lane A), a film is not made in the browser: Make says so. */
const BASE = new URL('./', self.location).pathname;
/* the version of the unit this worker belongs to: stamped by web/build.py, so a tab knows when the site has moved on */
const ABOUT = {"version": "0.3.8", "core": null, "commit": "a56863ab"};            // /juju-web/ on GitHub Pages
const STORE = 'juju-state-v1';
let CFG = null;
self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/* ---------- small store (the Cache API: a service worker has no localStorage) ---------- */
const keyOf = k => BASE + '__state/' + k;
async function get(k) { const r = await (await caches.open(STORE)).match(keyOf(k)); return r ? r.json() : null; }
async function put(k, v) { await (await caches.open(STORE)).put(keyOf(k), new Response(JSON.stringify(v), { headers: { 'Content-Type': 'application/json', 'X-At': String(Date.now()) } })); }
async function age(k) { const r = await (await caches.open(STORE)).match(keyOf(k)); return r ? Date.now() - Number(r.headers.get('X-At') || 0) : Infinity; }
async function drop(k) { await (await caches.open(STORE)).delete(keyOf(k)); }
async function cfg() { if (!CFG) CFG = await (await fetch(BASE + 'door.json', { cache: 'no-store' })).json(); return CFG; }
const seedCache = {};
async function seed(n) { if (!(n in seedCache)) { try { seedCache[n] = await (await fetch(BASE + 'seed/' + n + '.json')).json(); } catch (e) { seedCache[n] = []; } } return seedCache[n]; }

/* ---------- the Door ---------- */
class Fail { constructor(status, body) { this.status = status; this.body = body; } }
async function door(method, path, body) {
  const c = await cfg(), s = await get('session'), h = { Accept: 'application/json' };
  if (s && s.token) h.Authorization = 'Bearer ' + s.token;
  if (body !== undefined) h['Content-Type'] = 'application/json';
  let r; try { r = await fetch(c.url.replace(/\/$/, '') + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' }); }
  catch (e) { throw new Fail(503, { error: 'offline_door', say: 'No connection' }); }
  let v = null; try { v = await r.json(); } catch (e) { }
  if (r.ok) return v;
  if (r.status === 401) await drop('session');
  throw new Fail(r.status, v && v.say ? v : { error: 'door', say: 'Refused' });
}
/* a proof never touches Ambi's or Mumu's space: ?test=<name> on the first page signs in as the Door's throwaway test-<name><who> */
const space = async who => { const c = await cfg(), t = (await get('space')) || c.test_space; return t ? `test-${t}${who}` : who; };
const FRESH = 15000;
/* a shared list: the Door's (kept 15 s), else the last copy, else the seed */
async function list(name, fresh) {
  if (!fresh && await age('list-' + name) < FRESH) { const v = await get('list-' + name); if (v && v.data != null) return { data: v.data, version: v.version, from: 'door' }; }
  try { const v = await door('GET', '/v1/state/' + name); if (v.data == null && v.version === 0) return { data: await seed(name), version: 0, from: 'door' }; await put('list-' + name, v); return { data: v.data, version: v.version, from: 'door' }; }
  catch (e) { const v = await get('list-' + name); if (v) return { data: v.data, version: v.version, from: 'copy' }; return { data: await seed(name), version: 0, from: 'seed' }; }
}
async function change(name, fn) {
  for (let i = 0; i < 3; i++) {
    const l = await list(name, true); if (l.from !== 'door') throw new Fail(503, { error: 'offline_door', say: 'No connection' });
    const data = JSON.parse(JSON.stringify(l.data)); const why = fn(data); if (why) throw new Fail(422, { error: 'change', say: why });
    try { const v = await door('PUT', '/v1/state/' + name, { version: l.version, data }); await put('list-' + name, { version: v.version, data }); return data; }
    catch (e) { if (e.status !== 409) throw e; }
  }
  throw new Fail(409, { error: 'stale', say: 'Changed elsewhere' });
}
async function people() {
  if (await age('people') < FRESH) { const v = await get('people'); if (v) return v; }
  try { const v = await door('GET', '/v1/people'); const l = (v.people || []).map(p => ({ id: p.id, name: p.name, pin: p.pin_set ? 'set' : 'none', wait_s: 0 })); await put('people', l); return l; }
  catch (e) { return (await get('people')) || [{ id: 'ambi', name: 'Ambi', pin: 'set', wait_s: 0 }, { id: 'mumu', name: 'Mumu', pin: 'set', wait_s: 0 }]; }
}
const PLAN_SAY = 'Your Claude plan is read on the Mac; open Juju on the Mac once', API_SAY = 'Add a Claude API key: put ANTHROPIC_API_KEY in the key file and run door-keys';
async function localMode() { const m = (await get('mode')) || 'gris-gris'; return { mode: 'gris-gris', name: 'Gris-gris', tag: 'Recommended', lean: 'api', ways: { plan: { open: false, say: PLAN_SAY }, api: { open: false, say: API_SAY } }, room: null, asked: m }; }
const ALL_POTS = [['google', 'Choice of the Seer', 'Google'], ['deepseek', 'Pen of the Scribe', 'DeepSeek'], ['openrouter', 'Eye of the Judges', 'OpenRouter'], ['inworld', 'Voice of the Elders', 'Inworld'], ['wavespeed', 'Brush of the Painter', 'WaveSpeed']];
function fullPurse(p) { if (!p) return p; const rows = p.rows || [], have = new Set(rows.map((r) => r.id));
  for (const [id, name, service] of ALL_POTS) if (!have.has(id)) rows.push({ id, name, service, unit: 'usd', left: null, unread: true, say: 'Not reported' });
  if (!have.has('claude')) rows.push({ id: 'claude', name: 'High Juju', service: 'Claude', unit: 'pct_week', left: null, unread: true, say: 'Read on the Mac' });
  const counted = rows.filter((r) => r.unit === 'usd' && r.left != null).map((r) => r.service);
  return Object.assign({}, p, { rows, total_from: counted, total_line: p.total_line || `${counted.join(' + ')}, read live` }); }
async function purse() {
  if (await age('purse') < FRESH) { const v = await get('purse'); if (v) return v; }
  try { const v = await door('GET', '/v1/purse'); await put('purse', v); return v; } catch (e) { return get('purse'); }
}
async function money() {
  const p = await purse(); if (!p) return { line: 'Money: no word yet', spent: 0, cap: 0, left: 0, state: 'unknown' };
  const left = p.left ?? p.spend_left ?? Math.max(0, (p.cap || 0) - (p.spent || 0));
  return { line: `$${Number(left).toFixed(2)} left`, spent: p.spent || 0, cap: p.cap || 0, left, state: left <= 0.01 ? 'at_cap' : left < 0.5 ? 'low' : 'ok' };
}

/* ---------- the shapes the rooms read (tap.rs) ---------- */
const SIZES = [720, 1080, 1440];
const themeName = id => id.split('-').slice(0, 2).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
async function films() { return ((await list('films')).data || []).map(f => Object.assign({}, f, { state: 'elsewhere', film: null, here: false })); }
async function ideasOf(c) {
  const kinds = (await seed('kinds')).map(k => k.id), shut = (await seed('systems')).filter(s => s.locked && s.kind).map(s => s.kind);
  const all = (await list('ideas')).data || {}, mine = c.kinds || [];
  const own = all[c.slug] && all[c.slug].length ? all[c.slug] : Object.values(all).flat(); // channels are not seeded: the looks' ideas of its kinds
  return own.filter(i => mine.includes(i.kind) && (kinds.includes(i.kind) || shut.includes(i.kind))).map(i => Object.assign({}, i, { locked: !kinds.includes(i.kind) })).slice(0, 12);
}
async function card(c, fl, sys) {
  const mine = fl.filter(f => f.channel === c.slug), s = sys.find(x => x.id === c.system) || sys.find(x => (c.kinds || []).includes(x.kind));
  const look = c.theme && s && (s.themes || []).length > 1 ? themeName(c.theme) : s ? s.name : null;
  const thumb = ((await ideasOf(c)).find(i => i.thumb) || {}).thumb || null;
  return { slug: c.slug, name: c.name, handle: c.handle, link: c.link, avatar: null, thumb, still: null, niche: c.niche, look, system: s ? s.id : null, locked: !!(s && s.locked),
    minutes: c.minutes, export: c.export, kinds: c.kinds || [], ready: mine.filter(f => f.state === 'done').length, making: 0,
    owner: c.owner || null, describe: c.describe || null, niche_line: c.niche_line || null, niche_name: c.niche_name || null, niche_words: c.niche_words || null, route: c.route || null, refs: c.refs || [],
    palette: c.palette || null, swatches: s ? (s.swatches || []) : [], films_week: c.films_week || null, door: c.door || null, look_from: c.look_from || null };
}

const json = (status, v) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const no = (s, error, say) => json(s, { error, say });
async function answer(req, url) {
  const m = req.method === 'HEAD' ? 'GET' : req.method, seg = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const body = m === 'GET' || m === 'DELETE' ? {} : await req.json().catch(() => ({}));
  const is = (mm, ...p) => m === mm && p.length === seg.length && p.every((x, i) => x === '*' || x === seg[i]);
  if (is('GET', '__space')) { const t = url.searchParams.get('name') || ''; if (t === 'off') { await drop('space'); } else if (/^[a-z0-9]{4,20}$/.test(t)) { await put('space', t); } else return no(422, 'space', 'Not a test space'); await drop('session'); await drop('people'); return json(200, { space: t }); }
  if (is('GET', 'update')) {
    const about = ABOUT;
    const latest = await (await fetch(BASE + 'version.json', { cache: 'no-store' })).json().catch(() => null);
    const n = v => String(v || '0.0.0').replace(/^v/, '').split('.').map(x => +x || 0), gt = (a, b) => { a = n(a); b = n(b); for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false };
    return json(200, { version: about.version || '0.0.0', core: about.core || null, here: 'web', latest, newer: !!(latest && gt(latest.version, about.version)), core_old: false, making: false });
  }
  if (is('GET', 'health')) return json(200, { ok: true, here: 'web' });
  if (is('GET', 'session')) { const s = await get('session'), pp = await people(); return json(200, { who: s ? s.who : null, people: pp, here: pp.some(p => p.pin === 'none') ? 'mac' : 'phone' }); }
  if (is('POST', 'session') || is('POST', 'session', 'pin')) {
    const first = seg.length === 2; if (first && body.pin !== body.again) return no(422, 'again', 'Not the same');
    const ask = { who: await space(body.who), pin: body.pin }; if (first) Object.assign(ask, { again: body.again, first: true, code: body.code });
    let v; try { v = await door('POST', '/v1/session', ask); } catch (e) { if (first && e.status === 409) v = await door('POST', '/v1/session', { who: ask.who, pin: body.pin }); else throw e; }
    await put('session', { who: body.who, token: v.token, until: v.until }); await drop('people'); return json(200, { who: body.who });
  }
  const s = await get('session'); if (!s) return no(401, 'no_session', 'Sign in first');
  if (is('DELETE', 'session')) { await drop('session'); return json(200, { who: null }); }
  if (is('GET', 'money')) return json(200, await money());
  if (is('POST', 'purse', 'refresh')) { try { const v = await door('GET', '/v1/purse'); await put('purse', v); return json(200, fullPurse(v)); } catch (e) { return no(503, 'offline_door', 'No connection'); } }
  if (is('GET', 'purse')) { const p = fullPurse(await purse()); return p ? json(200, p) : no(503, 'offline_door', 'No connection'); }
  if (is('GET', 'mode')) { try { return json(200, await door('GET', '/v1/mode')); } catch (e) { return json(200, await localMode()); } }
  if (is('POST', 'mode') || is('POST', 'mode', 'check')) { try { return json(200, await door('POST', seg.length === 2 ? '/v1/mode/check' : '/v1/mode', body)); } catch (e) { const m = await localMode(); if (body && body.mode === 'high-juju') return json(409, Object.assign(m, { error: 'closed', say: API_SAY })); return json(200, m); } }
  if (seg[0] !== 'tap') return no(501, 'not_built', 'Not on the web yet');
  const sys = await seed('systems'), kinds = await seed('kinds');
  if (is('GET', 'tap', 'looks')) return json(200, { looks: sys.map(x => ({ id: x.id, name: x.name, kind: x.kind, themes: x.themes, locked: x.locked, examples: (x.examples || []).map((e) => ({ title: e.title, seconds: e.seconds, thumb: BASE + e.file })), swatches: x.swatches || [], inks: x.inks || [] })) });
  if (is('GET', 'tap')) return json(200, { kinds: kinds.map(k => ({ id: k.id, name: k.name, themes: (k.themes || []).length > 1, allowed: k.themes })), sizes: SIZES, size_first: 1080, export_built: false, money: await money(), making: [] });
  if (is('POST', 'tap')) return no(501, 'web_no_make', 'Films are made in the phone app for now');
  if (is('GET', 'tap', 'films')) { let l = await films(); const ch = url.searchParams.get('channel'); if (ch) l = l.filter(f => f.channel === ch); return json(200, { films: l, money: await money() }); }
  if (is('GET', 'tap', 'films', '*')) { const f = (await films()).find(x => x.id === seg[2]); return f ? json(200, f) : no(404, 'gone', 'Not here'); }
  if (m === 'POST' && seg[1] === 'films') return no(501, 'web_no_make', 'Films are made in the phone app for now');
  const chans = (await list('channels')).data || [];
  if (is('GET', 'tap', 'channels')) { const fl = await films(), mine = url.searchParams.get('mine') === '1'; const l = chans.filter(c => !c.parked && (!mine || !c.owner || c.owner === s.who)); return json(200, { channels: await Promise.all(l.map(c => card(c, fl, sys))), systems: sys, looks: [], sizes: SIZES, money: await money() }); }
  if (is('GET', 'tap', 'channels', '*')) { const c = chans.find(x => x.slug === seg[2]); if (!c) return no(404, 'gone', 'Not here'); const r = await card(c, await films(), sys); return json(200, Object.assign(r, { ideas: await ideasOf(c), systems: sys, sizes: SIZES })); }
  if (is('PATCH', 'tap', 'channels', '*')) {
    await change('channels', l => { const c = l.find(x => x.slug === seg[2]); if (!c) return 'Not here';
      if (typeof body.system === 'string') { const x = sys.find(y => y.id === body.system); if (!x || !x.kind) return 'Not a look'; if (x.locked) return 'Opens in High Juju';
        c.system = x.id; c.kinds = [x.kind, ...(c.kinds || []).filter(k => k !== x.kind && sys.some(y => y.kind === k && !y.locked))]; if (!(x.themes || []).includes(c.theme)) c.theme = (x.themes || [])[0] || null; }
      if (typeof body.theme === 'string') { const x = sys.find(y => y.id === c.system); if (!x || !(x.themes || []).includes(body.theme)) return 'Not a look'; c.theme = body.theme; }
      if (typeof body.export === 'number') { if (!SIZES.includes(body.export)) return 'Not that size'; c.export = body.export; }
      if (typeof body.minutes === 'number') { if (body.minutes < 1 || body.minutes > 40) return 'Not that long'; c.minutes = body.minutes; }
      if (typeof body.handle === 'string') c.handle = '@' + body.handle.trim().replace(/^@/, '');
      if (typeof body.name === 'string') { const n = body.name.split(/\s+/).join(' ').trim(); if (!n || n.length > 60) return 'Not a name'; c.name = n; c.named = true; }
      if (typeof body.look === 'string') { const x = sys.find(y => y.id === body.look); if (!x || !x.kind) return 'Not a look'; if (x.locked) return 'Opens in High Juju'; c.system = x.id; c.kinds = [x.kind]; c.theme = (x.themes || [])[0] || null; c.look_from = x.id; delete c.palette; }
      if (typeof body.describe === 'string') { const d = body.describe.split(/\s+/).join(' ').trim(); if (d.length < 3 || d.length > 200) return 'One line, please'; c.describe = d; }
      if (body.palette && typeof body.palette === 'object') { c.palette = Object.assign({}, c.palette || {}); for (const [k, v] of Object.entries(body.palette)) { if (v === null) delete c.palette[k]; else if (/^#[0-9a-fA-F]{6}$/.test(v)) c.palette[k] = v; else return 'Not a colour'; } }
      if (typeof body.films_week === 'number') { if (body.films_week < 1 || body.films_week > 14) return 'One to fourteen a week'; c.films_week = body.films_week; }
    });
    return json(200, { slug: seg[2] });
  }
  const notYet = say => json(501, { error: 'not_built', say: say || 'Not built yet', not_built: say || 'Not built yet' });
  if (is('POST', 'tap', 'channels')) {
    const v = { kinds: [], order: 50, added: new Date().toISOString(), owner: s.who, name: null, named: false };
    if (typeof body.link === 'string') { const L = body.link.trim(), h = (L.match(/@([A-Za-z0-9._-]{2,40})/) || [])[1];
      if (!/(youtube\.com|youtu\.be)/i.test(L) || (!h && !/\/channel\/[A-Za-z0-9_-]+/.test(L))) return no(422, 'link', 'Paste a YouTube channel link, like youtube.com/@name');
      Object.assign(v, { link: L, handle: h ? '@' + h : null, name: h || null, named: !!h, door: 'absorb', niche_words: h || '', route: { say: 'Now pick a look for this channel' } }); }
    else if (typeof body.look === 'string') { const l = sys.find(x => x.id === body.look); if (!l || !l.kind) return no(422, 'look', 'Not a look'); if (l.locked) return no(423, 'locked', 'Opens in High Juju');
      Object.assign(v, { system: l.id, kinds: [l.kind], theme: (l.themes || [])[0] || null, look_from: l.id, door: 'ready-made' }); }
    else if (typeof body.describe === 'string') { const d = body.describe.split(/\s+/).join(' ').trim(); if (d.length < 3 || d.length > 200) return no(422, 'describe', 'One line, please');
      Object.assign(v, { describe: d, niche_words: d.split(' ').slice(0, 6).join(' ').toLowerCase(), door: 'describe', route: { say: 'Pick a look: Juju cannot read a line on the web yet' } }); }
    else return no(422, 'door', 'A link, a line or a look');
    let slug = null;
    await change('channels', l => { const base = 'vessel-' + String(Date.now() % 1000000); slug = base; for (let i = 1; l.some(x => x.slug === slug); i++) slug = base + '-' + i; v.slug = slug; l.push(v); });
    return json(200, { slug, new: true, handle: v.handle || null, name: v.name || null });
  }
  if (is('POST', 'tap', 'channels', '*', 'park')) { await change('channels', l => { const c = l.find(x => x.slug === seg[2]); if (!c) return 'Not here'; c.parked = true; }); return json(200, { slug: seg[2], parked: true }); }
  if (is('POST', 'tap', 'channels', '*', 'refs')) return notYet('Learning from a film is not built on the web yet');
  if (is('GET', 'tap', 'channels', '*', 'ideas') || is('POST', 'tap', 'channels', '*', 'ideas')) {
    const c = chans.find(x => x.slug === seg[2]); if (!c) return no(404, 'gone', 'Not here');
    return json(200, { slug: c.slug, running: false, failed: false, ideas: await ideasOf(c), niche: c.niche_name || null, usd: null, titles: null });
  }
  return notYet();
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/api/')) return;
  // pictures the rooms ask for by /api address: the seed's own files
  const t = url.pathname.match(/^\/api\/tap\/themes\/([a-z0-9-]+)\.jpg$/);
  if (t) return e.respondWith(fetch(BASE + 'seed/themes/' + t[1] + '.jpg'));
  if (url.pathname === '/api/tap/pic') { const p = url.searchParams.get('p') || ''; return e.respondWith(/^seed\/thumbs\/[A-Za-z0-9_-]+\.jpg$/.test(p) ? fetch(BASE + p) : no(404, 'gone', 'Not here')); }
  e.respondWith(answer(e.request, url).catch(err => err instanceof Fail ? json(err.status, err.body) : (console.error(err), no(500, 'fault', 'Failed'))));
});
