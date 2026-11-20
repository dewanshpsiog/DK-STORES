(function () {
  window.ShopApp = window.ShopApp || {};
  const themes = new Set(["ember", "light", "dark", "blue"]);
  const themeColors = {
    ember: "#d47725",
    light: "#fffaf4",
    dark: "#1b1917",
    blue: "#2563eb"
  };
  const configScript = document.currentScript;
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = new URL("../../assets/images/favicon.png", configScript.src).href;
  document.head.appendChild(favicon);

  function applyTheme(theme) {
    const activeTheme = themes.has(theme) ? theme : "ember";
    document.documentElement.dataset.theme = activeTheme;
    localStorage.setItem("shophub:theme", activeTheme);

    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      document.head.appendChild(themeColor);
    }
    themeColor.content = themeColors[activeTheme];

    const selector = document.getElementById("themeSelect");
    if (selector) selector.value = activeTheme;
  }

  function addThemeSelector() {
    const selector = document.createElement("div");
    selector.className = "theme-switcher";
    selector.innerHTML = `
      <button class="theme-switcher__toggle" type="button" aria-label="Change color theme" aria-expanded="false" aria-controls="themePanel">
        <i class="bi bi-palette2 theme-switcher__icon" aria-hidden="true"></i>
      </button>
      <div class="theme-switcher__panel" id="themePanel" hidden>
        <label for="themeSelect">Color theme</label>
        <select id="themeSelect" aria-label="Choose a color theme">
          <option value="ember">Ember</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="blue">Blue</option>
        </select>
      </div>`;
    document.body.appendChild(selector);
    const toggle = selector.querySelector(".theme-switcher__toggle");
    const panel = selector.querySelector(".theme-switcher__panel");
    const themeSelect = selector.querySelector("select");
    const closePanel = () => {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) themeSelect.focus();
    });
    document.addEventListener("click", (event) => {
      if (!selector.contains(event.target)) closePanel();
    });
    selector.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePanel();
        toggle.focus();
      }
    });
    themeSelect.addEventListener("change", (event) => {
      applyTheme(event.target.value);
      closePanel();
    });
    applyTheme(document.documentElement.dataset.theme);
  }

  applyTheme(localStorage.getItem("shophub:theme"));
  window.addEventListener("storage", (event) => {
    if (event.key === "shophub:theme") {
      applyTheme(event.newValue);
    }
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addThemeSelector, { once: true });
  } else {
    addThemeSelector();
  }

  const AppConfig = Object.freeze({
    appName: "ShopHub",
    currency: "INR",
    currencySymbol: "₹",
    defaultCreditLimit: 1000,
    lowStockThreshold: 15,
    highStockThreshold: 100,
    pageSize: 12,
    storagePrefix: "shophub:",
    storageKeys: {
      categories: "categories",
      products: "products",
      customers: "customers",
      orders: "orders",
      cart: "cart",
      session: "session"
    }
  });

  window.ShopApp.config = AppConfig;

  window.ShopApp.firebaseReady = import("../../api/firebase.js")
    .then((firebaseModule) => firebaseModule.firebaseReady)
    .then(() => import("../services/firestore-service.js"))
    .then(() => window.ShopApp.firebase)
    .catch((error) => {
      window.ShopApp.firebaseError = error;
      console.error("Firebase setup could not be loaded:", error);
      throw error;
    });
  window.ShopApp.firebaseReady.catch(() => {});
})();
