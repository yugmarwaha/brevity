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
    // Groundwork for more hosts — selectors may need tuning as UIs change.
    "gemini.google.com": {
      inputSelector: [
        "rich-textarea [contenteditable='true']",
        "div[contenteditable='true'][aria-label*='prompt']",
        "div[contenteditable='true'][role='textbox']",
      ],
      sendButtonSelector: [
        "button[aria-label*='Send']",
        "button[mattooltip*='Send']",
      ],
    },
    "www.perplexity.ai": {
      inputSelector: [
        "div[contenteditable='true'][role='textbox']",
        "textarea[placeholder*='Ask']",
        "textarea",
      ],
      sendButtonSelector: [
        "button[aria-label*='Submit']",
        "button[aria-label*='Send']",
      ],
    },
    "perplexity.ai": {
      inputSelector: [
        "div[contenteditable='true'][role='textbox']",
        "textarea[placeholder*='Ask']",
        "textarea",
      ],
      sendButtonSelector: [
        "button[aria-label*='Submit']",
        "button[aria-label*='Send']",
      ],
    },
    "copilot.microsoft.com": {
      inputSelector: [
        "textarea#userInput",
        "textarea[aria-label*='message']",
        "div[contenteditable='true'][role='textbox']",
      ],
      sendButtonSelector: [
        "button[aria-label*='Send']",
        "button[type='submit']",
      ],
    },
    // Generic last resort when hostname is unmatched but script is injected.
    _default: {
      inputSelector: [
        "form div[contenteditable='true'][role='textbox']",
        "form textarea",
        "main div[contenteditable='true'][role='textbox']",
        "div[contenteditable='true'][role='textbox']",
        "textarea",
      ],
      sendButtonSelector: [
        "form button[type='submit']",
        "button[aria-label*='Send']",
        "button[data-testid*='send']",
      ],
    },
  };

  /** Hostnames Concise-AI ships selectors for (excludes _default). */
  const knownHosts = Object.keys(siteConfig).filter((k) => k !== "_default");

  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.siteConfig = siteConfig;
  globalScope.ConciseAI.knownHosts = knownHosts;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { siteConfig, knownHosts };
  }
})(typeof globalThis !== "undefined" ? globalThis : global);
