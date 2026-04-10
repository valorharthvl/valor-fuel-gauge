// popup.js — Valor AI Fuel Gauge popup logic

document.addEventListener('DOMContentLoaded', () => {
  const statusMessage = document.getElementById('status-message');
  const optionsBtn = document.getElementById('options-btn');

  // Request current status from the background service worker.
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      statusMessage.textContent = 'Unable to reach background service.';
      return;
    }
    if (response && response.ok) {
      statusMessage.textContent = 'Extension loaded. Action packs coming soon.';
    } else {
      statusMessage.textContent = 'Status unavailable.';
    }
  });

  // Open the options / settings page.
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
