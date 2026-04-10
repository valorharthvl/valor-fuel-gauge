// storage.js — Valor AI Fuel Gauge storage + AES-256-GCM encryption layer.
// Uses Web Crypto API for all encryption. No external libraries.
// The API key never leaves the device.

const ValorStorage = {

  // ── Basic chrome.storage.local wrappers ──

  get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  },

  set(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  remove(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  // ── Encryption helpers (AES-256-GCM via Web Crypto API) ──

  _STORAGE_KEY_EK: '_valor_ek',
  _STORAGE_KEY_API: '_valor_api_enc',

  /**
   * Get or create the AES-256-GCM encryption key.
   * The key is generated once and persisted as an exported JWK in local storage.
   * @returns {Promise<CryptoKey>}
   */
  async _getEncryptionKey() {
    const stored = await this.get([this._STORAGE_KEY_EK]);
    if (stored[this._STORAGE_KEY_EK]) {
      return crypto.subtle.importKey(
        'jwk',
        stored[this._STORAGE_KEY_EK],
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await crypto.subtle.exportKey('jwk', key);
    await this.set({ [this._STORAGE_KEY_EK]: exported });
    return crypto.subtle.importKey(
      'jwk',
      exported,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypt a plaintext string with AES-256-GCM.
   * Returns an object { iv, ciphertext } with Base64-encoded values.
   */
  async _encrypt(plaintext) {
    const key = await this._getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const buffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );
    return {
      iv: this._bufToBase64(iv),
      ciphertext: this._bufToBase64(new Uint8Array(buffer))
    };
  },

  /**
   * Decrypt a { iv, ciphertext } object back to a plaintext string.
   */
  async _decrypt(envelope) {
    const key = await this._getEncryptionKey();
    const iv = this._base64ToBuf(envelope.iv);
    const ciphertext = this._base64ToBuf(envelope.ciphertext);
    const buffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(buffer);
  },

  _bufToBase64(buf) {
    let binary = '';
    for (let i = 0; i < buf.length; i++) {
      binary += String.fromCharCode(buf[i]);
    }
    return btoa(binary);
  },

  _base64ToBuf(b64) {
    const binary = atob(b64);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buf[i] = binary.charCodeAt(i);
    }
    return buf;
  },

  // ── Public API key methods ──

  /**
   * Encrypt and save the Anthropic API key to local storage.
   * @param {string} apiKey
   */
  async saveApiKey(apiKey) {
    const envelope = await this._encrypt(apiKey);
    await this.set({ [this._STORAGE_KEY_API]: envelope });
  },

  /**
   * Load and decrypt the Anthropic API key from local storage.
   * Returns the plaintext key, or null if none is stored.
   * @returns {Promise<string|null>}
   */
  async loadApiKey() {
    const stored = await this.get([this._STORAGE_KEY_API]);
    const envelope = stored[this._STORAGE_KEY_API];
    if (!envelope) return null;
    return this._decrypt(envelope);
  },

  /**
   * Check whether an encrypted API key exists in storage without decrypting it.
   * @returns {Promise<boolean>}
   */
  async hasApiKey() {
    const stored = await this.get([this._STORAGE_KEY_API]);
    return !!stored[this._STORAGE_KEY_API];
  },

  /**
   * Remove the encrypted API key from local storage.
   */
  async clearApiKey() {
    await this.remove([this._STORAGE_KEY_API]);
  },

  /**
   * Return a masked version of the API key for display.
   * Shows the first 7 characters and the last 4, with dots in between.
   * @param {string} apiKey - The plaintext key.
   * @returns {string}
   */
  maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 16) return '••••••••••••';
    return apiKey.substring(0, 7) + '••••••••' + apiKey.slice(-4);
  }
};
