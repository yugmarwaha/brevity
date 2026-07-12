/**
 * Pure intercept helpers — shared by the content script and Node unit tests.
 * No DOM globals required except where a caller passes document/root explicitly.
 */
const ConciseAIIntercept = {
  getHostConfig(configByHost, hostname) {
    if (!hostname || !configByHost) {
      return null;
    }
    if (configByHost[hostname]) {
      return configByHost[hostname];
    }
    const withoutWww = String(hostname).replace(/^www\./, "");
    if (configByHost[withoutWww]) {
      return configByHost[withoutWww];
    }
    // Prefer www-prefixed alias, then generic default.
    if (configByHost[`www.${withoutWww}`]) {
      return configByHost[`www.${withoutWww}`];
    }
    return configByHost._default || null;
  },

  normalizeSelectors(selectors) {
    if (Array.isArray(selectors)) {
      return selectors.filter(Boolean).join(",");
    }
    if (typeof selectors === "string") {
      return selectors;
    }
    return "";
  },

  shouldModify(enabled) {
    return enabled === true;
  },

  isSendEnter(event) {
    if (!event || event.key !== "Enter") {
      return false;
    }
    // Ignore IME composition commits (some engines use keyCode 229).
    if (event.isComposing || event.keyCode === 229 || event.which === 229) {
      return false;
    }
    if (event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) {
      return false;
    }
    return true;
  },

  /**
   * Enter-to-send: only return an input when the event target is inside the composer.
   * Never fall back to a page-wide primary input (avoids mutating chat on unrelated Enter).
   */
  findComposerInput(eventTarget, inputSelector) {
    const selector = this.normalizeSelectors(inputSelector);
    if (!selector || !eventTarget || typeof eventTarget.closest !== "function") {
      return null;
    }
    return eventTarget.closest(selector);
  },

  findSendButton(eventTarget, sendButtonSelector) {
    const selector = this.normalizeSelectors(sendButtonSelector);
    if (!selector || !eventTarget || typeof eventTarget.closest !== "function") {
      return null;
    }
    return eventTarget.closest(selector);
  },

  /**
   * Prefer the composer inside the same form/container as the send control.
   * Falls back to document-wide query only when no local match exists.
   */
  findInputNearSendButton(sendButton, inputSelector, root) {
    const selector = this.normalizeSelectors(inputSelector);
    if (!selector || !sendButton) {
      return null;
    }

    const scope =
      (typeof sendButton.closest === "function" &&
        (sendButton.closest("form") ||
          sendButton.closest("[data-testid*='composer']") ||
          sendButton.closest("fieldset") ||
          sendButton.parentElement)) ||
      null;

    if (scope && typeof scope.querySelector === "function") {
      const local = scope.querySelector(selector);
      if (local) {
        return local;
      }
    }

    return this.findPrimaryInput(inputSelector, root);
  },

  findPrimaryInput(inputSelector, root) {
    const selector = this.normalizeSelectors(inputSelector);
    if (!selector || !root || typeof root.querySelector !== "function") {
      return null;
    }
    return root.querySelector(selector);
  },

  isPlainTextField(inputElement) {
    if (!inputElement || !inputElement.tagName) {
      return false;
    }
    const tag = String(inputElement.tagName).toLowerCase();
    return tag === "textarea" || tag === "input";
  },

  readInputText(inputElement) {
    if (!inputElement) {
      return "";
    }
    if (this.isPlainTextField(inputElement) && typeof inputElement.value === "string") {
      return inputElement.value.replace(/\u200B/g, "").trimEnd();
    }
    if (typeof inputElement.innerText === "string") {
      return inputElement.innerText.replace(/\u200B/g, "").trimEnd();
    }
    return "";
  },

  writeInputText(inputElement, text, scope) {
    if (!inputElement) {
      return;
    }

    const globalRef = scope || (typeof globalThis !== "undefined" ? globalThis : null);

    // Native textarea / input path (ChatGPT has used both over time).
    if (this.isPlainTextField(inputElement) && "value" in inputElement) {
      inputElement.value = text;
      if (typeof inputElement.setSelectionRange === "function") {
        const end = text.length;
        try {
          inputElement.setSelectionRange(end, end);
        } catch (_err) {
          // Some input types reject setSelectionRange; ignore.
        }
      }
      if (typeof inputElement.dispatchEvent === "function") {
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }

    if (typeof inputElement.focus === "function") {
      inputElement.focus();
    }

    const doc = typeof document !== "undefined" ? document : null;
    const selection = globalRef && globalRef.getSelection && globalRef.getSelection();
    if (selection && doc && typeof doc.createRange === "function") {
      const range = doc.createRange();
      range.selectNodeContents(inputElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    let wrote = false;
    if (doc && typeof doc.execCommand === "function") {
      wrote = !!doc.execCommand("insertText", false, text);
    }

    if (!wrote) {
      while (inputElement.firstChild) {
        inputElement.removeChild(inputElement.firstChild);
      }

      const lines = String(text).split("\n");
      if (doc && typeof doc.createElement === "function") {
        for (const line of lines) {
          const p = doc.createElement("p");
          p.textContent = line.length ? line : "\u200B";
          inputElement.appendChild(p);
        }
      } else if ("textContent" in inputElement) {
        inputElement.textContent = text;
      } else {
        inputElement.innerText = text;
      }
    }

    if (
      typeof inputElement.dispatchEvent === "function" &&
      typeof InputEvent === "function"
    ) {
      inputElement.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: text,
        })
      );
    }
  },

  /**
   * Full gate used before send: toggle must be ON; then classify + maybe append.
   */
  buildOutgoingPrompt(text, enabled, classifyIntent, modifyPrompt) {
    if (!this.shouldModify(enabled)) {
      return text;
    }
    return modifyPrompt(text, classifyIntent(text));
  },
};

