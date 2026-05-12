import { config } from './config.js';

const API = `https://api.telegram.org/bot${config.botToken}`;

let offset = 0;

export async function* pollUpdates() {
  while (true) {
    try {
      const url = `${API}/getUpdates?offset=${offset}&timeout=25&allowed_updates=${encodeURIComponent('["message"]')}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = await res.json();
      if (!data.ok) {
        console.error('getUpdates not ok:', data);
        await sleep(2000);
        continue;
      }
      for (const u of data.result) {
        offset = u.update_id + 1;
        yield u;
      }
    } catch (err) {
      console.error('getUpdates error:', err.message);
      await sleep(2000);
    }
  }
}

export async function sendMessage(text, { html = true, replyMarkup = null } = {}) {
  const chunks = [...splitChunks(text, config.maxMsgLen)];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const body = html
      ? { chat_id: config.chatId, text: `<pre>${escapeHtml(chunk)}</pre>`, parse_mode: 'HTML', disable_notification: true, disable_web_page_preview: true }
      : { chat_id: config.chatId, text: chunk, disable_notification: true, disable_web_page_preview: true };
    if (replyMarkup && i === chunks.length - 1) body.reply_markup = replyMarkup;
    try {
      const res = await fetch(`${API}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('sendMessage failed:', res.status, t.slice(0, 200));
      }
    } catch (err) {
      console.error('sendMessage error:', err.message);
    }
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function* splitChunks(text, limit) {
  if (text.length <= limit) { yield text; return; }
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + limit, text.length);
    if (end < text.length) {
      const nl = text.lastIndexOf('\n', end);
      if (nl > i + limit / 2) end = nl + 1;
    }
    yield text.slice(i, end);
    i = end;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
