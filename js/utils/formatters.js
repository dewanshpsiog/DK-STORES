(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.formatters = {
    currency(value) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: window.ShopApp.config.currency,
        maximumFractionDigits: 2
      }).format(Number(value) || 0);
    },

    text(value) {
      return String(value ?? "").trim();
    }
  };
})();
