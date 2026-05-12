import { upsertPost, getEnabledSubreddits, getSettings, logScan } from './db.js';

const UA = 'reddit-radar/0.1 (by Baader; jesse@resiliodm.com)';

const IMAGE_HOSTS = new Set(['i.redd.it', 'i.imgur.com', 'imgur.com']);
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)(\?.*)?$/i;

function isVisual(post) {
  const d = post.data;
  if (d.post_hint === 'image') return true;
  if (d.is_gallery) return true;
  if (d.preview?.images?.length) return true;
  try {
    const u = new URL(d.url);
    if (IMAGE_HOSTS.has(u.hostname.replace(/^www\./, ''))) return true;
    if (IMAGE_EXT.test(u.pathname)) return true;
  } catch {}
  return false;
}

function extractImage(post) {
  const d = post.data;
  if (d.preview?.images?.[0]?.source?.url) {
    return d.preview.images[0].source.url.replace(/&amp;/g, '&');
  }
  if (d.url && IMAGE_EXT.test(d.url)) return d.url;
  if (d.thumbnail && d.thumbnail.startsWith('http')) return d.thumbnail;
  return null;
}

// Hot-ish scoring: score × upvote ratio, decayed slightly by age in hours.
function rankScore(d) {
  const ageHours = Math.max(1, (Date.now() / 1000 - d.created_utc) / 3600);
  const ratio = d.upvote_ratio ?? 0.9;
  const engagement = d.score + 2 * (d.num_comments ?? 0);
  return (engagement * ratio) / Math.pow(ageHours, 0.4);
}

async function fetchSubreddit(name, { limit = 25 } = {}) {
  const url = `https://www.reddit.com/r/${name}/top.json?t=day&limit=${limit}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`reddit ${name} ${res.status}`);
  const json = await res.json();
  return json?.data?.children ?? [];
}

export async function runScan({ trigger = 'manual' } = {}) {
  const start = Date.now();
  const subs = getEnabledSubreddits();
  const settings = getSettings();
  const windowSec = Number(settings.time_window_hours) * 3600;
  const perSub = Math.max(5, Number(settings.posts_per_scan) * 3);
  const minScore = Number(settings.min_score) || 0;
  const visualOnly = Number(settings.visual_only) === 1;

  const cutoff = Date.now() / 1000 - windowSec;
  let fetched = 0;
  let inserted = 0;
  const errors = [];

  for (const sub of subs) {
    try {
      const children = await fetchSubreddit(sub, { limit: perSub });
      for (const child of children) {
        const d = child.data;
        if (!d || d.stickied || d.over_18) continue;
        if (d.created_utc < cutoff) continue;
        if (visualOnly && !isVisual(child)) continue;
        if ((d.score ?? 0) < minScore) continue;

        const image = extractImage(child);
        const row = {
          id: d.id,
          subreddit: sub,
          title: d.title,
          author: d.author,
          url: d.url,
          permalink: `https://www.reddit.com${d.permalink}`,
          image_url: image,
          thumbnail: d.thumbnail?.startsWith('http') ? d.thumbnail : null,
          score: d.score ?? 0,
          num_comments: d.num_comments ?? 0,
          upvote_ratio: d.upvote_ratio ?? null,
          reddit_created_utc: Math.floor(d.created_utc),
          rank_score: rankScore(d),
          fetched_at: Math.floor(Date.now() / 1000),
        };
        const result = upsertPost(row);
        fetched++;
        if (result === 'inserted') inserted++;
      }
      // Be polite to Reddit between requests.
      await new Promise(r => setTimeout(r, 350));
    } catch (e) {
      errors.push(`${sub}: ${e.message}`);
    }
  }

  const duration_ms = Date.now() - start;
  logScan({
    posts_fetched: fetched,
    posts_new: inserted,
    duration_ms,
    notes: [trigger, ...(errors.length ? ['errors:', ...errors] : [])].join(' | '),
  });

  return { fetched, inserted, duration_ms, errors };
}
