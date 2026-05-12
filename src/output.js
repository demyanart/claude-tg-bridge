import { config } from './config.js';
import { capturePane, sessionExists } from './tmux.js';
import { sendMessage } from './telegram.js';

let lastSnapshot = '';
let lastSentSnapshot = '';
let lastChangeAt = 0;
let dirty = false;

export async function startOutputLoop() {
  setInterval(tick, config.pollMs).unref();
}

export async function forceFlush() {
  if (!await sessionExists(config.tmuxSession)) return;
  lastSnapshot = await capturePane(config.tmuxTarget);
  await flush();
}

async function tick() {
  try {
    if (!await sessionExists(config.tmuxSession)) return;
    const snap = await capturePane(config.tmuxTarget);
    if (snap !== lastSnapshot) {
      lastSnapshot = snap;
      lastChangeAt = Date.now();
      dirty = true;
      return;
    }
    if (dirty && Date.now() - lastChangeAt >= config.idleMs) {
      await flush();
      dirty = false;
    }
  } catch (err) {
    console.error('output tick error:', err.message);
  }
}

async function flush() {
  const payload = diff(lastSentSnapshot, lastSnapshot);
  const trimmed = trimTrailingBlank(payload);
  if (!trimmed.trim()) {
    lastSentSnapshot = lastSnapshot;
    return;
  }
  await sendMessage(trimmed);
  lastSentSnapshot = lastSnapshot;
}

function diff(prev, curr) {
  if (!prev) return curr;
  const prevLines = prev.split('\n');
  const currLines = curr.split('\n');
  let i = 0;
  while (i < prevLines.length && i < currLines.length && prevLines[i] === currLines[i]) i++;
  if (i === 0) return curr;
  return currLines.slice(i).join('\n');
}

function trimTrailingBlank(s) {
  return s.replace(/\n+$/g, '');
}
