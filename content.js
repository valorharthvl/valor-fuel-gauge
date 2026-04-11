// content.js — Valor AI Fuel Gauge content script.
// Injected into claude.ai pages per manifest.json content_scripts config.
// No DOM scraping. Only returns user-selected text on request.

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'GET_SELECTED_TEXT') {
    var text = window.getSelection().toString().trim();
    sendResponse({ text: text });
  }
  return false;
});
