// popup.js — AI & API Tracker popup logic.
// Displays dual gauges for Claude and ChatGPT usage.

document.addEventListener('DOMContentLoaded', function() {

  var CHECKOUT_URL = 'https://valor-checkout.vercel.app/checkout.html';
  var RADIUS = 50;
  var CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // ── DOM references ──
  var creditsValue = document.getElementById('credits-value');
  var buyBtn = document.getElementById('buy-btn');
  var settingsBtn = document.getElementById('settings-btn');
  var summarizeBtn = document.getElementById('summarize-btn');
  var actionError = document.getElementById('action-error');
  var resultBox = document.getElementById('result-box');
  var resultText = document.getElementById('result-text');
  var resultDismiss = document.getElementById('result-dismiss');

  var currentCredits = 0;

  // ── Gauge helpers ──

  function gaugeColor(pct) {
    if (pct > 50) return '#4ade80';
    if (pct >= 25) return '#facc15';
    return '#ef4444';
  }

  function renderPlatformGauge(arcId, pctId, signId, captionId, resetId, resetValId, data) {
    var arc = document.getElementById(arcId);
    var pctEl = document.getElementById(pctId);
    var signEl = document.getElementById(signId);
    var captionEl = document.getElementById(captionId);
    var resetEl = document.getElementById(resetId);
    var resetValEl = document.getElementById(resetValId);

    if (!data || data.error === 'no_key') {
      arc.style.strokeDasharray = CIRCUMFERENCE;
      arc.style.strokeDashoffset = CIRCUMFERENCE;
      arc.setAttribute('stroke', '#1e293b');
      pctEl.textContent = '--';
      pctEl.style.color = '#475569';
      signEl.style.display = 'none';
      captionEl.textContent = 'Add API key in settings';
      captionEl.style.color = '#475569';
      resetEl.style.display = 'none';
      return;
    }

    if (!data.ok) {
      arc.style.strokeDasharray = CIRCUMFERENCE;
      arc.style.strokeDashoffset = CIRCUMFERENCE;
      arc.setAttribute('stroke', '#1e293b');
      pctEl.textContent = '--';
      pctEl.style.color = '#475569';
      signEl.style.display = 'none';
      captionEl.textContent = 'Check your API key';
      captionEl.style.color = '#ef4444';
      resetEl.style.display = 'none';
      return;
    }

    var clamped = Math.max(0, Math.min(100, data.percentRemaining));
    var offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    var color = gaugeColor(clamped);

    arc.style.strokeDasharray = CIRCUMFERENCE;
    arc.style.strokeDashoffset = offset;
    arc.setAttribute('stroke', color);

    pctEl.textContent = Math.round(clamped);
    pctEl.style.color = color;
    signEl.style.display = '';

    captionEl.textContent = 'Usage remaining';
    captionEl.style.color = '';
    resetEl.style.display = '';
    resetValEl.textContent = formatResetDate(data.resetDate);
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

  // ── Wake service worker, then request all data ──

  chrome.runtime.sendMessage({ type: 'PING' }, function() {
    if (chrome.runtime.lastError) {}
    requestClaudeUsage();
    requestOpenAIUsage();
    requestCredits();
  });

  // ── Claude usage ──

  function requestClaudeUsage() {
    chrome.runtime.sendMessage({ type: 'GET_USAGE' }, function(response) {
      if (chrome.runtime.lastError) {
        response = { ok: false, error: 'no_data' };
      }
      renderPlatformGauge(
        'claude-arc', 'claude-pct', 'claude-pct-sign',
        'claude-caption', 'claude-reset', 'claude-reset-val',
        response
      );
    });
  }

  // ── OpenAI usage ──

  function requestOpenAIUsage() {
    chrome.runtime.sendMessage({ type: 'GET_OPENAI_USAGE' }, function(response) {
      if (chrome.runtime.lastError) {
        response = { ok: false, error: 'no_data' };
      }
      renderPlatformGauge(
        'chatgpt-arc', 'chatgpt-pct', 'chatgpt-pct-sign',
        'chatgpt-caption', 'chatgpt-reset', 'chatgpt-reset-val',
        response
      );
    });
  }

  // ── Credits ──

  function requestCredits() {
    chrome.runtime.sendMessage({ type: 'GET_CREDITS' }, function(response) {
      if (chrome.runtime.lastError || !response) {
        creditsValue.textContent = '--';
        return;
      }
      updateCreditsDisplay(response.credits);
    });
  }

  // ── Summarize ──

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
        actionError.textContent = 'Add your Claude API key in settings first.';
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

  // ── Buy More ──

  buyBtn.addEventListener('click', function() {
    var extId = chrome.runtime.id;
    var url = CHECKOUT_URL + '?ext=' + encodeURIComponent(extId);
    chrome.tabs.create({ url: url });
  });

  // ── Settings ──

  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});
