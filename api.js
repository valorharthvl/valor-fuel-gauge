// api.js — Valor AI Fuel Gauge API helper.
// All external calls are routed through here. No DOM scraping.
// REQUIRED: Every Anthropic fetch must include anthropic-dangerous-direct-browser-access header.

const ValorAPI = {

  /**
   * Build the standard headers for every Anthropic API call.
   * @param {string} apiKey — Decrypted Anthropic API key.
   * @returns {Object}
   */
  _headers(apiKey) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  },

  /**
   * Validate an API key by making a minimal one-token request.
   * Returns the token count consumed so the local tracker can record it.
   *
   * @param {string} apiKey
   * @returns {Promise<Object>}  { ok, tokensUsed } or { ok:false, error }
   */
  async validateKey(apiKey) {
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
      console.error('[ValorAPI] validateKey network error:', err.message);
      return { ok: false, error: 'network_error' };
    }

    if (response.status === 401) {
      return { ok: false, error: 'invalid_key' };
    }

    if (!response.ok) {
      console.error('[ValorAPI] validateKey HTTP', response.status);
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
  async purchaseActionPack() {
    console.log('[ValorAPI] purchaseActionPack — not yet implemented.');
    return { ok: false, message: 'Stripe integration pending.' };
  },

  /**
   * Run a quick summary action via the Anthropic API.
   * Placeholder: not yet implemented.
   * @param {string} apiKey
   * @param {string} text
   */
  async runSummaryAction(apiKey, text) {
    console.log('[ValorAPI] runSummaryAction — not yet implemented.');
    return { ok: false, message: 'Anthropic integration pending.' };
  },

  /**
   * Send an onboarding email via Resend.
   * Placeholder: not yet implemented.
   * @param {string} email
   */
  async sendOnboardingEmail(email) {
    console.log('[ValorAPI] sendOnboardingEmail — not yet implemented.');
    return { ok: false, message: 'Resend integration pending.' };
  }
};
