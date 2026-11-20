(function () {
  window.ShopApp = window.ShopApp || {};
  const store = () => window.ShopApp.firestoreService;
  const collection = "customers";

  window.ShopApp.customerService = {
    async getAllCustomers() {
      return window.ShopApp.apiService.requireSuccess(async () => store().list(collection));
    },

    async getCustomerById(id) {
      return window.ShopApp.apiService.requireSuccess(async () => store().get(collection, id));
    },

    async updateCreditLimit(id, amount) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const limit = Number(amount);
        if (!Number.isFinite(limit) || limit < 0) throw new Error("Credit limit must be zero or greater.");
        return store().update(collection, id, { creditLimit: limit });
      });
    },

    async setCustomerStatus(id, isActive) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        await window.ShopApp.firebaseReady;
        const firebase = window.ShopApp.firebase;
        const batch = firebase.firestoreSdk.writeBatch(firebase.db);
        batch.update(firebase.firestoreSdk.doc(firebase.db, collection, id), { isActive: Boolean(isActive) });
        batch.update(firebase.firestoreSdk.doc(firebase.db, "users", id), { isActive: Boolean(isActive) });
        await batch.commit();
        return store().get(collection, id);
      });
    }
  };
})();
