// api.js — Valor AI Fuel Gauge API helper.
// All external calls are routed through here. No DOM scraping.

const ValorAPI = {

  /**
   * Fetch real-time usage data from the Anthropic API.
   *
   * Makes a minimal one-token request to the Messages endpoint and reads
   * the rate-limit headers that come back. These headers tell us how much
   * token capacity remains in the current rate-limit window.
   *
   *   anthropic-ratelimit-tokens-limit      → total tokens allowed
   *   anthropic-ratelimit-tokens-remaining   → tokens still available
   *   anthropic-ratelimit-tokens-reset       → ISO-8601 reset timestamp
   *
   * Uses claude-haiku-4-5 to keep the probe as cheap as possible.
   *
   * @param {string} apiKey  — Decrypted Anthropic API key.
   * @returns {Promise<Object>}
   */
  async fetchUsage(apiKey) {
    const url = 'https://api.anthropic.com/v1/messages';
    console.log('[ValorAPI] Endpoint URL:', url);
    console.log('[ValorAPI] API key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'NULL/EMPTY');

    var response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: '.' }]
        })
      });
    } catch (networkErr) {
      console.error('[ValorAPI] Network error (fetch threw):', networkErr.message);
      return { ok: false, error: 'network_error', message: networkErr.message };
    }

    console.log('[ValorAPI] HTTP status:', response.status, response.statusText);

    // Log the full response body so we can see Anthropic's error message.
    var bodyText;
    try {
      bodyText = await response.clone().text();
      console.log('[ValorAPI] Response body:', bodyText);
    } catch (e) {
      console.warn('[ValorAPI] Could not read response body:', e.message);
    }

    // Log every response header for debugging.
    console.log('[ValorAPI] Response headers:');
    response.headers.forEach(function(value, name) {
      console.log('  ', name + ':', value);
    });

    // 401 means the key is invalid or revoked.
    if (response.status === 401) {
      return { ok: false, error: 'invalid_key' };
    }

    // Read rate-limit headers (present on 200 and 429 responses).
    const tokensLimit = parseInt(
      response.headers.get('anthropic-ratelimit-tokens-limit') || '0', 10
    );
    const tokensRemaining = parseInt(
      response.headers.get('anthropic-ratelimit-tokens-remaining') || '0', 10
    );
    const tokensReset = response.headers.get('anthropic-ratelimit-tokens-reset') || '';

    console.log('[ValorAPI] Parsed rate-limit values:',
      'limit=' + tokensLimit,
      'remaining=' + tokensRemaining,
      'reset=' + tokensReset
    );

    // If we got zero for both, the headers were missing entirely.
    if (tokensLimit === 0 && tokensRemaining === 0) {
      return { ok: false, error: 'no_headers' };
    }

    const percentRemaining = tokensLimit > 0
      ? Math.round((tokensRemaining / tokensLimit) * 100)
      : 0;

    return {
      ok: true,
      percentRemaining: percentRemaining,
      tokensLimit: tokensLimit,
      tokensRemaining: tokensRemaining,
      tokensUsed: tokensLimit - tokensRemaining,
      resetDate: tokensReset,
      fetchedAt: Date.now()
    };
  },

  /**
   * Purchase an action pack via Stripe checkout.
   * Placeholder: not yet implemented.
   */
  async purchaseActionPack() {
    console.log('[ValorAPI] purchaseActionPack called — not yet implemented.');
    return { ok: false, message: 'Stripe integration pending.' };
  },

  /**
   * Run a quick summary action via the Anthropic API.
   * Placeholder: not yet implemented.
   * @param {string} text
   */
  async runSummaryAction(text) {
    console.log('[ValorAPI] runSummaryAction called — not yet implemented.');
    return { ok: false, message: 'Anthropic integration pending.' };
  },

  /**
   * Send an onboarding email via Resend.
   * Placeholder: not yet implemented.
   * @param {string} email
   */
  async sendOnboardingEmail(email) {
    console.log('[ValorAPI] sendOnboardingEmail called — not yet implemented.');
    return { ok: false, message: 'Resend integration pending.' };
  }
};
