// popup.js — Valor AI Fuel Gauge popup logic.
// Reads local token tracking data and action pack credits from the background service worker.
// Sends a PING first to wake the service worker before requesting data.

document.addEventListener('DOMContentLoaded', function() {

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

  // ── Wake the service worker with a PING, then request data ──

  console.log('[Valor Popup] Opened. Sending PING to wake service worker.');

  chrome.runtime.sendMessage({ type: 'PING' }, function() {
    if (chrome.runtime.lastError) {
      console.log('[Valor Popup] PING error (may be normal):', chrome.runtime.lastError.message);
    }

    // Request usage data and credits in parallel after wake.
    requestUsage();
    requestCredits();
  });

  // ── Usage data ──

  function requestUsage() {
    console.log('[Valor Popup] Sending GET_USAGE.');

    chrome.runtime.sendMessage({ type: 'GET_USAGE' }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('[Valor Popup] GET_USAGE error:', chrome.runtime.lastError.message);
        showError('Unable to reach background service.');
        return;
      }

      if (!response) {
        console.error('[Valor Popup] GET_USAGE returned null.');
        showError('Unable to reach background service.');
        return;
      }

      console.log('[Valor Popup] GET_USAGE response:', JSON.stringify(response));

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

      renderGauge(response.percentRemaining);
      gaugeCaption.textContent = 'Claude usage remaining';
      gaugeCaption.style.color = '';
      resetDateEl.style.display = '';
      resetDateValue.textContent = formatResetDate(response.resetDate);
    });
  }

  // ── Credit balance ──

  function requestCredits() {
    console.log('[Valor Popup] Sending GET_CREDITS.');

    chrome.runtime.sendMessage({ type: 'GET_CREDITS' }, function(response) {
      if (chrome.runtime.lastError || !response) {
        console.error('[Valor Popup] GET_CREDITS error.');
        creditsValue.textContent = '--';
        return;
      }

      console.log('[Valor Popup] GET_CREDITS response:', JSON.stringify(response));
      creditsValue.textContent = response.credits;
    });
  }

  // ── Button handlers ──

  buyBtn.addEventListener('click', function() {
    console.log('[Valor Popup] Buy More clicked — Stripe integration pending.');
  });

  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});
