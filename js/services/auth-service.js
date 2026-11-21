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
    let snapshot;
    try {
      snapshot = await firebase.firestoreSdk.getDoc(reference);
    } catch (error) {
      if (error.code === "permission-denied") {
        throw new Error("Firestore denied access to your account profile. Deploy firestore.rules and try again.");
      }
      throw error;
    }

    if (!snapshot.exists()) snapshot = await createCustomerProfile(firebase, user);
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

  async function createCustomerProfile(firebase, user) {
    const uid = user.uid;
    const userRef = firebase.firestoreSdk.doc(firebase.db, "users", uid);
    const customerRef = firebase.firestoreSdk.doc(firebase.db, "customers", uid);
    let customerSnapshot;
    try {
      customerSnapshot = await firebase.firestoreSdk.getDoc(customerRef);
    } catch (error) {
      if (error.code === "permission-denied") {
        throw new Error("Your Firestore profile is missing and rules do not allow profile repair. Deploy firestore.rules first.");
      }
      throw error;
    }

    const existingCustomer = customerSnapshot.exists() ? customerSnapshot.data() : null;
    if (existingCustomer && existingCustomer.uid !== uid) {
      throw new Error("The existing customer record does not match this account.");
    }

    const email = user.email || "";
    const name = existingCustomer && existingCustomer.name
      ? existingCustomer.name
      : user.displayName || email.split("@")[0] || "Customer";
    const createdAt = new Date().toISOString();
    const profile = {
      id: uid,
      name,
      email,
      role: "CUSTOMER",
      isActive: existingCustomer ? existingCustomer.isActive !== false : true,
      createdAt
    };
    const batch = firebase.firestoreSdk.writeBatch(firebase.db);
    batch.set(userRef, profile);

    if (!existingCustomer) {
      batch.set(customerRef, {
        id: uid,
        uid,
        name,
        email,
        mobile: "",
        creditLimit: window.ShopApp.config.defaultCreditLimit,
        outstandingCredit: 0,
        isActive: true,
        createdAt
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      if (error.code === "permission-denied") {
        throw new Error("Could not create your Firestore profile. Deploy firestore.rules and check the users/customers rules.");
      }
      throw error;
    }
    return firebase.firestoreSdk.getDoc(userRef);
  }

  function getLocalSession() {
    return window.ShopApp.storageService.get(window.ShopApp.config.storageKeys.session);
  }

  function setLocalSession(session) {
    return window.ShopApp.storageService.set(window.ShopApp.config.storageKeys.session, session);
  }

  const AuthService = {
    async login(email, password) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        try {
          const firebase = await getContext();
          const credential = await firebase.authSdk.signInWithEmailAndPassword(
            firebase.auth,
            String(email).trim(),
            password
          );
          const session = await loadSession(firebase, credential.user);
          await setLocalSession(session);
          return session;
        } catch (error) {
          const account = window.ShopApp.mockData.users.find((user) =>
            user.email.toLowerCase() === String(email).trim().toLowerCase() &&
            user.password === password &&
            user.isActive
          );
          if (!account) throw error;
          const session = { id: account.id, name: account.name, email: account.email, role: account.role };
          await setLocalSession(session);
          return session;
        }
      });
    },

    async signup(customer) {
      return window.ShopApp.apiService.requireSuccess(async () => {
        try {
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
          await batch.commit();
          return customerRecord;
        } catch (firebaseError) {
          const email = String(customer.email).trim().toLowerCase();
          const existing = window.ShopApp.mockData.users.find((user) =>
            user.email.toLowerCase() === email
          );
          if (existing) throw new Error("An account with this email already exists.");
          const id = `CUS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
          const now = new Date().toISOString();
          const session = { id, name: customer.name.trim(), email, role: "CUSTOMER" };
          await setLocalSession(session);
          const customerRecord = {
            id,
            uid: id,
            name: customer.name.trim(),
            email,
            mobile: customer.mobile.trim(),
            creditLimit: window.ShopApp.config.defaultCreditLimit,
            outstandingCredit: 0,
            isActive: true,
            createdAt: now
          };
          await window.ShopApp.storageService.set("localCustomers", [
            ...((await window.ShopApp.storageService.get("localCustomers")) || []),
            customerRecord
          ]);
          return customerRecord;
        }
      });
    },

    async logout() {
      await window.ShopApp.storageService.remove(window.ShopApp.config.storageKeys.session);
      try {
        const firebase = await getContext();
        await firebase.authSdk.signOut(firebase.auth);
      } catch (_) {
        // Local sign-out is already complete.
      }
      return true;
    },

    async getSession() {
      return window.ShopApp.apiService.requireSuccess(async () => {
        try {
          const firebase = await getContext();
          const user = firebase.auth.currentUser;
          if (user) {
            const session = await loadSession(firebase, user);
            await setLocalSession(session);
            return session;
          }
        } catch (_) {
          // Fall back to the locally stored session.
        }
        return (await getLocalSession()) || null;
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
