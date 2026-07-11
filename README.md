# Concise-AI

A Chrome extension that detects when your LLM chat prompt only needs a short, direct answer and automatically appends a brief-response instruction before send — so you don't have to type "keep it short" every time.

Works on [ChatGPT](https://chatgpt.com) and [Claude](https://claude.ai).

## How it works

1. You type a message in the chat input as usual.
2. Before the message is sent (Enter or send button), a rule-based classifier checks intent.
3. If the question looks like a definition or objective fact (e.g. "what is ephemeral?", "who is the CEO of X?"), a length constraint is appended to your prompt.
4. Subjective or explanatory questions are left unchanged.

**v1 tradeoff:** The appended instruction appears in your sent-message bubble in the chat transcript. Hiding it would require network-layer interception and is deferred to a future version.

## Install (unpacked)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this project folder.
5. Visit ChatGPT or Claude — the extension runs automatically on those sites.

## Usage

- Click the Concise-AI toolbar icon to open the popup.
- Use the **Enabled** toggle to turn prompt modification on or off.
- The setting is saved locally and applies immediately on open tabs.

## Run tests

Requires Node.js 18+ (built-in test runner).

```bash
node --test tests/*.test.js
```

## Project structure

```
├── manifest.json
├── src/
│   ├── content-script.js    # Intercepts send on ChatGPT / Claude
│   ├── intent-classifier.js # Rule-based short vs normal intent
│   ├── prompt-modifier.js   # Appends length instruction when short
│   └── site-config.js       # Per-site DOM selectors
├── popup/
│   ├── popup.html
│   └── popup.js
└── tests/
    └── intent-classifier.test.js
```

## Updating site selectors

Chat UIs change their DOM frequently. If the extension stops intercepting sends, update selectors in `src/site-config.js` — logic in other files should not need changes.

## License

MIT
