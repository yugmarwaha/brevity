(function initSiteConfig(globalScope) {
  const siteConfig = {
    "chatgpt.com": {
      inputSelector: [
        "#prompt-textarea[contenteditable='true']",
        "form #prompt-textarea",
        "form div[contenteditable='true'][role='textbox']",
      ],
      sendButtonSelector: [
        "form button[data-testid='send-button']",
        "form button[aria-label*='Send']",
        "form button[type='submit'][aria-label*='Send']",
      ],
    },
    "claude.ai": {
      inputSelector: [
        "div.ProseMirror[contenteditable='true']",
        "form div[contenteditable='true'][role='textbox']",
        "div[contenteditable='true'][data-placeholder*='Message']",
      ],
      sendButtonSelector: [
        "button[aria-label='Send Message']",
        "button[data-testid='send-button']",
        "form button[type='submit']",
      ],
    },
  };

  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.siteConfig = siteConfig;
})(globalThis);
