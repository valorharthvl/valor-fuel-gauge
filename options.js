// options.js — Valor AI Fuel Gauge settings page logic

document.addEventListener('DOMContentLoaded', async () => {
  const emailInput = document.getElementById('user-email');
  const saveBtn = document.getElementById('save-btn');
  const saveStatus = document.getElementById('save-status');

  // Load saved settings.
  const data = await ValorStorage.get(['userEmail']);
  if (data.userEmail) {
    emailInput.value = data.userEmail;
  }

  saveBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    await ValorStorage.set({ userEmail: email });
    saveStatus.textContent = 'Settings saved.';
    setTimeout(() => { saveStatus.textContent = ''; }, 2000);
  });
});
