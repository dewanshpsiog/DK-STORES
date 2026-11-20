(function () {
  window.ShopApp = window.ShopApp || {};
  const key = () => window.ShopApp.config.storageKeys.orders;
  const storage = () => window.ShopApp.storageService;

  window.ShopApp.orderService = {
    async createOrder(order) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!order.customerId || !order.items || order.items.length === 0) {
          throw new Error("A valid customer and at least one order item are required.");
        }
        if (!["CASH", "CREDIT"].includes(order.paymentMethod)) {
          throw new Error("Select a valid payment method.");
        }
        const invalidItem = order.items.find((item) =>
          !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 ||
          !Number.isFinite(item.unitPrice) || item.unitPrice < 0
        );
        if (invalidItem) throw new Error("One or more order items are invalid.");
        const orders = await storage().get(key());
        const orderDate = new Date().toISOString();
        const suffix = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 8).toUpperCase()
          : String(Date.now()).slice(-8);
        const created = {
          ...order,
          id: `ORD-${orderDate.slice(0, 10).replace(/-/g, "")}-${suffix}`,
          orderDate,
          status: "PLACED"
        };
        await storage().set(key(), [created, ...orders]);
        return created;
      });
    },

    async getCustomerOrders(customerId) {
      return window.ShopApp.apiService.requireSuccess(async () =>
        (await storage().get(key())).filter((order) => order.customerId === customerId)
      );
    },

    async getAllOrders() {
      return window.ShopApp.apiService.requireSuccess(async () => (await storage().get(key())) || []);
    },

    async getOrderById(orderId) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const order = (await storage().get(key())).find((item) => item.id === orderId);
        if (!order) throw new Error("Order not found.");
        return order;
      });
    },

    async updateOrderStatus(orderId, status) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const orders = await storage().get(key());
        const index = orders.findIndex((item) => item.id === orderId);
        if (index === -1) throw new Error("Order not found.");
        orders[index].status = status;
        await storage().set(key(), orders);
        return orders[index];
      });
    }
  };
})();
