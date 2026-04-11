// checkout-listener.js — Content script injected on valor-checkout.vercel.app
// Detects the Stripe success page, verifies payment server-side,
// then sends ADD_CREDITS to the extension background to top up the balance.
// Credits are NEVER awarded without server-side verification.

(function() {
  // Only act on the success page with a session_id.
  if (window.location.pathname.indexOf('/success') === -1) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get('session_id');
  if (!sessionId) {
    return;
  }

  var statusEl = document.getElementById('status');
  var spinnerEl = document.getElementById('spinner');

  // Verify the payment server-side before awarding any credits.
  fetch('/api/verify-session?session_id=' + encodeURIComponent(sessionId))
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (spinnerEl) spinnerEl.style.display = 'none';

      if (!data.ok) {
        if (statusEl) {
          statusEl.textContent = 'Verification failed: ' + (data.error || 'Unknown error');
          statusEl.className = 'error-text';
        }
        return;
      }

      // Server confirmed payment. Send credits to the extension.
      var credits = data.credits || 50;

      chrome.runtime.sendMessage({ type: 'ADD_CREDITS', credits: credits }, function(response) {
        if (chrome.runtime.lastError) {
          if (statusEl) {
            statusEl.textContent = credits + ' credits verified! Reopen the extension popup to see your updated balance.';
            statusEl.className = 'success-text';
          }
          return;
        }

        if (response && response.ok) {
          if (statusEl) {
            statusEl.textContent = credits + ' credits added! New balance: ' + response.credits;
            statusEl.className = 'success-text';
          }
        } else {
          if (statusEl) {
            statusEl.textContent = credits + ' credits verified! Reopen the extension popup to see your updated balance.';
            statusEl.className = 'success-text';
          }
        }
      });
    })
    .catch(function(err) {
      if (spinnerEl) spinnerEl.style.display = 'none';
      if (statusEl) {
        statusEl.textContent = 'Verification error. Please contact support.';
        statusEl.className = 'error-text';
      }
    });
})();
