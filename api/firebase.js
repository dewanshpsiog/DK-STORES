import { firebaseConfig, firebaseFunctionsRegion } from "./firebaseConfig.js";

window.ShopApp = window.ShopApp || {};

const firebaseReady = (async function initializeFirebase() {
  const [appSdk, authSdk, firestoreSdk, functionsSdk] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js")
  ]);

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId || !firebaseConfig.messagingSenderId) {
    throw new Error("Complete the Firebase web app configuration in api/firebaseConfig.js.");
  }

  const app = appSdk.initializeApp(firebaseConfig);
  const auth = authSdk.getAuth(app);
  const db = firestoreSdk.getFirestore(app);
  const functions = functionsSdk.getFunctions(app, firebaseFunctionsRegion);

  window.ShopApp.firebase = Object.freeze({
    app,
    auth,
    db,
    functions,
    authSdk,
    firestoreSdk,
    functionsSdk
  });
  return window.ShopApp.firebase;
})();

window.ShopApp.firebaseReady = firebaseReady;
firebaseReady.catch((error) => {
  window.ShopApp.firebaseError = error;
  console.error("Firebase initialization failed:", error);

  const showError = () => {
    if (document.getElementById("firebaseSetupError")) return;
    const alert = document.createElement("div");
    alert.id = "firebaseSetupError";
    alert.className = "alert alert-danger m-3";
    alert.setAttribute("role", "alert");
    alert.textContent = `Firebase setup failed: ${error.message}`;
    document.body.prepend(alert);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showError, { once: true });
  } else {
    showError();
  }
});

export { firebaseReady };
