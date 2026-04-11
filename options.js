// options.js — Valor AI Fuel Gauge settings page (UI only).
// Handles both Anthropic and OpenAI API key sections.

document.addEventListener('DOMContentLoaded', async function() {

  // ── Wire up a key section ──

  function wireKeySection(opts) {
    var inputGroup = document.getElementById(opts.inputGroupId);
    var keyInput = document.getElementById(opts.inputId);
    var savedDisplay = document.getElementById(opts.savedDisplayId);
    var savedMask = document.getElementById(opts.savedMaskId);
    var saveBtn = document.getElementById(opts.saveBtnId);
    var clearBtn = document.getElementById(opts.clearBtnId);
    var statusEl = document.getElementById(opts.statusId);
    var statusTimer = null;

    function showStatus(text, type) {
      if (statusTimer) clearTimeout(statusTimer);
      statusEl.textContent = text;
      statusEl.className = 'status-msg ' + type;
      statusTimer = setTimeout(function() { statusEl.textContent = ''; }, 3000);
    }

    function showSavedState(maskedKey) {
      savedMask.textContent = maskedKey;
      savedDisplay.classList.add('visible');
      inputGroup.style.display = 'none';
    }

    function showInputState() {
      savedDisplay.classList.remove('visible');
      inputGroup.style.display = 'block';
      keyInput.value = '';
      keyInput.focus();
    }

    // Load existing
    opts.loadFn().then(function(existing) {
      if (existing) {
        showSavedState(ValorStorage.maskApiKey(existing));
      }
    }).catch(function() {});

    saveBtn.addEventListener('click', async function() {
      var raw = keyInput.value.trim();
      if (!raw) {
        showStatus('Please enter your API key.', 'error');
        keyInput.focus();
        return;
      }
      try {
        await opts.saveFn(raw);
        showSavedState(ValorStorage.maskApiKey(raw));
        showStatus('API key encrypted and saved.', 'success');
      } catch (err) {
        showStatus('Failed to save. Please try again.', 'error');
      }
    });

    clearBtn.addEventListener('click', async function() {
      try {
        await opts.clearFn();
        showInputState();
        showStatus('API key removed.', 'success');
      } catch (err) {
        showStatus('Failed to clear. Please try again.', 'error');
      }
    });
  }

  // ── Anthropic section ──

  wireKeySection({
    inputGroupId: 'anthropic-input-group',
    inputId: 'anthropic-key-input',
    savedDisplayId: 'anthropic-saved-display',
    savedMaskId: 'anthropic-saved-mask',
    saveBtnId: 'anthropic-save-btn',
    clearBtnId: 'anthropic-clear-btn',
    statusId: 'anthropic-status',
    loadFn: function() { return ValorStorage.loadApiKey(); },
    saveFn: function(key) { return ValorStorage.saveApiKey(key); },
    clearFn: function() { return ValorStorage.clearApiKey(); }
  });

  // ── OpenAI section ──

  wireKeySection({
    inputGroupId: 'openai-input-group',
    inputId: 'openai-key-input',
    savedDisplayId: 'openai-saved-display',
    savedMaskId: 'openai-saved-mask',
    saveBtnId: 'openai-save-btn',
    clearBtnId: 'openai-clear-btn',
    statusId: 'openai-status',
    loadFn: function() { return ValorStorage.loadOpenAIKey(); },
    saveFn: function(key) { return ValorStorage.saveOpenAIKey(key); },
    clearFn: function() { return ValorStorage.clearOpenAIKey(); }
  });
});
