# AGENTS.md — Concise-AI

Orientation for AI agents working in this repo. Read this first in a new session.

## Product

**Concise-AI** is a Manifest V3 Chrome extension for ChatGPT (`chatgpt.com`) and Claude (`claude.ai`). It detects short-answer prompts (definitions, objective facts, factual yes/no) and appends a brevity instruction before send. Subjective and explanatory prompts are left alone.

## No API / privacy model

This project is intentionally **offline and keyless**:

- No OpenAI/Anthropic/Groq (or any) API key
- No `fetch` / analytics / telemetry from the extension
- Only permission beyond host match: `chrome.storage` (stores the on/off toggle)
- Prompt text is read and optionally modified **in the page DOM only**

Do not add cloud classifiers, API clients, or new host permissions unless the user explicitly expands scope.

## Architecture

| Piece | Role |
|-------|------|
| `src/intent-classifier.js` | Pure `classifyIntent` → `"short"` \| `"normal"` |
| `src/prompt-modifier.js` | Appends length suffix when intent is `"short"` |
| `src/site-config.js` | DOM selectors only (easy to update when sites change) |
| `src/content-script.js` | Capture-phase delegation; Enter scoped to composer; send scoped to form; textarea + contenteditable write paths; `enabledReady` gate for toggle |
| `popup/` | Toggle UI ↔ `chrome.storage.local.enabled` |

## Tests

```bash
node --test tests/*.test.js
```

## Private files (not in git)

- `project-spec.md` — full original spec
- `description.md` — resume/portfolio source notes

Prefer `README.md` + this file + `.cursor/rules/` for shared context.

## Out of scope (v1)

- Hiding the suffix from the chat transcript
- ML/API intent classification (optional future: user-supplied API keys — only if explicitly requested)
- Extra chat sites
- Usage analytics
