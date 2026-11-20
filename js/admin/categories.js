(function () {
  window.ShopApp = window.ShopApp || {};

  async function render() {
    const categories = await window.ShopApp.categoryService.getAllCategories();
    document.getElementById("categoryRows").innerHTML = categories.map((category) => `
      <tr><td>${category.id}</td><td><strong>${category.name}</strong></td><td>${category.description}</td><td><span class="status-badge ${category.isActive ? "status-active" : "status-inactive"}">${category.isActive ? "Active" : "Inactive"}</span></td><td>${window.ShopApp.dateUtils.formatDate(category.createdAt)}</td><td class="text-end"><button class="btn btn-sm btn-outline-primary edit-category" data-category-id="${category.id}" title="Edit"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-secondary ms-1 toggle-category" data-category-id="${category.id}" title="Toggle status"><i class="bi bi-toggle-${category.isActive ? "on" : "off"}"></i></button><button class="btn btn-sm btn-outline-danger ms-1 delete-category" data-category-id="${category.id}" title="Delete"><i class="bi bi-trash"></i></button></td></tr>`
    ).join("");
  }

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.adminSidebar.render("adminSidebar", "categories.html");
    await render();
    document.getElementById("addCategory").addEventListener("click", () => {
      document.getElementById("categoryModalTitle").textContent = "Add category";
      document.getElementById("categoryId").value = "";
      document.getElementById("categoryName").value = "";
      document.getElementById("categoryDescription").value = "";
      document.getElementById("categoryActive").checked = true;
    });
    document.getElementById("categoryRows").addEventListener("click", async (event) => {
      const edit = event.target.closest(".edit-category");
      const toggle = event.target.closest(".toggle-category");
      const remove = event.target.closest(".delete-category");
      if (edit) {
        const category = await window.ShopApp.categoryService.getCategoryById(edit.dataset.categoryId);
        document.getElementById("categoryModalTitle").textContent = "Edit category";
        document.getElementById("categoryId").value = category.id;
        document.getElementById("categoryName").value = category.name;
        document.getElementById("categoryDescription").value = category.description;
        document.getElementById("categoryActive").checked = category.isActive;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("categoryModal")).show();
      }
      if (toggle) {
        const category = await window.ShopApp.categoryService.getCategoryById(toggle.dataset.categoryId);
        await window.ShopApp.categoryService.updateCategory(category.id, { ...category, isActive: !category.isActive });
        await render();
      }
      if (remove) {
        const category = await window.ShopApp.categoryService.getCategoryById(remove.dataset.categoryId);
        if (window.confirm(`Delete category "${category.name}"?`)) {
          try {
            await window.ShopApp.categoryService.deleteCategory(category.id);
            await render();
            window.ShopApp.notification.show("Category deleted.", "success");
          } catch (error) {
            window.ShopApp.notification.show(error.message, "danger");
          }
        }
      }
    });
    document.getElementById("categoryForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = document.getElementById("categoryId").value;
      const payload = { name: document.getElementById("categoryName").value, description: document.getElementById("categoryDescription").value, isActive: document.getElementById("categoryActive").checked };
      try {
        if (id) await window.ShopApp.categoryService.updateCategory(id, payload);
        else await window.ShopApp.categoryService.createCategory(payload);
        bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
        await render();
        window.ShopApp.notification.show("Category saved.", "success");
      } catch (error) {
        window.ShopApp.notification.show(error.message, "danger");
      }
    });
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
