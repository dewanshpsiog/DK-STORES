(function () {
  window.ShopApp = window.ShopApp || {};
  const store = () => window.ShopApp.firestoreService;
  const collection = "orders";

  window.ShopApp.orderService = {
    async createOrder(order) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!order.items || order.items.length === 0) throw new Error("Add at least one item to the order.");
        if (!["CASH", "CREDIT"].includes(order.paymentMethod)) throw new Error("Select a valid payment method.");
        try {
          return await store().invoke("createOrder", {
            requestId: order.requestId,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: Number(item.quantity)
            })),
            paymentMethod: order.paymentMethod,
            deliveryAddress: order.deliveryAddress,
            mobile: order.customerSnapshot && order.customerSnapshot.mobile
          });
        } catch (error) {
          if (error.code === "functions/not-found") {
            throw new Error("Checkout service is not deployed. Deploy Firebase Functions, then try again.");
          }
          if (error.code === "functions/unavailable") {
            throw new Error("Checkout service is temporarily unavailable. Check your connection and try again.");
          }
          if (error.code === "functions/unauthenticated") {
            throw new Error("Your sign-in has expired. Sign in again before placing the order.");
          }
          if (error.code === "functions/permission-denied") {
            throw new Error("This account cannot place orders. Check that its customer profile is active.");
          }
          throw error;
        }
      });
    },

    async getCustomerOrders(customerId) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const orders = await store().list(collection, [{ field: "customerId", operator: "==", value: customerId }]);
        return orders.sort((first, second) => new Date(second.orderDate) - new Date(first.orderDate));
      });
    },

    async getAllOrders() {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const orders = await store().list(collection);
        return orders.sort((first, second) => new Date(second.orderDate) - new Date(first.orderDate));
      });
    },

    async getOrderById(orderId) {
      return window.ShopApp.apiService.requireSuccess(async () => store().get(collection, orderId));
    },

    async updateOrderStatus(orderId, status) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!["PENDING", "PLACED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
          throw new Error("Select a valid order status.");
        }
        return store().update(collection, orderId, { status });
      });
    }
  };
})();
