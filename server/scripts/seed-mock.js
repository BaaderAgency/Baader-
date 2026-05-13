// Seeds realistic mock Reddit posts so the UI demo has content.
// Only useful in sandbox/dev — never call this in production.
import { upsertPost } from '../db.js';

const now = Math.floor(Date.now() / 1000);

const mocks = [
  {
    id: 'mock_001',
    subreddit: 'ClaudeAI',
    title: 'I gave Claude a CRM and a sales pipeline. It closed two deals on its own.',
    author: 'startup_founder',
    image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    score: 2843, num_comments: 412, upvote_ratio: 0.94,
    permalink: 'https://reddit.com/r/ClaudeAI/comments/mock001',
  },
  {
    id: 'mock_002',
    subreddit: 'buildinpublic',
    title: 'Day 47 of building solo: $4,200 MRR, 0 employees, 1 cron job',
    author: 'indie_dev',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    score: 1924, num_comments: 287, upvote_ratio: 0.96,
    permalink: 'https://reddit.com/r/buildinpublic/comments/mock002',
  },
  {
    id: 'mock_003',
    subreddit: 'marketing',
    title: 'We A/B tested 47 LinkedIn hooks. The contrarian ones beat curiosity by 3.2x.',
    author: 'growth_marketer',
    image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
    score: 1547, num_comments: 198, upvote_ratio: 0.92,
    permalink: 'https://reddit.com/r/marketing/comments/mock003',
  },
  {
    id: 'mock_004',
    subreddit: 'AI_Agents',
    title: 'My agent stack: Claude orchestrator + 4 specialized sub-agents. Architecture diagram inside.',
    author: 'agent_builder',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    score: 3211, num_comments: 524, upvote_ratio: 0.97,
    permalink: 'https://reddit.com/r/AI_Agents/comments/mock004',
  },
  {
    id: 'mock_005',
    subreddit: 'copywriting',
    title: 'I rewrote a $40k landing page and the conversion rate fell 18%. Here\'s what I learned.',
    author: 'copy_chief',
    image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    score: 1102, num_comments: 156, upvote_ratio: 0.91,
    permalink: 'https://reddit.com/r/copywriting/comments/mock005',
  },
  {
    id: 'mock_006',
    subreddit: 'Entrepreneur',
    title: 'Killed my $12k/month service business to bet on AI. 60 days in.',
    author: 'pivot_ceo',
    image_url: 'https://images.unsplash.com/photo-1664575600397-92b96bf61ddc?w=800&q=80',
    score: 2398, num_comments: 391, upvote_ratio: 0.89,
    permalink: 'https://reddit.com/r/Entrepreneur/comments/mock006',
  },
  {
    id: 'mock_007',
    subreddit: 'SaaS',
    title: 'Our churn dropped 41% the week we deleted half the onboarding flow.',
    author: 'saas_founder',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    score: 1789, num_comments: 234, upvote_ratio: 0.95,
    permalink: 'https://reddit.com/r/SaaS/comments/mock007',
  },
  {
    id: 'mock_008',
    subreddit: 'OpenAI',
    title: 'GPT-5 vs Claude 4.7 on 200 real customer support tickets. Receipts inside.',
    author: 'ai_researcher',
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    score: 4521, num_comments: 712, upvote_ratio: 0.93,
    permalink: 'https://reddit.com/r/OpenAI/comments/mock008',
  },
  {
    id: 'mock_009',
    subreddit: 'IndieHackers',
    title: 'I tracked every minute of building my SaaS for 90 days. 73% wasn\'t coding.',
    author: 'time_tracker',
    image_url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
    score: 1356, num_comments: 178, upvote_ratio: 0.94,
    permalink: 'https://reddit.com/r/IndieHackers/comments/mock009',
  },
  {
    id: 'mock_010',
    subreddit: 'PromptEngineering',
    title: 'One prompt pattern that fixed 80% of our hallucinations. Three lines of XML.',
    author: 'prompt_eng',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    score: 2876, num_comments: 445, upvote_ratio: 0.96,
    permalink: 'https://reddit.com/r/PromptEngineering/comments/mock010',
  },
];

for (const m of mocks) {
  const ageHours = 4 + Math.random() * 16;
  upsertPost({
    ...m,
    url: m.permalink,
    thumbnail: m.image_url,
    reddit_created_utc: now - Math.floor(ageHours * 3600),
    rank_score: (m.score + 2 * m.num_comments) * m.upvote_ratio / Math.pow(ageHours, 0.4),
    fetched_at: now,
  });
}

console.log(`Seeded ${mocks.length} mock posts.`);
process.exit(0);
