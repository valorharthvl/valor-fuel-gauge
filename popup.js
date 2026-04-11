// popup.js — Valor AI Fuel Gauge popup logic.
// Reads local token tracking data and action pack credits from the background service worker.
// Handles the Summarize action button and displays results.

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
  var summarizeBtn = document.getElementById('summarize-btn');
  var actionError = document.getElementById('action-error');
  var resultBox = document.getElementById('result-box');
  var resultText = document.getElementById('result-text');
  var resultDismiss = document.getElementById('result-dismiss');

  var currentCredits = 0;

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

  function updateCreditsDisplay(credits) {
    currentCredits = credits;
    creditsValue.textContent = credits;
    if (credits <= 0) {
      buyBtn.classList.add('pulse');
    } else {
      buyBtn.classList.remove('pulse');
    }
  }

  // ── Wake the service worker with a PING, then request data ──

  chrome.runtime.sendMessage({ type: 'PING' }, function() {
    if (chrome.runtime.lastError) {
      // Ignore — PING just wakes the worker.
    }
    requestUsage();
    requestCredits();
  });

  // ── Usage data ──

  function requestUsage() {
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

      renderGauge(response.percentRemaining);
      gaugeCaption.textContent = 'Claude usage remaining';
      gaugeCaption.style.color = '';
      resetDateEl.style.display = '';
      resetDateValue.textContent = formatResetDate(response.resetDate);
    });
  }

  // ── Credit balance ──

  function requestCredits() {
    chrome.runtime.sendMessage({ type: 'GET_CREDITS' }, function(response) {
      if (chrome.runtime.lastError || !response) {
        creditsValue.textContent = '--';
        return;
      }
      updateCreditsDisplay(response.credits);
    });
  }

  // ── Summarize action ──

  summarizeBtn.addEventListener('click', function() {
    actionError.textContent = '';

    if (currentCredits <= 0) {
      actionError.textContent = 'No credits remaining. Buy more to continue.';
      return;
    }

    summarizeBtn.disabled = true;
    summarizeBtn.textContent = 'Summarizing...';
    resultBox.classList.add('hidden');

    chrome.runtime.sendMessage({ type: 'SUMMARIZE' }, function(response) {
      summarizeBtn.disabled = false;
      summarizeBtn.textContent = 'Summarize';

      if (chrome.runtime.lastError || !response) {
        actionError.textContent = 'Unable to reach background service.';
        return;
      }

      if (response.error === 'no_credits') {
        actionError.textContent = 'No credits remaining. Buy more to continue.';
        updateCreditsDisplay(0);
        return;
      }

      if (response.error === 'no_key') {
        actionError.textContent = 'Add your API key in settings first.';
        return;
      }

      if (!response.ok) {
        actionError.textContent = response.error === 'network_error'
          ? 'Network error. Check your connection.'
          : 'Summary failed. Please try again.';
        return;
      }

      resultText.textContent = response.summary;
      resultBox.classList.remove('hidden');

      if (typeof response.credits === 'number') {
        updateCreditsDisplay(response.credits);
      }
    });
  });

  // ── Result dismiss ──

  resultDismiss.addEventListener('click', function() {
    resultBox.classList.add('hidden');
    resultText.textContent = '';
  });

  // ── Button handlers ──

  buyBtn.addEventListener('click', function() {
    console.log('[Valor Popup] Buy More clicked — Stripe integration pending.');
  });

  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});
