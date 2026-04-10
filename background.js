// background.js — Valor AI Fuel Gauge service worker.
// Polls the Anthropic API for usage data and serves it to the popup.

importScripts('storage.js', 'api.js');

const ALARM_NAME = 'valor_usage_poll';
const CACHE_KEY = '_valor_usage_cache';

// ── Alarm setup ──
// chrome.alarms persists across service-worker restarts.
// Re-check on every wake to be safe.

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
  pollUsage();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    pollUsage();
  }
});

// ── Usage polling ──

async function pollUsage() {
  try {
    const apiKey = await ValorStorage.loadApiKey();

    if (!apiKey) {
      await ValorStorage.set({
        [CACHE_KEY]: { ok: false, error: 'no_key', fetchedAt: Date.now() }
      });
      return;
    }

    const result = await ValorAPI.fetchUsage(apiKey);
    await ValorStorage.set({ [CACHE_KEY]: result });

  } catch (err) {
    console.error('[Valor Background] Poll failed:', err);
    await ValorStorage.set({
      [CACHE_KEY]: { ok: false, error: 'fetch_failed', fetchedAt: Date.now() }
    });
  }
}

// ── Message handler ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_USAGE') {
    handleGetUsage().then(sendResponse);
    return true; // Keep channel open for async response.
  }

  if (message.type === 'FORCE_POLL') {
    pollUsage().then(() => {
      handleGetUsage().then(sendResponse);
    });
    return true;
  }
});

async function handleGetUsage() {
  const stored = await ValorStorage.get([CACHE_KEY]);
  const cached = stored[CACHE_KEY];

  // If there is no cache at all, do an immediate poll.
  if (!cached) {
    await pollUsage();
    const fresh = await ValorStorage.get([CACHE_KEY]);
    return fresh[CACHE_KEY] || { ok: false, error: 'no_data' };
  }

  return cached;
}
