// popup.js — Valor AI Fuel Gauge popup logic.
// Reads local token tracking data from the background service worker.

document.addEventListener('DOMContentLoaded', () => {

  // ── DOM references ──
  var gaugeArc = document.getElementById('gauge-arc');
  var gaugePercent = document.getElementById('gauge-percent');
  var gaugePercentSign = document.getElementById('gauge-percent-sign');
  var gaugeCaption = document.getElementById('gauge-caption');
  var resetDateEl = document.getElementById('reset-date');
  var resetDateValue = document.getElementById('reset-date-value');
  var creditsValue = document.getElementById('credits-value');
  var buyBtn = document.getElementById('buy-btn');
  var settingsBtn = document.getElementById('settings-btn');

  // ── Gauge constants ──
  var RADIUS = 68;
  var CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  function gaugeColor(pct) {
    if (pct > 50) return '#4ade80';
    if (pct >= 25) return '#facc15';
    return '#ef4444';
  }

  function renderGauge(pct) {
    var clamped = Math.max(0, Math.min(100, pct));
    var offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    var color = gaugeColor(clamped);

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
    gaugeCaption.style.color = '';
    resetDateEl.style.display = 'none';
  }

  function showError(text) {
    renderEmpty();
    gaugeCaption.textContent = text;
    gaugeCaption.style.color = '#ef4444';
    resetDateEl.style.display = 'none';
  }

  /**
   * Format an ISO-8601 date string for display.
   * "2026-05-01T00:00:00.000Z" → "May 1, 2026"
   */
  function formatResetDate(iso) {
    if (!iso) return '--';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '--';
      var month = d.toLocaleString('en-US', { month: 'short' });
      var day = d.getDate();
      var year = d.getFullYear();
      return month + ' ' + day + ', ' + year;
    } catch (e) {
      return '--';
    }
  }

  /**
   * Format a token count for display.
   * 123456 → "123,456"
   */
  function formatTokens(n) {
    if (typeof n !== 'number') return '--';
    return n.toLocaleString('en-US');
  }

  // ── Request usage data from background ──

  chrome.runtime.sendMessage({ type: 'GET_USAGE' }, function(response) {
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

    if (response.error === 'network_error') {
      showError('Network error. Check your connection.');
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

  buyBtn.addEventListener('click', function() {
    console.log('[Valor Fuel Gauge] Buy More clicked — Stripe integration pending.');
  });

  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});
