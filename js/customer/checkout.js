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
    const [cart, customer] = await Promise.all([
      window.ShopApp.cartService.getCartDetails(),
      window.ShopApp.customerService.getCustomerById(session.id)
    ]);
    if (cart.items.length === 0) {
      window.location.href = "cart.html";
      return;
    }
    if (!customer.isActive) {
      window.ShopApp.notification.show("This customer account is inactive.", "danger");
      window.location.href = "cart.html";
      return;
    }
    document.getElementById("fullName").value = customer.name || "";
    document.getElementById("mobile").value = customer.mobile || "";

    document.getElementById("availableCredit").textContent =
      window.ShopApp.formatters.currency(Math.max(0, customer.creditLimit - customer.outstandingCredit));
    document.getElementById("orderItems").innerHTML = cart.items.map((item) =>
      `<div class="d-flex justify-content-between mb-2"><span>${item.quantity} × ${item.title}</span><strong>${window.ShopApp.formatters.currency(item.lineTotal)}</strong></div>`
    ).join("");
    document.getElementById("checkoutTotal").textContent = window.ShopApp.formatters.currency(cart.total);
    const cartFingerprint = JSON.stringify(
      cart.items
        .map((item) => [item.productId, item.quantity])
        .sort(([firstId], [secondId]) => firstId.localeCompare(secondId))
    );
    const pendingCheckout = await window.ShopApp.storageService.get("checkoutRequest");
    const checkoutRequestId =
      pendingCheckout && pendingCheckout.cartFingerprint === cartFingerprint
        ? pendingCheckout.requestId
        : crypto.randomUUID();
    if (!pendingCheckout || pendingCheckout.requestId !== checkoutRequestId) {
      await window.ShopApp.storageService.set("checkoutRequest", {
        cartFingerprint,
        requestId: checkoutRequestId
      });
    }

    document.getElementById("checkoutForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }
      const mobile = document.getElementById("mobile").value.trim();
      const pinCode = document.getElementById("pinCode").value.trim();
      if (!/^[0-9]{10}$/.test(mobile)) {
        window.ShopApp.notification.show("Enter a valid 10-digit mobile number.", "danger");
        return;
      }
      if (!/^[0-9]{6}$/.test(pinCode)) {
        window.ShopApp.notification.show("Enter a valid 6-digit PIN code.", "danger");
        return;
      }
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      if (paymentMethod === "CREDIT") {
        const available = customer.creditLimit - customer.outstandingCredit;
        if (cart.total > available) {
          window.ShopApp.notification.show("This purchase exceeds your available credit.", "danger");
          return;
        }
      }
      const submitted = form.querySelector('button[type="submit"]');
      const originalLabel = submitted.textContent;
      submitted.disabled = true;
      submitted.textContent = "Placing order...";
      try {
        for (const item of cart.items) {
          const product = await window.ShopApp.productService.getProductById(item.productId);
          if (!product.isActive) throw new Error(`${product.title} is no longer available.`);
          if (item.quantity > product.qty) throw new Error(`Only ${product.qty} units of ${product.title} are available.`);
        }
        const orderItems = await Promise.all(cart.items.map(async (item) => {
          const product = await window.ShopApp.productService.getProductById(item.productId);
          return {
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            categoryId: product.cat_id
          };
        }));
        const order = await window.ShopApp.orderService.createOrder({
          customerId: session.id,
          requestId: checkoutRequestId,
          customerName: document.getElementById("fullName").value.trim(),
          items: orderItems,
          subtotal: cart.subtotal,
          total: cart.total,
          paymentMethod,
          customerSnapshot: {
            id: customer.id,
            name: document.getElementById("fullName").value.trim(),
            email: customer.email,
            mobile
          },
          deliveryAddress: {
            addressLine: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            pinCode
          }
        });
        await window.ShopApp.cartService.clearCart();
        await window.ShopApp.storageService.remove("checkoutRequest");
        window.location.href = `order-success.html?id=${encodeURIComponent(order.id)}`;
      } catch (error) {
        window.ShopApp.notification.show(error.message, "danger");
        submitted.disabled = false;
        submitted.textContent = originalLabel;
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    initialize().catch((error) => {
      console.error("Checkout could not be initialized:", error);
      const message = document.getElementById("checkoutMessage");
      message.className = "alert alert-danger";
      message.textContent = `Checkout could not be loaded: ${error.message}. Check your sign-in, Firebase connection, and account profile, then reload the page.`;
      const submit = document.querySelector('#checkoutForm button[type="submit"]');
      if (submit) submit.disabled = true;
    });
  });
})();
