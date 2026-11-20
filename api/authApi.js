(function () {
  window.ShopApp = window.ShopApp || {};

  window.ShopApp.firebaseAuthApi = {
    async registerUser(email, password, name, mobile) {
      return window.ShopApp.authService.signup({ email, password, name, mobile });
    },

    async loginUser(email, password) {
      return window.ShopApp.authService.login(email, password);
    }
  };
})();
