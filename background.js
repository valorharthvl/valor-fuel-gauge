// background.js — Valor AI Fuel Gauge service worker.
// Validates API key, tracks token usage locally, serves data to popup.
// Does NOT poll the Anthropic API for usage — all tracking is local.

importScripts('storage.js', 'api.js');

const TRACKER_KEY = '_valor_token_tracker';
const DEFAULT_BUDGET = 1000000; // 1 million tokens per monthly period

// ── Lifecycle ──

chrome.runtime.onInstalled.addListener(() => {
  initTracker();
});

// ── Token tracker ──

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
  }
}

async function getTracker() {
  await initTracker();
  var stored = await ValorStorage.get([TRACKER_KEY]);
  var tracker = stored[TRACKER_KEY];

  // Reset if the monthly period has elapsed.
  if (new Date() >= new Date(tracker.resetDate)) {
    var now = new Date();
    var nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    tracker.tokensUsed = 0;
    tracker.periodStart = now.toISOString();
    tracker.resetDate = nextReset.toISOString();
    await ValorStorage.set({ [TRACKER_KEY]: tracker });
  }

  return tracker;
}

async function addTokens(count) {
  var tracker = await getTracker();
  tracker.tokensUsed += count;
  await ValorStorage.set({ [TRACKER_KEY]: tracker });
  return tracker;
}

// ── Key validation (one-time per key save, not polling) ──

async function validateAndCache() {
  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) {
    return { ok: false, error: 'no_key' };
  }

  var result = await ValorAPI.validateKey(apiKey);

  var tracker = await getTracker();

  if (!result.ok) {
    tracker.keyValid = false;
    await ValorStorage.set({ [TRACKER_KEY]: tracker });
    return { ok: false, error: result.error };
  }

  // Key is valid. Record the tokens the validation probe used.
  tracker.keyValid = true;
  tracker.tokensUsed += result.tokensUsed;
  await ValorStorage.set({ [TRACKER_KEY]: tracker });

  return buildUsageResponse(tracker);
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

// ── Message handler ──

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'GET_USAGE') {
    handleGetUsage().then(sendResponse);
    return true;
  }

  if (message.type === 'RECORD_TOKENS') {
    addTokens(message.tokens).then(function(tracker) {
      sendResponse(buildUsageResponse(tracker));
    });
    return true;
  }

  if (message.type === 'FORCE_VALIDATE') {
    validateAndCache().then(sendResponse);
    return true;
  }
});

async function handleGetUsage() {
  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) {
    return { ok: false, error: 'no_key' };
  }

  var tracker = await getTracker();

  // If the key has never been validated, validate it now.
  if (!tracker.keyValid) {
    return validateAndCache();
  }

  return buildUsageResponse(tracker);
}
