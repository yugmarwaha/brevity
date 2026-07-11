(function initContentScript(globalScope) {
  const namespace = globalScope.ConciseAI || {};
  const siteConfig = namespace.siteConfig || {};
  const classifyIntent = namespace.classifyIntent;
  const modifyPrompt = namespace.modifyPrompt;

  const hostConfig = getHostConfig(siteConfig, globalScope.location && globalScope.location.hostname);

  if (!hostConfig || typeof classifyIntent !== "function" || typeof modifyPrompt !== "function") {
    return;
  }

  let extensionEnabled = true;

  hydrateEnabledFlag();
  subscribeToEnabledUpdates();
  attachInterceptors();
  observeSpaMutations();

  function getHostConfig(configByHost, hostname) {
    if (!hostname) {
      return null;
    }

    if (configByHost[hostname]) {
      return configByHost[hostname];
    }

    const withoutWww = hostname.replace(/^www\./, "");
    return configByHost[withoutWww] || null;
  }

  function hydrateEnabledFlag() {
    if (!globalScope.chrome || !chrome.storage || !chrome.storage.local) {
      extensionEnabled = true;
      return;
    }

    chrome.storage.local.get({ enabled: true }, (result) => {
      extensionEnabled = result.enabled !== false;
    });
  }

  function subscribeToEnabledUpdates() {
    if (!globalScope.chrome || !chrome.storage || !chrome.storage.onChanged) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes.enabled) {
        return;
      }
      extensionEnabled = changes.enabled.newValue !== false;
    });
  }

  function attachInterceptors() {
    document.addEventListener("keydown", onDocumentKeyDown, true);
    document.addEventListener("click", onDocumentClick, true);
  }

  function observeSpaMutations() {
    const observer = new MutationObserver(() => {
      // Intentionally empty: event delegation stays active across SPA re-renders.
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function onDocumentKeyDown(event) {
    if (!isSendEnter(event)) {
      return;
    }

    const inputElement = findInputFromEvent(event);
    if (!inputElement) {
      return;
    }

    tryModifyInputText(inputElement);
  }

  function onDocumentClick(event) {
    const sendButton = findSendButtonFromEvent(event);
    if (!sendButton) {
      return;
    }

    const inputElement = findPrimaryInput();
    if (!inputElement) {
      return;
    }

    tryModifyInputText(inputElement);
  }

  function isSendEnter(event) {
    if (event.key !== "Enter") {
      return false;
    }
    if (event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) {
      return false;
    }
    if (event.isComposing) {
      return false;
    }
    return true;
  }

  function findInputFromEvent(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return findPrimaryInput();
    }

    const inputSelector = normalizeSelectors(hostConfig.inputSelector);
    if (inputSelector && target.closest(inputSelector)) {
      return target.closest(inputSelector);
    }
    return findPrimaryInput();
  }

  function findSendButtonFromEvent(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return null;
    }

    const sendSelector = normalizeSelectors(hostConfig.sendButtonSelector);
    if (!sendSelector) {
      return null;
    }
    return target.closest(sendSelector);
  }

  function findPrimaryInput() {
    const inputSelector = normalizeSelectors(hostConfig.inputSelector);
    if (!inputSelector) {
      return null;
    }
    return document.querySelector(inputSelector);
  }

  function normalizeSelectors(selectors) {
    if (Array.isArray(selectors)) {
      return selectors.join(",");
    }
    if (typeof selectors === "string") {
      return selectors;
    }
    return "";
  }

  function tryModifyInputText(inputElement) {
    if (!extensionEnabled) {
      return;
    }

    try {
      const originalText = readInputText(inputElement);
      if (!originalText.trim()) {
        return;
      }

      const intent = classifyIntent(originalText);
      const modifiedText = modifyPrompt(originalText, intent);
      if (modifiedText === originalText) {
        return;
      }

      writeInputText(inputElement, modifiedText);
    } catch (_err) {
      // Fail silently so the site's native send behavior is never blocked.
    }
  }

  function readInputText(inputElement) {
    return typeof inputElement.innerText === "string" ? inputElement.innerText : "";
  }

  function writeInputText(inputElement, text) {
    inputElement.focus();

    const selection = globalScope.getSelection && globalScope.getSelection();
    const range = document.createRange();
    range.selectNodeContents(inputElement);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const usedExecCommand = document.execCommand && document.execCommand("insertText", false, text);
    if (!usedExecCommand) {
      inputElement.textContent = text;
    }

    inputElement.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text,
      })
    );
  }
})(globalThis);
