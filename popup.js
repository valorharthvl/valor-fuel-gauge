// popup.js — Valor AI Fuel Gauge popup logic.
// Reads live usage data from the background service worker.

document.addEventListener('DOMContentLoaded', () => {

  // ── DOM references ──
  const gaugeArc = document.getElementById('gauge-arc');
  const gaugePercent = document.getElementById('gauge-percent');
  const gaugePercentSign = document.getElementById('gauge-percent-sign');
  const gaugeCaption = document.getElementById('gauge-caption');
  const resetDateEl = document.getElementById('reset-date');
  const resetDateValue = document.getElementById('reset-date-value');
  const creditsValue = document.getElementById('credits-value');
  const buyBtn = document.getElementById('buy-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // ── Gauge constants ──
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  function gaugeColor(pct) {
    if (pct > 50) return '#4ade80';
    if (pct >= 25) return '#facc15';
    return '#ef4444';
  }

  function renderGauge(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    const color = gaugeColor(clamped);

    gaugeArc.style.strokeDasharray = CIRCUMFERENCE;
    gaugeArc.style.strokeDashoffset = offset;
    gaugeArc.setAttribute('stroke', color);

    gaugePercent.textContent = Math.round(clamped);
    gaugePercent.style.color = color;
    gaugePercentSign.style.display = '';
  }

  function renderEmpty() {
    gaugeArc.style.strokeDasharray = CIRCUMFERENCE;
    gaugeArc.style.strokeDashoffset = CIRCUMFERENCE;
    gaugeArc.setAttribute('stroke', '#1e293b');
    gaugePercent.textContent = '--';
    gaugePercent.style.color = '#475569';
    gaugePercentSign.style.display = 'none';
  }

  function showMessage(text) {
    renderEmpty();
    gaugeCaption.textContent = text;
    resetDateEl.style.display = 'none';
  }

  function showError(text) {
    renderEmpty();
    gaugeCaption.textContent = text;
    gaugeCaption.style.color = '#ef4444';
    resetDateEl.style.display = 'none';
  }

  /**
   * Format an ISO-8601 timestamp into a readable string.
   * "2026-04-10T16:00:00Z" → "Apr 10, 4:00 PM"
   */
  function formatResetDate(iso) {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '--';
      var month = d.toLocaleString('en-US', { month: 'short' });
      var day = d.getDate();
      var time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return month + ' ' + day + ', ' + time;
    } catch (e) {
      return '--';
    }
  }

  // ── Request usage data from background ──

  chrome.runtime.sendMessage({ type: 'GET_USAGE' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      showError('Unable to reach background service.');
      return;
    }

    if (response.error === 'no_key') {
      showMessage('Add your API key in settings to get started');
      return;
    }

    if (response.error === 'invalid_key') {
      showError('Unable to fetch usage. Check your API key.');
      return;
    }

    if (!response.ok) {
      showError('Unable to fetch usage. Check your API key.');
      return;
    }

    // ── Success: render live data ──
    renderGauge(response.percentRemaining);
    gaugeCaption.textContent = 'Claude usage remaining';
    gaugeCaption.style.color = '';
    resetDateEl.style.display = '';
    resetDateValue.textContent = formatResetDate(response.resetDate);
  });

  // ── Credits: still placeholder until Supabase is wired up ──
  creditsValue.textContent = '--';

  // ── Button handlers ──

  buyBtn.addEventListener('click', () => {
    console.log('[Valor Fuel Gauge] Buy More clicked — Stripe integration pending.');
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
