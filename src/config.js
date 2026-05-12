function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

export const config = {
  botToken: required('TELEGRAM_BOT_TOKEN'),
  chatId: required('TELEGRAM_CHAT_ID'),
  allowedUserId: process.env.TELEGRAM_ALLOWED_USER_ID || process.env.TELEGRAM_CHAT_ID,
  tmuxSession: process.env.TMUX_SESSION || 'claude',
  tmuxTarget: process.env.TMUX_TARGET || 'claude:0.0',
  pollMs: Number(process.env.TG_BRIDGE_POLL_MS || 500),
  idleMs: Number(process.env.TG_BRIDGE_IDLE_MS || 1500),
  maxMsgLen: 3800,
};
