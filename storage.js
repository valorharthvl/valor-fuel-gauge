// storage.js — Thin wrapper around chrome.storage.local for Valor AI Fuel Gauge.
// Provides promise-based get/set so every other module can await storage calls.

const ValorStorage = {
  /**
   * Retrieve one or more keys from chrome.storage.local.
   * @param {string|string[]} keys
   * @returns {Promise<Object>}
   */
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

  /**
   * Write one or more key/value pairs to chrome.storage.local.
   * @param {Object} items
   * @returns {Promise<void>}
   */
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

  /**
   * Remove one or more keys from chrome.storage.local.
   * @param {string|string[]} keys
   * @returns {Promise<void>}
   */
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
  }
};
