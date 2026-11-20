(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.navbar = {
    async render(targetId) {
      const target = document.getElementById(targetId);
      if (!target) return;
      await window.ShopApp.storageService.initialize();
      const session = await window.ShopApp.authService.getSession();
      const cart = await window.ShopApp.cartService.getCart();
      const count = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
      target.innerHTML = `
        <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top">
          <div class="container">
            <a class="navbar-brand fw-bold" href="index.html"><img class="brand-mark" src="assets/images/logo.png" alt=""><span>DK Stores</span></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation" aria-controls="mainNavigation" aria-expanded="false" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNavigation">
              <ul class="navbar-nav mx-lg-auto mb-2 mb-lg-0">
                <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="products.html">Shop</a></li>
                ${session ? '<li class="nav-item"><a class="nav-link" href="order-history.html">My Orders</a></li>' : ""}
              </ul>
              <form class="d-flex me-lg-3 my-2 my-lg-0" action="products.html" role="search">
                <input class="form-control form-control-sm" name="search" type="search" placeholder="Search products" aria-label="Search products">
                <button class="btn btn-outline-primary btn-sm ms-2" type="submit" aria-label="Search"><i class="bi bi-search"></i></button>
              </form>
              <a class="btn btn-link position-relative text-dark text-decoration-none" href="cart.html" aria-label="Shopping cart">
                <i class="bi bi-cart3 fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${count}</span>
              </a>
              ${session
                ? `<div class="dropdown ms-2"><button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">${session.name}</button><ul class="dropdown-menu dropdown-menu-end"><li><button class="dropdown-item" id="logoutButton">Sign out</button></li></ul></div>`
                : '<a class="btn btn-outline-primary btn-sm ms-2" href="login.html">Sign in</a>'}
            </div>
          </div>
        </nav>`;

      const logout = document.getElementById("logoutButton");
      if (logout) logout.addEventListener("click", async () => {
        await window.ShopApp.authService.logout();
        window.location.href = "index.html";
      });
    }
  };
})();
