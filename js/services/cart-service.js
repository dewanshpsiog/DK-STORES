(function () {
  window.ShopApp = window.ShopApp || {};
  const cartKey = () => window.ShopApp.config.storageKeys.cart;
  const storage = () => window.ShopApp.storageService;
  const productService = () => window.ShopApp.productService;

  window.ShopApp.cartService = {
    async getCart() {
      return window.ShopApp.apiService.requireSuccess(async () => (await storage().get(cartKey())) || []);
    },

    async addItem(productId, quantity) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const product = await productService().getProductById(productId);
        if (!product.isActive) throw new Error("This product is not available.");
        const amount = Number(quantity);
        if (!Number.isInteger(amount) || amount < 1) throw new Error("Quantity must be a positive whole number.");
        if (amount > product.qty) throw new Error(`Only ${product.qty} units are available.`);

        const cart = (await storage().get(cartKey())) || [];
        const existing = cart.find((item) => item.productId === productId);
        const nextQuantity = existing ? existing.quantity + amount : amount;
        if (nextQuantity > product.qty) throw new Error(`Only ${product.qty} units are available.`);

        const nextCart = existing
          ? cart.map((item) => item.productId === productId ? { ...item, quantity: nextQuantity } : item)
          : [...cart, { productId, title: product.title, unitPrice: product.price, image: product.image, quantity: amount }];
        await storage().set(cartKey(), nextCart);
        return nextCart;
      });
    },

    async setQuantity(productId, quantity) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const product = await productService().getProductById(productId);
        const amount = Number(quantity);
        if (!Number.isInteger(amount) || amount < 1) throw new Error("Quantity must be a positive whole number.");
        if (amount > product.qty) throw new Error(`Only ${product.qty} units are available.`);
        const cart = (await storage().get(cartKey())) || [];
        await storage().set(cartKey(), cart.map((item) => item.productId === productId ? { ...item, quantity: amount } : item));
        return storage().get(cartKey());
      });
    },

    async removeItem(productId) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const cart = (await storage().get(cartKey())) || [];
        const nextCart = cart.filter((item) => item.productId !== productId);
        await storage().set(cartKey(), nextCart);
        return nextCart;
      });
    },

    async clearCart() {
      await storage().set(cartKey(), []);
      return [];
    },

    async getCartDetails() {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const cart = (await storage().get(cartKey())) || [];
        const detailedItems = [];
        let subtotal = 0;

        for (const item of cart) {
          const product = await productService().getProductById(item.productId);
          const quantity = Math.min(item.quantity, product.qty);
          const lineTotal = quantity * product.price;
          subtotal += lineTotal;
          detailedItems.push({
            ...item,
            title: product.title,
            unitPrice: product.price,
            image: product.image,
            quantity,
            lineTotal
          });
        }
        return { items: detailedItems, subtotal, total: subtotal };
      });
    }
  };
})();