(function initContentScript(globalScope) {
  globalScope.ConciseAI = globalScope.ConciseAI || {};
  globalScope.ConciseAI.interceptHelpers = ConciseAIIntercept;

  // Skip browser wiring under Node (unit tests only need the exported helpers).
  if (typeof document === "undefined") {
    return;
  }

  const namespace = globalScope.ConciseAI;
  const siteConfig = namespace.siteConfig || {};
  const classifyIntent = namespace.classifyIntent;
  const modifyPrompt = namespace.modifyPrompt;
  const Settings = namespace.Settings;
  const helpers = ConciseAIIntercept;

  const hostConfig = helpers.getHostConfig(
    siteConfig,
    globalScope.location && globalScope.location.hostname
  );

  if (!hostConfig || typeof classifyIntent !== "function" || typeof modifyPrompt !== "function") {
    return;
  }

  // Attach immediately so we don't miss early sends when enabled.
  // Gate modifications on enabledReady so toggle OFF never races.
  let extensionEnabled = true;
  let enabledReady = false;
  let settings = Settings
    ? Settings.normalize({})
    : { enabled: true, classifierMode: "regex", apiKey: "", apiBaseUrl: "", apiModel: "" };
  let intentCache = { text: "", intent: null };
  let classifyTimer = null;

  attachInterceptors();
  hydrateSettings();
  subscribeToSettingsUpdates();

  function hydrateSettings() {
    if (!globalScope.chrome || !chrome.storage || !chrome.storage.local) {
      enabledReady = true;
      extensionEnabled = true;
      return;
    }

    chrome.storage.local.get(null, (stored) => {
      settings = Settings ? Settings.normalize(stored) : stored;
      extensionEnabled = settings.enabled !== false;
      enabledReady = true;
    });
  }

  function subscribeToSettingsUpdates() {
    if (!globalScope.chrome || !chrome.storage || !chrome.storage.onChanged) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }
      const merged = Object.assign({}, settings);
      for (const key of Object.keys(changes)) {
        merged[key] = changes[key].newValue;
      }
      settings = Settings ? Settings.normalize(merged) : merged;
      extensionEnabled = settings.enabled !== false;
      intentCache = { text: "", intent: null };
    });
  }

  function attachInterceptors() {
    document.addEventListener("keydown", onDocumentKeyDown, true);
    document.addEventListener("pointerdown", onSendPointer, true);
    document.addEventListener("mousedown", onSendPointer, true);
    document.addEventListener("click", onSendPointer, true);
    document.addEventListener("submit", onFormSubmit, true);
    // Prefetch API intent while typing so send stays synchronous.
    document.addEventListener("input", onComposerInput, true);
  }

  function onComposerInput(event) {
    if (!enabledReady || !helpers.shouldModify(extensionEnabled)) {
      return;
    }
    if (!Settings || !Settings.usesApi(settings)) {
      return;
    }
    const inputElement = helpers.findComposerInput(
      event.target,
      hostConfig.inputSelector
    );
    if (!inputElement) {
      return;
    }
    scheduleClassify(helpers.readInputText(inputElement));
  }

  function scheduleClassify(text) {
    const trimmed = String(text || "");
    if (!trimmed.trim()) {
      intentCache = { text: "", intent: null };
      return;
    }
    clearTimeout(classifyTimer);
    classifyTimer = setTimeout(() => {
      requestClassify(trimmed).then((intent) => {
        const current = helpers.findPrimaryInput(hostConfig.inputSelector, document);
        if (!current) {
          return;
        }
        if (helpers.readInputText(current) === trimmed) {
          intentCache = { text: trimmed, intent };
        }
      });
    }, 450);
  }

  function requestClassify(text) {
    return new Promise((resolve) => {
      if (!globalScope.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        resolve(classifyIntent(text));
        return;
      }
      try {
        chrome.runtime.sendMessage(
          { type: "conciseai:classify", text },
          (response) => {
            if (chrome.runtime.lastError || !response || !response.ok) {
              resolve(classifyIntent(text));
              return;
            }
            resolve(response.intent === "short" ? "short" : "normal");
          }
        );
      } catch (_err) {
        resolve(classifyIntent(text));
      }
    });
  }

  function onDocumentKeyDown(event) {
    if (!helpers.isSendEnter(event)) {
      return;
    }

    const inputElement = helpers.findComposerInput(
      event.target,
      hostConfig.inputSelector
    );
    if (!inputElement) {
      return;
    }

    tryModifyInputText(inputElement);
  }

  function onSendPointer(event) {
    const sendButton = helpers.findSendButton(
      event.target,
      hostConfig.sendButtonSelector
    );
    if (!sendButton) {
      return;
    }

    const inputElement = helpers.findInputNearSendButton(
      sendButton,
      hostConfig.inputSelector,
      document
    );
    if (!inputElement) {
      return;
    }

    tryModifyInputText(inputElement);
  }

  function onFormSubmit(event) {
    const form = event.target;
    if (!form || typeof form.querySelector !== "function") {
      return;
    }

    const selector = helpers.normalizeSelectors(hostConfig.inputSelector);
    if (!selector) {
      return;
    }

    const inputElement = form.querySelector(selector);
    if (!inputElement) {
      return;
    }

    tryModifyInputText(inputElement);
  }

  function tryModifyInputText(inputElement) {
    if (!enabledReady || !helpers.shouldModify(extensionEnabled)) {
      return;
    }

    try {
      const originalText = helpers.readInputText(inputElement);
      if (!originalText.trim()) {
        return;
      }

      let intent = "normal";
      if (intentCache.text === originalText && intentCache.intent) {
        intent = intentCache.intent;
      } else {
        // Sync path: regex (also used when API cache is cold).
        intent = classifyIntent(originalText);
      }

      const modifiedText = modifyPrompt(originalText, intent);
      if (modifiedText === originalText) {
        return;
      }

      helpers.writeInputText(inputElement, modifiedText, globalScope);
    } catch (_err) {
      // Fail silently — never block the site's native send.
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : global);

if (typeof module !== "undefined" && module.exports) {
  module.exports = ConciseAIIntercept;
}
