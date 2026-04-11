// background.js — Valor AI Fuel Gauge service worker.
// All usage tracking is LOCAL in Chrome storage. No Anthropic usage endpoint exists.
// Actions are dispatched through the actionsRegistry for extensibility.

console.log('[Valor] Service worker loaded.');

importScripts('storage.js', 'api.js');

var TRACKER_KEY = '_valor_token_tracker';
var CREDITS_KEY = 'valor_action_credits';
var DEFAULT_BUDGET = 100000;
var FREE_CREDITS = 5;

// ══════════════════════════════════════════
// Actions Registry
// Each handler receives (apiKey, content, options) and returns
// { ok, result, tokensUsed } or { ok: false, error }.
// To add a new action: add a key here and a message handler below.
// ══════════════════════════════════════════

var actionsRegistry = {

  SUMMARIZE: async function(apiKey, content) {
    var response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: ValorAPI._headers(apiKey),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: 'You are a concise summarizer. Summarize the provided text in 3 sentences maximum. Be direct and clear.',
          messages: [{ role: 'user', content: content }]
        })
      });
    } catch (err) {
      return { ok: false, error: 'network_error' };
    }

    console.log('[Valor] SUMMARIZE HTTP status:', response.status);

    if (response.status === 401) {
      return { ok: false, error: 'invalid_key' };
    }

    if (!response.ok) {
      var errorBody = await response.text();
      console.log('[Valor] SUMMARIZE error body:', errorBody);
      return { ok: false, error: 'api_error' };
    }

    var body = await response.json();

    var text = '';
    if (body.content && body.content[0] && body.content[0].text) {
      text = body.content[0].text;
    }

    var tokensUsed = 0;
    if (body.usage) {
      tokensUsed = (body.usage.input_tokens || 0) + (body.usage.output_tokens || 0);
    }

    return { ok: true, result: text, tokensUsed: tokensUsed };
  }

  // Future actions: REWRITE_TONE, DRAFT_EMAIL, EXPLAIN_CODE
};

// ══════════════════════════════════════════
// Lifecycle
// ══════════════════════════════════════════

chrome.runtime.onInstalled.addListener(function() {
  console.log('[Valor] onInstalled fired.');
  initTracker();
  initCredits();
});

// ══════════════════════════════════════════
// Action pack credits
// ══════════════════════════════════════════

async function initCredits() {
  var stored = await ValorStorage.get([CREDITS_KEY]);
  if (typeof stored[CREDITS_KEY] !== 'number') {
    await ValorStorage.set({ [CREDITS_KEY]: FREE_CREDITS });
    console.log('[Valor] Credits initialized:', FREE_CREDITS);
  }
}

async function getCredits() {
  var stored = await ValorStorage.get([CREDITS_KEY]);
  var balance = stored[CREDITS_KEY];
  if (typeof balance !== 'number') {
    await ValorStorage.set({ [CREDITS_KEY]: FREE_CREDITS });
    return FREE_CREDITS;
  }
  return balance;
}

async function addCredits(amount) {
  var balance = await getCredits();
  var newBalance = balance + amount;
  await ValorStorage.set({ [CREDITS_KEY]: newBalance });
  console.log('[Valor] Credits added:', amount, 'New balance:', newBalance);
  return { ok: true, credits: newBalance };
}

async function deductCredit() {
  var balance = await getCredits();
  if (balance <= 0) {
    return { ok: false, error: 'no_credits', credits: 0 };
  }
  var newBalance = balance - 1;
  await ValorStorage.set({ [CREDITS_KEY]: newBalance });
  return { ok: true, credits: newBalance };
}

// ══════════════════════════════════════════
// Local token tracker
// ══════════════════════════════════════════

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

// ══════════════════════════════════════════
// One-time key validation
// ══════════════════════════════════════════

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

  console.log('[Valor] Key valid. Probe used', result.tokensUsed, 'tokens.');
  tracker.keyValid = true;
  tracker.tokensUsed += result.tokensUsed;
  await ValorStorage.set({ [TRACKER_KEY]: tracker });

  return buildUsageResponse(tracker);
}

// ══════════════════════════════════════════
// SUMMARIZE action handler
// ══════════════════════════════════════════

async function handleSummarize() {
  var credits = await getCredits();
  if (credits <= 0) {
    return { ok: false, error: 'no_credits', credits: 0 };
  }

  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) {
    return { ok: false, error: 'no_key' };
  }

  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) {
    return { ok: false, error: 'no_tab' };
  }
  var tab = tabs[0];

  var selectedText = '';
  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function() { return window.getSelection().toString().trim(); }
    });
    if (results && results[0] && results[0].result) {
      selectedText = results[0].result;
    }
  } catch (e) {
    console.log('[Valor] scripting.executeScript failed:', e.message);
  }

  var content = selectedText;
  if (!content) {
    content = 'Page: ' + (tab.title || 'Unknown') + '\nURL: ' + (tab.url || 'Unknown');
  }

  var result = await actionsRegistry.SUMMARIZE(apiKey, content);

  if (!result.ok) {
    return result;
  }

  var creditResult = await deductCredit();

  if (result.tokensUsed) {
    await addTokens(result.tokensUsed);
  }

  return {
    ok: true,
    summary: result.result,
    credits: creditResult.credits,
    tokensUsed: result.tokensUsed
  };
}

// ══════════════════════════════════════════
// Message handler
// ══════════════════════════════════════════

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('[Valor] Message received:', message.type);

  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'GET_USAGE') {
    handleGetUsage().then(sendResponse);
    return true;
  }

  if (message.type === 'GET_CREDITS') {
    getCredits().then(function(balance) {
      sendResponse({ ok: true, credits: balance });
    });
    return true;
  }

  if (message.type === 'DEDUCT_CREDIT') {
    deductCredit().then(sendResponse);
    return true;
  }

  if (message.type === 'ADD_CREDITS') {
    var amount = message.credits || 0;
    if (amount > 0) {
      addCredits(amount).then(sendResponse);
    } else {
      sendResponse({ ok: false, error: 'invalid_amount' });
    }
    return true;
  }

  if (message.type === 'SUMMARIZE') {
    handleSummarize().then(sendResponse);
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

  if (!tracker.keyValid) {
    return validateOnce();
  }

  return buildUsageResponse(tracker);
}
