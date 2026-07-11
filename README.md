# Concise-AI

Chrome extension that shortens ChatGPT / Claude replies for simple questions (definitions, facts) by appending a brief-answer instruction before send. Local rule-based classifier — no API keys, no network.

Not on the Chrome Web Store yet. Anyone can install it by downloading this repo and loading it as an unpacked extension.

## Install

### Step 1 — Download the project

Pick one:

**Download ZIP**

1. Go to https://github.com/yugmarwaha/brevity
2. Click the green **Code** button
3. Click **Download ZIP**
4. Unzip the downloaded file
5. Open the unzipped folder and confirm you see `manifest.json` at the top level

**Or clone with git**

```bash
git clone https://github.com/yugmarwaha/brevity.git
cd brevity
```

Confirm `manifest.json` is in that folder.

### Step 2 — Enable Developer mode in Chrome

1. Open Google Chrome
2. In the address bar, go to `chrome://extensions`
3. In the top-right corner, turn **Developer mode** on

### Step 3 — Load the extension

1. Still on `chrome://extensions`, click **Load unpacked**
2. Select the project folder (the folder that contains `manifest.json`)
3. Click **Select** / **Open**
4. Confirm **Concise-AI** appears in the extensions list and its toggle is **On**

### Step 4 — Pin the icon (optional)

1. Click the puzzle-piece icon in Chrome’s toolbar
2. Find **Concise-AI**
3. Click the pin icon so it stays visible

### Step 5 — Use it

1. Open https://chatgpt.com or https://claude.ai
2. Click the Concise-AI toolbar icon
3. Leave **Auto-shorten** set to **On**
4. Ask a short question (example: `What does ephemeral mean?`)
5. Check your sent message — it should include the brief-answer instruction

### Updating later

1. Download the latest ZIP again, or run `git pull` in the project folder
2. Go to `chrome://extensions`
3. Click **Reload** on Concise-AI
4. Refresh the ChatGPT / Claude tab

## Usage

- Toolbar popup → **Auto-shorten** on/off
- Setting is saved locally on your machine
- The instruction appears in your sent message bubble (v1 tradeoff)

## Test (for developers)

```bash
node --test tests/*.test.js
```

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
