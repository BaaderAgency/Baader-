import Database from 'better-sqlite3';
import { DB_PATH, DEFAULT_SUBREDDITS, DEFAULT_SETTINGS } from './config.js';

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    url TEXT NOT NULL,
    permalink TEXT NOT NULL,
    image_url TEXT,
    thumbnail TEXT,
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    upvote_ratio REAL,
    reddit_created_utc INTEGER,
    rank_score REAL,
    fetched_at INTEGER NOT NULL,
    decision TEXT,
    decided_at INTEGER,
    notion_status TEXT DEFAULT 'queued',
    notion_page_id TEXT,
    notion_flushed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS hooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    angle TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS subreddits (
    name TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    added_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scan_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ran_at INTEGER NOT NULL,
    posts_fetched INTEGER NOT NULL,
    posts_new INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_posts_decision ON posts(decision);
  CREATE INDEX IF NOT EXISTS idx_posts_notion_status ON posts(notion_status);
  CREATE INDEX IF NOT EXISTS idx_posts_fetched_at ON posts(fetched_at DESC);
`);

const seedSub = db.prepare('INSERT OR IGNORE INTO subreddits (name, enabled, added_at) VALUES (?, 1, ?)');
const seedSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
const now = () => Math.floor(Date.now() / 1000);

const seed = db.transaction(() => {
  for (const s of DEFAULT_SUBREDDITS) seedSub.run(s, now());
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) seedSetting.run(k, String(v));
});
seed();

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    const num = Number(value);
    out[key] = Number.isFinite(num) && value.trim() !== '' ? num : value;
  }
  return out;
}

export function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, String(value));
}

export function getSubreddits() {
  return db.prepare('SELECT name, enabled FROM subreddits ORDER BY name COLLATE NOCASE').all()
    .map(r => ({ name: r.name, enabled: !!r.enabled }));
}

export function getEnabledSubreddits() {
  return db.prepare('SELECT name FROM subreddits WHERE enabled = 1').all().map(r => r.name);
}

export function addSubreddit(name) {
  const clean = String(name).replace(/^r\//i, '').trim();
  if (!clean) return null;
  db.prepare('INSERT OR IGNORE INTO subreddits (name, enabled, added_at) VALUES (?, 1, ?)').run(clean, now());
  return clean;
}

export function toggleSubreddit(name, enabled) {
  db.prepare('UPDATE subreddits SET enabled = ? WHERE name = ?').run(enabled ? 1 : 0, name);
}

export function removeSubreddit(name) {
  db.prepare('DELETE FROM subreddits WHERE name = ?').run(name);
}

export function upsertPost(p) {
  const stmt = db.prepare(`
    INSERT INTO posts (id, subreddit, title, author, url, permalink, image_url, thumbnail,
                       score, num_comments, upvote_ratio, reddit_created_utc, rank_score, fetched_at)
    VALUES (@id, @subreddit, @title, @author, @url, @permalink, @image_url, @thumbnail,
            @score, @num_comments, @upvote_ratio, @reddit_created_utc, @rank_score, @fetched_at)
    ON CONFLICT(id) DO UPDATE SET
      score = excluded.score,
      num_comments = excluded.num_comments,
      upvote_ratio = excluded.upvote_ratio,
      rank_score = excluded.rank_score
  `);
  const info = stmt.run(p);
  return info.changes === 1 && info.lastInsertRowid !== 0 ? 'inserted' : 'updated';
}

export function listFeed({ limit = 50 } = {}) {
  return db.prepare(`
    SELECT * FROM posts
    WHERE decision IS NULL
    ORDER BY rank_score DESC, fetched_at DESC
    LIMIT ?
  `).all(limit);
}

export function listDecisions(decision, limit = 100) {
  return db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM hooks h WHERE h.post_id = p.id) AS hook_count
    FROM posts p
    WHERE decision = ?
    ORDER BY decided_at DESC
    LIMIT ?
  `).all(decision, limit);
}

export function decidePost(id, decision) {
  db.prepare('UPDATE posts SET decision = ?, decided_at = ? WHERE id = ?').run(decision, now(), id);
  return getPost(id);
}

export function getPost(id) {
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
}

export function listHooks(postId) {
  return db.prepare('SELECT * FROM hooks WHERE post_id = ? ORDER BY id ASC').all(postId);
}

export function insertHooks(postId, hooks) {
  const stmt = db.prepare('INSERT INTO hooks (post_id, angle, text, created_at) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(rows => {
    db.prepare('DELETE FROM hooks WHERE post_id = ?').run(postId);
    for (const h of rows) stmt.run(postId, h.angle, h.text, now());
  });
  tx(hooks);
}

export function queuedForFlush() {
  return db.prepare(`
    SELECT * FROM posts
    WHERE decision = 'save' AND notion_status = 'queued'
    ORDER BY decided_at ASC
  `).all();
}

export function markFlushed(id, pageId) {
  db.prepare(`UPDATE posts SET notion_status='synced', notion_page_id=?, notion_flushed_at=? WHERE id = ?`)
    .run(pageId, now(), id);
}

export function markFlushFailed(id, err) {
  db.prepare(`UPDATE posts SET notion_status='error' WHERE id = ?`).run(id);
  db.prepare('INSERT INTO scan_log (ran_at, posts_fetched, posts_new, duration_ms, notes) VALUES (?, 0, 0, 0, ?)')
    .run(now(), `flush_error ${id}: ${err}`);
}

export function logScan({ posts_fetched, posts_new, duration_ms, notes = '' }) {
  db.prepare('INSERT INTO scan_log (ran_at, posts_fetched, posts_new, duration_ms, notes) VALUES (?, ?, ?, ?, ?)')
    .run(now(), posts_fetched, posts_new, duration_ms, notes);
}

export function latestScan() {
  return db.prepare('SELECT * FROM scan_log ORDER BY ran_at DESC LIMIT 1').get();
}

export function counts() {
  const total = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  const queued = db.prepare(`SELECT COUNT(*) as c FROM posts WHERE decision IS NULL`).get().c;
  const saved = db.prepare(`SELECT COUNT(*) as c FROM posts WHERE decision='save'`).get().c;
  const synced = db.prepare(`SELECT COUNT(*) as c FROM posts WHERE notion_status='synced'`).get().c;
  const pendingFlush = db.prepare(`SELECT COUNT(*) as c FROM posts WHERE decision='save' AND notion_status='queued'`).get().c;
  return { total, queued, saved, synced, pendingFlush };
}

export default db;
