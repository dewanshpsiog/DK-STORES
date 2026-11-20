(function () {
  window.ShopApp = window.ShopApp || {};

  const StorageService = {
    async get(key) {
      try {
        const value = localStorage.getItem(this.key(key));
        return value === null ? null : JSON.parse(value);
      } catch {
        throw new Error("Could not read local application data.");
      }
    },

    async set(key, value) {
      try {
        localStorage.setItem(this.key(key), JSON.stringify(value));
        return true;
      } catch {
        throw new Error("Could not save local application data.");
      }
    },

    async remove(key) {
      localStorage.removeItem(this.key(key));
    },

    key(key) {
      return `${window.ShopApp.config.storagePrefix}${key}`;
    },

    async initialize() {
      await window.ShopApp.firebaseReady;
      const cartKey = window.ShopApp.config.storageKeys.cart;
      if (await this.get(cartKey) === null) await this.set(cartKey, []);
    }
  };

  window.ShopApp.storageService = StorageService;
})();
