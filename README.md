# Concise-AI

Chrome extension that shortens AI chat replies for simple questions (definitions, facts) by appending a brief-answer instruction before send.

**Default:** local regex classifier — no API keys, no network.  
**Optional:** your own OpenAI-compatible API key for smarter intent detection (regex fallback if the call fails).

Not on the Chrome Web Store yet. Install locally from this repo.

## Install

### Step 1 — Download the project

**Download ZIP**

1. Go to https://github.com/yugmarwaha/brevity
2. Click **Code** → **Download ZIP**
3. Unzip and confirm you see `manifest.json`

**Or clone**

```bash
git clone https://github.com/yugmarwaha/brevity.git
cd brevity
```

### Step 2 — Enable Developer mode

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top right)

### Step 3 — Load unpacked

1. Click **Load unpacked**
2. Select the folder that contains `manifest.json`
3. Confirm **Concise-AI** is listed and enabled

### Step 4 — Use it

1. Open ChatGPT, Claude, Gemini, Perplexity, or Copilot
2. Click the Concise-AI toolbar icon (pin via the puzzle menu if needed)
3. Leave **Auto-shorten** on
4. Optional: set **Classifier** to **API + regex fallback**, then add key / base URL / model

After updates: **Reload** the extension on `chrome://extensions`, then refresh the chat tab.

## Usage

- **Auto-shorten** — master on/off
- **Classifier** — `Local regex` (default) or `API + regex fallback`
- API fields appear only in API mode; key is stored in `chrome.storage.local` on your machine
- The brevity instruction appears in your sent message bubble (v1)

## Test

```bash
node --test tests/*.test.js
```

## Layout

```
manifest.json
src/          content-script, classifiers, settings, background, site-config
popup/        toggle + classifier settings
tests/
```

## License

MIT
