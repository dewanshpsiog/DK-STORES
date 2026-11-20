(function () {
  window.ShopApp = window.ShopApp || {};

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.navbar.render("siteNavbar");
    const id = new URLSearchParams(window.location.search).get("id");
    const container = document.getElementById("productDetails");
    try {
      if (!id) throw new Error("Product ID is missing.");
      const [product, categories] = await Promise.all([
        window.ShopApp.productService.getProductById(id),
        window.ShopApp.categoryService.getAllCategories()
      ]);
      const category = categories.find((item) => item.id === product.cat_id);
      const unavailable = !product.isActive || product.qty <= 0;
      container.innerHTML = `
        <div class="row g-4">
          <div class="col-lg-6"><div class="surface-card p-3"><img class="w-100 rounded" style="max-height:520px;object-fit:cover" src="${product.image}" alt="${product.title}" onerror="this.src='assets/images/placeholder.svg'"></div></div>
          <div class="col-lg-6">
            <div class="surface-card p-4 h-100">
              <span class="text-muted">${category ? category.name : "Uncategorized"}</span>
              <h1 class="h2 mt-2">${product.title}</h1>
              <p class="text-muted">${product.description}</p>
              <h2 class="h3 text-primary">${window.ShopApp.formatters.currency(product.price)}</h2>
              <p><strong>Availability:</strong> ${unavailable ? "Unavailable" : `${product.qty} in stock`}</p>
              <label class="form-label" for="quantityInput">Quantity</label>
              <div class="input-group" style="max-width:220px">
                <button class="btn btn-outline-secondary" id="decreaseQuantity" type="button">-</button>
                <input class="form-control text-center" id="quantityInput" type="number" min="1" max="${product.qty}" value="1" ${unavailable ? "disabled" : ""}>
                <button class="btn btn-outline-secondary" id="increaseQuantity" type="button">+</button>
              </div>
              <button class="btn btn-primary btn-lg mt-4" id="addToCart" ${unavailable ? "disabled" : ""}><i class="bi bi-cart-plus me-2"></i>Add to cart</button>
            </div>
          </div>
        </div>`;

      if (!unavailable) {
        const quantityInput = document.getElementById("quantityInput");
        document.getElementById("decreaseQuantity").addEventListener("click", () => {
          quantityInput.value = Math.max(1, Number(quantityInput.value) - 1);
        });
        document.getElementById("increaseQuantity").addEventListener("click", () => {
          quantityInput.value = Math.min(product.qty, Number(quantityInput.value) + 1);
        });
        document.getElementById("addToCart").addEventListener("click", async (event) => {
          event.currentTarget.disabled = true;
          try {
            await window.ShopApp.cartService.addItem(product.id, Number(quantityInput.value));
            await window.ShopApp.navbar.render("siteNavbar");
            window.ShopApp.notification.show("Added to cart.", "success");
          } catch (error) {
            window.ShopApp.notification.show(error.message, "danger");
          } finally {
            event.currentTarget.disabled = false;
          }
        });
      }
    } catch (error) {
      container.innerHTML = `<div class="empty-state surface-card"><i class="bi bi-box-seam fs-1"></i><h1 class="h4 mt-3">Product unavailable</h1><p>${error.message}</p><a class="btn btn-primary" href="products.html">Back to products</a></div>`;
    }
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
