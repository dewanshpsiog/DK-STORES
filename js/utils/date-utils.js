(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.dateUtils = {
    formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    },

    formatDateTime(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  };
})();
