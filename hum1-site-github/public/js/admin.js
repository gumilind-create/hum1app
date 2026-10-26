(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((kid) => node.append(kid));
    return node;
  };

  const state = { texts: [], prices: [], images: [], briefs: [], status: {}, tab: 'content', filter: 'all', query: '' };
  const edits = { texts: {}, prices: {} };
  const TABS = [['content', 'Texts'], ['prices', 'Prices'], ['gallery', 'Gallery'], ['briefs', 'Briefs'], ['settings', 'Settings']];

  async function api(path, { method = 'GET', json, body, headers = {} } = {}) {
    const init = { method, credentials: 'same-origin', headers: { 'X-Admin': '1', ...headers } };
    if (json !== undefined) { init.method = method === 'GET' ? 'POST' : method; init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(json); }
    if (body !== undefined) init.body = body;
    const res = await fetch(`/api/admin${path}`, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) { const err = new Error(data.error || `Error ${res.status}`); err.status = res.status; throw err; }
    return data;
  }
  let toastTimer;
  function toast(message, bad = false) {
    const t = $('#toast');
    t.textContent = message; t.className = `toast on${bad ? ' bad' : ''}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = 'toast'; }, 2600);
  }
  const dirtyCount = () => Object.keys(edits.texts).length + Object.keys(edits.prices).length;
  function updateBar() {
    const n = dirtyCount();
    $('#savebar').hidden = n === 0;
    $('#savecount').textContent = `${n} unsaved change${n === 1 ? '' : 's'}`;
  }

  /* ------------------------------------------------------------- texts */
  function renderContent(panel) {
    panel.append(el('h2', { text: 'Texts' }), el('p', { class: 'muted', text: 'Every text on the site, in page order. Edit and press Save. “Reset” returns the original wording.' }));
    panel.append(el('input', { class: 'in', type: 'search', placeholder: 'Search texts…', value: state.query, style: 'margin-bottom:16px', oninput: (e) => { state.query = e.target.value.toLowerCase(); filterFields(panel); } }));
    const groups = new Map();
    state.texts.forEach((t) => groups.set(t.group, [...(groups.get(t.group) || []), t]));
    for (const [name, items] of groups) {
      const fields = items.map((t) => {
        const area = el('textarea', { class: 'in', rows: t.default.length > 90 ? 3 : 1 });
        area.value = edits.texts[t.key] ?? t.value;
        const node = el('div', { class: 'fld', 'data-search': `${t.key} ${t.default} ${t.value}`.toLowerCase() });
        const mark = () => node.classList.toggle('mod', area.value !== t.default);
        area.addEventListener('input', () => { if (area.value === t.value) delete edits.texts[t.key]; else edits.texts[t.key] = area.value; mark(); updateBar(); });
        node.append(el('div', { class: 'head' }, el('code', { text: t.key }), el('button', { class: 'link-btn', type: 'button', text: 'Reset', onclick: () => { area.value = t.default; area.dispatchEvent(new Event('input')); } })), area);
        if (t.value !== t.default || area.value !== t.default) node.append(el('span', { class: 'def', text: `Original: ${t.default}` }));
        mark();
        return node;
      });
      panel.append(el('details', { class: 'group', open: name === 'First screen' }, el('summary', {}, el('span', { text: name }), el('small', { text: `${items.length} texts` })), el('div', { class: 'fields' }, fields)));
    }
    filterFields(panel);
  }
  function filterFields(panel) {
    panel.querySelectorAll('.group').forEach((g) => {
      let shown = 0;
      g.querySelectorAll('.fld').forEach((f) => { const hit = !state.query || f.dataset.search.includes(state.query); f.hidden = !hit; if (hit) shown++; });
      g.hidden = shown === 0;
      if (state.query && shown) g.open = true;
    });
  }

  /* ------------------------------------------------------------ prices */
  function renderPrices(panel) {
    panel.append(el('h2', { text: 'Prices' }), el('p', { class: 'muted', text: 'Whole dollars. Package prices are shown on the site. Service prices are hidden from visitors and only drive the “from” estimate in the calculator and in the brief.' }));
    const section = (title, list) => {
      panel.append(el('h3', { text: title, style: 'margin:22px 0 12px' }));
      panel.append(el('div', { class: 'grid' }, list.map((p) => {
        const input = el('input', { class: 'in', type: 'number', min: 0, max: 1000000, step: 1, id: `p-${p.key}` });
        input.value = edits.prices[p.key] ?? p.value;
        input.addEventListener('input', () => { if (Number(input.value) === p.value) delete edits.prices[p.key]; else edits.prices[p.key] = input.value; updateBar(); });
        return el('div', { class: 'price' }, el('label', { for: `p-${p.key}`, text: p.label }), el('div', { class: 'row' }, el('span', { text: p.key === 'logo.bundle' ? '%' : '$' }), input));
      })));
    };
    section('Packages', state.prices.filter((p) => p.key.startsWith('price.')));
    section('Configurator features', state.prices.filter((p) => p.key.startsWith('feat.')));
    section('Logo design', state.prices.filter((p) => p.key.startsWith('logo.')));
  }

  /* ----------------------------------------------------------- gallery */
  function renderGallery(panel) {
    panel.append(el('h2', { text: 'Gallery' }), el('p', { class: 'muted', text: 'Replace a picture with your own project screenshot (PNG, JPEG or WebP, up to 4 MB, ratio 8:5 works best).' }));
    panel.append(el('div', { class: 'grid' }, state.images.map((img) => {
      const file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', hidden: true });
      file.addEventListener('change', async () => {
        const f = file.files[0]; if (!f) return;
        try { await api(`/image/${img.slot}`, { method: 'PUT', body: f, headers: { 'Content-Type': f.type } }); toast('Picture replaced'); await load(); } catch (e) { toast(e.message, true); }
      });
      return el('div', { class: 'shot' }, el('img', { src: img.current, alt: img.alt }), el('div', {}, el('strong', { text: img.slot.replace('work-', '') }), file,
        el('div', { class: 'actions', style: 'margin:0' }, el('button', { class: 'btn', type: 'button', text: 'Replace', onclick: () => file.click() }),
          img.custom ? el('button', { class: 'ghost', type: 'button', text: 'Use original', onclick: async () => { await api(`/image/${img.slot}`, { method: 'DELETE' }); toast('Original restored'); await load(); } }) : false)));
    })));
  }

  /* ------------------------------------------------------------- briefs */
  const STATUS = { new: 'New', progress: 'In progress', done: 'Done' };
  function renderBriefs(panel) {
    panel.append(el('h2', { text: 'Briefs' }), el('p', { class: 'muted', text: 'Every submitted brief is stored here, even when Telegram is unavailable.' }));
    panel.append(el('div', { class: 'bar' }, ['all', 'new', 'progress', 'done'].map((f) => el('button', { class: `ghost${state.filter === f ? ' on' : ''}`, type: 'button', text: f === 'all' ? 'All' : STATUS[f], onclick: () => { state.filter = f; render(); } }))));
    const list = state.briefs.filter((b) => state.filter === 'all' || b.status === state.filter);
    if (!list.length) panel.append(el('p', { class: 'muted', text: 'No briefs here yet.' }));
    list.forEach((b) => {
      const get = (l) => (b.rows.find((r) => r[0] === l) || [])[1] || '';
      const select = el('select', { class: 'in', 'aria-label': 'Status', onchange: async (e) => { try { await api(`/briefs/${b.id}`, { method: 'PATCH', json: { status: e.target.value } }); await load(); } catch (err) { toast(err.message, true); } } },
        Object.entries(STATUS).map(([v, label]) => el('option', { value: v, text: label, selected: b.status === v })));
      const tg = b.tg && b.tg.ok ? el('span', { class: 'badge ok', text: 'Telegram: sent' }) : el('span', { class: 'badge bad', text: 'Telegram: not sent', title: b.tg ? b.tg.error : '' });
      panel.append(el('article', { class: `brief ${b.status}` },
        el('header', {}, el('h3', { text: `#${b.n} · ${get('Name')} · ${get('Business')}` }), el('span', { class: 'muted', text: new Date(b.createdAt).toLocaleString() })),
        el('div', { class: 'actions' }, select, tg, b.estimate ? el('span', { class: 'badge', text: `${b.estimate.name} ${b.estimate.from ? 'from ' : '~'}$${b.estimate.price}` }) : false),
        el('dl', {}, b.rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
        el('div', { class: 'actions' },
          el('button', { class: 'ghost', type: 'button', text: 'Resend to Telegram', onclick: async () => { try { await api(`/briefs/${b.id}/resend`, { method: 'POST', json: {} }); toast('Sent to Telegram'); } catch (e) { toast(e.message, true); } await load(); } }),
          el('button', { class: 'ghost bad', type: 'button', text: 'Delete', onclick: async () => { if (confirm('Delete this brief for good?')) { await api(`/briefs/${b.id}`, { method: 'DELETE' }); await load(); } } }))));
    });
  }

  async function downloadBackup() {
    try {
      const res = await fetch('/api/admin/backup', { credentials: 'same-origin', headers: { 'X-Admin': '1' } });
      if (!res.ok) throw new Error('Could not create the backup');
      const link = el('a', { href: URL.createObjectURL(await res.blob()), download: `hum1-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(link); link.click(); link.remove();
    } catch (e) { toast(e.message, true); }
  }
  /* ----------------------------------------------------------- settings */
  function renderSettings(panel) {
    const tg = state.status.telegram || {};
    panel.append(el('h2', { text: 'Settings' }));
    panel.append(el('h3', { text: 'Telegram bot', style: 'margin:18px 0 6px' }),
      el('p', { class: 'muted', text: tg.configured ? `Connected, ${tg.chats} chat(s). New briefs are sent there instantly.` : 'Not configured. Put TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID into the .env file and restart the server.' }),
      el('button', { class: 'btn', type: 'button', text: 'Send test message', onclick: async (e) => { e.target.disabled = true; try { await api('/telegram/test', { method: 'POST', json: {} }); toast('Test message sent. Check Telegram.'); } catch (err) { toast(err.message, true); } e.target.disabled = false; } }));
    const cur = el('input', { class: 'in', type: 'password', autocomplete: 'current-password', 'aria-label': 'Current password', placeholder: 'Current password' });
    const next = el('input', { class: 'in', type: 'password', autocomplete: 'new-password', 'aria-label': 'New password', placeholder: 'New password (8+ characters)' });
    panel.append(el('h3', { text: 'Change password', style: 'margin:30px 0 10px' }), el('div', { class: 'stack' }, cur, next,
      el('button', { class: 'btn', type: 'button', text: 'Change password', onclick: async () => { try { await api('/password', { json: { current: cur.value, next: next.value } }); cur.value = next.value = ''; toast('Password changed'); } catch (e) { toast(e.message, true); } } })));
    const restoreFile = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
    restoreFile.addEventListener('change', async () => {
      const f = restoreFile.files[0]; restoreFile.value = '';
      if (!f || !confirm('Replace all current texts, prices, pictures and briefs with this backup?')) return;
      try { const res = await api('/restore', { json: JSON.parse(await f.text()) }); toast(`Backup restored (${res.briefs} briefs)`); await load(); } catch (e) { toast(e.message, true); }
    });
    panel.append(el('h3', { text: 'Backup', style: 'margin:30px 0 6px' }),
      el('p', { class: 'muted', text: 'Free hosting can erase files when the server restarts. Download a backup after big edits and restore it here if anything disappears.' }),
      el('div', { class: 'actions', style: 'margin:0' }, el('button', { class: 'btn', type: 'button', text: 'Download backup', onclick: downloadBackup }), el('button', { class: 'ghost', type: 'button', text: 'Restore from file', onclick: () => restoreFile.click() }), restoreFile));
    panel.append(el('p', { class: 'muted', style: 'margin-top:30px', text: `Server: Node ${state.status.node || ''}, uptime ${Math.round((state.status.uptime || 0) / 60)} min.` }));
  }

  /* ----------------------------------------------------------- shell */
  function render() {
    const tabs = $('#tabs'); tabs.replaceChildren();
    TABS.forEach(([id, label]) => {
      const fresh = id === 'briefs' ? state.briefs.filter((b) => b.status === 'new').length : 0;
      tabs.append(el('button', { type: 'button', class: state.tab === id ? 'on' : '', onclick: () => { state.tab = id; render(); window.scrollTo(0, 0); } }, label, fresh ? el('b', { text: String(fresh) }) : false));
    });
    const panels = $('#panels'); panels.replaceChildren();
    const panel = el('section', { class: 'panel' }); panels.append(panel);
    ({ content: renderContent, prices: renderPrices, gallery: renderGallery, briefs: renderBriefs, settings: renderSettings })[state.tab](panel);
    updateBar();
  }
  async function load() {
    const [c, b, s] = await Promise.all([api('/content'), api('/briefs'), api('/status')]);
    Object.assign(state, { texts: c.texts, prices: c.prices, images: c.images, briefs: b.briefs, status: s });
    render();
  }
  async function enter() {
    $('#login').hidden = true; $('#app').hidden = false;
    try { await load(); } catch (e) { if (e.status === 401) showLogin(); else toast(e.message, true); }
  }
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; $('#pw').focus(); }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#login-err'); err.hidden = true;
    const res = await fetch('/api/admin/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { err.textContent = data.error || 'Could not sign in'; err.hidden = false; return; }
    $('#pw').value = ''; enter();
  });
  $('#logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }); showLogin(); });
  $('#discard').addEventListener('click', () => { edits.texts = {}; edits.prices = {}; render(); });
  async function save() {
    if (!dirtyCount()) return;
    try { await api('/content', { method: 'PUT', json: edits }); edits.texts = {}; edits.prices = {}; toast('Saved. The site is updated.'); await load(); } catch (e) { toast(e.message, true); }
  }
  $('#save').addEventListener('click', save);
  addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } });
  addEventListener('beforeunload', (e) => { if (dirtyCount()) e.preventDefault(); });

  api('/me').then(enter, showLogin);
})();
