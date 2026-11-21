"use strict";

const assert = require("node:assert/strict");
const Module = require("node:module");
const test = require("node:test");

const documents = new Map();
const logs = [];

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function reference(collection, id) {
  return { collection, id, path: `${collection}/${id}` };
}

function snapshot(value) {
  return {
    exists: value !== undefined,
    data: () => clone(value),
    get: (field) => (value === undefined ? undefined : value[field])
  };
}

const db = {
  collection(collection) {
    return {
      doc(id) {
        return reference(collection, id);
      }
    };
  },
  async runTransaction(callback) {
    const writes = [];
    const transaction = {
      async get(ref) {
        return snapshot(documents.get(ref.path));
      },
      set(ref, value) {
        writes.push({ type: "set", ref, value: clone(value) });
      },
      update(ref, value) {
        writes.push({ type: "update", ref, value: clone(value) });
      }
    };
    const result = await callback(transaction);
    for (const write of writes) {
      if (write.type === "set") {
        documents.set(write.ref.path, write.value);
      } else {
        documents.set(write.ref.path, {
          ...documents.get(write.ref.path),
          ...write.value
        });
      }
    }
    return result;
  }
};

class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "firebase-admin/app") {
    return { initializeApp() {} };
  }
  if (request === "firebase-admin/firestore") {
    return { getFirestore: () => db };
  }
  if (request === "firebase-functions") {
    return { logger: { error: (...args) => logs.push(args) } };
  }
  if (request === "firebase-functions/v2/https") {
    return {
      HttpsError,
      onCall: (_options, handler) => handler
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

let createOrder;
try {
  ({ createOrder } = require("../index.js"));
} finally {
  Module._load = originalLoad;
}

const uid = "customer-1";
const requestId = "9a7f55e8-933f-4fdb-9f4e-564e87be78d1";
const request = {
  auth: { uid, token: { name: "Signed-in name", email: "customer@example.com" } },
  data: {
    requestId,
    customerName: "Delivery recipient",
    items: [{ productId: "product-1", quantity: 2 }],
    paymentMethod: "CASH",
    deliveryAddress: {
      addressLine: "10 Market Road",
      city: "Pune",
      pinCode: "411001"
    },
    mobile: "9876543210"
  }
};

function seedCheckoutDocuments() {
  documents.clear();
  logs.length = 0;
  documents.set(`users/${uid}`, {
    role: "CUSTOMER",
    isActive: true
  });
  documents.set(`customers/${uid}`, {
    uid,
    name: "Account name",
    email: "customer@example.com",
    isActive: true,
    creditLimit: 1000,
    outstandingCredit: 0
  });
  documents.set("products/product-1", {
    title: "Test item",
    cat_id: "category-1",
    price: 125,
    qty: 5,
    isActive: true
  });
}

test("creates a pending order using trusted price and updates stock", async () => {
  seedCheckoutDocuments();

  const order = await createOrder(request);

  assert.equal(order.status, "PENDING");
  assert.equal(order.total, 250);
  assert.equal(order.items[0].unitPrice, 125);
  assert.equal(order.customerSnapshot.name, "Delivery recipient");
  assert.equal(documents.get("products/product-1").qty, 3);
  assert.equal(documents.get(`orders/${order.id}`).customerId, uid);
  assert.equal(
    documents.get(`checkoutRequests/${uid}_${requestId}`).orderId,
    order.id
  );
});

test("returns the prior order on retry without decrementing stock again", async () => {
  seedCheckoutDocuments();

  const firstOrder = await createOrder(request);
  const retriedOrder = await createOrder(request);

  assert.equal(retriedOrder.id, firstOrder.id);
  assert.equal(documents.get("products/product-1").qty, 3);
});

test("updates customer credit atomically and rejects purchases over the limit", async () => {
  seedCheckoutDocuments();
  const creditRequest = {
    ...request,
    data: { ...request.data, paymentMethod: "CREDIT" }
  };

  await createOrder(creditRequest);
  assert.equal(documents.get(`customers/${uid}`).outstandingCredit, 250);
  assert.equal(documents.get("products/product-1").qty, 3);

  seedCheckoutDocuments();
  documents.get(`customers/${uid}`).creditLimit = 200;
  await assert.rejects(
    createOrder(creditRequest),
    (error) => error.code === "failed-precondition"
  );
  assert.equal(documents.get(`customers/${uid}`).outstandingCredit, 0);
  assert.equal(documents.get("products/product-1").qty, 5);
});

test("rejects malformed order items instead of returning an internal error", async () => {
  seedCheckoutDocuments();

  await assert.rejects(
    createOrder({ ...request, data: { ...request.data, items: [null] } }),
    (error) => error.code === "invalid-argument"
  );
  assert.equal(logs.length, 0);
});

test("logs an internal error when a retry record has no order", async () => {
  seedCheckoutDocuments();
  documents.set(`checkoutRequests/${uid}_${requestId}`, {
    orderId: "missing-order"
  });

  await assert.rejects(createOrder(request), (error) => error.code === "internal");
  assert.equal(logs.length, 1);
  assert.equal(logs[0][1].requestId, requestId);
});
