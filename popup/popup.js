const toggle = document.getElementById("enabled-toggle");
const modeSelect = document.getElementById("classifier-mode");
const apiFields = document.getElementById("api-fields");
const apiKeyInput = document.getElementById("api-key");
const apiBaseInput = document.getElementById("api-base");
const apiModelInput = document.getElementById("api-model");
const hintText = document.getElementById("hint-text");
const mark = document.querySelector(".mark");

const Settings = globalThis.ConciseAI.Settings;

function syncToggle(enabled) {
  toggle.checked = enabled;
  toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  document.body.classList.toggle("is-enabled", enabled);
}

function syncModeUi(settings) {
  modeSelect.value = settings.classifierMode === "api" ? "api" : "regex";
  apiKeyInput.value = settings.apiKey || "";
  apiBaseInput.value = settings.apiBaseUrl || Settings.DEFAULTS.apiBaseUrl;
  apiModelInput.value = settings.apiModel || "";
  apiFields.hidden = settings.classifierMode !== "api";
  mark.textContent = settings.classifierMode === "api" ? "api" : "local";
  hintText.textContent =
    settings.classifierMode === "api"
      ? "API classifies in the background service worker; the page never sees your key. Regex is used if the call fails or cache is cold."
      : "Default is local regex — no keys, no network. API mode uses your key only for intent classification.";
}

function readFormSettings(enabled) {
  return Settings.normalize({
    enabled,
    classifierMode: modeSelect.value,
    apiKey: apiKeyInput.value,
    apiBaseUrl: apiBaseInput.value,
    apiModel: apiModelInput.value,
  });
}

function persist(partial) {
  chrome.storage.local.set(partial);
}

chrome.storage.local.get(null, (stored) => {
  const settings = Settings.normalize(stored);
  syncToggle(settings.enabled);
  syncModeUi(settings);
  document.body.classList.add("ui-ready");
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  syncToggle(enabled);
  persist({ enabled });
});

modeSelect.addEventListener("change", () => {
  const settings = readFormSettings(toggle.checked);
  syncModeUi(settings);
  persist({
    classifierMode: settings.classifierMode,
    apiKey: settings.apiKey,
    apiBaseUrl: settings.apiBaseUrl,
    apiModel: settings.apiModel,
  });
});

function onApiFieldChange() {
  const settings = readFormSettings(toggle.checked);
  persist({
    apiKey: settings.apiKey,
    apiBaseUrl: settings.apiBaseUrl,
    apiModel: settings.apiModel,
  });
}

apiKeyInput.addEventListener("change", onApiFieldChange);
apiBaseInput.addEventListener("change", onApiFieldChange);
apiModelInput.addEventListener("change", onApiFieldChange);
apiKeyInput.addEventListener("blur", onApiFieldChange);
apiBaseInput.addEventListener("blur", onApiFieldChange);
apiModelInput.addEventListener("blur", onApiFieldChange);
