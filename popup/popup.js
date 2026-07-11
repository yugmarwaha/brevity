const toggle = document.getElementById("enabled-toggle");

chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  toggle.checked = enabled;
});

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
});
