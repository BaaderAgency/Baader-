import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TABS = [
  { id: 'feed', label: 'Feed', icon: '📡', desc: 'Today’s ranked posts' },
  { id: 'ideate', label: 'Ideate', icon: '💡', desc: 'Hooks for saved posts' },
  { id: 'sources', label: 'Sources', icon: '🗂', desc: 'Subreddits' },
  { id: 'settings', label: 'Settings', icon: '⚙︎', desc: 'Scan + integrations' },
];

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function timeAgo(unixSec) {
  if (!unixSec) return '—';
  const diff = Date.now() / 1000 - unixSec;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

// ── Shell ─────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState('feed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const refreshStatus = useCallback(async () => {
    try { setStatus(await api('/api/status')); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);
  useEffect(() => { setSidebarOpen(false); }, [tab]);

  const showToast = useCallback((msg, kind = 'info') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return html`
    <div className="min-h-screen flex">
      <${Sidebar} tab=${tab} setTab=${setTab} status=${status} open=${sidebarOpen} onClose=${() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <${TopBar} onMenu=${() => setSidebarOpen(true)} tab=${tab} />
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto">
          ${tab === 'feed' && html`<${FeedTab} showToast=${showToast} refreshStatus=${refreshStatus} status=${status} />`}
          ${tab === 'ideate' && html`<${IdeateTab} showToast=${showToast} refreshStatus=${refreshStatus} status=${status} />`}
          ${tab === 'sources' && html`<${SourcesTab} showToast=${showToast} />`}
          ${tab === 'settings' && html`<${SettingsTab} showToast=${showToast} status=${status} refreshStatus=${refreshStatus} />`}
        </main>
      </div>

      ${toast && html`<${Toast} ...${toast} />`}
    </div>
  `;
}

function TopBar({ onMenu, tab }) {
  const current = TABS.find(t => t.id === tab);
  return html`
    <header className="lg:hidden sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
      <button onClick=${onMenu} aria-label="Open menu"
        className="p-2 -ml-2 rounded-md hover:bg-surface text-light">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div className="flex items-baseline gap-2">
        <span className="font-display font-extrabold text-light">Reddit Radar</span>
        <span className="text-xs text-muted uppercase tracking-widest">${current?.label}</span>
      </div>
    </header>
  `;
}

function Sidebar({ tab, setTab, status, open, onClose }) {
  return html`
    <${React.Fragment}>
      ${open && html`
        <div onClick=${onClose}
          className="lg:hidden fixed inset-0 bg-black/60 z-40" />
      `}
      <aside className=${`fixed lg:static top-0 left-0 h-full z-50 w-72 bg-surface border-r border-border
        transform transition-transform duration-200 lg:transform-none
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-display font-extrabold text-white">B</div>
            <div>
              <div className="font-display font-extrabold text-light text-lg leading-none">Reddit Radar</div>
              <div className="text-[11px] uppercase tracking-widest text-accent mt-1">Baader · Oracle</div>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          ${TABS.map(t => html`
            <button key=${t.id} onClick=${() => setTab(t.id)}
              className=${`w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition
                ${tab === t.id
                  ? 'bg-primary/30 border border-primary-light/40 text-light'
                  : 'text-muted hover:bg-ink hover:text-light border border-transparent'}`}>
              <span className="text-xl leading-none mt-0.5">${t.icon}</span>
              <span className="flex-1 min-w-0">
                <div className="font-semibold text-sm">${t.label}</div>
                <div className="text-[11px] opacity-70 truncate">${t.desc}</div>
              </span>
            </button>
          `)}
        </nav>

        <div className="p-4 mt-6 text-xs text-muted space-y-2">
          <${IntegrationBadge} on=${status?.integrations.anthropic} label="Anthropic" />
          <${IntegrationBadge} on=${status?.integrations.notion} label="Notion" />
          <${IntegrationBadge} on=${status?.integrations.gmail} label="Gmail" />
          ${status?.last_scan && html`
            <div className="pt-3 border-t border-border mt-3">
              Last scan: ${timeAgo(status.last_scan.ran_at)}
              <div>${status.last_scan.posts_new} new / ${status.last_scan.posts_fetched} fetched</div>
            </div>
          `}
        </div>
      </aside>
    </${React.Fragment}>
  `;
}

function IntegrationBadge({ on, label }) {
  return html`
    <div className="flex items-center gap-2">
      <span className=${`w-2 h-2 rounded-full ${on ? 'bg-emerald-400' : 'bg-red-400/70'}`}></span>
      <span>${label}: ${on ? 'connected' : 'missing key'}</span>
    </div>
  `;
}

function Toast({ msg, kind }) {
  const colors = {
    info: 'bg-primary-light/20 border-primary-light/40 text-light',
    success: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100',
    error: 'bg-red-500/15 border-red-400/40 text-red-100',
  };
  return html`
    <div className=${`fixed bottom-6 right-6 px-4 py-3 rounded-lg border ${colors[kind] || colors.info} shadow-lg z-50 text-sm max-w-sm`}>
      ${msg}
    </div>
  `;
}

// ── Feed Tab ──────────────────────────────────────────
function FeedTab({ showToast, refreshStatus, status }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api('/api/feed?limit=40');
      setPosts(r.posts);
    } catch (e) { showToast(e.message, 'error'); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function decide(post, decision) {
    setPosts(p => p.filter(x => x.id !== post.id));
    try {
      await api(`/api/posts/${post.id}/decision`, { method: 'POST', body: { decision } });
      refreshStatus();
      if (decision === 'save') showToast(`Saved · queued for Notion`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
      load();
    }
  }

  async function runScan() {
    setScanning(true);
    try {
      const r = await api('/api/scan', { method: 'POST' });
      showToast(`Scan: ${r.inserted} new / ${r.fetched} fetched`, 'success');
      await load();
      refreshStatus();
    } catch (e) { showToast(e.message, 'error'); }
    setScanning(false);
  }

  return html`
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-light">Feed</h1>
          <p className="text-muted text-sm">Ranked visuals from the last scan. Tap save to queue for Notion.</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-xs text-muted">${status?.counts.queued ?? 0} waiting</span>
          <button onClick=${runScan} disabled=${scanning}
            className="px-4 py-2 rounded-lg bg-primary border border-primary-light/40 hover:bg-primary-light/40 transition text-sm font-semibold disabled:opacity-50">
            ${scanning ? 'Scanning…' : 'Scan now'}
          </button>
        </div>
      </div>

      ${loading ? html`<${Skeleton} />` :
        posts.length === 0 ? html`<${EmptyState} title="Nothing in the feed" hint="Hit “Scan now” to pull the last 24 hours." />` :
        html`<div className="grid sm:grid-cols-2 gap-4">
          ${posts.map(p => html`<${PostCard} key=${p.id} post=${p} onDecision=${decide} />`)}
        </div>`}
    </div>
  `;
}

function PostCard({ post, onDecision }) {
  return html`
    <article className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
      ${post.image_url
        ? html`<div className="aspect-[4/3] bg-ink overflow-hidden">
            <img src=${post.image_url} alt="" loading="lazy"
              className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>`
        : html`<div className="aspect-[4/3] bg-gradient-to-br from-primary/40 to-ink flex items-center justify-center text-5xl">📭</div>`}
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[11px] uppercase tracking-widest text-accent mb-2 flex items-center gap-2">
          <span>r/${post.subreddit}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">${post.score} pts · ${post.num_comments} comments</span>
        </div>
        <h3 className="font-semibold text-light text-base leading-snug line-clamp-3 flex-1">${post.title}</h3>
        <div className="flex items-center gap-2 mt-4">
          <button onClick=${() => onDecision(post, 'skip')}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-muted hover:text-light hover:border-primary-light/40 text-sm font-semibold transition">
            Skip
          </button>
          <button onClick=${() => onDecision(post, 'save')}
            className="flex-1 px-3 py-2 rounded-lg bg-primary-light text-ink hover:bg-light text-sm font-semibold transition">
            Save
          </button>
          <a href=${post.permalink} target="_blank" rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-border text-muted hover:text-accent text-sm" aria-label="Open on Reddit">↗</a>
        </div>
      </div>
    </article>
  `;
}

// ── Ideate Tab ────────────────────────────────────────
function IdeateTab({ showToast, refreshStatus, status }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [hooks, setHooks] = useState({});
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api('/api/saved');
      setSaved(r.posts);
    } catch (e) { showToast(e.message, 'error'); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  async function toggle(post) {
    const next = openId === post.id ? null : post.id;
    setOpenId(next);
    if (next && !hooks[post.id]) {
      try {
        const r = await api(`/api/posts/${post.id}/hooks`);
        setHooks(h => ({ ...h, [post.id]: r.hooks }));
      } catch (e) { showToast(e.message, 'error'); }
    }
  }

  async function generate(post) {
    setBusy(b => ({ ...b, [post.id]: true }));
    try {
      const r = await api(`/api/posts/${post.id}/hooks`, { method: 'POST' });
      setHooks(h => ({ ...h, [post.id]: r.hooks }));
      showToast('5 hooks generated', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    setBusy(b => ({ ...b, [post.id]: false }));
  }

  async function flushAll() {
    try {
      const r = await api('/api/flush', { method: 'POST' });
      showToast(`Flushed ${r.flushed}/${r.total ?? 0} to Notion`, 'success');
      await load();
      refreshStatus();
    } catch (e) { showToast(e.message, 'error'); }
  }

  return html`
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-light">Ideate</h1>
          <p className="text-muted text-sm">Saved posts. Generate 5 Oracle-voice hooks, then flush to Notion.</p>
        </div>
        <button onClick=${flushAll}
          className="px-4 py-2 rounded-lg bg-primary border border-primary-light/40 hover:bg-primary-light/40 transition text-sm font-semibold">
          Flush ${status?.counts.pendingFlush ?? 0} → Notion
        </button>
      </div>

      ${loading ? html`<${Skeleton} />` :
        saved.length === 0 ? html`<${EmptyState} title="No saved posts yet" hint="Save something from the feed first." />` :
        html`<div className="space-y-3">
          ${saved.map(p => html`
            <article key=${p.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button onClick=${() => toggle(p)}
                className="w-full text-left p-4 flex items-start gap-4 hover:bg-ink/40 transition">
                ${p.image_url
                  ? html`<img src=${p.image_url} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />`
                  : html`<div className="w-20 h-20 rounded-lg bg-ink flex-shrink-0 flex items-center justify-center text-2xl">📭</div>`}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-widest text-accent">r/${p.subreddit} · ${p.score} pts</div>
                  <h3 className="font-semibold text-light text-sm sm:text-base leading-snug mt-1 line-clamp-2">${p.title}</h3>
                  <div className="text-xs text-muted mt-1">
                    ${p.notion_status === 'synced' ? '✓ in Notion' : 'queued for Notion'}
                    · ${p.hook_count || 0} hooks
                  </div>
                </div>
                <span className="text-muted">${openId === p.id ? '▾' : '▸'}</span>
              </button>

              ${openId === p.id && html`
                <div className="border-t border-border p-4 space-y-3 bg-ink/30">
                  <div className="flex items-center gap-3">
                    <button onClick=${() => generate(p)} disabled=${busy[p.id]}
                      className="px-3 py-2 rounded-lg bg-primary-light text-ink text-sm font-semibold hover:bg-light transition disabled:opacity-50">
                      ${busy[p.id] ? 'Generating…' : (hooks[p.id]?.length ? 'Regenerate hooks' : 'Generate hooks')}
                    </button>
                    <a href=${p.permalink} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Open source ↗</a>
                  </div>
                  ${hooks[p.id]?.length
                    ? html`<div className="space-y-3">
                        ${hooks[p.id].map(h => html`
                          <div key=${h.id} className="bg-surface rounded-lg p-3 border border-border">
                            <div className="text-[10px] uppercase tracking-widest text-accent mb-1">${h.angle}</div>
                            <p className="text-sm text-light leading-relaxed whitespace-pre-wrap">${h.text}</p>
                          </div>`)}
                      </div>`
                    : html`<p className="text-sm text-muted">No hooks generated yet.</p>`}
                </div>
              `}
            </article>
          `)}
        </div>`}
    </div>
  `;
}

// ── Sources Tab ───────────────────────────────────────
function SourcesTab({ showToast }) {
  const [subs, setSubs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [adding, setAdding] = useState('');

  const load = useCallback(async () => {
    const r = await api('/api/subreddits');
    setSubs(r.subreddits);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(name, enabled) {
    setSubs(s => s.map(x => x.name === name ? { ...x, enabled } : x));
    await api(`/api/subreddits/${name}`, { method: 'PATCH', body: { enabled } });
  }

  async function remove(name) {
    if (!confirm(`Remove r/${name}?`)) return;
    await api(`/api/subreddits/${name}`, { method: 'DELETE' });
    load();
  }

  async function add(name) {
    const trimmed = String(name).replace(/^r\//i, '').trim();
    if (!trimmed) return;
    setAdding('');
    try {
      await api('/api/subreddits', { method: 'POST', body: { name: trimmed } });
      showToast(`Added r/${trimmed}`, 'success');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function suggest() {
    try {
      const r = await api('/api/subreddits/suggest', { method: 'POST' });
      setSuggestions(r.suggestions);
    } catch (e) { showToast(e.message, 'error'); }
  }

  return html`
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-light">Sources</h1>
        <p className="text-muted text-sm">Toggle subreddits, add new ones, see suggestions.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <input value=${adding} onChange=${e => setAdding(e.target.value)}
          onKeyDown=${e => e.key === 'Enter' && add(adding)}
          placeholder="r/ClaudeAI or just ClaudeAI"
          className="flex-1 bg-ink border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-light" />
        <button onClick=${() => add(adding)}
          className="px-4 py-2 rounded-lg bg-primary-light text-ink font-semibold text-sm hover:bg-light transition">Add</button>
        <button onClick=${suggest}
          className="px-4 py-2 rounded-lg border border-border text-light hover:border-primary-light/40 text-sm">Suggest more</button>
      </div>

      ${suggestions.length > 0 && html`
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-widest text-accent mb-3">Suggested for AI + builders</div>
          <div className="flex flex-wrap gap-2">
            ${suggestions.map(s => html`
              <button key=${s} onClick=${() => add(s)}
                className="px-3 py-1.5 rounded-lg bg-ink border border-border text-sm text-light hover:border-primary-light/40">
                + r/${s}
              </button>`)}
          </div>
        </div>
      `}

      <div className="bg-surface border border-border rounded-xl divide-y divide-border">
        ${subs.map(s => html`
          <div key=${s.name} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-light text-sm">r/${s.name}</div>
              <div className="text-xs text-muted">${s.enabled ? 'Scanning daily' : 'Paused'}</div>
            </div>
            <${Switch} on=${s.enabled} onChange=${v => toggle(s.name, v)} />
            <button onClick=${() => remove(s.name)}
              className="text-muted hover:text-red-400 text-xs">Remove</button>
          </div>
        `)}
      </div>
    </div>
  `;
}

function Switch({ on, onChange }) {
  return html`
    <button onClick=${() => onChange(!on)}
      className=${`w-11 h-6 rounded-full transition relative ${on ? 'bg-primary-light' : 'bg-border'}`}>
      <span className=${`absolute top-0.5 ${on ? 'left-5' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition`}></span>
    </button>
  `;
}

// ── Settings Tab ──────────────────────────────────────
function SettingsTab({ showToast, status, refreshStatus }) {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api('/api/settings').then(r => setSettings(r.settings)).catch(e => showToast(e.message, 'error'));
  }, [showToast]);

  async function update(key, value) {
    setSettings(s => ({ ...s, [key]: value }));
    try { await api('/api/settings', { method: 'PATCH', body: { settings: { [key]: value } } }); }
    catch (e) { showToast(e.message, 'error'); }
  }

  async function runAction(action, label) {
    setBusy(action);
    try {
      const r = await api(`/api/${action}`, { method: 'POST' });
      showToast(`${label}: ${JSON.stringify(r)}`, 'success');
      refreshStatus();
    } catch (e) { showToast(e.message, 'error'); }
    setBusy('');
  }

  if (!settings) return html`<${Skeleton} />`;

  return html`
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-light">Settings</h1>
        <p className="text-muted text-sm">Scan parameters and manual triggers.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <${Slider} label="Posts per subreddit per scan" value=${settings.posts_per_scan}
          min=${1} max=${25} onChange=${v => update('posts_per_scan', v)} />
        <${Slider} label="Time window (hours)" value=${settings.time_window_hours}
          min=${1} max=${168} onChange=${v => update('time_window_hours', v)} />
        <${Slider} label="Minimum score" value=${settings.min_score}
          min=${0} max=${1000} step=${10} onChange=${v => update('min_score', v)} />
        <label className="flex items-center justify-between">
          <div>
            <div className="text-light text-sm font-semibold">Visual posts only</div>
            <div className="text-xs text-muted">Skip text-only posts when scanning</div>
          </div>
          <${Switch} on=${settings.visual_only === 1} onChange=${v => update('visual_only', v ? 1 : 0)} />
        </label>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
        <div className="text-[11px] uppercase tracking-widest text-accent mb-1">Manual triggers</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <button onClick=${() => runAction('scan', 'Scan')} disabled=${!!busy}
            className="px-4 py-3 rounded-lg bg-primary border border-primary-light/40 hover:bg-primary-light/40 transition text-sm font-semibold disabled:opacity-50">
            ${busy === 'scan' ? 'Scanning…' : 'Scan Reddit now'}
          </button>
          <button onClick=${() => runAction('flush', 'Flush')} disabled=${!!busy}
            className="px-4 py-3 rounded-lg bg-primary border border-primary-light/40 hover:bg-primary-light/40 transition text-sm font-semibold disabled:opacity-50">
            ${busy === 'flush' ? 'Flushing…' : 'Flush queue → Notion'}
          </button>
          <button onClick=${() => runAction('email-summary', 'Email')} disabled=${!!busy}
            className="px-4 py-3 rounded-lg bg-primary border border-primary-light/40 hover:bg-primary-light/40 transition text-sm font-semibold disabled:opacity-50">
            ${busy === 'email-summary' ? 'Sending…' : 'Send summary email'}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 text-sm text-muted space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-accent">Schedule</div>
        <div>Cron: <code className="text-light">${status?.cron}</code></div>
        <div>Timezone: <code className="text-light">${status?.timezone}</code></div>
        <div className="text-xs">Defaults to 6:00am ${status?.timezone ?? 'PT'} daily. Change in your .env to repoint.</div>
      </div>
    </div>
  `;
}

function Slider({ label, value, min, max, step = 1, onChange }) {
  return html`
    <label className="block">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-light font-semibold">${label}</span>
        <span className="text-sm text-accent font-semibold tabular-nums">${value}</span>
      </div>
      <input type="range" min=${min} max=${max} step=${step} value=${value}
        onChange=${e => onChange(Number(e.target.value))}
        className="w-full accent-primary-light" />
    </label>
  `;
}

// ── Misc ──────────────────────────────────────────────
function Skeleton() {
  return html`<div className="space-y-3">
    ${[1,2,3].map(i => html`<div key=${i} className="bg-surface border border-border rounded-xl h-24 animate-pulse" />`)}
  </div>`;
}

function EmptyState({ title, hint }) {
  return html`
    <div className="bg-surface border border-border rounded-2xl p-10 text-center">
      <div className="text-5xl mb-3">📭</div>
      <div className="font-display font-bold text-light text-lg">${title}</div>
      <div className="text-muted text-sm mt-1">${hint}</div>
    </div>
  `;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
