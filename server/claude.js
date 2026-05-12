import Anthropic from '@anthropic-ai/sdk';
import { env } from './config.js';
import { getPost, insertHooks, listHooks } from './db.js';

const HOOK_ANGLES = ['curiosity', 'contrarian', 'data-led', 'story', 'listicle'];

const SYSTEM = `You are writing LinkedIn hook drafts for Jesse Ayala, founder of Baader.

Jesse's brand archetype is THE ORACLE. Voice rules (locked, non-negotiable):
- Open with the wrong belief the audience holds, then reframe it.
- Physical/sensory language over abstract concepts.
- Consequence before data ("or you risk burning spend" before the 5% stat).
- No CTAs. No setup paragraphs. No "here's how it works" bridges.
- No em dashes. No "game-changer", "leverage", "delve", "unlock".
- Target ~40% shorter than feels complete. Every sentence earns its spot.
- End with a statement of scale or a quiet proof point. Never a question or ask.

Audience: founders + CMOs of DTC brands, financial advisors, medical/wellness practices, agency builders. They want practitioner depth, not theory.

Pillars (used for context, not labels):
1. Framework Reveals — proprietary frameworks
2. Campaign Teardowns — real numbers
3. Contrarian Takes — what most marketers get wrong
4. AI + Agency Operations — how Baader runs

You return STRICT JSON only. No prose, no markdown fences.`;

function buildPrompt(post) {
  return `A trending Reddit post in r/${post.subreddit} was saved as an idea seed.

Title: ${post.title}
Score: ${post.score} · Comments: ${post.num_comments}
URL: ${post.permalink}

Write 5 LinkedIn hook openings for Jesse. Each hook must be 1–2 sentences max, in his Oracle voice. Do not reference Reddit or this post directly — translate the underlying tension into a hook a founder would stop scrolling for.

Required angles (exactly one hook per angle, in this order):
1. curiosity — open a loop the reader can't ignore
2. contrarian — call out a wrong belief most operators hold
3. data-led — lead with a number that flips the assumption
4. story — drop into a scene from real client work
5. listicle — a numbered teardown opener

Output strict JSON:
{
  "hooks": [
    {"angle": "curiosity", "text": "..."},
    {"angle": "contrarian", "text": "..."},
    {"angle": "data-led", "text": "..."},
    {"angle": "story", "text": "..."},
    {"angle": "listicle", "text": "..."}
  ]
}`;
}

function parseHooks(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/```$/, '');
  const json = JSON.parse(cleaned);
  if (!json?.hooks || !Array.isArray(json.hooks)) throw new Error('No hooks array');
  return json.hooks
    .filter(h => h && typeof h.angle === 'string' && typeof h.text === 'string')
    .slice(0, 5);
}

export async function generateHooks(postId) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  const post = getPost(postId);
  if (!post) throw new Error(`Post ${postId} not found`);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildPrompt(post) }],
  });

  const textBlock = resp.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');
  const hooks = parseHooks(textBlock.text);
  insertHooks(postId, hooks);
  return listHooks(postId);
}

export { HOOK_ANGLES };
