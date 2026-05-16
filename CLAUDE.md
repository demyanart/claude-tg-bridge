# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A bridge between a Telegram chat and a **local `tmux` session that has `claude` CLI running inside it**. Messages from Telegram are typed into the tmux pane; the pane's visible buffer is streamed back to Telegram as it changes. Lets you drive a local Claude Code session from your phone.

## Run / check

- **Requires Node 22+.** No npm dependencies — the runtime relies on built-ins (`fetch`, `--env-file`, `node:child_process`). Don't add a `dependencies` block to `package.json`.
- **Requires a running tmux session** named per `TMUX_SESSION` (default `claude`) with `claude` already started inside it. Start manually before launching the bridge: `tmux new -s claude`, then run `claude` in that pane.
- `make run` — runs `node --env-file=.env src/index.js`.
- `make check` — syntax-only check (`node --check` on each source file). There are no tests or linter.

## Architecture

Five source files in `src/`, each ~50–80 lines. The interesting parts only need explaining where multiple files interact:

- **`index.js`** — top-level loop. Async-iterates `pollUpdates()`, rejects any message whose `from.id` ≠ `TELEGRAM_ALLOWED_USER_ID` (falls back to `TELEGRAM_CHAT_ID` if unset — fine for 1:1 chats), then routes the text:
  - matches a reply-keyboard button → `handleControl` (sends a tmux key)
  - starts with `!` → `handleControl` (e.g. `!esc`, `!c-c`, `!enter`, `!snap`, `!help`)
  - contains a newline → `pasteText` (multiline path)
  - otherwise → `sendText` (single-line path)
- **`telegram.js`** — `getUpdates` long-polling (25s timeout, 30s abort) with persistent `offset`; `sendMessage` chunks at `config.maxMsgLen` (3800), wraps each chunk in `<pre>...</pre>` with HTML escaping (so the monospace tmux output renders correctly), and attaches `reply_markup` only to the **last** chunk so the keyboard isn't duplicated.
- **`tmux.js`** — shells out to the `tmux` binary via `execFile`. **Single-line text** goes through `send-keys -l` line-by-line with `S-Enter` between lines and a final `Enter` to submit. **Multiline text** goes through `load-buffer` + `paste-buffer -d` (via a temp file) because `send-keys -l` corrupts long multi-line input; the `-d` flag deletes the buffer after paste, then a final `Enter` submits.
- **`output.js`** — runs `setInterval(tick, pollMs)` (default 500ms). Each tick captures the pane (`tmux capture-pane -p -J`) and compares to `lastSnapshot`. When the pane has been idle (unchanged) for `idleMs` (default 1500ms), it computes a line-prefix diff against `lastSentSnapshot` and sends only the suffix that changed — so you don't get the whole screen on every message. `forceFlush()` (triggered by `!snap`) bypasses the idle timer and re-sends the current pane.
- **`keyboard.js`** — declarative reply keyboard (`Esc`, `Ctrl+C`, `Enter`, arrows, `Tab`) and a button→command map consumed by `index.js`.

## Conventions

- **Zero-dependency by design.** If you're tempted to add a Telegram SDK or tmux library, don't — the surface area is small enough that the raw Bot API + `execFile('tmux', ...)` is the right level. New env-driven knobs should be added to `config.js` with a default and read from `process.env`.
- **All Telegram output is `<pre>`-wrapped.** Plain-text replies (errors, help, "bridge online") explicitly pass `{ html: false }` to `sendMessage` — keep that pattern when adding new replies that shouldn't be in a monospace block.
- **The pane diff state is module-level in `output.js`** (`lastSnapshot`, `lastSentSnapshot`, `lastChangeAt`, `dirty`). Don't move it; the idle-flush model depends on it being shared across ticks.
- **Auth is by Telegram `user.id`, not `chat.id`.** When testing access control, set `TELEGRAM_ALLOWED_USER_ID` explicitly — relying on the `chat.id` fallback breaks in groups.
