(function () {
  window.ShopApp = window.ShopApp || {};
  const AppConfig = Object.freeze({
    appName: "ShopHub",
    currency: "INR",
    currencySymbol: "₹",
    defaultCreditLimit: 1000,
    lowStockThreshold: 15,
    highStockThreshold: 100,
    pageSize: 12,
    storagePrefix: "shophub:",
    storageKeys: {
      categories: "categories",
      products: "products",
      customers: "customers",
      orders: "orders",
      cart: "cart",
      session: "session"
    }
  });

  window.ShopApp.config = AppConfig;
})();
