// background.js — AI & API Tracker service worker.
// Tracks usage for both Claude (Anthropic) and ChatGPT (OpenAI) locally.
// Actions dispatched through actionsRegistry.

console.log('[Valor] Service worker loaded.');

importScripts('storage.js', 'api.js');

var CLAUDE_TRACKER_KEY = '_valor_token_tracker';
var OPENAI_TRACKER_KEY = '_valor_openai_tracker';
var CREDITS_KEY = 'valor_action_credits';
var CREDITED_SESSIONS_KEY = '_valor_credited_sessions';
var DEFAULT_BUDGET = 100000;
var FREE_CREDITS = 5;

// ══════════════════════════════════════════
// Actions Registry
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

    if (response.status === 401) return { ok: false, error: 'invalid_key' };
    if (!response.ok) {
      var errorBody = await response.text();
      console.log('[Valor] SUMMARIZE error:', errorBody);
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
};

// ══════════════════════════════════════════
// Lifecycle
// ══════════════════════════════════════════

chrome.runtime.onInstalled.addListener(function() {
  console.log('[Valor] onInstalled fired.');
  initTracker(CLAUDE_TRACKER_KEY);
  initTracker(OPENAI_TRACKER_KEY);
  initCredits();
});

// ══════════════════════════════════════════
// Generic tracker (works for both platforms)
// ══════════════════════════════════════════

async function initTracker(key) {
  var stored = await ValorStorage.get([key]);
  if (!stored[key]) {
    var now = new Date();
    var resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var obj = {};
    obj[key] = {
      tokensUsed: 0,
      tokenBudget: DEFAULT_BUDGET,
      periodStart: now.toISOString(),
      resetDate: resetDate.toISOString(),
      keyValid: false
    };
    await ValorStorage.set(obj);
  }
}

async function getTracker(key) {
  await initTracker(key);
  var stored = await ValorStorage.get([key]);
  var tracker = stored[key];

  if (new Date() >= new Date(tracker.resetDate)) {
    var now = new Date();
    var nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    tracker.tokensUsed = 0;
    tracker.periodStart = now.toISOString();
    tracker.resetDate = nextReset.toISOString();
    var obj = {};
    obj[key] = tracker;
    await ValorStorage.set(obj);
  }

  return tracker;
}

async function addTokensToTracker(key, count) {
  var tracker = await getTracker(key);
  tracker.tokensUsed += count;
  var obj = {};
  obj[key] = tracker;
  await ValorStorage.set(obj);
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
// Claude key validation
// ══════════════════════════════════════════

async function validateClaude() {
  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) return { ok: false, error: 'no_key' };

  var result = await ValorAPI.validateKey(apiKey);
  var tracker = await getTracker(CLAUDE_TRACKER_KEY);

  if (!result.ok) {
    tracker.keyValid = false;
    var obj = {};
    obj[CLAUDE_TRACKER_KEY] = tracker;
    await ValorStorage.set(obj);
    return { ok: false, error: result.error };
  }

  tracker.keyValid = true;
  tracker.tokensUsed += result.tokensUsed;
  var obj = {};
  obj[CLAUDE_TRACKER_KEY] = tracker;
  await ValorStorage.set(obj);
  return buildUsageResponse(tracker);
}

// ══════════════════════════════════════════
// OpenAI key validation
// ══════════════════════════════════════════

async function validateOpenAI() {
  var apiKey = await ValorStorage.loadOpenAIKey();
  if (!apiKey) return { ok: false, error: 'no_key' };

  var result = await ValorAPI.validateOpenAIKey(apiKey);
  var tracker = await getTracker(OPENAI_TRACKER_KEY);

  if (!result.ok) {
    tracker.keyValid = false;
    var obj = {};
    obj[OPENAI_TRACKER_KEY] = tracker;
    await ValorStorage.set(obj);
    return { ok: false, error: result.error };
  }

  tracker.keyValid = true;
  tracker.tokensUsed += result.tokensUsed;
  var obj = {};
  obj[OPENAI_TRACKER_KEY] = tracker;
  await ValorStorage.set(obj);
  return buildUsageResponse(tracker);
}

// ══════════════════════════════════════════
// Usage handlers
// ══════════════════════════════════════════

