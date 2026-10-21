import { NETWORKS, DEFAULT_ON, buildLinks, googleAllLink } from './networks.js';

const $ = (id) => document.getElementById(id);

// ---------- Storage (may be unavailable in private mode, so never trust it) ----------
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

const KEY_NETS = 'sf.networks';
const KEY_RECENT = 'sf.recent';
const MAX_RECENT = 12;

const state = {
  mode: 'name',
  enabled: new Set(store.get(KEY_NETS, DEFAULT_ON)),
  recent: store.get(KEY_RECENT, []),
  last: null, // the last search shown { mode, term, extra }
};

// ---------- Mode switch ----------
const termInput = $('term');
const extraInput = $('extra');

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.seg button').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.mode === mode));
  });
  const isName = mode === 'name';
  $('termLabel').textContent = isName ? "Person's name" : 'Username';
  termInput.placeholder = isName ? 'e.g. Anna Petrosyan' : 'e.g. anna.petrosyan';
  termInput.autocapitalize = isName ? 'words' : 'none';
  termInput.spellcheck = isName;
  $('extraField').hidden = !isName;
}

document.querySelectorAll('.seg button').forEach((b) => {
  b.addEventListener('click', () => { setMode(b.dataset.mode); termInput.focus(); });
});

// Typing "@name" is a clear sign of a username.
termInput.addEventListener('input', () => {
  if (state.mode === 'name' && termInput.value.trimStart().startsWith('@')) setMode('username');
});

// ---------- Search ----------
function cleanUsername(raw) {
  let u = raw.trim();
  // Accept a pasted profile link such as https://instagram.com/anna/ and keep "anna".
  try {
    if (/^https?:\/\//i.test(u)) {
      const parts = new URL(u).pathname.split('/').filter(Boolean);
      if (parts.length) u = parts[parts.length - 1];
    }
  } catch { /* not a URL */ }
  return u.replace(/^@+/, '').trim();
}

function enabledNetworks() {
  return NETWORKS.filter((n) => state.enabled.has(n.id));
}

function runSearch({ mode, term, extra = '' }, { remember = true } = {}) {
  term = mode === 'username' ? cleanUsername(term) : term.trim().replace(/\s+/g, ' ');
  extra = mode === 'name' ? extra.trim().replace(/\s+/g, ' ') : '';
  if (!term) { toast('Type a name or username first'); termInput.focus(); return; }
  if (mode === 'username' && /\s/.test(term)) {
    toast('Usernames have no spaces. Switched to full name.');
    setMode('name');
    mode = 'name';
  }

  state.last = { mode, term, extra };
  render();

  const params = new URLSearchParams({ mode, q: term });
  if (extra) params.set('extra', extra);
  history.replaceState(null, '', `?${params}`);

  if (remember) addRecent(state.last);
}

$('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  termInput.blur(); // closes the phone keyboard so results are visible
  runSearch({ mode: state.mode, term: termInput.value, extra: extraInput.value });
});

// ---------- Results ----------
const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const ICON_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>';
const canShare = typeof navigator.share === 'function';

function currentLinks() {
  if (!state.last) return [];
  return buildLinks({ ...state.last, networks: enabledNetworks() });
}

function titleFor({ mode, term, extra }) {
  const who = mode === 'username' ? `@${term}` : `"${term}"`;
  return extra ? `${who} + ${extra}` : who;
}

function render() {
  const box = $('results');
  const list = $('list');
  if (!state.last) { box.hidden = true; return; }

  const links = currentLinks();
  box.hidden = false;
  $('resultsTitle').textContent = `${links.length} links for ${titleFor(state.last)}`;
  list.replaceChildren();

  const google = $('googleAll');
  google.hidden = links.length === 0;
  if (links.length) {
    const g = state.last.extra ? `${state.last.term}" "${state.last.extra}` : state.last.term;
    google.href = googleAllLink(g, enabledNetworks(), state.last.mode);
  }

  if (!links.length) {
    const li = document.createElement('li');
    li.className = 'hint';
    li.textContent = 'No networks selected. Open "Networks to search" below and pick some.';
    list.append(li);
    return;
  }

  for (const link of links) list.append(rowFor(link));
}

function rowFor({ network: n, url, kind }) {
  const li = document.createElement('li');
  li.className = 'row';

  const a = document.createElement('a');
  a.className = 'main';
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.style.setProperty('--c', n.color);
  if (n.ink) badge.style.setProperty('--ink', n.ink);
  badge.textContent = n.label;

  const info = document.createElement('span');
  info.className = 'info';
  const name = document.createElement('strong');
  name.textContent = n.name;
  const sub = document.createElement('small');
  const k = document.createElement('span');
  k.className = 'kind';
  k.textContent = kind;
  sub.append(k, ` · ${url.replace(/^https?:\/\/(www\.)?/, '')}`);
  info.append(name, sub);
  a.append(badge, info);

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'icon-btn';
  copy.title = `Copy ${n.name} link`;
  copy.setAttribute('aria-label', copy.title);
  copy.innerHTML = ICON_COPY;
  copy.addEventListener('click', () => copyText(url, `${n.name} link copied`));

  li.append(a, copy);

  if (canShare) {
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'icon-btn';
    share.title = `Share ${n.name} link`;
    share.setAttribute('aria-label', share.title);
    share.innerHTML = ICON_SHARE;
    share.addEventListener('click', () => shareText({ title: `${n.name}: ${titleFor(state.last)}`, url }));
    li.append(share);
  }
  return li;
}

