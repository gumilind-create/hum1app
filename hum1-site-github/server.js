'use strict';

require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
function usableDir(dir) {
  try { fs.mkdirSync(path.join(dir, 'uploads'), { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); return true; } catch { return false; }
}
function pickDataDir() {
  const wanted = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
  for (const dir of [wanted, path.join(__dirname, 'data'), path.join(os.tmpdir(), 'hum1-data')]) {
    if (usableDir(dir)) { if (dir !== wanted) console.warn(`[warn] Data folder ${wanted} is not writable, using ${dir} instead`); return dir; }
  }
  throw new Error('No writable folder for data');
}
const DATA = pickDataDir();
const UPLOADS = path.join(DATA, 'uploads');
const TG_BASE = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
const PROD = process.env.NODE_ENV === 'production';

/* ------------------------------------------------------------------ storage */
const FILES = { content: path.join(DATA, 'content.json'), briefs: path.join(DATA, 'briefs.json'), admin: path.join(DATA, 'admin.json') };
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
const content = Object.assign({ texts: {}, prices: {}, images: {} }, readJson(FILES.content, {}));
let briefs = readJson(FILES.briefs, []);
const adminState = readJson(FILES.admin, {});
if (!adminState.secret) { adminState.secret = crypto.randomBytes(32).toString('hex'); writeJson(FILES.admin, adminState); }
const saveContent = () => { writeJson(FILES.content, content); pageCache = null; };
const saveBriefs = () => writeJson(FILES.briefs, briefs);

/* --------------------------------------------------------------- admin auth */
const SECRET = process.env.SESSION_SECRET || adminState.secret;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const hashPassword = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
function checkPassword(pw) {
  if (typeof pw !== 'string' || !pw) return false;
  if (adminState.hash) return safeEqual(hashPassword(pw, adminState.salt), adminState.hash);
  return Boolean(process.env.ADMIN_PASSWORD) && safeEqual(pw, process.env.ADMIN_PASSWORD);
}
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 12 * 3600e3, n: crypto.randomBytes(8).toString('hex') })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function validToken(token) {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sign(payload), sig)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
function readCookie(req, name) {
  const hit = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
}
// The custom header cannot be set by a cross-site form, which closes the CSRF hole together with SameSite=Strict.
const requireAdmin = (req, res, next) =>
  validToken(readCookie(req, 'h1_admin')) && req.get('X-Admin') === '1' ? next() : res.status(401).json({ ok: false, error: 'Unauthorized' });

/* ---------------------------------------------------------- page templating */
const SECTION_LABELS = { site: 'Search engines', hero: 'First screen', why: 'Why a website', work: 'Gallery', packages: 'Packages', logo: 'Logo design', thanks: 'Thank-you window', extras: 'Smart extras', care: 'Website Care', compare: 'Tariff comparison', builder: 'Configurator', process: 'Process and payment', handover: 'After launch', about: 'About us', payment: 'Crypto payment', faq: 'FAQ', contacts: 'Contacts', contact: 'Contact details', footer: 'Footer' };
const PRICE_LABELS = { 'price.card': 'Card Website: price', 'price.portal': 'Full Web Portal: price', 'price.custom': 'Custom Constructor: starting price', 'care.price': 'Website Care: price per month', 'logo.start': 'Logo Start: price', 'logo.standard': 'Logo Standard: price', 'logo.brand': 'Logo Brand: price', 'logo.bundle': 'Logo discount with a website (%)' };
const TEXT_RE = /(<([a-z0-9]+)\b[^>]*\bdata-c="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g;
const BUTTON_PRICE_RE = /(<button\b[^>]*\bdata-price="([^"]+)"[^>]*>)([\s\S]*?)(<\/button>)/g;
const SPAN_PRICE_RE = /<span\b[^>]*\bdata-price="([^"]+)"[^>]*>[^<]*<\/span>/g;
const IMG_RE = /<img\b[^>]*\bdata-img="([^"]+)"[^>]*>/g;
const TITLE_RE = /<title>[^<]*<\/title>/;
const DESC_RE = /<meta name="description" content="[^"]*">/;
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const encode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => Number(n).toLocaleString('en-US');
const readTemplate = () => fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
let template = readTemplate();
let pageCache = null;

