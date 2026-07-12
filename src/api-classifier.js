/**
 * OpenAI-compatible chat-completions classifier.
 * Model is user-configurable; keep prompts tiny — classification only.
 */
(function initApiClassifier(globalScope) {
  const SYSTEM_PROMPT =
    'Classify the user message intent for reply length. Reply with exactly one word: "short" or "normal".\n' +
    "- short = definition, objective fact, or factual yes/no that needs a brief direct answer\n" +
    "- normal = opinion, advice, explanation, how-to, or anything that needs reasoning\n" +
    'Output only: short OR normal';

  async function classifyWithApi(text, settings, fetchImpl) {
    const Settings = globalScope.ConciseAI && globalScope.ConciseAI.Settings;
    const s = Settings ? Settings.normalize(settings) : settings;
    const doFetch = fetchImpl || globalScope.fetch;

    if (!s || !s.apiKey) {
      throw new Error("Missing API key");
    }
    if (!s.apiModel) {
      throw new Error("Missing API model");
    }
    if (typeof doFetch !== "function") {
      throw new Error("fetch unavailable");
    }

    const base = String(s.apiBaseUrl || "").replace(/\/$/, "");
    const url = base.endsWith("/v1")
      ? `${base}/chat/completions`
      : `${base}/v1/chat/completions`;

    const response = await doFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.apiKey}`,
      },
      body: JSON.stringify({
        model: s.apiModel,
        temperature: 0,
        max_tokens: 4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: String(text || "").slice(0, 2000) },
        ],
      }),
    });

    if (!response.ok) {
      const body = typeof response.text === "function" ? await response.text() : "";
      throw new Error(`API ${response.status}: ${String(body).slice(0, 200)}`);
    }

    const data = await response.json();
    const raw =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    return parseIntentLabel(raw);
  }

  function parseIntentLabel(raw) {
    const label = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/["'`]/g, "")
      .split(/\s+/)[0];

    if (label === "short") {
      return "short";
    }
    if (label === "normal") {
      return "normal";
    }
    // Unknown model output → treat as normal (do not force brevity).
    return "normal";
  }

  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.classifyWithApi = classifyWithApi;
  globalScope.ConciseAI.parseIntentLabel = parseIntentLabel;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { classifyWithApi, parseIntentLabel, SYSTEM_PROMPT };
  }
})(typeof globalThis !== "undefined" ? globalThis : global);
