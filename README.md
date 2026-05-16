# claude-tg-bridge

Drive a local `claude` CLI session from Telegram. A tiny Node bridge polls Telegram for messages, types them into a `tmux` pane running `claude`, and streams the pane's output back to your chat.

Zero npm dependencies — Node 22+ built-ins only (`fetch`, `--env-file`, `node:child_process`).

> **First time here?** If you're using Claude Code, run `/quickstart` from the project root — it walks you through every step below interactively.

## How it works

```
Telegram chat  ⇄  bridge (Node)  ⇄  tmux session  →  claude CLI
```

- Messages → `tmux send-keys` into the pane (single-line) or `load-buffer` + `paste-buffer` (multiline).
- The pane is snapshotted every 500 ms. When it stays idle for 1500 ms, only the new tail is sent back to Telegram, wrapped in `<pre>` so it renders monospace.
- A reply keyboard exposes `Esc`, `Ctrl+C`, `Enter`, arrows, and `Tab`. Text starting with `!` is a control command (`!esc`, `!c-c`, `!snap`, `!help`, …).

## Prerequisites

- macOS with Homebrew
- Node 22+
- `tmux`
- `claude` CLI installed and logged in
- A Telegram bot token and your own Telegram user ID

Install the system tools:

```sh
brew install tmux node
node -v   # must be >= 22
```

## Setup

### 1. Create a Telegram bot

In Telegram, open a chat with [@BotFather](https://t.me/BotFather) and run:

```
/newbot
```

Follow the prompts. Save the **bot token** it gives you (looks like `1234567890:AAH…`).

### 2. Get your own Telegram user ID

Message [@userinfobot](https://t.me/userinfobot) — it replies with your numeric user ID. That number is both your `TELEGRAM_CHAT_ID` (for 1:1 chats it equals the user ID) and your `TELEGRAM_ALLOWED_USER_ID`.

Then **send any message to your new bot** so it has a chat to reply into.

### 3. Configure `.env`

```sh
cp .env.example .env
```

Fill in:

```
TELEGRAM_BOT_TOKEN=123456:AAH…           # from BotFather
TELEGRAM_CHAT_ID=123456789               # your numeric user ID
TELEGRAM_ALLOWED_USER_ID=123456789       # same number; gates who can talk to the bridge
TMUX_SESSION=claude
TMUX_TARGET=claude:0.0
```

`TELEGRAM_ALLOWED_USER_ID` is the auth check — only messages from this user ID are accepted. If unset, it falls back to `TELEGRAM_CHAT_ID`.

### 4. Start the tmux session with claude inside

In one terminal:

```sh
tmux new -s claude
```

Inside that tmux pane, start Claude:

```sh
claude
```

Leave it running. Detach if you want (`Ctrl+b d`); the session keeps living.

### 5. Run the bridge

In another terminal:

```sh
make run
```

You should see `claude-tg-bridge started.` and get a `bridge online` message in Telegram with the reply keyboard attached.

## Using it

- **Plain text** — typed into the pane and submitted with Enter.
- **Multi-line text** (anything containing a newline) — pasted as a block, then Enter.
- **Reply-keyboard buttons** — `⎋ Esc`, `⌃C`, `⏎ Enter`, `↑`, `↓`, `⇥ Tab`.
- **`!`-prefixed controls**:
  - `!esc` — Escape
  - `!c-c` — Ctrl+C (interrupt)
  - `!enter` — bare Enter
  - `!tab` / `!up` / `!down` — arrows / Tab
  - `!snap` — force re-send the current pane (bypasses the idle timer)
  - `!help` — list controls

## Tuning

Optional knobs in `.env`:

```
TG_BRIDGE_POLL_MS=500     # pane snapshot interval
TG_BRIDGE_IDLE_MS=1500    # idle window before flushing changes to Telegram
TMUX_SESSION=claude       # session name (must match `tmux new -s …`)
TMUX_TARGET=claude:0.0    # session:window.pane to type into
```

## Troubleshooting

- **`Missing required env var: TELEGRAM_BOT_TOKEN`** — `.env` not filled in.
- **`tmux session "claude" not running`** — start it with `tmux new -s claude` and run `claude` inside.
- **`Rejected message from user_id=…`** logged to console — `TELEGRAM_ALLOWED_USER_ID` doesn't match your user ID.
- **Output looks stuck** — send `!snap` to force a re-send.
- **Syntax check without running** — `make check`.