async function handleGetClaudeUsage() {
  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) return { ok: false, error: 'no_key' };
  var tracker = await getTracker(CLAUDE_TRACKER_KEY);
  if (!tracker.keyValid) return validateClaude();
  return buildUsageResponse(tracker);
}

async function handleGetOpenAIUsage() {
  var apiKey = await ValorStorage.loadOpenAIKey();
  if (!apiKey) return { ok: false, error: 'no_key' };
  var tracker = await getTracker(OPENAI_TRACKER_KEY);
  if (!tracker.keyValid) return validateOpenAI();
  return buildUsageResponse(tracker);
}

// ══════════════════════════════════════════
// Action pack credits
// ══════════════════════════════════════════

async function initCredits() {
  var stored = await ValorStorage.get([CREDITS_KEY]);
  if (typeof stored[CREDITS_KEY] !== 'number') {
    await ValorStorage.set({ [CREDITS_KEY]: FREE_CREDITS });
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
  return { ok: true, credits: newBalance };
}

async function deductCredit() {
  var balance = await getCredits();
  if (balance <= 0) return { ok: false, error: 'no_credits', credits: 0 };
  var newBalance = balance - 1;
  await ValorStorage.set({ [CREDITS_KEY]: newBalance });
  return { ok: true, credits: newBalance };
}

async function handleAddCredits(message) {
  var amount = message.credits || 0;
  var sessionId = message.session_id || '';
  if (amount <= 0) return { ok: false, error: 'invalid_amount' };
  if (sessionId) {
    var stored = await ValorStorage.get([CREDITED_SESSIONS_KEY]);
    var credited = stored[CREDITED_SESSIONS_KEY] || [];
    if (credited.indexOf(sessionId) !== -1) {
      var balance = await getCredits();
      return { ok: true, credits: balance, already_credited: true };
    }
    credited.push(sessionId);
    await ValorStorage.set({ [CREDITED_SESSIONS_KEY]: credited });
  }
  return addCredits(amount);
}

// ══════════════════════════════════════════
// SUMMARIZE action handler
// ══════════════════════════════════════════

async function handleSummarize() {
  var credits = await getCredits();
  if (credits <= 0) return { ok: false, error: 'no_credits', credits: 0 };

  var apiKey = await ValorStorage.loadApiKey();
  if (!apiKey) return { ok: false, error: 'no_key' };

  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs.length) return { ok: false, error: 'no_tab' };
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
  if (!result.ok) return result;

  var creditResult = await deductCredit();
  if (result.tokensUsed) {
    await addTokensToTracker(CLAUDE_TRACKER_KEY, result.tokensUsed);
  }

  return {
    ok: true,
    summary: result.result,
    credits: creditResult.credits,
    tokensUsed: result.tokensUsed
  };
}

// ══════════════════════════════════════════
// Message handlers
// ══════════════════════════════════════════

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('[Valor] Message received:', message.type);

  if (message.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'GET_USAGE') {
    handleGetClaudeUsage().then(sendResponse);
    return true;
  }

  if (message.type === 'GET_OPENAI_USAGE') {
    handleGetOpenAIUsage().then(sendResponse);
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
    handleAddCredits(message).then(sendResponse);
    return true;
  }

  if (message.type === 'SUMMARIZE') {
    handleSummarize().then(sendResponse);
    return true;
  }

  if (message.type === 'RECORD_TOKENS') {
    var key = message.platform === 'openai' ? OPENAI_TRACKER_KEY : CLAUDE_TRACKER_KEY;
    addTokensToTracker(key, message.tokens).then(function(tracker) {
      sendResponse(buildUsageResponse(tracker));
    });
    return true;
  }

  if (message.type === 'FORCE_VALIDATE') {
    validateClaude().then(sendResponse);
    return true;
  }

  if (message.type === 'FORCE_VALIDATE_OPENAI') {
    validateOpenAI().then(sendResponse);
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
  console.log('[Valor] External message received:', message.type);
  if (message.type === 'ADD_CREDITS') {
    handleAddCredits(message).then(sendResponse);
    return true;
  }
  sendResponse({ ok: false, error: 'unknown_message' });
});
