import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exec = promisify(execFile);

async function tmux(args) {
  return exec('tmux', args);
}

export async function sessionExists(name) {
  try {
    await tmux(['has-session', '-t', name]);
    return true;
  } catch {
    return false;
  }
}

export async function capturePane(target) {
  const { stdout } = await tmux(['capture-pane', '-p', '-J', '-t', target]);
  return stdout;
}

export async function sendKey(target, key) {
  await tmux(['send-keys', '-t', target, key]);
}

export async function sendText(target, text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) {
      await tmux(['send-keys', '-t', target, '-l', lines[i]]);
    }
    if (i < lines.length - 1) {
      await tmux(['send-keys', '-t', target, 'S-Enter']);
    }
  }
  await tmux(['send-keys', '-t', target, 'Enter']);
}

export async function pasteText(target, text) {
  const file = join(tmpdir(), `claude-tg-${process.pid}-${Date.now()}.txt`);
  await writeFile(file, text);
  try {
    await tmux(['load-buffer', '-b', 'claude-tg', file]);
    await tmux(['paste-buffer', '-b', 'claude-tg', '-d', '-t', target]);
    await tmux(['send-keys', '-t', target, 'Enter']);
  } finally {
    await unlink(file).catch(() => {});
  }
}
