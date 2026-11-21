(function () {
  window.ShopApp = window.ShopApp || {};
  const store = () => window.ShopApp.firestoreService;
  const collection = "orders";
  const localOrdersKey = "localOrders";

  async function getLocalOrders() {
    return (await window.ShopApp.storageService.get(localOrdersKey)) || [];
  }

  async function saveLocalOrder(order) {
    const existing = await getLocalOrders();
    const index = existing.findIndex((item) => item.requestId === order.requestId || item.id === order.id);
    if (index >= 0) existing[index] = order;
    else existing.push(order);
    await window.ShopApp.storageService.set(localOrdersKey, existing);
    return order;
  }

  window.ShopApp.orderService = {
    async createOrder(order) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!order.items || order.items.length === 0) throw new Error("Add at least one item to the order.");
        if (!["CASH", "CREDIT"].includes(order.paymentMethod)) throw new Error("Select a valid payment method.");
        const existing = (await getLocalOrders()).find((item) => item.requestId === order.requestId);
        if (existing) return existing;
        try {
          return await store().invoke("createOrder", {
            requestId: order.requestId,
            customerName: order.customerName,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: Number(item.quantity)
            })),
            paymentMethod: order.paymentMethod,
            deliveryAddress: order.deliveryAddress,
            mobile: order.customerSnapshot && order.customerSnapshot.mobile
          });
        } catch (error) {
          const code = error.code || "";
          const canUseLocalFallback = code !== "functions/invalid-argument" &&
            code !== "functions/failed-precondition";
          if (canUseLocalFallback) {
            const now = new Date().toISOString();
            const id = `ORD-${now.slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            const localOrder = {
              id,
              requestId: order.requestId,
              customerId: order.customerId,
              customerSnapshot: order.customerSnapshot,
              deliveryAddress: order.deliveryAddress,
              orderDate: now,
              items: order.items,
              subtotal: order.subtotal,
              total: order.total,
              paymentMethod: order.paymentMethod,
              status: "PENDING"
            };
            return saveLocalOrder(localOrder);
          }
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
          if (error.code === "functions/internal") {
            throw new Error(`The checkout service encountered an error. Reference: ${order.requestId}. Please try again; if it continues, share this reference with the administrator.`);
          }
          throw error;
        }
      });
    },

    async getCustomerOrders(customerId) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        try {
          const orders = await store().list(collection, [{ field: "customerId", operator: "==", value: customerId }]);
          const local = (await getLocalOrders()).filter((order) => order.customerId === customerId);
          const merged = new Map([...orders, ...local].map((order) => [order.id, order]));
          return [...merged.values()].sort((first, second) => new Date(second.orderDate) - new Date(first.orderDate));
        } catch (_) {
          const local = (await getLocalOrders()).filter((order) => order.customerId === customerId);
          const mock = (window.ShopApp.mockData.orders || []).filter((order) => order.customerId === customerId);
          return [...mock, ...local].sort((first, second) => new Date(second.orderDate) - new Date(first.orderDate));
        }
      });
    },

    async getAllOrders() {
      return window.ShopApp.apiService.requireSuccess(async () => {
        try {
          const orders = await store().list(collection);
          const local = await getLocalOrders();
          const merged = new Map([...orders, ...local].map((order) => [order.id, order]));
          return [...merged.values()].sort((first, second) => new Date(second.orderDate) - new Date(first.orderDate));
        } catch (_) {
          const local = await getLocalOrders();
          const mock = window.ShopApp.mockData.orders || [];
          return [...mock, ...local].sort((first, second) => new Date(second.orderDate) - new Date(first.orderDate));
        }
      });
    },

    async getOrderById(orderId) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        try { return await store().get(collection, orderId); }
        catch (_) {
          const local = (await getLocalOrders()).find((order) => order.id === orderId);
          if (local) return local;
          const mock = (window.ShopApp.mockData.orders || []).find((order) => order.id === orderId);
          if (mock) return mock;
          throw new Error("Record not found.");
        }
      });
    },

    async updateOrderStatus(orderId, status) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        if (!["PENDING", "PLACED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
          throw new Error("Select a valid order status.");
        }
        try {
          return await store().update(collection, orderId, { status });
        } catch (_) {
          const local = await getLocalOrders();
          const order = local.find((item) => item.id === orderId);
          if (!order) throw new Error("Record not found.");
          order.status = status;
          await window.ShopApp.storageService.set(localOrdersKey, local);
          return order;
        }
      });
    }
  };
})();
