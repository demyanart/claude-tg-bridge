import { config } from './config.js';
import { pollUpdates, sendMessage } from './telegram.js';
import { sessionExists, sendKey, sendText, pasteText } from './tmux.js';
import { startOutputLoop, forceFlush } from './output.js';

console.log(`claude-tg-bridge started. Target: ${config.tmuxTarget}`);
if (!process.env.TELEGRAM_ALLOWED_USER_ID) {
  console.log(`TELEGRAM_ALLOWED_USER_ID unset — falling back to TELEGRAM_CHAT_ID (${config.chatId}).`);
}

startOutputLoop();

for await (const update of pollUpdates()) {
  const msg = update.message;
  if (!msg || !msg.text) continue;

  const fromId = String(msg.from?.id ?? '');
  if (fromId !== String(config.allowedUserId)) {
    console.log(`Rejected message from user_id=${fromId}`);
    continue;
  }

  const text = msg.text;

  if (!await sessionExists(config.tmuxSession)) {
    await sendMessage(`tmux session "${config.tmuxSession}" not running. Start it with:\n  tmux new -s ${config.tmuxSession}\nthen run \`claude\` inside.`);
    continue;
  }

  try {
    if (text.startsWith('!')) {
      await handleControl(text.slice(1).trim().toLowerCase());
    } else if (text.includes('\n')) {
      await pasteText(config.tmuxTarget, text);
    } else {
      await sendText(config.tmuxTarget, text);
    }
  } catch (err) {
    console.error('handler error:', err);
    await sendMessage(`bridge error: ${err.message}`, { html: false });
  }
}

async function handleControl(cmd) {
  switch (cmd) {
    case 'esc':
      return sendKey(config.tmuxTarget, 'Escape');
    case 'c-c':
    case 'ctrl-c':
      return sendKey(config.tmuxTarget, 'C-c');
    case 'c-r':
      return sendKey(config.tmuxTarget, 'C-r');
    case 'enter':
      return sendKey(config.tmuxTarget, 'Enter');
    case 'tab':
      return sendKey(config.tmuxTarget, 'Tab');
    case 'up':
      return sendKey(config.tmuxTarget, 'Up');
    case 'down':
      return sendKey(config.tmuxTarget, 'Down');
    case 'snap':
      return forceFlush();
    case 'help':
      return sendMessage(
        'Controls:\n' +
        '  !esc       — Escape\n' +
        '  !c-c       — Ctrl+C (interrupt)\n' +
        '  !enter     — bare Enter (e.g., accept default in prompt)\n' +
        '  !tab/!up/!down — arrows\n' +
        '  !snap      — force re-send current pane\n' +
        '  !help      — this help\n\n' +
        'Anything else is typed into the tmux pane and submitted.',
        { html: false },
      );
    default:
      return sendMessage(`Unknown control: !${cmd}. Try !help.`, { html: false });
  }
}
