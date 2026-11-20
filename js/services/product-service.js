(function () {
  window.ShopApp = window.ShopApp || {};
  const key = () => window.ShopApp.config.storageKeys.products;
  const storage = () => window.ShopApp.storageService;

  window.ShopApp.productService = {
    async getAllProducts() {
      return window.ShopApp.apiService.requireSuccess(async () => (await storage().get(key())) || []);
    },

    async getProductById(id) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const product = (await storage().get(key())).find((item) => item.id === id);
        if (!product) throw new Error("Product not found.");
        return product;
      });
    },

    async getProductsByCategory(categoryId) {
      return window.ShopApp.apiService.requireSuccess(async () =>
        (await storage().get(key())).filter((product) => product.cat_id === categoryId)
      );
    },

    async createProduct(product) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const products = (await storage().get(key())) || [];
        if (!product.title || !product.cat_id) throw new Error("Title and category are required.");
        const created = {
          id: `PRD-${String(products.length + 1).padStart(3, "0")}`,
          cat_id: product.cat_id,
          title: product.title.trim(),
          description: product.description.trim(),
          qty: Number(product.qty),
          price: Number(product.price),
          image: product.image || "assets/images/placeholder.svg",
          isActive: product.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await storage().set(key(), [...products, created]);
        return created;
      });
    },

    async updateProduct(id, updates) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const products = await storage().get(key());
        const index = products.findIndex((item) => item.id === id);
        if (index === -1) throw new Error("Product not found.");
        const updated = {
          ...products[index],
          ...updates,
          id,
          qty: Number(updates.qty),
          price: Number(updates.price),
          updatedAt: new Date().toISOString()
        };
        products[index] = updated;
        await storage().set(key(), products);
        return updated;
      });
    },

    async deleteProduct(id) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const products = await storage().get(key());
        await storage().set(key(), products.filter((item) => item.id !== id));
        return true;
      });
    }
  };
})();
