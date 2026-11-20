(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.validators = {
    required(value) {
      return String(value ?? "").trim().length > 0;
    },

    email(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
    },

    mobile(value) {
      return /^[0-9]{10}$/.test(String(value ?? "").trim());
    },

    positiveNumber(value) {
      return Number.isFinite(Number(value)) && Number(value) >= 0;
    },

    password(value) {
      return String(value ?? "").length >= 8;
    }
  };
})();
