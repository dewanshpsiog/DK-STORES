(function () {
  window.ShopApp = window.ShopApp || {};

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.navbar.render("siteNavbar");

    const [products, categories] = await Promise.all([
      window.ShopApp.productService.getAllProducts(),
      window.ShopApp.categoryService.getAllCategories()
    ]);

    const categorySelect = document.getElementById("categoryFilter");
    categories.filter((category) => category.isActive).forEach((category) => {
      categorySelect.insertAdjacentHTML("beforeend", `<option value="${category.id}">${category.name}</option>`);
    });

    const params = new URLSearchParams(window.location.search);
    document.getElementById("searchInput").value = params.get("search") || "";
    if (params.get("category")) document.getElementById("categoryFilter").value = params.get("category");

    let currentPage = 1;
    async function renderProducts() {
      const search = document.getElementById("searchInput").value.trim().toLowerCase();
      const categoryId = document.getElementById("categoryFilter").value;
      const minPrice = Number(document.getElementById("minPrice").value) || 0;
      const maxPrice = Number(document.getElementById("maxPrice").value) || Infinity;
      const sort = document.getElementById("sortProducts").value;

      let filtered = products.filter((product) =>
        product.isActive &&
        (!search || product.title.toLowerCase().includes(search)) &&
        (!categoryId || product.cat_id === categoryId) &&
        product.price >= minPrice &&
        product.price <= maxPrice
      );

      if (sort === "priceAsc") filtered.sort((a, b) => a.price - b.price);
      if (sort === "priceDesc") filtered.sort((a, b) => b.price - a.price);
      if (sort === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const pageSize = window.ShopApp.config.pageSize;
      const start = (currentPage - 1) * pageSize;
      const visible = filtered.slice(start, start + pageSize);
      document.getElementById("resultCount").textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
      document.getElementById("productGrid").innerHTML = visible.length
        ? visible.map((product) => window.ShopApp.productCard.render(product)).join("")
        : '<div class="col"><div class="empty-state surface-card"><i class="bi bi-search fs-1"></i><h2 class="h5 mt-3">No products found</h2><p>Try changing your search or filters.</p></div></div>';

      window.ShopApp.pagination.render("pagination", currentPage, filtered.length, pageSize, (page) => {
        currentPage = page;
        renderProducts();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    document.getElementById("searchInput").addEventListener("input", () => { currentPage = 1; renderProducts(); });
    document.getElementById("categoryFilter").addEventListener("change", () => { currentPage = 1; renderProducts(); });
    document.getElementById("sortProducts").addEventListener("change", () => { currentPage = 1; renderProducts(); });
    document.getElementById("minPrice").addEventListener("input", () => { currentPage = 1; renderProducts(); });
    document.getElementById("maxPrice").addEventListener("input", () => { currentPage = 1; renderProducts(); });
    document.getElementById("clearFilters").addEventListener("click", () => {
      document.getElementById("searchInput").value = "";
      document.getElementById("categoryFilter").value = "";
      document.getElementById("minPrice").value = "";
      document.getElementById("maxPrice").value = "";
      document.getElementById("sortProducts").value = "newest";
      currentPage = 1;
      renderProducts();
    });
    document.getElementById("productGrid").addEventListener("click", async (event) => {
      const button = event.target.closest(".add-to-cart");
      if (!button) return;
      button.disabled = true;
      try {
        await window.ShopApp.cartService.addItem(button.dataset.productId, 1);
        await window.ShopApp.navbar.render("siteNavbar");
        window.ShopApp.notification.show("Added to cart.", "success");
      } catch (error) {
        window.ShopApp.notification.show(error.message, "danger");
      } finally {
        button.disabled = false;
      }
    });

    await renderProducts();
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
