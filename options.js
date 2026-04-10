// options.js — Valor AI Fuel Gauge settings page (UI only).
// All encryption and storage logic lives in storage.js.

document.addEventListener('DOMContentLoaded', async () => {

  // ── DOM references ──
  const apiKeyInput = document.getElementById('api-key-input');
  const inputGroup = document.getElementById('input-group');
  const savedKeyDisplay = document.getElementById('saved-key-display');
  const savedKeyMask = document.getElementById('saved-key-mask');
  const saveBtn = document.getElementById('save-btn');
  const clearBtn = document.getElementById('clear-btn');
  const statusMsg = document.getElementById('status-msg');

  let statusTimer = null;

  // ── Helpers ──

  function showStatus(text, type) {
    if (statusTimer) clearTimeout(statusTimer);
    statusMsg.textContent = text;
    statusMsg.className = 'status-msg ' + type;
    statusTimer = setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  }

  function showSavedState(maskedKey) {
    savedKeyMask.textContent = maskedKey;
    savedKeyDisplay.classList.add('visible');
    inputGroup.style.display = 'none';
  }

  function showInputState() {
    savedKeyDisplay.classList.remove('visible');
    inputGroup.style.display = 'block';
    apiKeyInput.value = '';
    apiKeyInput.focus();
  }

  // ── Load existing key on page open ──

  try {
    const existing = await ValorStorage.loadApiKey();
    if (existing) {
      showSavedState(ValorStorage.maskApiKey(existing));
    }
  } catch (err) {
    console.error('[Valor Options] Failed to load API key:', err);
  }

  // ── Save button ──

  saveBtn.addEventListener('click', async () => {
    const raw = apiKeyInput.value.trim();

    if (!raw) {
      showStatus('Please enter your API key.', 'error');
      apiKeyInput.focus();
      return;
    }

    try {
      await ValorStorage.saveApiKey(raw);
      showSavedState(ValorStorage.maskApiKey(raw));
      showStatus('API key encrypted and saved.', 'success');
    } catch (err) {
      console.error('[Valor Options] Save failed:', err);
      showStatus('Failed to save. Please try again.', 'error');
    }
  });

  // ── Clear button ──

  clearBtn.addEventListener('click', async () => {
    try {
      await ValorStorage.clearApiKey();
      showInputState();
      showStatus('API key removed.', 'success');
    } catch (err) {
      console.error('[Valor Options] Clear failed:', err);
      showStatus('Failed to clear. Please try again.', 'error');
    }
  });
});
