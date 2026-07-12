/**
 * Background service worker — owns API classify calls so keys stay out of page JS.
 */
importScripts(
  "settings.js",
  "intent-classifier.js",
  "api-classifier.js",
  "classify-router.js"
);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "conciseai:classify") {
    return false;
  }

  const text = typeof message.text === "string" ? message.text : "";

  chrome.storage.local.get(null, async (stored) => {
    try {
      const settings = ConciseAI.Settings.normalize(stored);
      const intent = await ConciseAI.resolveIntent(text, settings);
      sendResponse({ ok: true, intent });
    } catch (err) {
      sendResponse({
        ok: false,
        intent: "normal",
        error: err && err.message ? err.message : "classify failed",
      });
    }
  });

  return true; // keep channel open for async sendResponse
});
