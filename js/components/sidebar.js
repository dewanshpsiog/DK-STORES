(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.adminSidebar = {
    async render(targetId, activePage) {
      const target = document.getElementById(targetId);
      if (!target) return;
      await window.ShopApp.storageService.initialize();
      const session = await window.ShopApp.authService.getSession();
      if (!session || session.role !== "ADMIN") {
        window.location.href = "../login.html";
        return;
      }
      const links = [
        ["dashboard.html", "speedometer2", "Dashboard"],
        ["categories.html", "tags", "Categories"],
        ["inventory.html", "boxes", "Inventory"],
        ["customers.html", "people", "Customers"],
        ["orders.html", "receipt", "Orders"],
        ["reports.html", "graph-up", "Reports"]
      ];
      target.innerHTML = `
        <aside class="admin-sidebar">
          <a class="d-flex align-items-center text-white text-decoration-none mb-4" href="dashboard.html">
            <img class="brand-mark me-2" src="../assets/images/logo.png" alt=""><strong>DK Stores Admin</strong>
          </a>
          <nav class="nav flex-column">
            ${links.map(([page, icon, label]) => `<a class="nav-link ${page === activePage ? "active" : ""}" href="${page}"><i class="bi bi-${icon} me-2"></i>${label}</a>`).join("")}
          </nav>
          <button class="btn btn-outline-light w-100 mt-4" id="adminLogout"><i class="bi bi-box-arrow-right me-2"></i>Sign out</button>
        </aside>`;
      document.getElementById("adminLogout").addEventListener("click", async () => {
        await window.ShopApp.authService.logout();
        window.location.href = "../login.html";
      });
    }
  };
})();
