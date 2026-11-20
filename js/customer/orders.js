(function () {
  window.ShopApp = window.ShopApp || {};

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.navbar.render("siteNavbar");
    const session = await window.ShopApp.authService.getSession();
    if (!session || session.role !== "CUSTOMER") {
      window.location.href = "login.html";
      return;
    }
    const [orders] = await Promise.all([
      window.ShopApp.orderService.getCustomerOrders(session.id)
    ]);
    const container = document.getElementById("orderHistory");
    if (orders.length === 0) {
      container.innerHTML = '<div class="empty-state surface-card"><i class="bi bi-bag fs-1"></i><h1 class="h4 mt-3">No orders yet</h1><a class="btn btn-primary" href="products.html">Start shopping</a></div>';
      return;
    }
    container.innerHTML = orders.map((order) => `
      <div class="surface-card p-4 mb-3">
        <div class="d-flex flex-wrap justify-content-between gap-2">
          <div><strong>${order.id}</strong><div class="text-muted small">${window.ShopApp.dateUtils.formatDateTime(order.orderDate)}</div></div>
          <div><span class="status-badge status-active">${order.status}</span></div>
        </div>
        <hr>
        ${order.items.map((item) => `<div class="d-flex justify-content-between mb-2"><span>${item.quantity} × ${item.title}</span><strong>${window.ShopApp.formatters.currency(item.lineTotal)}</strong></div>`).join("")}
        <div class="d-flex justify-content-between mt-3"><span>Payment: ${order.paymentMethod}</span><strong>Total ${window.ShopApp.formatters.currency(order.total)}</strong></div>
        <button class="btn btn-outline-primary btn-sm mt-3 view-bill" data-order-id="${order.id}" data-bs-toggle="modal" data-bs-target="#billModal"><i class="bi bi-receipt me-1"></i>View bill</button>
      </div>`).join("");
    container.insertAdjacentHTML("beforeend", '<div class="modal fade" id="billModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h2 class="modal-title h5">Order bill</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="billContent"></div><div class="modal-footer"><button class="btn btn-primary" id="printBill"><i class="bi bi-printer me-1"></i>Print</button></div></div></div>');
    container.addEventListener("click", (event) => {
      const button = event.target.closest(".view-bill");
      if (!button) return;
      const order = orders.find((item) => item.id === button.dataset.orderId);
      document.getElementById("billContent").innerHTML = `
        <div class="d-flex justify-content-between"><div><strong>ShopHub</strong><div class="text-muted small">Customer invoice</div></div><div class="text-end"><strong>${order.id}</strong><div class="text-muted small">${window.ShopApp.dateUtils.formatDateTime(order.orderDate)}</div></div></div>
        <hr>
        <div class="row mb-3"><div class="col-md-6"><strong>Bill to</strong><div>${order.customerSnapshot ? order.customerSnapshot.name : ""}</div><div>${order.deliveryAddress ? order.deliveryAddress.addressLine : ""}</div><div>${order.deliveryAddress ? `${order.deliveryAddress.city} - ${order.deliveryAddress.pinCode}` : ""}</div></div><div class="col-md-6 text-md-end"><strong>Payment</strong><div>${order.paymentMethod}</div><strong>Status</strong><div>${order.status}</div></div></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${order.items.map((item) => `<tr><td>${item.title}</td><td>${item.quantity}</td><td>${window.ShopApp.formatters.currency(item.unitPrice)}</td><td>${window.ShopApp.formatters.currency(item.lineTotal)}</td></tr>`).join("")}</tbody></table></div>
        <div class="text-end"><strong>Subtotal: ${window.ShopApp.formatters.currency(order.subtotal)}</strong><div class="h5 text-primary mt-2">Total: ${window.ShopApp.formatters.currency(order.total)}</div></div>`;
    });
    document.getElementById("printBill").addEventListener("click", () => window.print());
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
