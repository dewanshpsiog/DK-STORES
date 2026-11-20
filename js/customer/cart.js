(function () {
  window.ShopApp = window.ShopApp || {};

  async function renderCart() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.navbar.render("siteNavbar");
    const container = document.getElementById("cartContent");
    const details = await window.ShopApp.cartService.getCartDetails();

    if (details.items.length === 0) {
      container.innerHTML = `<div class="empty-state surface-card"><i class="bi bi-cart-x fs-1"></i><h1 class="h4 mt-3">Your cart is empty</h1><p>Explore the store and add products you like.</p><a class="btn btn-primary" href="products.html">Continue shopping</a></div>`;
      return;
    }

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="surface-card">
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead><tr><th>Product</th><th>Price</th><th style="width:150px">Quantity</th><th>Total</th><th></th></tr></thead>
                <tbody id="cartRows"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="surface-card p-4">
            <h2 class="h5">Order summary</h2>
            <div class="d-flex justify-content-between mt-3"><span>Subtotal</span><strong>${window.ShopApp.formatters.currency(details.subtotal)}</strong></div>
            <hr>
            <div class="d-flex justify-content-between"><span class="fw-bold">Total</span><strong class="h5 text-primary">${window.ShopApp.formatters.currency(details.total)}</strong></div>
            <a class="btn btn-primary w-100 mt-3" href="checkout.html">Proceed to checkout</a>
            <a class="btn btn-outline-secondary w-100 mt-2" href="products.html">Continue shopping</a>
          </div>
        </div>
      </div>`;

    const rows = document.getElementById("cartRows");
    rows.innerHTML = details.items.map((item) => `
      <tr>
        <td><div class="d-flex align-items-center gap-3"><img src="${item.image}" alt="" width="64" height="64" class="rounded object-fit-cover" onerror="this.src='assets/images/placeholder.svg'"><div><a class="fw-semibold text-dark text-decoration-none" href="product-details.html?id=${item.productId}">${item.title}</a></div></div></td>
        <td>${window.ShopApp.formatters.currency(item.unitPrice)}</td>
        <td><input class="form-control form-control-sm cart-quantity" type="number" min="1" data-product-id="${item.productId}" value="${item.quantity}"></td>
        <td class="fw-semibold">${window.ShopApp.formatters.currency(item.lineTotal)}</td>
        <td><button class="btn btn-link text-danger remove-cart-item" data-product-id="${item.productId}" aria-label="Remove ${item.title}"><i class="bi bi-trash"></i></button></td>
      </tr>`).join("");

    rows.addEventListener("change", async (event) => {
      const input = event.target.closest(".cart-quantity");
      if (!input) return;
      try {
        await window.ShopApp.cartService.setQuantity(input.dataset.productId, Number(input.value));
        await renderCart();
      } catch (error) {
        window.ShopApp.notification.show(error.message, "danger");
        await renderCart();
      }
    });
    rows.addEventListener("click", async (event) => {
      const button = event.target.closest(".remove-cart-item");
      if (!button) return;
      await window.ShopApp.cartService.removeItem(button.dataset.productId);
      await window.ShopApp.navbar.render("siteNavbar");
      await renderCart();
      window.ShopApp.notification.show("Item removed.", "success");
    });
  }

  window.addEventListener("DOMContentLoaded", renderCart);
})();
