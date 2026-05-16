---
description: Walk a new user through first-time setup of claude-tg-bridge (bot, env, deps, run).
---

You are walking the user through first-time setup of `claude-tg-bridge`. Go step by step. At each step, **ask the user to confirm** they finished it before moving on. Don't run the bot yourself — the user runs it. Don't read or write to `.env` for them; tell them what to put in it.

## Step 1 — Create the Telegram bot

Tell the user:

> Open Telegram and message **@BotFather**. Send `/newbot`, pick a name and username, and copy the **bot token** it gives you (looks like `1234567890:AAH…`). Then open a chat with your new bot and send it any message so it has a chat to reply into.

Ask: "Got the bot token? Paste it here (or just confirm you saved it)."

## Step 2 — Get the user's Telegram user ID

Tell the user:

> In Telegram, message **@userinfobot**. It will reply with your numeric user ID. Copy that number — it's both your `TELEGRAM_CHAT_ID` and your `TELEGRAM_ALLOWED_USER_ID` (the auth gate).

Ask: "Got your user ID? Confirm when ready."

## Step 3 — Install Homebrew, tmux, and Node 22+

Check what's installed first:

```sh
command -v brew && brew --version
command -v tmux && tmux -V
command -v node && node -v
```

- If `brew` is missing, point the user to https://brew.sh and ask them to install it (it's an interactive shell command — they need to run it).
- If `tmux` or `node` are missing, run `brew install tmux node`.
- If `node` is present but `< 22`, run `brew upgrade node` (or `brew install node@22 && brew link --overwrite node@22`).

Confirm `node -v` reports `v22.x` or higher before moving on.

## Step 4 — Fill in `.env`

Run `cp .env.example .env` if `.env` doesn't exist yet (check with `ls -la .env` first — don't clobber an existing one).

Then tell the user to edit `.env` and set:

```
TELEGRAM_BOT_TOKEN=<token from Step 1>
TELEGRAM_CHAT_ID=<user ID from Step 2>
TELEGRAM_ALLOWED_USER_ID=<same user ID from Step 2>
```

Leave `TMUX_SESSION=claude` and `TMUX_TARGET=claude:0.0` as defaults.

Ask the user to confirm the file is filled in. Do **not** open `.env` yourself — it's gitignored secret material.

## Step 5 — Start the tmux session with claude

Tell the user to open a **separate terminal** and run:

```sh
tmux new -s claude
```

Inside that tmux pane, start `claude`:

```sh
claude
```

Then they can detach with `Ctrl+b` then `d` (optional — the session keeps running either way).

Verify from this terminal:

```sh
tmux has-session -t claude 2>/dev/null && echo "session up" || echo "session NOT up"
```

Don't proceed until the session is up.

## Step 6 — Run the bridge

Tell the user to run, from the project root:

```sh
make run
```

They should see `claude-tg-bridge started.` in the terminal and receive a `bridge online` message in their Telegram chat with the reply keyboard.

## Step 7 — Smoke test

Have the user:

1. Send a plain message ("hello") from Telegram → it should appear in the tmux pane and Claude should respond, with the response streamed back to Telegram.
2. Tap the `⎋ Esc` button → Claude's input should clear.
3. Send `!help` → the bridge should reply with the control list.

If any step fails, point them at the Troubleshooting section of `README.md`.

---

**Tone:** terse, one step at a time, wait for the user's confirmation before advancing. Don't dump the whole sequence at once.