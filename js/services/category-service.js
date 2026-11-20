(function () {
  window.ShopApp = window.ShopApp || {};
  const store = () => window.ShopApp.firestoreService;
  const collection = "categories";

  window.ShopApp.categoryService = {
    async getAllCategories() {
      return window.ShopApp.apiService.requireSuccess(async () => store().list(collection));
    },

    async getCategoryById(id) {
      return window.ShopApp.apiService.requireSuccess(async () => store().get(collection, id));
    },

    async createCategory(category) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const name = String(category.name || "").trim();
        const description = String(category.description || "").trim();
        if (!name || !description) throw new Error("Category name and description are required.");
        const existing = await store().list(collection);
        if (existing.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("A category with this name already exists.");
        }
        const id = `CAT-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
        return store().create(collection, id, {
          name,
          description,
          isActive: category.isActive !== false,
          createdAt: new Date().toISOString()
        });
      });
    },

    async updateCategory(id, updates) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const name = String(updates.name || "").trim();
        const description = String(updates.description || "").trim();
        if (!name || !description) throw new Error("Category name and description are required.");
        const existing = await store().list(collection);
        if (existing.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("A category with this name already exists.");
        }
        return store().update(collection, id, {
          name,
          description,
          isActive: Boolean(updates.isActive)
        });
      });
    },

    async deleteCategory(id) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const products = await window.ShopApp.productService.getAllProducts();
        if (products.some((product) => product.cat_id === id)) {
          throw new Error("Cannot delete a category that contains products.");
        }
        return store().remove(collection, id);
      });
    }
  };
})();
