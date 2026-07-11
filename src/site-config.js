(function initSiteConfig(globalScope) {
  const siteConfig = {
    "chatgpt.com": {
      inputSelector: [
        "#prompt-textarea[contenteditable='true']",
        "#prompt-textarea",
        "form #prompt-textarea",
        "form div[contenteditable='true'][role='textbox']",
        "form textarea[name='prompt-textarea']",
        "main form textarea",
      ],
      sendButtonSelector: [
        "form button[data-testid='send-button']",
        "form button[aria-label*='Send']",
        "form button[type='submit'][aria-label*='Send']",
        "form button[type='submit']",
      ],
    },
    "claude.ai": {
      inputSelector: [
        "fieldset div.ProseMirror[contenteditable='true']",
        "form div.ProseMirror[contenteditable='true']",
        "div[contenteditable='true'][data-placeholder*='Message']",
        "form div[contenteditable='true'][role='textbox']",
        "div.ProseMirror[contenteditable='true']",
      ],
      sendButtonSelector: [
        "button[aria-label='Send Message']",
        "button[aria-label*='Send message']",
        "button[aria-label*='Send Message']",
        "button[data-testid='send-button']",
        "form button[type='submit']",
      ],
    },
  };

  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.siteConfig = siteConfig;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { siteConfig };
  }
})(typeof globalThis !== "undefined" ? globalThis : global);
