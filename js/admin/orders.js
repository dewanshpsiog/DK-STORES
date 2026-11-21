(function () {
  window.ShopApp = window.ShopApp || {};
  let allOrders = [];
  let customers = [];

  function render() {
    const start = document.getElementById("orderStartDate").value;
    const end = document.getElementById("orderEndDate").value;
    const customerId = document.getElementById("orderCustomer").value;
    const payment = document.getElementById("orderPayment").value;
    const status = document.getElementById("orderStatus").value;
    const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
    const filtered = allOrders.filter((order) => {
      const date = order.orderDate.slice(0, 10);
      return (!start || date >= start) && (!end || date <= end) &&
        (!customerId || order.customerId === customerId) &&
        (!payment || order.paymentMethod === payment) &&
        (!status || order.status === status);
    });
    document.getElementById("orderRows").innerHTML = filtered.map((order) => `
      <tr><td><strong>${order.id}</strong></td><td>${customerMap.get(order.customerId) || order.customerId}</td><td>${window.ShopApp.dateUtils.formatDateTime(order.orderDate)}</td><td>${order.paymentMethod}</td><td>${window.ShopApp.formatters.currency(order.total)}</td><td><select class="form-select form-select-sm admin-order-status" data-order-id="${order.id}"><option ${order.status === "PENDING" ? "selected" : ""}>PENDING</option><option ${order.status === "PLACED" ? "selected" : ""}>PLACED</option><option ${order.status === "SHIPPED" ? "selected" : ""}>SHIPPED</option><option ${order.status === "DELIVERED" ? "selected" : ""}>DELIVERED</option><option ${order.status === "CANCELLED" ? "selected" : ""}>CANCELLED</option></select></td></tr>`
    ).join("") || '<tr><td colspan="6" class="text-center text-muted py-4">No orders match the filters.</td></tr>';
  }

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.adminSidebar.render("adminSidebar", "orders.html");
    [allOrders, customers] = await Promise.all([
      window.ShopApp.orderService.getAllOrders(),
      window.ShopApp.customerService.getAllCustomers()
    ]);
    document.getElementById("orderCustomer").insertAdjacentHTML("beforeend",
      customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join("")
    );
    ["orderStartDate", "orderEndDate", "orderPayment", "orderStatus", "orderCustomer"].forEach((id) =>
      document.getElementById(id).addEventListener("change", render)
    );
    document.getElementById("orderRows").addEventListener("change", async (event) => {
      const select = event.target.closest(".admin-order-status");
      if (!select) return;
      const previousStatus = allOrders.find((order) => order.id === select.dataset.orderId).status;
      select.disabled = true;
      try {
        await window.ShopApp.orderService.updateOrderStatus(select.dataset.orderId, select.value);
        allOrders = await window.ShopApp.orderService.getAllOrders();
        render();
        window.ShopApp.notification.show("Order status updated.", "success");
      } catch (error) {
        select.value = previousStatus;
        window.ShopApp.notification.show(error.message, "danger");
      } finally {
        select.disabled = false;
      }
    });
    render();
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
