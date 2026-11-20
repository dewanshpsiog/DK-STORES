(function () {
  window.ShopApp = window.ShopApp || {};

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.adminSidebar.render("adminSidebar", "dashboard.html");
    await window.ShopApp.productService.seedInitialCatalog();
    const [categories, products, customers, orders] = await Promise.all([
      window.ShopApp.categoryService.getAllCategories(),
      window.ShopApp.productService.getAllProducts(),
      window.ShopApp.customerService.getAllCustomers(),
      window.ShopApp.orderService.getAllOrders()
    ]);
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const lowStock = products.filter((product) => product.qty < window.ShopApp.config.lowStockThreshold);
    const stats = [
      ["Customers", customers.length, "people"],
      ["Products", products.length, "boxes"],
      ["Categories", categories.length, "tags"],
      ["Orders", orders.length, "receipt"],
      ["Total sales", window.ShopApp.formatters.currency(totalSales), "cash-stack"]
    ];
    document.getElementById("statCards").innerHTML = stats.map(([label, value, icon]) =>
      `<div class="col-sm-6 col-xl"><div class="surface-card stat-card"><div class="d-flex justify-content-between"><span class="text-muted">${label}</span><i class="bi bi-${icon} text-primary fs-5"></i></div><div class="stat-card__value mt-2">${value}</div></div></div>`
    ).join("");
    document.getElementById("lowStock").innerHTML = lowStock.length
      ? lowStock.map((product) => `<div class="d-flex justify-content-between border-bottom py-2"><span>${product.title}</span><span class="text-danger fw-semibold">${product.qty}</span></div>`).join("")
      : '<div class="text-muted py-3">No low-stock products.</div>';

    const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
    document.getElementById("recentOrders").innerHTML = orders.slice(0, 8).map((order) =>
      `<tr><td><strong>${order.id}</strong></td><td>${customerMap.get(order.customerId) || order.customerId}</td><td>${window.ShopApp.dateUtils.formatDate(order.orderDate)}</td><td>${order.paymentMethod}</td><td>${window.ShopApp.formatters.currency(order.total)}</td><td><select class="form-select form-select-sm order-status" data-order-id="${order.id}"><option ${order.status === "PLACED" ? "selected" : ""}>PLACED</option><option ${order.status === "SHIPPED" ? "selected" : ""}>SHIPPED</option><option ${order.status === "DELIVERED" ? "selected" : ""}>DELIVERED</option><option ${order.status === "CANCELLED" ? "selected" : ""}>CANCELLED</option></select></td></tr>`
    ).join("") || '<tr><td colspan="6" class="text-center text-muted py-4">No orders yet.</td></tr>';
    document.getElementById("recentOrders").addEventListener("change", async (event) => {
      const select = event.target.closest(".order-status");
      if (!select) return;
      await window.ShopApp.orderService.updateOrderStatus(select.dataset.orderId, select.value);
    });

    if (window.Chart) {
      const salesByDay = {};
      orders.forEach((order) => {
        const day = String(order.orderDate).slice(0, 10);
        salesByDay[day] = (salesByDay[day] || 0) + Number(order.total);
      });
      const labels = Object.keys(salesByDay).sort();
      new window.Chart(document.getElementById("salesChart"), {
        type: "line",
        data: { labels, datasets: [{ label: "Sales (₹)", data: labels.map((label) => salesByDay[label]), borderColor: "#155eef", backgroundColor: "rgba(21,94,239,.12)", fill: true, tension: 0.3 }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
