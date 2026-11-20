(function () {
  window.ShopApp = window.ShopApp || {};

  const ApiService = {
    async execute(operation) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 40));
        const data = await operation();
        return { success: true, data, error: null };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: { code: "OPERATION_FAILED", message: error.message || "An unexpected error occurred." }
        };
      }
    },

    async requireSuccess(operation) {
      const response = await this.execute(operation);
      if (!response.success) {
        throw new Error(response.error.message);
      }
      return response.data;
    }
  };

  window.ShopApp.apiService = ApiService;
})();
