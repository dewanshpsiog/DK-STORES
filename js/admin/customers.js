(function () {
  window.ShopApp = window.ShopApp || {};
  let customers = [];

  function render() {
    const search = document.getElementById("customerSearch").value.trim().toLowerCase();
    const filtered = customers.filter((customer) =>
      !search || customer.name.toLowerCase().includes(search) || customer.email.toLowerCase().includes(search)
    );
    document.getElementById("customerRows").innerHTML = filtered.map((customer) => {
      const available = Math.max(0, customer.creditLimit - customer.outstandingCredit);
      return `<tr><td>${customer.id}</td><td><strong>${customer.name}</strong></td><td>${customer.email}</td><td>${customer.mobile}</td><td>${window.ShopApp.formatters.currency(customer.creditLimit)}</td><td>${window.ShopApp.formatters.currency(customer.outstandingCredit)}</td><td>${window.ShopApp.formatters.currency(available)}</td><td><span class="status-badge ${customer.isActive ? "status-active" : "status-inactive"}">${customer.isActive ? "Active" : "Inactive"}</span></td><td class="text-end"><button class="btn btn-sm btn-outline-primary edit-credit" data-customer-id="${customer.id}" title="Credit limit"><i class="bi bi-credit-card"></i></button><button class="btn btn-sm btn-outline-secondary ms-1 toggle-customer" data-customer-id="${customer.id}" title="Toggle status"><i class="bi bi-toggle-${customer.isActive ? "on" : "off"}"></i></button></td></tr>`;
    }).join("") || '<tr><td colspan="9" class="text-center text-muted py-4">No customers found.</td></tr>';
  }

  async function initialize() {
    await window.ShopApp.storageService.initialize();
    await window.ShopApp.adminSidebar.render("adminSidebar", "customers.html");
    customers = await window.ShopApp.customerService.getAllCustomers();
    await render();
    document.getElementById("customerSearch").addEventListener("input", render);
    document.getElementById("customerRows").addEventListener("click", async (event) => {
      const edit = event.target.closest(".edit-credit");
      const toggle = event.target.closest(".toggle-customer");
      if (edit) {
        const customer = await window.ShopApp.customerService.getCustomerById(edit.dataset.customerId);
        document.getElementById("creditCustomerId").value = customer.id;
        document.getElementById("creditLimit").value = customer.creditLimit;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("creditModal")).show();
      }
      if (toggle) {
        const customer = await window.ShopApp.customerService.getCustomerById(toggle.dataset.customerId);
        await window.ShopApp.customerService.setCustomerStatus(customer.id, !customer.isActive);
        customers = await window.ShopApp.customerService.getAllCustomers();
        render();
      }
    });
    document.getElementById("creditForm").addEventListener("submit", async (event) => {
      event.preventEventDefault && event.preventEventDefault();
      event.preventDefault();
      await window.ShopApp.customerService.updateCreditLimit(
        document.getElementById("creditCustomerId").value,
        document.getElementById("creditLimit").value
      );
      bootstrap.Modal.getInstance(document.getElementById("creditModal")).hide();
      customers = await window.ShopApp.customerService.getAllCustomers();
      render();
      window.ShopApp.notification.show("Credit limit updated.", "success");
    });
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();
