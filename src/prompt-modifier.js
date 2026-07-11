(function initPromptModifier(globalScope) {
  const SHORT_SUFFIX =
    "\n\n(Give a brief, direct answer only — no elaboration, background, or caveats unless explicitly asked.)";

  function modifyPrompt(text, intent) {
    const safeText = typeof text === "string" ? text : "";
    if (intent !== "short") {
      return safeText;
    }
    if (safeText.endsWith(SHORT_SUFFIX)) {
      return safeText;
    }
    return safeText + SHORT_SUFFIX;
  }

  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.modifyPrompt = modifyPrompt;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { modifyPrompt, SHORT_SUFFIX };
  }
})(typeof globalThis !== "undefined" ? globalThis : global);
