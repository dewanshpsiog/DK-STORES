(function () {
  window.ShopApp = window.ShopApp || {};

  async function getContext() {
    await window.ShopApp.firebaseReady;
    const firebase = window.ShopApp.firebase;
    await firebase.auth.authStateReady();
    return firebase;
  }

  async function loadSession(firebase, user) {
    const reference = firebase.firestoreSdk.doc(firebase.db, "users", user.uid);
    const snapshot = await firebase.firestoreSdk.getDoc(reference);
    if (!snapshot.exists()) {
      await firebase.authSdk.signOut(firebase.auth);
      throw new Error("Your account profile is missing. Contact the administrator.");
    }

    const profile = snapshot.data();
    if (!["ADMIN", "CUSTOMER"].includes(profile.role)) {
      await firebase.authSdk.signOut(firebase.auth);
      throw new Error("Your account has no valid application role.");
    }
    if (!profile.isActive) {
      await firebase.authSdk.signOut(firebase.auth);
      throw new Error("This account is inactive.");
    }
    return { id: user.uid, name: profile.name, email: user.email, role: profile.role };
  }

  const AuthService = {
    async login(email, password) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const firebase = await getContext();
        const credential = await firebase.authSdk.signInWithEmailAndPassword(
          firebase.auth,
          String(email).trim(),
          password
        );
        return loadSession(firebase, credential.user);
      });
    },

    async signup(customer) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const firebase = await getContext();
        const credential = await firebase.authSdk.createUserWithEmailAndPassword(
          firebase.auth,
          String(customer.email).trim().toLowerCase(),
          customer.password
        );
        const user = credential.user;
        const profile = {
          id: user.uid,
          name: customer.name.trim(),
          email: user.email,
          role: "CUSTOMER",
          isActive: true,
          createdAt: new Date().toISOString()
        };
        const customerRecord = {
          id: user.uid,
          uid: user.uid,
          name: profile.name,
          email: profile.email,
          mobile: customer.mobile.trim(),
          creditLimit: window.ShopApp.config.defaultCreditLimit,
          outstandingCredit: 0,
          isActive: true,
          createdAt: profile.createdAt
        };
        const userRef = firebase.firestoreSdk.doc(firebase.db, "users", user.uid);
        const customerRef = firebase.firestoreSdk.doc(firebase.db, "customers", user.uid);
        const batch = firebase.firestoreSdk.writeBatch(firebase.db);
        batch.set(userRef, profile);
        batch.set(customerRef, customerRecord);

        try {
          await batch.commit();
        } catch (error) {
          await firebase.authSdk.deleteUser(user);
          throw error;
        }
        return customerRecord;
      });
    },

    async logout() {
      const firebase = await getContext();
      await firebase.authSdk.signOut(firebase.auth);
      return true;
    },

    async getSession() {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const firebase = await getContext();
        const user = firebase.auth.currentUser;
        return user ? loadSession(firebase, user) : null;
      });
    },

    async resetPassword(email) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        const firebase = await getContext();
        await firebase.authSdk.sendPasswordResetEmail(firebase.auth, String(email).trim());
        return { message: "Password reset instructions have been sent." };
      });
    }
  };

  window.ShopApp.authService = AuthService;
})();
