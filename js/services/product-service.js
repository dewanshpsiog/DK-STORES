(function () {
  window.ShopApp = window.ShopApp || {};
  const store = () => window.ShopApp.firestoreService;
  const collection = "products";

  function validateProduct(product) {
    const title = String(product.title || "").trim();
    const description = String(product.description || "").trim();
    const quantity = Number(product.qty);
    const price = Number(product.price);
    if (!title || !description || !product.cat_id) throw new Error("Title, description and category are required.");
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Stock must be a non-negative whole number.");
    if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a non-negative number.");
    return { title, description, quantity, price };
  }

  window.ShopApp.productService = {
    async getAllProducts() {
      return window.ShopApp.apiService.requireSuccess(async () => store().list(collection));
    },

    async getProductById(id) {
      return window.ShopApp.apiService.requireSuccess(async () => store().get(collection, id));
    },

    async getProductsByCategory(categoryId) {
      return window.ShopApp.apiService.requireSuccess(async () =>
        store().list(collection, [{ field: "cat_id", operator: "==", value: categoryId }])
      );
    },

    async createProduct(product) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const validated = validateProduct(product);
        const id = `PRD-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
        const now = new Date().toISOString();
        return store().create(collection, id, {
          title: validated.title,
          description: validated.description,
          qty: validated.quantity,
          price: validated.price,
          cat_id: product.cat_id,
          image: product.image || "assets/images/placeholder.svg",
          isActive: product.isActive !== false,
          createdAt: now,
          updatedAt: now
        });
      });
    },

    async updateProduct(id, updates) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const validated = validateProduct(updates);
        return store().update(collection, id, {
          title: validated.title,
          description: validated.description,
          cat_id: updates.cat_id,
          qty: validated.quantity,
          price: validated.price,
          image: updates.image || "assets/images/placeholder.svg",
          isActive: Boolean(updates.isActive),
          updatedAt: new Date().toISOString()
        });
      });
    },

    async deleteProduct(id) {
      return window.ShopApp.apiService.requireSuccess(async () => store().remove(collection, id));
    },

    async seedInitialCatalog() {
      return window.ShopApp.apiService.requireSuccess(async () => {
        await window.ShopApp.firebaseReady;
        const firebase = window.ShopApp.firebase;
        const seedRef = firebase.firestoreSdk.doc(firebase.db, "appMetadata", "catalog-seed-v1");
        const seedSnapshot = await firebase.firestoreSdk.getDoc(seedRef);
        if (seedSnapshot.exists()) return 0;
        const [categories, products] = await Promise.all([
          window.ShopApp.categoryService.getAllCategories(),
          store().list(collection)
        ]);
        const mock = window.ShopApp.mockData;
        const batch = firebase.firestoreSdk.writeBatch(firebase.db);
        let writes = 0;
        if (categories.length === 0) {
          mock.categories.forEach((category) => {
            const { id, ...data } = category;
            batch.set(firebase.firestoreSdk.doc(firebase.db, "categories", id), data);
            writes += 1;
          });
        }
        if (products.length === 0) {
          mock.products.forEach((product) => {
            const { id, ...data } = product;
            batch.set(firebase.firestoreSdk.doc(firebase.db, "products", id), data);
            writes += 1;
          });
        }
        batch.set(seedRef, { version: 1, completedAt: new Date().toISOString() });
        await batch.commit();
        return writes;
      });
    }
  };
})();
