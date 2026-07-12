/**
 * Shared settings defaults for popup, background, and tests.
 * classifierMode:
 *   - "regex"         local only (default, free, private)
 *   - "api"           OpenAI-compatible API only (falls back to regex on failure)
 *   - "api-fallback"  try API first, then regex (same as api today; alias for clarity)
 */
const ConciseAISettings = {
  DEFAULTS: {
    enabled: true,
    classifierMode: "regex",
    apiKey: "",
    apiBaseUrl: "https://api.openai.com/v1",
    apiModel: "",
  },

  normalize(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    let mode = typeof src.classifierMode === "string" ? src.classifierMode : "regex";
    if (mode === "api-fallback") {
      mode = "api";
    }
    if (mode !== "regex" && mode !== "api") {
      mode = "regex";
    }

    return {
      enabled: src.enabled !== false,
      classifierMode: mode,
      apiKey: typeof src.apiKey === "string" ? src.apiKey.trim() : "",
      apiBaseUrl:
        typeof src.apiBaseUrl === "string" && src.apiBaseUrl.trim()
          ? src.apiBaseUrl.trim().replace(/\/$/, "")
          : this.DEFAULTS.apiBaseUrl,
      apiModel: typeof src.apiModel === "string" ? src.apiModel.trim() : "",
    };
  },

  usesApi(settings) {
    const s = this.normalize(settings);
    return s.classifierMode === "api" && Boolean(s.apiKey);
  },

  /**
   * Fields safe to keep in the content script (runs beside chat pages).
   * Never includes apiKey / apiBaseUrl secrets.
   */
  pageSafeFromStorage(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    let mode = typeof src.classifierMode === "string" ? src.classifierMode : "regex";
    if (mode === "api-fallback") {
      mode = "api";
    }
    if (mode !== "regex" && mode !== "api") {
      mode = "regex";
    }
    return {
      enabled: src.enabled !== false,
      classifierMode: mode,
    };
  },

  /** True when content script should ask the background to classify (key stays in SW). */
  wantsApiPrefetch(pageSafe) {
    return pageSafe && pageSafe.classifierMode === "api";
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.ConciseAI = globalThis.ConciseAI || {};
  globalThis.ConciseAI.Settings = ConciseAISettings;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ConciseAISettings };
}
