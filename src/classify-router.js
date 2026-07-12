/**
 * Routes classification to regex and/or API.
 * API failures always fall back to the local regex classifier.
 */
(function initClassifyRouter(globalScope) {
  async function resolveIntent(text, settings, deps) {
    const namespace = globalScope.ConciseAI || {};
    const Settings = (deps && deps.Settings) || namespace.Settings;
    const classifyRegex =
      (deps && deps.classifyIntent) || namespace.classifyIntent;
    const classifyWithApi =
      (deps && deps.classifyWithApi) || namespace.classifyWithApi;
    const fetchImpl = deps && deps.fetch;

    if (typeof classifyRegex !== "function") {
      return "normal";
    }

    const s = Settings ? Settings.normalize(settings) : settings || {};
    const wantApi = s.classifierMode === "api" && s.apiKey && s.apiModel;

    if (!wantApi || typeof classifyWithApi !== "function") {
      return classifyRegex(text);
    }

    try {
      return await classifyWithApi(text, s, fetchImpl);
    } catch (_err) {
      return classifyRegex(text);
    }
  }

  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.resolveIntent = resolveIntent;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { resolveIntent };
  }
})(typeof globalThis !== "undefined" ? globalThis : global);
