// background.js — Valor AI Fuel Gauge service worker
// Handles extension lifecycle events, alarms, and message routing.

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Valor Fuel Gauge] Extension installed.');
  } else if (details.reason === 'update') {
    console.log('[Valor Fuel Gauge] Extension updated to', chrome.runtime.getManifest().version);
  }
});

// Central message router — all popup/content/options messages arrive here.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    // Placeholder: will return usage status from Supabase in a later step.
    sendResponse({ ok: true, status: 'ready' });
  }
  // Return true to keep the message channel open for async responses.
  return true;
});
