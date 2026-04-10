// popup.js — Valor AI Fuel Gauge popup logic

document.addEventListener('DOMContentLoaded', () => {

  // ── Hardcoded placeholder data (replaced with real data in later steps) ──
  const MOCK_DATA = {
    usagePercent: 63,
    resetDate: 'Apr 17, 2026',
    credits: 42
  };

  // ── DOM references ──
  const gaugeArc = document.getElementById('gauge-arc');
  const gaugePercent = document.getElementById('gauge-percent');
  const resetDateValue = document.getElementById('reset-date-value');
  const creditsValue = document.getElementById('credits-value');
  const buyBtn = document.getElementById('buy-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // ── Gauge rendering ──

  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  /**
   * Returns the gauge color for a given percentage.
   *   > 50  → green
   *   25-50 → yellow
   *   < 25  → red
   */
  function gaugeColor(pct) {
    if (pct > 50) return '#4ade80';
    if (pct >= 25) return '#facc15';
    return '#ef4444';
  }

  /**
   * Draw the gauge arc to reflect the given percentage (0-100).
   */
  function renderGauge(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    const color = gaugeColor(clamped);

    gaugeArc.style.strokeDasharray = CIRCUMFERENCE;
    gaugeArc.style.strokeDashoffset = offset;
    gaugeArc.setAttribute('stroke', color);

    gaugePercent.textContent = Math.round(clamped);
    gaugePercent.style.color = color;
  }

  // ── Populate UI with placeholder data ──

  renderGauge(MOCK_DATA.usagePercent);
  resetDateValue.textContent = MOCK_DATA.resetDate;
  creditsValue.textContent = MOCK_DATA.credits;

  // ── Button handlers ──

  buyBtn.addEventListener('click', () => {
    // Placeholder: will open Stripe checkout in a later step.
    console.log('[Valor Fuel Gauge] Buy More clicked — Stripe integration pending.');
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