function allLinksText() {
  const lines = currentLinks().map((l) => `${l.network.name}: ${l.url}`);
  return `Links for ${titleFor(state.last)}\n\n${lines.join('\n')}`;
}

$('copyAll').addEventListener('click', () => copyText(allLinksText(), 'All links copied'));
$('shareAll').addEventListener('click', () => {
  const text = allLinksText();
  if (canShare) shareText({ title: `Links for ${titleFor(state.last)}`, text });
  else copyText(text, 'Sharing isn\'t supported here, so the links were copied instead');
});

// ---------- Copy / share helpers ----------
async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older browsers or non-secure pages: fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    if (!ok) { showCopyDialog(text); return; }
  }
  toast(message);
}

// Last resort when the browser blocks the clipboard: show the text, selected, to copy by hand.
function showCopyDialog(text) {
  const dlg = $('copyDialog');
  const box = $('copyText');
  box.value = text;
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  box.focus();
  box.select();
}

async function shareText(data) {
  try {
    await navigator.share(data);
  } catch (err) {
    if (err && err.name === 'AbortError') return; // the person closed the share sheet
    copyText(data.url || data.text, 'Copied instead');
  }
}

let toastTimer;
function toast(message) {
  const t = $('toast');
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

// ---------- Recent searches ----------
function addRecent(item) {
  const same = (r) => r.mode === item.mode && r.term.toLowerCase() === item.term.toLowerCase()
    && (r.extra || '').toLowerCase() === (item.extra || '').toLowerCase();
  state.recent = [item, ...state.recent.filter((r) => !same(r))].slice(0, MAX_RECENT);
  store.set(KEY_RECENT, state.recent);
  renderRecent();
}

function renderRecent() {
  const box = $('recentBox');
  const ul = $('recent');
  box.hidden = state.recent.length === 0;
  ul.replaceChildren();
  for (const r of state.recent) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = r.mode === 'username' ? `@${r.term}` : r.term;
    if (r.extra) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = r.extra;
      b.append(tag);
    }
    b.addEventListener('click', () => {
      setMode(r.mode);
      termInput.value = r.term;
      extraInput.value = r.extra || '';
      runSearch(r);
      $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.append(b);
    ul.append(li);
  }
}

$('clearRecent').addEventListener('click', () => {
  state.recent = [];
  store.set(KEY_RECENT, state.recent);
  renderRecent();
});

// ---------- Network settings ----------
function renderSettings() {
  const grid = $('netList');
  grid.replaceChildren();
  for (const n of NETWORKS) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state.enabled.has(n.id);
    input.addEventListener('change', () => {
      if (input.checked) state.enabled.add(n.id); else state.enabled.delete(n.id);
      saveNetworks();
    });
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.setProperty('--c', n.color);
    label.append(input, dot, n.name);
    grid.append(label);
  }
  updateNetCount();
}

function saveNetworks() {
  store.set(KEY_NETS, [...state.enabled]);
  updateNetCount();
  render();
}

function updateNetCount() {
  $('netCount').textContent = `(${state.enabled.size} of ${NETWORKS.length})`;
}

$('allOn').addEventListener('click', () => {
  state.enabled = new Set(NETWORKS.map((n) => n.id));
  renderSettings();
  saveNetworks();
});
$('allOff').addEventListener('click', () => {
  state.enabled = new Set();
  renderSettings();
  saveNetworks();
});

// ---------- Install button ----------
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  $('installBtn').hidden = false;
});
$('installBtn').addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  $('installBtn').hidden = true;
});
window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; });

// ---------- Start ----------
function startFromUrl() {
  const p = new URLSearchParams(location.search);
  // "text"/"title" arrive when another app shares something into this one.
  let term = p.get('q') || p.get('text') || p.get('title') || '';
  let mode = p.get('mode') === 'username' ? 'username' : 'name';
  if (!p.get('mode') && term.trim().startsWith('@')) mode = 'username';
  const extra = p.get('extra') || '';
  setMode(mode);
  if (term.trim()) {
    termInput.value = term.trim();
    extraInput.value = extra;
    // A reload or bookmark (?q=...) shouldn't add to Recent again; a share should.
    runSearch({ mode, term, extra }, { remember: !p.has('q') });
  }
}

renderSettings();
renderRecent();
startFromUrl();

if ('serviceWorker' in navigator) {
  // When a new version takes over, reload once so the page uses the new files.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  });
}
