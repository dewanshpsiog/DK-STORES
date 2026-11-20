(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.notification = {
    show(message, type) {
      let container = document.querySelector(".toast-container");
      if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
      }
      const toast = document.createElement("div");
      toast.className = `toast align-items-center text-bg-${type || "primary"} border-0 show`;
      toast.setAttribute("role", "alert");
      toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button></div>`;
      container.appendChild(toast);
      toast.querySelector("button").addEventListener("click", () => toast.remove());
      setTimeout(() => toast.remove(), 4000);
    }
  };
})();
