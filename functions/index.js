"use strict";

const { randomUUID } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

initializeApp();
const db = getFirestore();

function requireText(value, label, maxLength) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    throw new HttpsError("invalid-argument", `${label} is invalid.`);
  }
  return value.trim();
}

exports.createOrder = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before placing an order.");
  }

  const uid = request.auth.uid;
  const input = request.data || {};
  const requestId = requireText(input.requestId, "Checkout request ID", 64);
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    throw new HttpsError("invalid-argument", "Checkout request ID is invalid.");
  }
  const paymentMethod = input.paymentMethod;
  if (!["CASH", "CREDIT"].includes(paymentMethod)) {
    throw new HttpsError("invalid-argument", "Select a valid payment method.");
  }
  if (
    !Array.isArray(input.items) ||
    input.items.length === 0 ||
    input.items.length > 50
  ) {
    throw new HttpsError(
      "invalid-argument",
      "An order must contain between 1 and 50 items.",
    );
  }

  const deliveryAddress = input.deliveryAddress || {};
  const addressLine = requireText(deliveryAddress.addressLine, "Address", 300);
  const city = requireText(deliveryAddress.city, "City", 100);
  const pinCode = requireText(deliveryAddress.pinCode, "PIN code", 6);
  const mobile = requireText(input.mobile, "Mobile number", 10);
  if (!/^[0-9]{6}$/.test(pinCode) || !/^[0-9]{10}$/.test(mobile)) {
    throw new HttpsError(
      "invalid-argument",
      "Enter a valid mobile number and 6-digit PIN code.",
    );
  }

  const quantities = new Map();
  for (const item of input.items) {
    const productId = requireText(item.productId, "Product ID", 128);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpsError(
        "invalid-argument",
        "Product quantities must be positive whole numbers.",
      );
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const userRef = db.collection("users").doc(uid);
  const customerRef = db.collection("customers").doc(uid);
  const requestRef = db
    .collection("checkoutRequests")
    .doc(`${uid}_${requestId}`);
  const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const orderRef = db.collection("orders").doc(orderId);
  const productRefs = Array.from(quantities.keys(), (productId) =>
    db.collection("products").doc(productId),
  );

  try {
    return await db.runTransaction(async (transaction) => {
      const [requestSnapshot, userSnapshot, customerSnapshot] =
        await Promise.all([
          transaction.get(requestRef),
          transaction.get(userRef),
          transaction.get(customerRef),
        ]);
      const productSnapshots = await Promise.all(
        productRefs.map((reference) => transaction.get(reference)),
      );
      if (requestSnapshot.exists) {
        const previousOrderRef = db
          .collection("orders")
          .doc(requestSnapshot.get("orderId"));
        const previousOrderSnapshot = await transaction.get(previousOrderRef);
        if (!previousOrderSnapshot.exists) {
          throw new HttpsError(
            "internal",
            "The earlier checkout request has no order record.",
          );
        }
        return previousOrderSnapshot.data();
      }

      if (
        !userSnapshot.exists ||
        userSnapshot.get("role") !== "CUSTOMER" ||
        userSnapshot.get("isActive") !== true
      ) {
        throw new HttpsError(
          "permission-denied",
          "This customer account is not permitted to place orders.",
        );
      }
      if (
        !customerSnapshot.exists ||
        customerSnapshot.get("isActive") !== true
      ) {
        throw new HttpsError(
          "permission-denied",
          "This customer account is inactive.",
        );
      }

      let total = 0;
      const items = productSnapshots.map((snapshot, index) => {
        if (!snapshot.exists)
          throw new HttpsError(
            "not-found",
            "A product in your cart no longer exists.",
          );
        const product = snapshot.data();
        const productId = productRefs[index].id;
        const quantity = quantities.get(productId);
        if (
          typeof product.title !== "string" ||
          !product.title.trim() ||
          typeof product.cat_id !== "string" ||
          !product.cat_id.trim()
        ) {
          throw new HttpsError(
            "failed-precondition",
            "A product in your cart has incomplete catalog information.",
          );
        }
        if (
          product.isActive !== true ||
          !Number.isInteger(product.qty) ||
          product.qty < quantity
        ) {
          throw new HttpsError(
            "failed-precondition",
            `${product.title || "A product"} has insufficient stock.`,
          );
        }
        if (!Number.isFinite(product.price) || product.price < 0) {
          throw new HttpsError(
            "failed-precondition",
            "A product has an invalid price.",
          );
        }
        const lineTotal = product.price * quantity;
        if (!Number.isFinite(lineTotal)) {
          throw new HttpsError(
            "failed-precondition",
            "A product total is too large to process.",
          );
        }
        total += lineTotal;
        return {
          productId,
          title: product.title,
          categoryId: product.cat_id,
          quantity,
          unitPrice: product.price,
          lineTotal,
        };
      });

      if (!Number.isFinite(total)) {
        throw new HttpsError(
          "failed-precondition",
          "The order total is too large to process.",
        );
      }

      const outstandingCredit = Number(
        customerSnapshot.get("outstandingCredit") || 0,
      );
      const creditLimit = Number(customerSnapshot.get("creditLimit") || 0);
      if (
        !Number.isFinite(outstandingCredit) ||
        outstandingCredit < 0 ||
        !Number.isFinite(creditLimit) ||
        creditLimit < 0
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The customer credit profile is invalid. Contact the store administrator.",
        );
      }
      if (
        paymentMethod === "CREDIT" &&
        outstandingCredit + total > creditLimit
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This purchase exceeds your available credit.",
        );
      }

      const now = new Date().toISOString();
      const customer = customerSnapshot.data();
      const customerName =
        typeof customer.name === "string" && customer.name.trim()
          ? customer.name.trim()
          : request.auth.token.name || "Customer";
      const customerEmail =
        typeof customer.email === "string"
          ? customer.email
          : request.auth.token.email || "";
      const order = {
        id: orderId,
        customerId: uid,
        customerSnapshot: {
          id: uid,
          name: customerName,
          email: customerEmail,
          mobile,
        },
        deliveryAddress: { addressLine, city, pinCode },
        orderDate: now,
        items,
        subtotal: total,
        total,
        paymentMethod,
        status: "PENDING",
      };

      productRefs.forEach((reference, index) => {
        const product = productSnapshots[index].data();
        transaction.update(reference, {
          qty: product.qty - quantities.get(reference.id),
          updatedAt: now,
        });
      });
      if (paymentMethod === "CREDIT") {
        transaction.update(customerRef, {
          outstandingCredit: outstandingCredit + total,
        });
      }
      transaction.set(orderRef, order);
      transaction.set(requestRef, { orderId, customerId: uid, createdAt: now });
      return order;
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error("createOrder failed unexpectedly", {
      uid,
      requestId,
      error: error.message,
      stack: error.stack,
    });
    throw new HttpsError(
      "internal",
      `Order processing failed. Reference: ${requestId}`,
    );
  }
});