// Everything the admin panel can edit is discovered in the HTML itself (data-c, data-price, data-img).
function scanDefaults(html) {
  const texts = [{ key: 'site.title', tag: 'title', text: decode((TITLE_RE.exec(html) || ['<title></title>'])[0].slice(7, -8)) },
    { key: 'site.description', tag: 'meta', text: decode(/content="([^"]*)"/.exec(DESC_RE.exec(html)?.[0] || '')?.[1] || '') }];
  for (const m of html.matchAll(TEXT_RE)) texts.push({ key: m[3], tag: m[2], text: decode(m[4]) });
  const prices = new Map();
  for (const m of html.matchAll(BUTTON_PRICE_RE)) {
    if (prices.has(m[2])) continue;
    const base = /data-p="(\d+)"/.exec(m[1]);
    const name = /<span>([^<]*)<\/span>/.exec(m[3]);
    prices.set(m[2], { key: m[2], label: name ? decode(name[1]) : m[2], default: base ? Number(base[1]) : 0 });
  }
  for (const m of html.matchAll(SPAN_PRICE_RE)) {
    prices.set(m[1], { key: m[1], label: PRICE_LABELS[m[1]] || m[1], default: Number(/data-count="(\d+)"/.exec(m[0])[1]) });
  }
  const images = [...html.matchAll(IMG_RE)].map((m) => ({ slot: m[1], src: /src="([^"]+)"/.exec(m[0])[1], alt: decode((/alt="([^"]*)"/.exec(m[0]) || [])[1] || '') }));
  return { texts, prices: [...prices.values()], images };
}
const priceOf = (defs, key) => (key in content.prices ? content.prices[key] : defs.prices.find((p) => p.key === key)?.default);
const textOf = (defs, key) => (key in content.texts ? content.texts[key] : defs.texts.find((t) => t.key === key)?.text || '');

