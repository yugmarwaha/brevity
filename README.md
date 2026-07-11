# Concise-AI

Chrome extension that shortens ChatGPT / Claude replies for simple questions (definitions, facts) by appending a brief-answer instruction before send. Local rule-based classifier — no API keys, no network.

## Install

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. After code changes: **Reload** the extension, then refresh the chat tab

## Usage

Toolbar popup → **Auto-shorten** on/off (saved in `chrome.storage.local`).

Note: the instruction appears in your sent message bubble (v1).

## Test

```bash
node --test tests/*.test.js
```

Manual: short prompt gets a suffix; subjective/explanatory prompts do not; toggle off disables modification.

## Layout

```
manifest.json
src/          content-script, classifier, prompt-modifier, site-config
popup/        toggle UI
tests/
```

DOM selectors live in `src/site-config.js`.

## License

MIT
