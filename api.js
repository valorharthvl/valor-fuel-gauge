// api.js — Valor AI Fuel Gauge API helper.
// All external calls (Supabase, Vercel backend, Anthropic) are routed through here.
// Nothing is live yet — every function returns a placeholder response.

const ValorAPI = {
  /**
   * Fetch the user's current usage status from the backend.
   * Placeholder: returns a mock object.
   * @returns {Promise<Object>}
   */
  async getUsageStatus() {
    // TODO: Replace with real Supabase/Vercel call.
    return { actionsRemaining: 0, plan: 'none' };
  },

  /**
   * Purchase an action pack via Stripe checkout.
   * Placeholder: logs intent and resolves.
   * @returns {Promise<Object>}
   */
  async purchaseActionPack() {
    // TODO: Replace with Stripe checkout session creation via Vercel endpoint.
    console.log('[ValorAPI] purchaseActionPack called — not yet implemented.');
    return { ok: false, message: 'Stripe integration pending.' };
  },

  /**
   * Run a quick summary action via the Anthropic API.
   * Placeholder: resolves with a stub.
   * @param {string} text - The text to summarize.
   * @returns {Promise<Object>}
   */
  async runSummaryAction(text) {
    // TODO: Replace with real Anthropic API call via Vercel proxy.
    console.log('[ValorAPI] runSummaryAction called — not yet implemented.');
    return { ok: false, message: 'Anthropic integration pending.' };
  },

  /**
   * Send an onboarding email via Resend.
   * Placeholder: resolves with a stub.
   * @param {string} email
   * @returns {Promise<Object>}
   */
  async sendOnboardingEmail(email) {
    // TODO: Replace with Resend call via Vercel endpoint.
    console.log('[ValorAPI] sendOnboardingEmail called — not yet implemented.');
    return { ok: false, message: 'Resend integration pending.' };
  }
};
