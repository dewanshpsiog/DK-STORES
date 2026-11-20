(function () {
  window.ShopApp = window.ShopApp || {};
  let exportRows = [];
  let exportFilename = "shop-report.csv";

  function downloadCsv(filename, rows) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) =>
      `"${String(row[header] ?? "").replace(/"/g, '""')}"`
    ).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function render() {
    const [orders, products, customers, categories] = await Promise.all([
      window.ShopApp.orderService.getAllOrders(),
      window.ShopApp.productService.getAllProducts(),
      window.ShopApp.customerService.getAllCustomers(),
      window.ShopApp.categoryService.getAllCategories()
    ]);
    const type = document.getElementById("reportType").value;
    const start = document.getElementById("reportStart").value;
    const end = document.getElementById("reportEnd").value;
    const dateFiltered = orders.filter((order) => {
      const date = order.orderDate.slice(0, 10);
      return (!start || date >= start) && (!end || date <= end);
    });
    const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
    const head = document.getElementById("reportHead");
    const rows = document.getElementById("reportRows");
    const cards = document.getElementById("reportCards");
    let reportRows = [];
    let title = "All sales";

    if (type === "cash" || type === "credit" || type === "all") {
      const filtered = type === "all" ? dateFiltered : dateFiltered.filter((order) => order.paymentMethod === type.toUpperCase());
      title = type === "cash" ? "Cash sales" : type === "credit" ? "Credit sales" : "All sales";
      head.innerHTML = "<tr><th>Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Status</th><th>Total</th></tr>";
      reportRows = filtered.map((order) => ({ Order: order.id, Date: window.ShopApp.dateUtils.formatDate(order.orderDate), Customer: customerMap.get(order.customerId) || order.customerId, Payment: order.paymentMethod, Status: order.status, Total: order.total }));
      rows.innerHTML = filtered.map((order) => `<tr><td>${order.id}</td><td>${window.ShopApp.dateUtils.formatDate(order.orderDate)}</td><td>${customerMap.get(order.customerId) || order.customerId}</td><td>${order.paymentMethod}</td><td>${order.status}</td><td>${window.ShopApp.formatters.currency(order.total)}</td></tr>`).join("") || '<tr><td colspan="6" class="text-center text-muted py-4">No sales found.</td></tr>';
      cards.innerHTML = `<div class="col-md-4"><div class="surface-card stat-card"><div class="text-muted">Orders</div><div class="stat-card__value">${filtered.length}</div></div></div><div class="col-md-4"><div class="surface-card stat-card"><div class="text-muted">Sales</div><div class="stat-card__value">${window.ShopApp.formatters.currency(filtered.reduce((sum, order) => sum + order.total, 0))}</div></div></div>`;
    } else if (type === "top-products" || type === "bottom-products") {
      const totals = {};
      dateFiltered.forEach((order) => order.items.forEach((item) => { totals[item.productId] = (totals[item.productId] || 0) + item.quantity; }));
      const ranked = Object.entries(totals).map(([id, quantity]) => ({ id, title: products.find((product) => product.id === id)?.title || id, quantity })).sort((a, b) => b.quantity - a.quantity);
      const selected = type === "top-products" ? ranked.slice(0, 10) : ranked.sort((a, b) => a.quantity - b.quantity).slice(0, 10);
      title = type === "top-products" ? "Top 10 selling products" : "Bottom 10 selling products";
      head.innerHTML = "<tr><th>Product</th><th>Units sold</th></tr>";
      reportRows = selected.map((item) => ({ Product: item.title, "Units sold": item.quantity }));
      rows.innerHTML = selected.map((item) => `<tr><td>${item.title}</td><td>${item.quantity}</td></tr>`).join("") || '<tr><td colspan="2" class="text-center text-muted py-4">No sales found.</td></tr>';
      cards.innerHTML = `<div class="col-md-4"><div class="surface-card stat-card"><div class="text-muted">Products ranked</div><div class="stat-card__value">${ranked.length}</div></div></div>`;
    } else if (type === "low-stock" || type === "high-stock") {
      const selected = type === "low-stock" ? products.filter((product) => product.qty < 15) : products.filter((product) => product.qty > 100);
      title = type === "low-stock" ? "Low-stock inventory" : "High-stock inventory";
      head.innerHTML = "<tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th></tr>";
      reportRows = selected.map((product) => ({ Product: product.title, Category: categoryMap.get(product.cat_id) || product.cat_id, Stock: product.qty, Price: product.price }));
      rows.innerHTML = selected.map((product) => `<tr><td>${product.title}</td><td>${categoryMap.get(product.cat_id) || product.cat_id}</td><td>${product.qty}</td><td>${window.ShopApp.formatters.currency(product.price)}</td></tr>`).join("") || '<tr><td colspan="4" class="text-center text-muted py-4">No products found.</td></tr>';
      cards.innerHTML = `<div class="col-md-4"><div class="surface-card stat-card"><div class="text-muted">Products</div><div class="stat-card__value">${selected.length}</div></div></div>`;
    } else if (type === "top-customers") {
      const totals = {};
      dateFiltered.forEach((order) => { totals[order.customerId] = (totals[order.customerId] || 0) + order.total; });
      const selected = Object.entries(totals).map(([id, total]) => ({ id, name: customerMap.get(id) || id, total })).sort((a, b) => b.total - a.total).slice(0, 10);
      title = "Top 10 customers";
      head.innerHTML = "<tr><th>Customer</th><th>Purchase value</th></tr>";
      reportRows = selected.map((customer) => ({ Customer: customer.name, "Purchase value": customer.total }));
      rows.innerHTML = selected.map((customer) => `<tr><td>${customer.name}</td><td>${window.ShopApp.formatters.currency(customer.total)}</td></tr>`).join("") || '<tr><td colspan="2" class="text-center text-muted py-4">No purchases found.</td></tr>';
      cards.innerHTML = `<div class="col-md-4"><div class="surface-card stat-card"><div class="text-muted">Customers ranked</div><div class="stat-card__value">${selected.length}</div></div></div>`;
    }
    document.getElementById("reportTitle").textContent = title;
    exportRows = reportRows;
    exportFilename = `${type}-report.csv`;
  }

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.adminSidebar.render("adminSidebar", "reports.html");
    ["reportType", "reportStart", "reportEnd"].forEach((id) => document.getElementById(id).addEventListener("change", render));
    document.getElementById("exportCsv").addEventListener("click", () => downloadCsv(exportFilename, exportRows));
    await render();
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
