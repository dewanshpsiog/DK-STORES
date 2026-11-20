(function () {
  window.ShopApp = window.ShopApp || {};
  const key = () => window.ShopApp.config.storageKeys.customers;
  const storage = () => window.ShopApp.storageService;

  window.ShopApp.customerService = {
    async getAllCustomers() {
      return window.ShopApp.apiService.requireSuccess(async () => (await storage().get(key())) || []);
    },

    async getCustomerById(id) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const customer = (await storage().get(key())).find((item) => item.id === id);
        if (!customer) throw new Error("Customer not found.");
        return customer;
      });
    },

    async updateCreditLimit(id, amount) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const limit = Number(amount);
        if (!Number.isFinite(limit) || limit < 0) throw new Error("Credit limit must be zero or greater.");
        const customers = await storage().get(key());
        const index = customers.findIndex((item) => item.id === id);
        if (index === -1) throw new Error("Customer not found.");
        customers[index].creditLimit = limit;
        await storage().set(key(), customers);
        return customers[index];
      });
    },

    async setCustomerStatus(id, isActive) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const customers = await storage().get(key());
        const index = customers.findIndex((item) => item.id === id);
        if (index === -1) throw new Error("Customer not found.");
        customers[index].isActive = Boolean(isActive);
        await storage().set(key(), customers);
        return customers[index];
      });
    },

    async addOutstandingCredit(id, amount) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const customers = await storage().get(key());
        const index = customers.findIndex((item) => item.id === id);
        if (index === -1) throw new Error("Customer not found.");
        customers[index].outstandingCredit = Number(customers[index].outstandingCredit) + Number(amount);
        await storage().set(key(), customers);
        return customers[index];
      });
    }
  };
})();
