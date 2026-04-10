// content.js — Valor AI Fuel Gauge content script.
// Injected into claude.ai pages per manifest.json content_scripts config.
// This file intentionally does NO DOM scraping of Claude's interface.
// It only listens for messages from the popup/background to coordinate actions.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ ok: true, context: 'content_script_active' });
  }
  return true;
});