function buildPage() {
  if (pageCache) return pageCache;
  if (!PROD) template = readTemplate();
  let html = template;
  html = html.replace(TEXT_RE, (all, open, tag, key, inner, close) => (key in content.texts ? open + encode(content.texts[key]) + close : all));
  html = html.replace(BUTTON_PRICE_RE, (all, open, key, inner, close) => {
    if (!(key in content.prices)) return all;
    const v = content.prices[key];
    return open.replace(/data-p="\d+"/, `data-p="${v}"`) + inner.replace(/<em>\$[\d,]+<\/em>/, `<em>$${money(v)}</em>`) + close;
  });
  html = html.replace(SPAN_PRICE_RE, (all, key) => {
    if (!(key in content.prices)) return all;
    const v = content.prices[key];
    return all.replace(/data-count="\d+"/, `data-count="${v}"`).replace(/>[^<]*<\/span>$/, `>${money(v)}</span>`);
  });
  html = html.replace(IMG_RE, (all, slot) => (content.images[slot] ? all.replace(/src="[^"]*"/, `src="${content.images[slot]}"`) : all));
  if ('site.title' in content.texts) html = html.replace(TITLE_RE, `<title>${encode(content.texts['site.title'])}</title>`);
  if ('site.description' in content.texts) html = html.replace(DESC_RE, `<meta name="description" content="${encode(content.texts['site.description'])}">`);
  pageCache = html;
  return html;
}
function configScript() {
  const defs = scanDefaults(template);
  const cfg = {
    prices: { card: priceOf(defs, 'price.card'), portal: priceOf(defs, 'price.portal'), custom: priceOf(defs, 'price.custom'), care: priceOf(defs, 'care.price'), logo: { start: priceOf(defs, 'logo.start'), standard: priceOf(defs, 'logo.standard'), brand: priceOf(defs, 'logo.brand'), bundle: priceOf(defs, 'logo.bundle') } },
    contacts: { phone: textOf(defs, 'contact.phone'), telegram: textOf(defs, 'contact.telegram'), email: textOf(defs, 'contact.email') },
  };
  return `window.H1=${JSON.stringify(cfg).replace(/</g, '\\u003c')};`;
}

/* ----------------------------------------------------------------- telegram */
const tgEnv = () => ({ token: process.env.TELEGRAM_BOT_TOKEN || '', chats: (process.env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean) });
const tgConfigured = () => { const { token, chats } = tgEnv(); return Boolean(token && chats.length); };
async function tgRequest(method, body) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  try {
    const res = await fetch(`${TG_BASE}/bot${tgEnv().token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    const json = await res.json().catch(() => ({}));
    return json.ok ? { ok: true } : { ok: false, error: json.description || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Telegram timeout' : err.message };
  } finally { clearTimeout(timer); }
}
async function tgSend(text) {
  if (!tgConfigured()) return { ok: false, error: 'Telegram is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)' };
  const results = await Promise.all(tgEnv().chats.map((chat) => tgRequest('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true })));
  return results.find((r) => !r.ok) || { ok: true };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function briefMessage(b) {
  const first = ['Name', 'Contact', 'Best time'];
  const rows = [...b.rows.filter((r) => first.includes(r[0])).sort((x, y) => first.indexOf(x[0]) - first.indexOf(y[0])), ...b.rows.filter((r) => !first.includes(r[0]))];
  let text = `🛰 <b>New website brief #${b.n}</b>\n`;
  for (const [k, v] of rows) {
    const line = `\n<b>${esc(k)}:</b> ${esc(v)}`;
    if (text.length + line.length > 3900) { text += '\n…'; break; }
    text += line;
  }
  return text;
}

/* --------------------------------------------------------------------- app */
const app = express();
app.disable('x-powered-by');
const hosted = Boolean(process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.FLY_APP_NAME || process.env.DYNO || process.env.K_SERVICE);
app.set('trust proxy', (process.env.TRUST_PROXY ? process.env.TRUST_PROXY === '1' : hosted) ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], fontSrc: ["'self'"], connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"] } },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
const limiter = (windowMs, limit, error) => rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { ok: false, error } });
const json = express.json({ limit: '64kb' });

app.get('/', (req, res) => res.set('Cache-Control', 'no-cache').type('html').send(buildPage()));
app.get('/js/config.js', (req, res) => res.set('Cache-Control', 'no-cache').type('application/javascript').send(configScript()));
app.get('/admin', (req, res) => res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }).sendFile(path.join(PUBLIC, 'admin.html')));
app.get(['/index.html', '/admin.html'], (req, res) => res.redirect(301, req.path === '/admin.html' ? '/admin' : '/'));
app.get('/robots.txt', (req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /admin\nDisallow: /api/\n'));
app.get('/healthz', (req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));
app.use('/uploads', express.static(UPLOADS, { index: false, maxAge: '365d', immutable: true }));
app.use(express.static(PUBLIC, {
  index: false,
  setHeaders: (res, file) => res.setHeader('Cache-Control', /\.(woff2|webp|png|svg)$/.test(file) ? 'public, max-age=2592000' : 'no-cache'),
}));

/* ------------------------------------------------------------ public: brief */
const clip = (value, max) => String(value == null ? '' : value).replace(/\p{Cc}/gu, (c) => (c === '\n' || c === '\t' ? c : '')).trim().slice(0, max);
app.post('/api/brief', limiter(10 * 60e3, 6, 'Too many requests. Please try again in a few minutes.'), json, async (req, res) => {
  const body = req.body || {};
  if (clip(body.hp, 50) || Number(body.elapsed) < 3000) return res.json({ ok: true }); // bots: look successful, deliver nothing
  const rows = (Array.isArray(body.rows) ? body.rows.slice(0, 40) : []).map((r) => [clip(r && r[0], 60), clip(r && r[1], 2000)]).filter((r) => r[0] && r[1]);
  const field = (label) => (rows.find((r) => r[0] === label) || [])[1] || '';
  if (!field('Name') || !field('Contact') || !field('Business')) return res.status(400).json({ ok: false, error: 'Please fill in your name, contact and business name.' });
  const est = body.estimate && typeof body.estimate === 'object' ? { name: clip(body.estimate.name, 60), price: Number(body.estimate.price) || 0, from: Boolean(body.estimate.from) } : null;
  const brief = { id: crypto.randomBytes(6).toString('hex'), n: (briefs[0]?.n || 0) + 1, createdAt: new Date().toISOString(), status: 'new', rows, estimate: est, tg: null };
  briefs.unshift(brief);
  briefs = briefs.slice(0, 2000);
  brief.tg = await tgSend(briefMessage(brief));
  if (!brief.tg.ok) console.error(`[brief #${brief.n}] Telegram delivery failed: ${brief.tg.error}`);
  saveBriefs();
  console.log(`[brief #${brief.n}] received`);
  return res.json({ ok: true });
});

/* -------------------------------------------------------------------- admin */
app.post('/api/admin/login', limiter(15 * 60e3, 10, 'Too many attempts. Try again later.'), json, (req, res) => {
  if (!checkPassword(req.body && req.body.password)) return res.status(401).json({ ok: false, error: 'Wrong password' });
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `h1_admin=${encodeURIComponent(makeToken())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${12 * 3600}${secure}`);
  return res.json({ ok: true });
});
app.post('/api/admin/logout', (req, res) => { res.setHeader('Set-Cookie', 'h1_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
const admin = express.Router();
admin.use(requireAdmin);
app.use('/api/admin', admin);

admin.get('/me', (req, res) => res.json({ ok: true }));
admin.get('/status', (req, res) => res.json({ ok: true, telegram: { configured: tgConfigured(), chats: tgEnv().chats.length }, node: process.version, uptime: Math.round(process.uptime()), newBriefs: briefs.filter((b) => b.status === 'new').length }));

admin.get('/content', (req, res) => {
  const defs = scanDefaults(template);
  res.json({
    ok: true,
    texts: defs.texts.map((t) => ({ key: t.key, group: SECTION_LABELS[t.key.split('.')[0]] || t.key.split('.')[0], tag: t.tag, default: t.text, value: t.key in content.texts ? content.texts[t.key] : t.text })),
    prices: defs.prices.map((p) => ({ ...p, value: p.key in content.prices ? content.prices[p.key] : p.default })),
    images: defs.images.map((i) => ({ ...i, current: content.images[i.slot] || i.src, custom: Boolean(content.images[i.slot]) })),
  });
});
admin.put('/content', json, (req, res) => {
  const defs = scanDefaults(template);
  const { texts = {}, prices = {} } = req.body || {};
  for (const [key, raw] of Object.entries(texts)) {
    const def = defs.texts.find((t) => t.key === key);
    if (!def) continue;
    const value = clip(raw, 4000);
    if (!value || value === def.text) delete content.texts[key]; else content.texts[key] = value;
  }
  for (const [key, raw] of Object.entries(prices)) {
    const def = defs.prices.find((p) => p.key === key);
    const value = Math.round(Number(raw));
    if (!def || !Number.isFinite(value) || value < 0 || value > (key === 'logo.bundle' ? 90 : 1e6)) continue;
    if (value === def.default) delete content.prices[key]; else content.prices[key] = value;
  }
  saveContent();
  res.json({ ok: true });
});
const IMAGE_TYPES = [['png', Buffer.from([0x89, 0x50, 0x4e, 0x47])], ['jpg', Buffer.from([0xff, 0xd8, 0xff])]];
const imageExt = (buf) => (IMAGE_TYPES.find(([, sig]) => buf.subarray(0, sig.length).equals(sig)) || [])[0] || (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP' ? 'webp' : '');
const dropUpload = (url) => { if (url && url.startsWith('/uploads/')) fs.rm(path.join(UPLOADS, path.basename(url)), () => {}); };
admin.put('/image/:slot', express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '4mb' }), (req, res) => {
  const slot = req.params.slot;
  if (!scanDefaults(template).images.some((i) => i.slot === slot)) return res.status(404).json({ ok: false, error: 'Unknown image slot' });
  const ext = Buffer.isBuffer(req.body) ? imageExt(req.body) : '';
  if (!ext) return res.status(400).json({ ok: false, error: 'Upload a PNG, JPEG or WebP image up to 4 MB' });
  const name = `${slot}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS, name), req.body);
  dropUpload(content.images[slot]);
  content.images[slot] = `/uploads/${name}`;
  saveContent();
  return res.json({ ok: true, url: content.images[slot] });
});
admin.delete('/image/:slot', (req, res) => { dropUpload(content.images[req.params.slot]); delete content.images[req.params.slot]; saveContent(); res.json({ ok: true }); });

admin.get('/briefs', (req, res) => res.json({ ok: true, briefs }));
admin.patch('/briefs/:id', json, (req, res) => {
  const brief = briefs.find((b) => b.id === req.params.id);
  if (!brief || !['new', 'progress', 'done'].includes(req.body && req.body.status)) return res.status(400).json({ ok: false, error: 'Bad request' });
  brief.status = req.body.status; saveBriefs(); return res.json({ ok: true });
});
admin.delete('/briefs/:id', (req, res) => { briefs = briefs.filter((b) => b.id !== req.params.id); saveBriefs(); res.json({ ok: true }); });
admin.post('/briefs/:id/resend', async (req, res) => {
  const brief = briefs.find((b) => b.id === req.params.id);
  if (!brief) return res.status(404).json({ ok: false, error: 'Not found' });
  brief.tg = await tgSend(briefMessage(brief)); saveBriefs();
  return res.json(brief.tg.ok ? { ok: true } : { ok: false, error: brief.tg.error });
});
admin.post('/telegram/test', async (req, res) => {
  const result = await tgSend('✅ <b>Hum1 site</b>: Telegram is connected. New briefs will appear here.');
  res.json(result.ok ? { ok: true } : { ok: false, error: result.error });
});
admin.get('/backup', (req, res) => {
  const uploads = {};
  for (const name of fs.readdirSync(UPLOADS)) uploads[name] = fs.readFileSync(path.join(UPLOADS, name)).toString('base64');
  res.setHeader('Content-Disposition', `attachment; filename="hum1-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ ok: true, version: 1, content, briefs, uploads });
});
admin.post('/restore', express.json({ limit: '40mb' }), (req, res) => {
  const b = req.body;
  if (!b || b.version !== 1 || !b.content || typeof b.content !== 'object' || !Array.isArray(b.briefs)) return res.status(400).json({ ok: false, error: 'This is not a Hum1 backup file' });
  const defs = scanDefaults(template);
  const texts = {}; const prices = {}; const images = {};
  for (const t of defs.texts) if (typeof b.content.texts?.[t.key] === 'string') texts[t.key] = clip(b.content.texts[t.key], 4000);
  for (const p of defs.prices) if (Number.isFinite(Number(b.content.prices?.[p.key]))) prices[p.key] = Math.round(Number(b.content.prices[p.key]));
  const files = {};
  for (const [name, data] of Object.entries(b.uploads && typeof b.uploads === 'object' ? b.uploads : {})) {
    const buf = typeof data === 'string' ? Buffer.from(data, 'base64') : null;
    if (/^[\w.-]+$/.test(name) && buf && buf.length <= 4 * 1024 * 1024 && imageExt(buf)) files[name] = buf;
  }
  for (const i of defs.images) {
    const url = b.content.images?.[i.slot];
    if (typeof url === 'string' && /^\/uploads\/[\w.-]+$/.test(url) && files[path.basename(url)]) images[i.slot] = url;
  }
  for (const [name, buf] of Object.entries(files)) fs.writeFileSync(path.join(UPLOADS, name), buf);
  content.texts = texts; content.prices = prices; content.images = images;
  briefs = b.briefs.slice(0, 2000).filter((x) => x && typeof x.id === 'string' && Array.isArray(x.rows)).map((x) => ({ ...x, rows: x.rows.slice(0, 40).map((r) => [clip(r && r[0], 60), clip(r && r[1], 2000)]) }));
  saveContent(); saveBriefs();
  return res.json({ ok: true, briefs: briefs.length });
});
admin.post('/password', json, (req, res) => {
  const { current, next } = req.body || {};
  if (!checkPassword(current)) return res.status(400).json({ ok: false, error: 'Current password is wrong' });
  if (typeof next !== 'string' || next.length < 8) return res.status(400).json({ ok: false, error: 'New password must have at least 8 characters' });
  adminState.salt = crypto.randomBytes(16).toString('hex'); adminState.hash = hashPassword(next, adminState.salt);
  writeJson(FILES.admin, adminState);
  return res.json({ ok: true });
});

/* ------------------------------------------------------------------- errors */
app.use((req, res) => (req.path.startsWith('/api/') ? res.status(404).json({ ok: false, error: 'Not found' }) : res.status(404).type('text').send('Not found')));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ ok: false, error: status >= 500 ? 'Server error' : 'Bad request' });
});

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Hum1 site is running\n  Site:   http://localhost:${PORT}\n  Admin:  http://localhost:${PORT}/admin`);
    console.log(`  Data folder: ${DATA}`);
    console.log(`  Telegram: ${tgConfigured() ? `connected (${tgEnv().chats.length} chat)` : 'NOT configured, see .env'}`);
    if (!adminState.hash && !process.env.ADMIN_PASSWORD) console.log('  WARNING: ADMIN_PASSWORD is not set, nobody can log in to /admin\n');
  });
  process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
module.exports = app;
