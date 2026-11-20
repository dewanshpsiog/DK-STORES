(function () {
  window.ShopApp = window.ShopApp || {};

  const AuthService = {
    async login(email, password) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = window.ShopApp.mockData.users.find(
          (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
        );
        if (!user) throw new Error("Invalid email or password.");
        if (!user.isActive) throw new Error("This account is inactive.");

        const session = { id: user.id, name: user.name, email: user.email, role: user.role };
        await window.ShopApp.storageService.set(window.ShopApp.config.storageKeys.session, session);
        return session;
      });
    },

    async signup(customer) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const email = String(customer.email).trim().toLowerCase();
        const existing = window.ShopApp.mockData.users.some((item) => item.email.toLowerCase() === email);
        if (existing) throw new Error("An account already exists with this email.");

        const customersKey = window.ShopApp.config.storageKeys.customers;
        const customers = await window.ShopApp.storageService.get(customersKey);
        const id = `CUS-${String(customers.length + 1).padStart(3, "0")}`;
        const newCustomer = {
          id,
          name: customer.name.trim(),
          email,
          mobile: customer.mobile.trim(),
          creditLimit: window.ShopApp.config.defaultCreditLimit,
          outstandingCredit: 0,
          isActive: true
        };
        await window.ShopApp.storageService.set(customersKey, [...customers, newCustomer]);
        window.ShopApp.mockData.users.push({
          id,
          name: newCustomer.name,
          email,
          role: "CUSTOMER",
          isActive: true,
          password: customer.password
        });
        return newCustomer;
      });
    },

    async logout() {
      await window.ShopApp.storageService.remove(window.ShopApp.config.storageKeys.session);
      return true;
    },

    async getSession() {
      return window.ShopApp.storageService.get(window.ShopApp.config.storageKeys.session);
    },

    async resetPassword(email) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const exists = window.ShopApp.mockData.users.some(
          (user) => user.email.toLowerCase() === String(email).trim().toLowerCase()
        );
        if (!exists) throw new Error("No account exists with this email.");
        return { message: "Password reset instructions have been sent." };
      });
    }
  };

  window.ShopApp.authService = AuthService;
})();
