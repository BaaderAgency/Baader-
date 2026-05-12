import nodemailer from 'nodemailer';
import { env } from './config.js';
import { listFeed, counts, latestScan } from './db.js';

function transport() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

function renderHtml(top, stats, scan) {
  const rows = top.slice(0, 10).map(p => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1f2d31;vertical-align:top;width:96px;">
        ${p.image_url ? `<img src="${p.image_url}" width="80" style="border-radius:6px;display:block;" />` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #1f2d31;color:#E8EFF1;font-family:Inter,Arial,sans-serif;">
        <div style="font-weight:600;font-size:14px;">
          <a href="${p.permalink}" style="color:#A5CCD1;text-decoration:none;">${escapeHtml(p.title)}</a>
        </div>
        <div style="color:#8FA4A9;font-size:12px;margin-top:4px;">
          r/${p.subreddit} · ${p.score} pts · ${p.num_comments} comments
        </div>
      </td>
    </tr>`).join('');

  return `<!doctype html>
<html><body style="margin:0;background:#0B1416;font-family:Inter,Arial,sans-serif;color:#E8EFF1;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#A5CCD1;font-weight:600;">
      Baader · Reddit Radar
    </div>
    <h1 style="margin:8px 0 24px;font-size:24px;color:#fff;">Today's top ${top.length} visual posts</h1>
    <div style="background:#121E22;border:1px solid #1f2d31;border-radius:12px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px;color:#8FA4A9;">
        <div><strong style="color:#fff;">${stats.queued}</strong> in feed</div>
        <div><strong style="color:#fff;">${stats.pendingFlush}</strong> waiting for Notion</div>
        <div><strong style="color:#fff;">${stats.synced}</strong> synced lifetime</div>
        ${scan ? `<div style="color:#8FA4A9;">last scan: ${scan.posts_new} new · ${scan.duration_ms}ms</div>` : ''}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#121E22;border:1px solid #1f2d31;border-radius:12px;overflow:hidden;">
      ${rows || `<tr><td style="padding:16px;color:#8FA4A9;">No posts in feed.</td></tr>`}
    </table>
    <p style="margin-top:24px;color:#8FA4A9;font-size:12px;">
      Tap into the local Radar at http://localhost:${env.PORT} to save or skip.
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

export async function sendSummary() {
  const t = transport();
  if (!t) return { sent: false, reason: 'gmail not configured' };
  const top = listFeed({ limit: 10 });
  const stats = counts();
  const scan = latestScan();

  const subject = `Reddit Radar — ${top.length} fresh posts ready`;
  const html = renderHtml(top, stats, scan);
  const text = top.map(p => `• ${p.title}\n  r/${p.subreddit} · ${p.score} pts · ${p.permalink}`).join('\n\n');

  await t.sendMail({
    from: `Reddit Radar <${env.GMAIL_USER}>`,
    to: env.GMAIL_TO,
    subject,
    text,
    html,
  });
  return { sent: true, count: top.length };
}
