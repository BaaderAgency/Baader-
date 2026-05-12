import express from 'express';
import cron from 'node-cron';
import path from 'node:path';
import { env, PUBLIC_DIR, BAADER_BRAND, DEFAULT_SETTINGS } from './config.js';
import {
  listFeed, listDecisions, decidePost, getPost, listHooks,
  getSubreddits, addSubreddit, toggleSubreddit, removeSubreddit,
  getSettings, setSetting, counts, latestScan,
} from './db.js';
import { runScan } from './reddit.js';
import { generateHooks } from './claude.js';
import { flushQueue } from './notion.js';
import { sendSummary } from './gmail.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/api/status', (req, res) => {
  res.json({
    brand: BAADER_BRAND,
    counts: counts(),
    last_scan: latestScan(),
    timezone: env.SCAN_TIMEZONE,
    cron: env.SCAN_CRON,
    integrations: {
      anthropic: !!env.ANTHROPIC_API_KEY,
      notion: !!(env.NOTION_API_KEY && env.NOTION_DATABASE_ID),
      gmail: !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD),
    },
  });
});

app.get('/api/feed', (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 30), 100);
  res.json({ posts: listFeed({ limit }) });
});

app.get('/api/saved', (req, res) => {
  res.json({ posts: listDecisions('save') });
});

app.get('/api/skipped', (req, res) => {
  res.json({ posts: listDecisions('skip', 50) });
});

app.post('/api/posts/:id/decision', (req, res) => {
  const { decision } = req.body ?? {};
  if (!['save', 'skip'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be save or skip' });
  }
  const post = decidePost(req.params.id, decision);
  if (!post) return res.status(404).json({ error: 'not found' });
  res.json({ post });
});

app.get('/api/posts/:id/hooks', (req, res) => {
  const post = getPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  res.json({ post, hooks: listHooks(req.params.id) });
});

app.post('/api/posts/:id/hooks', async (req, res) => {
  try {
    const hooks = await generateHooks(req.params.id);
    res.json({ hooks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/subreddits', (req, res) => {
  res.json({ subreddits: getSubreddits() });
});

app.post('/api/subreddits', (req, res) => {
  const name = addSubreddit(req.body?.name ?? '');
  if (!name) return res.status(400).json({ error: 'invalid name' });
  res.json({ name });
});

app.patch('/api/subreddits/:name', (req, res) => {
  toggleSubreddit(req.params.name, !!req.body?.enabled);
  res.json({ ok: true });
});

app.delete('/api/subreddits/:name', (req, res) => {
  removeSubreddit(req.params.name);
  res.json({ ok: true });
});

app.get('/api/settings', (req, res) => {
  res.json({ settings: getSettings(), defaults: DEFAULT_SETTINGS });
});

app.patch('/api/settings', (req, res) => {
  const updates = req.body?.settings ?? {};
  for (const [k, v] of Object.entries(updates)) setSetting(k, v);
  res.json({ settings: getSettings() });
});

app.post('/api/scan', async (req, res) => {
  try {
    const result = await runScan({ trigger: 'manual' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/flush', async (req, res) => {
  try {
    const result = await flushQueue();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/email-summary', async (req, res) => {
  try {
    const result = await sendSummary();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subreddits/suggest', async (req, res) => {
  // Static curated suggestions until Claude-based discovery is wired.
  const existing = new Set(getSubreddits().map(s => s.name.toLowerCase()));
  const pool = [
    'agi', 'AIDungeon', 'AItoolsCatalog', 'aiwars', 'ChatGPTCoding', 'cursor',
    'gpt5', 'GeminiAI', 'huggingface', 'languagemodels', 'midjourney', 'mlops',
    'NoCodeSaaS', 'NeuralNetwork', 'NLP', 'OpenSourceAI', 'PerplexityAI',
    'productivity', 'replit', 'StableDiffusion', 'vibecoding', 'workflows',
    'CharacterAI', 'datascience', 'devops', 'webdesign',
  ].filter(name => !existing.has(name.toLowerCase()));
  res.json({ suggestions: pool.slice(0, 10) });
});

app.get('/api/last-scan', (req, res) => res.json({ scan: latestScan() }));

app.get('*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(env.PORT, () => {
  console.log(`\n  ▲ Reddit Radar listening on http://localhost:${env.PORT}`);
  console.log(`    Scan cron: ${env.SCAN_CRON} (${env.SCAN_TIMEZONE})`);
  console.log(`    Notion DB: ${env.NOTION_DATABASE_ID || '(unset)'}`);
});

if (cron.validate(env.SCAN_CRON)) {
  cron.schedule(env.SCAN_CRON, async () => {
    console.log('[cron] starting 6am scan');
    try {
      const scan = await runScan({ trigger: 'cron' });
      console.log(`[cron] scan complete: ${scan.inserted} new / ${scan.fetched} fetched`);
      const flush = await flushQueue();
      console.log(`[cron] flushed ${flush.flushed} saved posts to Notion`);
      const mail = await sendSummary();
      console.log(`[cron] gmail: ${JSON.stringify(mail)}`);
    } catch (e) {
      console.error('[cron] failed:', e);
    }
  }, { timezone: env.SCAN_TIMEZONE });
  console.log(`  ✓ Cron registered (${env.SCAN_CRON} ${env.SCAN_TIMEZONE})`);
} else {
  console.warn(`  ⚠ Invalid cron expression: ${env.SCAN_CRON}`);
}
