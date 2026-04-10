// background.js — Valor AI Fuel Gauge service worker.
// Polls the Anthropic API for usage data and serves it to the popup.

importScripts('storage.js', 'api.js');

const ALARM_NAME = 'valor_usage_poll';
const CACHE_KEY = '_valor_usage_cache';

// ── Alarm setup ──
// chrome.alarms persists across service-worker restarts.
// Re-check on every wake to be safe.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Valor Background] onInstalled fired. Creating alarm and polling.');
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
  pollUsage();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Valor Background] onStartup fired.');
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      console.log('[Valor Background] Alarm missing on startup, recreating.');
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[Valor Background] Alarm fired. Polling usage.');
    pollUsage();
  }
});

// ── Usage polling ──

async function pollUsage() {
  console.log('[Valor Background] pollUsage() started.');
  try {
    const apiKey = await ValorStorage.loadApiKey();
    console.log('[Valor Background] Decrypted key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NULL — no key saved');

    if (!apiKey) {
      await ValorStorage.set({
        [CACHE_KEY]: { ok: false, error: 'no_key', fetchedAt: Date.now() }
      });
      console.log('[Valor Background] No key found. Cached no_key state.');
      return;
    }

    console.log('[Valor Background] Calling ValorAPI.fetchUsage()...');
    const result = await ValorAPI.fetchUsage(apiKey);
    console.log('[Valor Background] fetchUsage result:', JSON.stringify(result));
    await ValorStorage.set({ [CACHE_KEY]: result });
    console.log('[Valor Background] Result cached.');

  } catch (err) {
    console.error('[Valor Background] pollUsage() threw:', err.message, err.stack);
    await ValorStorage.set({
      [CACHE_KEY]: { ok: false, error: 'fetch_failed', fetchedAt: Date.now() }
    });
  }
}

// ── Message handler ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Valor Background] Message received:', message.type);

  if (message.type === 'GET_USAGE') {
    handleGetUsage().then(function(data) {
      console.log('[Valor Background] Responding to GET_USAGE:', JSON.stringify(data));
      sendResponse(data);
    });
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
    console.log('[Valor Background] No cache found. Triggering immediate poll.');
    await pollUsage();
    const fresh = await ValorStorage.get([CACHE_KEY]);
    return fresh[CACHE_KEY] || { ok: false, error: 'no_data' };
  }

  return cached;
}
