// checkout-listener.js — Content script injected on valor-checkout.vercel.app
// Backup credit path: verifies payment server-side, sends ADD_CREDITS via
// internal content-script messaging. The success page also tries external
// messaging as the primary path. Session ID dedup in background.js prevents
// double-crediting.

(function() {
  if (window.location.pathname.indexOf('/success') === -1) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get('session_id');
  var extId = params.get('ext');
  if (!sessionId) {
    return;
  }

  console.log('[Valor Checkout Listener] Success page detected. session_id:', sessionId, 'ext:', extId);

  var statusEl = document.getElementById('status');
  var spinnerEl = document.getElementById('spinner');

  fetch('/api/verify-session?session_id=' + encodeURIComponent(sessionId))
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.ok) {
        if (spinnerEl) spinnerEl.style.display = 'none';
        if (statusEl) {
          statusEl.textContent = 'Verification failed: ' + (data.error || 'Unknown error');
          statusEl.className = 'error-text';
        }
        return;
      }

      var credits = data.credits || 20;

      // Send via internal content-script messaging (backup path).
      chrome.runtime.sendMessage(
        { type: 'ADD_CREDITS', credits: credits, session_id: sessionId },
        function(response) {
          if (spinnerEl) spinnerEl.style.display = 'none';

          if (chrome.runtime.lastError) {
            console.log('[Valor Checkout Listener] Internal message failed:', chrome.runtime.lastError.message);
            if (statusEl) {
              statusEl.textContent = credits + ' credits verified! Reopen the extension popup to see your balance.';
              statusEl.className = 'success-text';
            }
            return;
          }

          if (response && response.ok) {
            console.log('[Valor Checkout Listener] Credits added. Balance:', response.credits);
            if (statusEl) {
              statusEl.textContent = credits + ' credits added! New balance: ' + response.credits;
              statusEl.className = 'success-text';
            }
          }
        }
      );
    })
    .catch(function(err) {
      if (spinnerEl) spinnerEl.style.display = 'none';
      if (statusEl) {
        statusEl.textContent = 'Verification error. Please contact support.';
        statusEl.className = 'error-text';
      }
    });
})();
