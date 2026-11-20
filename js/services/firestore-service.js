(function () {
  window.ShopApp = window.ShopApp || {};

  async function getContext() {
    await window.ShopApp.firebaseReady;
    if (!window.ShopApp.firebase) throw new Error("Firebase is not initialized.");
    return window.ShopApp.firebase;
  }

  window.ShopApp.firestoreService = {
    async list(collectionName, filters) {
      const { db, firestoreSdk } = await getContext();
      const collectionRef = firestoreSdk.collection(db, collectionName);
      const constraints = (filters || []).map((filter) =>
        firestoreSdk.where(filter.field, filter.operator, filter.value)
      );
      const target = constraints.length ? firestoreSdk.query(collectionRef, ...constraints) : collectionRef;
      const snapshot = await firestoreSdk.getDocs(target);
      return snapshot.docs.map((document) => ({ ...document.data(), id: document.id }));
    },

    async get(collectionName, id) {
      const { db, firestoreSdk } = await getContext();
      const snapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, collectionName, id));
      if (!snapshot.exists()) throw new Error("Record not found.");
      return { ...snapshot.data(), id: snapshot.id };
    },

    async create(collectionName, id, data) {
      const { db, firestoreSdk } = await getContext();
      await firestoreSdk.setDoc(firestoreSdk.doc(db, collectionName, id), data);
      return { ...data, id };
    },

    async update(collectionName, id, updates) {
      const { db, firestoreSdk } = await getContext();
      const reference = firestoreSdk.doc(db, collectionName, id);
      await firestoreSdk.updateDoc(reference, updates);
      const snapshot = await firestoreSdk.getDoc(reference);
      if (!snapshot.exists()) throw new Error("Record not found.");
      return { ...snapshot.data(), id: snapshot.id };
    },

    async remove(collectionName, id) {
      const { db, firestoreSdk } = await getContext();
      await firestoreSdk.deleteDoc(firestoreSdk.doc(db, collectionName, id));
      return true;
    },

    async invoke(functionName, payload) {
      const { functions, functionsSdk } = await getContext();
      const callable = functionsSdk.httpsCallable(functions, functionName);
      const result = await callable(payload);
      return result.data;
    }
  };
})();
