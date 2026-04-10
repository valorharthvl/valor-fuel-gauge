// background.js — Valor AI Fuel Gauge service worker.
// All usage tracking is LOCAL in Chrome storage. No Anthropic usage endpoint exists.
// The only API call is a one-time key validation on first load.

console.log('[Valor] Service worker loaded.');

importScripts('storage.js', 'api.js');

var TRACKER_KEY = '_valor_token_tracker';
var DEFAULT_BUDGET = 100000; // 100,000 tokens per month

// ── Lifecycle ──

chrome.runtime.onInstalled.addListener(function() {
  console.log('[Valor] onInstalled fired.');
  initTracker();
});

// ── Local token tracker ──

async function initTracker() {
  var stored = await ValorStorage.get([TRACKER_KEY]);
  if (!stored[TRACKER_KEY]) {
    var now = new Date();
    var resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await ValorStorage.set({
      [TRACKER_KEY]: {
        tokensUsed: 0,
        tokenBudget: DEFAULT_BUDGET,
        periodStart: now.toISOString(),
        resetDate: resetDate.toISOString(),
        keyValid: false
      }
    });
    console.log('[Valor] Tracker initialized.');
  }
}

async function getTracker() {
  await initTracker();
  var stored = await ValorStorage.get([TRACKER_KEY]);
  var tracker = stored[TRACKER_KEY];

  // Auto-reset if the monthly period has elapsed.
  if (new Date() >= new Date(tracker.resetDate)) {
    var now = new Date();
    var nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    tracker.tokensUsed = 0;
    tracker.periodStart = now.toISOString();
    tracker.resetDate = nextReset.toISOString();
    await ValorStorage.set({ [TRACKER_KEY]: tracker });
    console.log('[Valor] Monthly period reset.');
  }

  return tracker;
}

async function addTokens(count) {
  var tracker = await getTracker();
  tracker.tokensUsed += count;
  await ValorStorage.set({ [TRACKER_KEY]: tracker });
  return tracker;
}

function buildUsageResponse(tracker) {
  var remaining = tracker.tokenBudget - tracker.tokensUsed;
  if (remaining < 0) remaining = 0;
  var pct = Math.round((remaining / tracker.tokenBudget) * 100);

  return {
    ok: true,
    percentRemaining: pct,
    tokensUsed: tracker.tokensUsed,
    tokenBudget: tracker.tokenBudget,
    resetDate: tracker.resetDate,
    fetchedAt: Date.now()
  };
}

// ── One-time key validation (first load only) ──

async function validateOnce() {
  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) {
    return { ok: false, error: 'no_key' };
  }

  console.log('[Valor] Validating API key...');
  var result = await ValorAPI.validateKey(apiKey);
  var tracker = await getTracker();

  if (!result.ok) {
    console.log('[Valor] Key validation failed:', result.error);
    tracker.keyValid = false;
    await ValorStorage.set({ [TRACKER_KEY]: tracker });
    return { ok: false, error: result.error };
  }

  // Key is valid. Record the tokens the validation probe consumed.
  console.log('[Valor] Key valid. Probe used', result.tokensUsed, 'tokens.');
  tracker.keyValid = true;
  tracker.tokensUsed += result.tokensUsed;
  await ValorStorage.set({ [TRACKER_KEY]: tracker });

  return buildUsageResponse(tracker);
}

// ── Message handler ──

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('[Valor] Message received:', message.type);

  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'GET_USAGE') {
    handleGetUsage().then(function(data) {
      console.log('[Valor] GET_USAGE response:', JSON.stringify(data));
      sendResponse(data);
    });
    return true;
  }

  if (message.type === 'RECORD_TOKENS') {
    addTokens(message.tokens).then(function(tracker) {
      sendResponse(buildUsageResponse(tracker));
    });
    return true;
  }

  if (message.type === 'FORCE_VALIDATE') {
    validateOnce().then(sendResponse);
    return true;
  }
});

async function handleGetUsage() {
  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) {
    return { ok: false, error: 'no_key' };
  }

  var tracker = await getTracker();

  // Validate key on first load only. After that, read local tracker.
  if (!tracker.keyValid) {
    return validateOnce();
  }

  return buildUsageResponse(tracker);
}
