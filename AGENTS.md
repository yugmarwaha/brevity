# AGENTS.md — Concise-AI

Orientation for AI agents working in this repo. Read this first in a new session.

## Product

**Concise-AI** is a Manifest V3 Chrome extension for AI chat UIs (ChatGPT, Claude, plus groundwork hosts). It detects short-answer prompts and appends a brevity instruction before send.

## Classifier modes (v1.1 groundwork)

| Mode | Behavior |
|------|----------|
| `regex` (default) | Local rule-based `classifyIntent` — no network |
| `api` | OpenAI-compatible chat completions via background SW; **falls back to regex** on failure or cold cache |

- User supplies API key / base URL / model in the popup (stored in `chrome.storage.local`).
- Model choice is deferred to the user — keep prompts tiny (`max_tokens: 4`).
- Do not hard-require a vendor; prefer OpenAI-compatible `/v1/chat/completions`.

## Privacy defaults

- Default remains **regex / offline**.
- API mode is opt-in. Keys never go into git. Content script does not call the API directly (messages the service worker).
- Prompt text is still modified in the page DOM (suffix visible in sent bubble).

## Architecture

| Piece | Role |
|-------|------|
| `src/settings.js` | Defaults + normalize (`enabled`, `classifierMode`, `apiKey`, `apiBaseUrl`, `apiModel`) |
| `src/intent-classifier.js` | Regex `classifyIntent` |
| `src/api-classifier.js` | `classifyWithApi` (OpenAI-compatible) |
| `src/classify-router.js` | `resolveIntent` — API then regex fallback |
| `src/background.js` | Service worker message `conciseai:classify` |
| `src/prompt-modifier.js` | Appends length suffix when intent is `"short"` |
| `src/site-config.js` | Per-host selectors + `_default` |
| `src/content-script.js` | Intercepts send; debounced API prefetch; regex sync fallback |
| `popup/` | Toggle + classifier mode + API fields |

## Tests

```bash
node --test tests/*.test.js
```

## Private files (not in git)

- `project-spec.md` — full original spec
- `description.md` — resume/portfolio source notes

## Still out of scope / later

- Hiding the suffix from the chat transcript
- Perfect selectors for every chat site (stubs exist; tune as needed)
- Picking a default paid model for the user
- Usage analytics
