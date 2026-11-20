(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.productCard = {
    render(product) {
      const unavailable = !product.isActive || product.qty <= 0;
      const image = product.image && product.image !== "" ? product.image : "assets/images/placeholder.jpg";
      return `
        <div class="col">
          <article class="product-card">
            <a href="product-details.html?id=${encodeURIComponent(product.id)}" class="d-block">
              <img class="product-card__image" src="${image}" alt="${product.title}" onerror="this.src='assets/images/placeholder.jpg'">
            </a>
            <div class="product-card__body">
              <h3 class="h6 fw-semibold mb-1"><a class="text-decoration-none text-dark" href="product-details.html?id=${encodeURIComponent(product.id)}">${product.title}</a></h3>
              <p class="text-muted small mb-2">${product.description}</p>
              <div class="d-flex align-items-center justify-content-between">
                <strong class="text-primary">${window.ShopApp.formatters.currency(product.price)}</strong>
                <span class="status-badge ${unavailable ? "status-inactive" : "status-active"}">${unavailable ? "Unavailable" : "In stock"}</span>
              </div>
              <button class="btn btn-primary w-100 mt-3 add-to-cart" data-product-id="${product.id}" ${unavailable ? "disabled" : ""}>
                <i class="bi bi-cart-plus me-1"></i>Add to cart
              </button>
            </div>
          </article>
        </div>`;
    }
  };
})();
