import { Client } from '@notionhq/client';
import { env } from './config.js';
import { queuedForFlush, listHooks, markFlushed, markFlushFailed } from './db.js';
import { generateHooks } from './claude.js';

function client() {
  if (!env.NOTION_API_KEY) throw new Error('NOTION_API_KEY not set');
  return new Client({ auth: env.NOTION_API_KEY });
}

const SUBREDDIT_TAG = new Set([
  'ArtificialIntelligence','ClaudeAI','OpenAI','LocalLLaMA','singularity','MachineLearning',
  'PromptEngineering','AI_Agents','SaaS','Entrepreneur','startups','buildinpublic','sideproject',
  'IndieHackers','webdev','programming','marketing','copywriting','socialmedia','digital_marketing',
]);

function subSelect(name) {
  if (SUBREDDIT_TAG.has(name)) return { select: { name: `r/${name}` } };
  return undefined;
}

function buildProperties(post, hooksGenerated) {
  const props = {
    Title: { title: [{ text: { content: post.title.slice(0, 1900) } }] },
    Status: { select: { name: 'New' } },
    Source: { select: { name: 'Reddit Radar' } },
    'Reddit URL': { url: post.permalink },
    Score: { number: post.score ?? 0 },
    'Saved On': { date: { start: new Date((post.decided_at ?? Date.now() / 1000) * 1000).toISOString() } },
    'Reddit Posted': { date: { start: new Date((post.reddit_created_utc ?? Date.now() / 1000) * 1000).toISOString() } },
    'Hooks Generated': { checkbox: !!hooksGenerated },
  };
  if (post.image_url) props['Image URL'] = { url: post.image_url };
  const sub = subSelect(post.subreddit);
  if (sub) props.Subreddit = sub;
  return props;
}

function buildChildren(post, hooks) {
  const children = [];

  if (post.image_url) {
    children.push({
      object: 'block', type: 'image',
      image: { type: 'external', external: { url: post.image_url } },
    });
  }

  children.push({
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: 'Source' } }] },
  });
  children.push({
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [
      { type: 'text', text: { content: `r/${post.subreddit} · ` } },
      { type: 'text', text: { content: post.title, link: { url: post.permalink } } },
    ] },
  });
  children.push({
    object: 'block', type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ type: 'text', text: {
      content: `${post.score} upvotes · ${post.num_comments} comments · ratio ${(post.upvote_ratio ?? 0).toFixed(2)}`
    } }] },
  });

  children.push({
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: 'Hooks' } }] },
  });

  if (!hooks?.length) {
    children.push({
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: 'Hook generation not yet run.' } }] },
    });
  } else {
    for (const h of hooks) {
      children.push({
        object: 'block', type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: h.angle } }] },
      });
      children.push({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: h.text } }] },
      });
    }
  }

  return children;
}

async function ensureHooks(post) {
  let hooks = listHooks(post.id);
  if (hooks.length === 0 && env.ANTHROPIC_API_KEY) {
    try { hooks = await generateHooks(post.id); }
    catch (e) { console.warn(`[notion] hook gen failed for ${post.id}: ${e.message}`); }
  }
  return hooks;
}

export async function flushQueue() {
  if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
    return { flushed: 0, skipped: 'notion not configured' };
  }
  const notion = client();
  const queue = queuedForFlush();
  let flushed = 0;
  const errors = [];

  for (const post of queue) {
    try {
      const hooks = await ensureHooks(post);
      const page = await notion.pages.create({
        parent: { database_id: env.NOTION_DATABASE_ID },
        properties: buildProperties(post, hooks.length > 0),
        children: buildChildren(post, hooks),
      });
      markFlushed(post.id, page.id);
      flushed++;
    } catch (e) {
      console.error(`[notion] flush failed for ${post.id}:`, e.message);
      markFlushFailed(post.id, e.message);
      errors.push(`${post.id}: ${e.message}`);
    }
  }

  return { flushed, total: queue.length, errors };
}
