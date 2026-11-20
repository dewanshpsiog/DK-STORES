(function () {
  window.ShopApp = window.ShopApp || {};
  const store = () => window.ShopApp.firestoreService;
  const collection = "orders";

  window.ShopApp.orderService = {
    async createOrder(order) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!order.items || order.items.length === 0) throw new Error("Add at least one item to the order.");
        if (!["CASH", "CREDIT"].includes(order.paymentMethod)) throw new Error("Select a valid payment method.");
        return store().invoke("createOrder", {
          requestId: order.requestId,
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity)
          })),
          paymentMethod: order.paymentMethod,
          deliveryAddress: order.deliveryAddress,
          mobile: order.customerSnapshot && order.customerSnapshot.mobile
        });
      });
    },

    async getCustomerOrders(customerId) {
      return window.ShopApp.apiService.requireSuccess(async () =>
        store().list(collection, [{ field: "customerId", operator: "==", value: customerId }])
      );
    },

    async getAllOrders() {
      return window.ShopApp.apiService.requireSuccess(async () => store().list(collection));
    },

    async getOrderById(orderId) {
      return window.ShopApp.apiService.requireSuccess(async () => store().get(collection, orderId));
    },

    async updateOrderStatus(orderId, status) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!["PLACED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
          throw new Error("Select a valid order status.");
        }
        return store().update(collection, orderId, { status });
      });
    }
  };
})();
