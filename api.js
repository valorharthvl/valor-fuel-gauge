// api.js — AI & API Tracker API helper.
// All external calls are routed through here. No DOM scraping.
// Supports both Anthropic (Claude) and OpenAI (ChatGPT) APIs.

var ValorAPI = {

  // ── Anthropic headers ──

  _headers: function(apiKey) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  },

  // ── OpenAI headers ──

  _openaiHeaders: function(apiKey) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    };
  },

  // ── Anthropic key validation ──

  validateKey: async function(apiKey) {
    var response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: this._headers(apiKey),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: '.' }]
        })
      });
    } catch (err) {
      return { ok: false, error: 'network_error' };
    }

    console.log('[ValorAPI] validateKey (Anthropic) HTTP status:', response.status);

    if (response.status === 401) {
      return { ok: false, error: 'invalid_key' };
    }

    if (!response.ok) {
      var errorBody = await response.text();
      console.log('[ValorAPI] validateKey error body:', errorBody);
      return { ok: false, error: 'api_error' };
    }

    var body;
    try {
      body = await response.json();
    } catch (e) {
      return { ok: true, tokensUsed: 0 };
    }

    var used = 0;
    if (body && body.usage) {
      used = (body.usage.input_tokens || 0) + (body.usage.output_tokens || 0);
    }

    return { ok: true, tokensUsed: used };
  },

  // ── OpenAI key validation ──

  validateOpenAIKey: async function(apiKey) {
    var response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: this._openaiHeaders(apiKey),
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1,
          messages: [{ role: 'user', content: '.' }]
        })
      });
    } catch (err) {
      return { ok: false, error: 'network_error' };
    }

    console.log('[ValorAPI] validateKey (OpenAI) HTTP status:', response.status);

    if (response.status === 401) {
      return { ok: false, error: 'invalid_key' };
    }

    if (!response.ok) {
      var errorBody = await response.text();
      console.log('[ValorAPI] validateOpenAIKey error body:', errorBody);
      return { ok: false, error: 'api_error' };
    }

    var body;
    try {
      body = await response.json();
    } catch (e) {
      return { ok: true, tokensUsed: 0 };
    }

    var used = 0;
    if (body && body.usage) {
      used = (body.usage.prompt_tokens || 0) + (body.usage.completion_tokens || 0);
    }

    return { ok: true, tokensUsed: used };
  },

  // ── Placeholders ──

  purchaseActionPack: async function() {
    return { ok: false, message: 'Stripe integration pending.' };
  },

  runSummaryAction: async function(apiKey, text) {
    return { ok: false, message: 'Anthropic integration pending.' };
  },

  sendOnboardingEmail: async function(email) {
    return { ok: false, message: 'Resend integration pending.' };
  }
};
