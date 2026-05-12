.PHONY: run check fmt

run:
	node --env-file=.env src/index.js

check:
	node --check src/index.js src/config.js src/telegram.js src/tmux.js src/output.js
