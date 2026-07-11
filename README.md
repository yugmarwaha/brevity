# Concise-AI

A Chrome extension that detects when your LLM chat prompt only needs a short, direct answer and automatically appends a brief-response instruction before send — so you don't have to type "keep it short" every time.

Works on [ChatGPT](https://chatgpt.com) and [Claude](https://claude.ai).

## How it works

1. You type a message in the chat input as usual.
2. Before the message is sent (Enter, send button, or form submit), a rule-based classifier checks intent.
3. If the question looks like a definition or objective fact (e.g. "what is ephemeral?", "who is the CEO of X?"), a length constraint is appended to your prompt.
4. Subjective or explanatory questions (e.g. "is nuclear power safe?", "how does photosynthesis work?") are left unchanged.

**v1 tradeoff:** The instruction is appended to the input before send, so it also appears in your sent-message bubble. Fully hiding it would require network-layer interception and is deferred to a later version.

## Privacy & performance

- **No API keys and no network calls** from the extension — no analytics, no external APIs, fully local rule-based classifier.
- **Permissions:** `storage` only, plus host access limited to ChatGPT and Claude.
- **Stored data:** only the on/off toggle in `chrome.storage.local` (on your machine). The extension does not keep a chat history of its own.
- **Prompt text** is read in-page solely to classify/modify before the site’s normal send; it is not uploaded by the extension.
- Scripts inject only on those two sites; work runs on send events (not continuous polling), so Chrome impact stays minimal.

## Install (unpacked)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this project folder.
5. Visit ChatGPT or Claude — the extension runs automatically on those sites.
6. After code changes, click **Reload** on the extension card, then refresh the chat tab.

## Usage

- Click the Concise-AI toolbar icon to open the popup.
- Use the **Enabled** toggle to turn prompt modification on or off.
- The setting is saved locally and applies on open tabs after storage updates.

## Manual smoke test

| Action | Expected |
|--------|----------|
| Send `what does ephemeral mean?` | Sent message includes the brief-answer suffix; reply stays short |
| Send `is nuclear power safe?` | Prompt unchanged |
| Send `how does photosynthesis work?` | Prompt unchanged |
| Turn **Enabled** off, send a short question | Prompt unchanged |
| Start a new chat and send again | Still intercepts |

## Run tests

Requires Node.js 18+ (built-in test runner).

```bash
node --test tests/*.test.js
```

Covers classifier categories (definitions, facts, factual vs subjective yes/no, advisory prompts) plus acceptance checks for toggle-off, selector miss, Enter scoping, and send-button form scoping.

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
├── tests/
│   ├── intent-classifier.test.js
│   └── acceptance.test.js
└── README.md
```

## Updating site selectors

Chat UIs change their DOM frequently. If the extension stops intercepting sends, update selectors in `src/site-config.js` — logic in other files should not need changes.

## License

MIT
