(function () {
  window.ShopApp = window.ShopApp || {};
  const key = () => window.ShopApp.config.storageKeys.categories;
  const storage = () => window.ShopApp.storageService;

  window.ShopApp.categoryService = {
    async getAllCategories() {
      return window.ShopApp.apiService.requireSuccess(async () => (await storage().get(key())) || []);
    },

    async getCategoryById(id) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const category = (await storage().get(key())).find((item) => item.id === id);
        if (!category) throw new Error("Category not found.");
        return category;
      });
    },

    async createCategory(category) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const categories = (await storage().get(key())) || [];
        if (categories.some((item) => item.name.toLowerCase() === category.name.trim().toLowerCase())) {
          throw new Error("A category with this name already exists.");
        }
        const created = {
          id: `CAT-${String(categories.length + 1).padStart(3, "0")}`,
          name: category.name.trim(),
          description: category.description.trim(),
          isActive: category.isActive !== false,
          createdAt: new Date().toISOString()
        };
        await storage().set(key(), [...categories, created]);
        return created;
      });
    },

    async updateCategory(id, updates) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const categories = await storage().get(key());
        const index = categories.findIndex((item) => item.id === id);
        if (index === -1) throw new Error("Category not found.");
        const updated = { ...categories[index], ...updates, id, name: updates.name.trim(), description: updates.description.trim() };
        categories[index] = updated;
        await storage().set(key(), categories);
        return updated;
      });
    },

    async deleteCategory(id) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const categories = await storage().get(key());
        const products = await storage().get(window.ShopApp.config.storageKeys.products);
        if (products.some((product) => product.cat_id === id)) {
          throw new Error("Cannot delete a category that contains products.");
        }
        await storage().set(key(), categories.filter((item) => item.id !== id));
        return true;
      });
    }
  };
})();
