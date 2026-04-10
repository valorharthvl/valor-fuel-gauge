// api.js — Valor AI Fuel Gauge API helper.
// All external calls are routed through here. No DOM scraping.
// REQUIRED: Every Anthropic fetch includes anthropic-dangerous-direct-browser-access header.
// RULE: Never use the messages endpoint for usage checking. Track usage locally.
// The messages endpoint is used ONLY for one-time key validation on first load.

var ValorAPI = {

  /**
   * Standard headers for every Anthropic API call.
   * Always includes anthropic-dangerous-direct-browser-access or calls return 401.
   */
  _headers: function(apiKey) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  },

  /**
   * One-time key validation. Sends a minimal 1-token test message.
   * Called on first load only, never for usage polling.
   * Returns the token count so the local tracker can record it.
   */
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

    if (response.status === 401) {
      return { ok: false, error: 'invalid_key' };
    }

    if (!response.ok) {
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

  /**
   * Purchase an action pack via Stripe checkout.
   * Placeholder: not yet implemented.
   */
  purchaseActionPack: async function() {
    return { ok: false, message: 'Stripe integration pending.' };
  },

  /**
   * Run a quick summary action via the Anthropic API.
   * Placeholder: not yet implemented. Will use _headers() and record tokens.
   */
  runSummaryAction: async function(apiKey, text) {
    return { ok: false, message: 'Anthropic integration pending.' };
  },

  /**
   * Send an onboarding email via Resend.
   * Placeholder: not yet implemented.
   */
  sendOnboardingEmail: async function(email) {
    return { ok: false, message: 'Resend integration pending.' };
  }
};
