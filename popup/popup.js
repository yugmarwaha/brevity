const toggle = document.getElementById("enabled-toggle");

function syncUi(enabled) {
  toggle.checked = enabled;
  toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  document.body.classList.toggle("is-enabled", enabled);
  document.body.classList.add("ui-ready");
}

chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  syncUi(enabled !== false);
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  syncUi(enabled);
  chrome.storage.local.set({ enabled });
});
