(function () {
  window.ShopApp = window.ShopApp || {};

  const StorageService = {
    async get(key) {
      try {
        const value = localStorage.getItem(this.key(key));
        return value === null ? null : JSON.parse(value);
      } catch (error) {
        throw new Error("Could not read local application data.");
      }
    },

    async set(key, value) {
      try {
        localStorage.setItem(this.key(key), JSON.stringify(value));
        return true;
      } catch (error) {
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
      const keys = window.ShopApp.config.storageKeys;
      const mock = window.ShopApp.mockData;
      for (const [name, value] of Object.entries({
        [keys.categories]: mock.categories,
        [keys.products]: mock.products,
        [keys.customers]: mock.customers,
        [keys.orders]: mock.orders,
        [keys.cart]: []
      })) {
        if (await this.get(name) === null) {
          await this.set(name, value);
        }
      }
    }
  };

  window.ShopApp.storageService = StorageService;
})();
