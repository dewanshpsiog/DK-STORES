(function () {
  window.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("signupForm");
    const message = document.getElementById("signupMessage");
    const submit = form.querySelector('button[type="submit"]');

    try {
      await window.ShopApp.storageService.initialize();
    } catch (error) {
      message.textContent = error.message;
      message.className = "alert alert-danger";
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const customer = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        mobile: document.getElementById("mobile").value.trim(),
        password: document.getElementById("password").value
      };
      const isValid = window.ShopApp.validators.required(customer.name) &&
        window.ShopApp.validators.email(customer.email) &&
        window.ShopApp.validators.mobile(customer.mobile) &&
        window.ShopApp.validators.password(customer.password);

      if (!isValid) {
        message.textContent = "Check your name, email, 10-digit mobile number and password.";
        message.className = "alert alert-danger";
        return;
      }

      submit.disabled = true;
      message.textContent = "";
      message.className = "mb-3";
      try {
        await window.ShopApp.authService.signup(customer);
        message.textContent = "Account created. You can now sign in.";
        message.className = "alert alert-success";
        form.reset();
      } catch (error) {
        message.textContent = error.message;
        message.className = "alert alert-danger";
      } finally {
        submit.disabled = false;
      }
    });
  });
})();