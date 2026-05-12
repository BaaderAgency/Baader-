# Reddit Radar — Baader

A local-first content ideation pipeline for Jesse Ayala's personal brand.

Scans 20 AI / building-in-public subreddits at 6am PT, ranks today's visual posts, lets you save or skip in a clean feed, then generates 5 Oracle-voice hook angles per saved post and flushes everything to a Notion database under `Jesse Ayala — Personal Brand`. A daily summary email is sent to Gmail.

## Stack

| Layer | Choice |
|---|---|
| Backend | Node 20 + Express |
| Local queue | better-sqlite3 (WAL) |
| Scheduler | node-cron (`0 6 * * *` America/Los_Angeles) |
| LLM | Anthropic SDK — Claude Sonnet 4.6 |
| Notion sync | @notionhq/client |
| Email | nodemailer (Gmail app password) |
| Frontend | React 18 via esm.sh + Tailwind CDN — no build step |

## Run it

```bash
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY, NOTION_API_KEY, GMAIL_APP_PASSWORD
npm start
```

Open `http://localhost:5174`.

The 6am PT cron registers automatically on boot. Keep the process running (locally, in a tmux session, or wire it into pm2 / a launchd plist) for the schedule to fire.

## Notion setup

The target database is already provisioned in your workspace:

- **Page:** Jesse Ayala — Personal Brand → 📡 Reddit Radar — Content Ideas
- **DB ID:** `659fe8e8-f976-4f5d-8a31-1e0e965c59c2` (pre-filled in `.env.example`)
- **Schema:** Title, Status, Pillar, Oracle Type, Subreddit, Reddit URL, Image URL, Score, Reddit Posted, Saved On, Source, Hooks Generated, Notes

For the Express server to write to it, create a Notion internal integration at <https://www.notion.so/profile/integrations>, then share the database with that integration. Paste the secret as `NOTION_API_KEY` in `.env`.

## Voice tuning

`server/claude.js` carries Jesse's locked Oracle voice rules verbatim:

- Open with the wrong belief, then reframe.
- Physical/sensory language. No abstractions.
- Consequence before data.
- No CTAs. No bridges. No em dashes.
- Banned words: game-changer, leverage, delve, unlock.
- 40% shorter than feels complete.
- End on scale or a quiet proof point — never a question.

Each saved post gets exactly five hooks: `curiosity`, `contrarian`, `data-led`, `story`, `listicle`.

## Local queue → Notion flush

Save intents land in SQLite immediately. The cron job and `Flush queue → Notion` button drain the queue. This way you can save offline (or if Notion is temporarily unreachable) and nothing gets lost.

Files:

- `data/radar.sqlite` — local queue + scan log
- `server/index.js` — Express + cron entrypoint
- `server/reddit.js` — public Reddit JSON scanner with visual-post filter + decay-weighted ranking
- `server/claude.js` — Oracle-voice hook generation (Claude Sonnet 4.6)
- `server/notion.js` — page builder with image, source block, and Hooks heading
- `server/gmail.js` — HTML summary email
- `public/index.html` + `public/app.js` — single-page React UI

## CLI

```bash
npm run scan      # one-off Reddit pull
npm run flush     # drain SQLite queue → Notion
```

## Brand

Baader teal palette: `#012622`, `#2A4A54`, `#518394`, `#D6E8ED`, `#A5CCD1`. Typography: Inter (body), Montserrat (display).
