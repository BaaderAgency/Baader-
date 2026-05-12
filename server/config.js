import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const DB_PATH = path.join(DATA_DIR, 'radar.sqlite');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const env = {
  PORT: Number(process.env.PORT ?? 5174),
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  NOTION_API_KEY: process.env.NOTION_API_KEY ?? '',
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID ?? '',
  GMAIL_USER: process.env.GMAIL_USER ?? '',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ?? '',
  GMAIL_TO: process.env.GMAIL_TO ?? process.env.GMAIL_USER ?? '',
  SCAN_TIMEZONE: process.env.SCAN_TIMEZONE ?? 'America/Los_Angeles',
  SCAN_CRON: process.env.SCAN_CRON ?? '0 6 * * *',
};

export const DEFAULT_SUBREDDITS = [
  'ArtificialIntelligence',
  'ClaudeAI',
  'OpenAI',
  'LocalLLaMA',
  'singularity',
  'MachineLearning',
  'PromptEngineering',
  'AI_Agents',
  'SaaS',
  'Entrepreneur',
  'startups',
  'buildinpublic',
  'sideproject',
  'IndieHackers',
  'webdev',
  'programming',
  'marketing',
  'copywriting',
  'socialmedia',
  'digital_marketing',
];

export const DEFAULT_SETTINGS = {
  posts_per_scan: 8,
  time_window_hours: 24,
  min_score: 50,
  visual_only: 1,
};

export const BAADER_BRAND = {
  dark: '#012622',
  primary: '#2A4A54',
  primaryLight: '#518394',
  light: '#D6E8ED',
  accent: '#A5CCD1',
  bg: '#0B1416',
  surface: '#121E22',
  text: '#E8EFF1',
  muted: '#8FA4A9',
};
