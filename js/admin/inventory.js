(function () {
  window.ShopApp = window.ShopApp || {};
  let allProducts = [];
  let currentPage = 1;

  async function render() {
    const search = document.getElementById("productSearch").value.trim().toLowerCase();
    const categoryId = document.getElementById("productCategory").value;
    let filtered = allProducts.filter((product) =>
      (!search || product.title.toLowerCase().includes(search) || product.id.toLowerCase().includes(search)) &&
      (!categoryId || product.cat_id === categoryId)
    );
    const categories = await window.ShopApp.categoryService.getAllCategories();
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
    const pageSize = window.ShopApp.config.pageSize;
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    document.getElementById("inventoryRows").innerHTML = visible.map((product) => `
      <tr><td>${product.id}</td><td><strong>${product.title}</strong></td><td>${categoryMap.get(product.cat_id) || product.cat_id}</td><td><span class="status-badge ${product.qty < 15 ? "status-inactive" : "status-active"}">${product.qty}</span></td><td>${window.ShopApp.formatters.currency(product.price)}</td><td><span class="status-badge ${product.isActive ? "status-active" : "status-inactive"}">${product.isActive ? "Active" : "Inactive"}</span></td><td class="text-end"><button class="btn btn-sm btn-outline-primary edit-product" data-product-id="${product.id}" title="Edit"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-secondary ms-1 toggle-product" data-product-id="${product.id}" title="Toggle status"><i class="bi bi-toggle-${product.isActive ? "on" : "off"}"></i></button><button class="btn btn-sm btn-outline-danger ms-1 delete-product" data-product-id="${product.id}" title="Delete"><i class="bi bi-trash"></i></button></td></tr>`
    ).join("") || '<tr><td colspan="7" class="text-center text-muted py-4">No products found.</td></tr>';
    window.ShopApp.pagination.render("inventoryPagination", currentPage, filtered.length, pageSize, (page) => {
      currentPage = page;
      render();
    });
  }

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.adminSidebar.render("adminSidebar", "inventory.html");
    allProducts = await window.ShopApp.productService.getAllProducts();
    const categories = await window.ShopApp.categoryService.getAllCategories();
    ["productCategory", "productCategoryField"].forEach((id) => {
      const select = document.getElementById(id);
      if (id === "productCategory") {
        categories.filter((category) => category.isActive).forEach((category) => select.insertAdjacentHTML("beforeend", `<option value="${category.id}">${category.name}</option>`));
      } else {
        select.innerHTML = categories.filter((category) => category.isActive).map((category) => `<option value="${category.id}">${category.name}</option>`).join("");
      }
    });
    await render();
    document.getElementById("productSearch").addEventListener("input", () => { currentPage = 1; render(); });
    document.getElementById("productCategory").addEventListener("change", () => { currentPage = 1; render(); });
    document.getElementById("addProduct").addEventListener("click", () => {
      document.getElementById("productModalTitle").textContent = "Add product";
      document.getElementById("productId").value = "";
      document.getElementById("productForm").reset();
      document.getElementById("productActive").checked = true;
    });
    document.getElementById("inventoryRows").addEventListener("click", async (event) => {
      const edit = event.target.closest(".edit-product");
      const toggle = event.target.closest(".toggle-product");
      const remove = event.target.closest(".delete-product");
      if (edit) {
        const product = await window.ShopApp.productService.getProductById(edit.dataset.productId);
        document.getElementById("productModalTitle").textContent = "Edit product";
        document.getElementById("productId").value = product.id;
        document.getElementById("productTitle").value = product.title;
        document.getElementById("productCategoryField").value = product.cat_id;
        document.getElementById("productDescription").value = product.description;
        document.getElementById("productQty").value = product.qty;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productImage").value = product.image;
        document.getElementById("productActive").checked = product.isActive;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("productModal")).show();
      }
      if (toggle) {
        const product = await window.ShopApp.productService.getProductById(toggle.dataset.productId);
        await window.ShopApp.productService.updateProduct(product.id, { ...product, isActive: !product.isActive });
        allProducts = await window.ShopApp.productService.getAllProducts();
        await render();
      }
      if (remove && window.confirm("Delete this product?")) {
        await window.ShopApp.productService.deleteProduct(remove.dataset.productId);
        allProducts = await window.ShopApp.productService.getAllProducts();
        await render();
      }
    });
    document.getElementById("productForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = document.getElementById("productId").value;
      const payload = {
        cat_id: document.getElementById("productCategoryField").value,
        title: document.getElementById("productTitle").value,
        description: document.getElementById("productDescription").value,
        qty: document.getElementById("productQty").value,
        price: document.getElementById("productPrice").value,
        image: document.getElementById("productImage").value || "assets/images/placeholder.svg",
        isActive: document.getElementById("productActive").checked
      };
      try {
        if (id) await window.ShopApp.productService.updateProduct(id, payload);
        else await window.ShopApp.productService.createProduct(payload);
        bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
        allProducts = await window.ShopApp.productService.getAllProducts();
        await render();
        window.ShopApp.notification.show("Product saved.", "success");
      } catch (error) {
        window.ShopApp.notification.show(error.message, "danger");
      }
    });
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
