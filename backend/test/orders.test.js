const assert = require("node:assert/strict");
const { mock, test } = require("node:test");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const {
  createOrder,
  isValidOrderTransition,
  listCustomerOrders,
  updateAdminOrder,
} = require("../controllers/orderController");

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const testIdempotencyKey = "2f7b173d-6a36-4f75-9e83-68d385b9b8cb";

function orderRequest(body, idempotencyKey = testIdempotencyKey) {
  return {
    headers: { "idempotency-key": idempotencyKey },
    app: { locals: { orderIdempotencyIndexReady: true } },
    user: { userId: "507f1f77bcf86cd799439011" },
    body,
  };
}

function mockNoIdempotentOrder(t) {
  t.mock.method(Order, "findOne", () => ({
    select: () => ({ lean: async () => null }),
  }));
}

test("order status transitions do not allow skipping valid workflow steps", () => {
  assert.equal(isValidOrderTransition("pending", "confirmed"), true);
  assert.equal(isValidOrderTransition("processing", "shipped"), true);
  assert.equal(isValidOrderTransition("pending", "delivered"), false);
  assert.equal(isValidOrderTransition("delivered", "cancelled"), false);
});

test("customer order queries are limited to the authenticated customer", async (t) => {
  let filter;
  t.mock.method(Order, "find", (query) => {
    filter = query;
    return { sort: () => ({ lean: async () => [] }) };
  });

  const response = responseRecorder();
  await listCustomerOrders({ user: { userId: "507f1f77bcf86cd799439011" } }, response);

  assert.deepEqual(filter, { customer: "507f1f77bcf86cd799439011" });
  assert.deepEqual(response.body, { orders: [] });
});

test("order creation trusts database prices and uses a mock transaction only", async (t) => {
  const productId = "507f1f77bcf86cd799439022";
  const product = {
    _id: { toString: () => productId },
    name: "Database product",
    price: 125,
    stock: 5,
    stockVerified: true,
  };
  let orderDocument;
  let updatedStockFilter;
  const session = {
    withTransaction: async (operation) => operation(),
    endSession: async () => {},
  };

  mockNoIdempotentOrder(t);
  t.mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "Customer",
      email: "customer@example.invalid",
    }),
  }));
  t.mock.method(Product, "find", () => ({
    session: async () => [product],
  }));
  t.mock.method(Product, "updateOne", async (filter) => {
    updatedStockFilter = filter;
    return { modifiedCount: 1 };
  });
  t.mock.method(Order, "create", async ([document]) => {
    orderDocument = document;
    return [{ ...document, _id: "mock-order-id" }];
  });
  t.mock.method(mongoose, "startSession", async () => session);

  const response = responseRecorder();
  await createOrder(orderRequest({
      items: [{ productId, quantity: 2 }],
      deliveryMethod: "standard",
      paymentMethod: "card",
      address: {
        line1: "1 Test Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
      },
    }), response);

  assert.equal(orderDocument.items[0].unitPrice, 125);
  assert.equal(orderDocument.total, 299);
  assert.equal(orderDocument.orderStatus, "pending");
  assert.equal(orderDocument.paymentStatus, "pending");
  assert.equal(updatedStockFilter.stock.$gte, 2);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.order._id, "mock-order-id");
});

test("order creation rejects products without verified numeric stock", async (t) => {
  const productId = "507f1f77bcf86cd799439023";
  const session = {
    withTransaction: async (operation) => operation(),
    endSession: async () => {},
  };
  mockNoIdempotentOrder(t);
  t.mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "Customer",
      email: "customer@example.invalid",
    }),
  }));
  t.mock.method(Product, "find", () => ({
    session: async () => [{
      _id: { toString: () => productId },
      name: "Unverified product",
      price: 100,
      stock: 5,
      stockVerified: false,
    }],
  }));
  t.mock.method(mongoose, "startSession", async () => session);

  await assert.rejects(createOrder(orderRequest({
      items: [{ productId, quantity: 1 }],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      address: {
        line1: "1 Test Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
      },
    }), responseRecorder()), {
    message: "Unverified product does not have a verified numeric stock quantity.",
  });
});

test("checkout is disabled until the unique idempotency index is verified", async () => {
  await assert.rejects(createOrder({
    ...orderRequest({}),
    app: { locals: { orderIdempotencyIndexReady: false } },
  }, responseRecorder()), {
    message: "Checkout setup is incomplete. An administrator must prepare the demo database first.",
  });
});

test("order creation rejects insufficient stock before reserving inventory", async (t) => {
  const productId = "507f1f77bcf86cd799439024";
  let stockReservationAttempted = false;
  let orderCreationAttempted = false;
  const session = {
    withTransaction: async (operation) => operation(),
    endSession: async () => {},
  };
  mockNoIdempotentOrder(t);
  t.mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "Customer",
      email: "customer@example.invalid",
    }),
  }));
  t.mock.method(Product, "find", () => ({
    session: async () => [{
      _id: { toString: () => productId },
      name: "Limited stock product",
      price: 100,
      stock: 1,
      stockVerified: true,
    }],
  }));
  t.mock.method(Product, "updateOne", async () => {
    stockReservationAttempted = true;
    return { modifiedCount: 1 };
  });
  t.mock.method(Order, "create", async () => {
    orderCreationAttempted = true;
    return [];
  });
  t.mock.method(mongoose, "startSession", async () => session);

  await assert.rejects(createOrder(orderRequest({
      items: [{ productId, quantity: 2 }],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      address: {
        line1: "1 Test Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
      },
    }), responseRecorder()), {
    message: "Limited stock product does not have enough stock.",
  });

  assert.equal(stockReservationAttempted, false);
  assert.equal(orderCreationAttempted, false);
});

test("order creation rejects a stock race when conditional reservation fails", async (t) => {
  const productId = "507f1f77bcf86cd799439027";
  let orderCreationAttempted = false;
  const session = {
    withTransaction: async (operation) => operation(),
    endSession: async () => {},
  };
  mockNoIdempotentOrder(t);
  t.mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "Customer",
      email: "customer@example.invalid",
    }),
  }));
  t.mock.method(Product, "find", () => ({
    session: async () => [{
      _id: { toString: () => productId },
      name: "Concurrent product",
      price: 100,
      stock: 5,
      stockVerified: true,
    }],
  }));
  t.mock.method(Product, "updateOne", async (filter) => {
    assert.equal(filter._id.toString(), productId);
    assert.equal(filter.stockVerified, true);
    assert.deepEqual(filter.stock, { $gte: 2 });
    return { modifiedCount: 0 };
  });
  t.mock.method(Order, "create", async () => {
    orderCreationAttempted = true;
    return [];
  });
  t.mock.method(mongoose, "startSession", async () => session);

  await assert.rejects(createOrder(orderRequest({
      items: [{ productId, quantity: 2 }],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      address: {
        line1: "1 Test Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
      },
    }), responseRecorder()), {
    message: "Product stock changed during checkout. Refresh your cart and try again.",
  });
  assert.equal(orderCreationAttempted, false);
});

test("order creation rejects duplicate cart lines whose combined quantity exceeds the limit", async () => {
  await assert.rejects(createOrder(orderRequest({
      items: [
        { productId: "507f1f77bcf86cd799439026", quantity: 6 },
        { productId: "507f1f77bcf86cd799439026", quantity: 5 },
      ],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      address: {
        line1: "1 Test Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
      },
    }), responseRecorder()), {
    message: "A product quantity cannot exceed 10 per order.",
  });
});

test("order creation rolls back stock and order when the transaction commit fails", async (t) => {
  const productId = "507f1f77bcf86cd799439025";
  let stock = 5;
  let persistedOrder = false;
  const session = {
    async withTransaction(operation) {
      const startingStock = stock;
      try {
        await operation();
        throw new Error("Simulated transaction commit failure");
      } catch (error) {
        stock = startingStock;
        persistedOrder = false;
        throw error;
      }
    },
    async endSession() {},
  };
  mockNoIdempotentOrder(t);
  t.mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "Customer",
      email: "customer@example.invalid",
    }),
  }));
  t.mock.method(Product, "find", () => ({
    session: async () => [{
      _id: { toString: () => productId },
      name: "Database product",
      price: 125,
      stock,
      stockVerified: true,
    }],
  }));
  t.mock.method(Product, "updateOne", async (filter, update) => {
    if (stock < filter.stock.$gte) return { modifiedCount: 0 };
    stock += update.$inc.stock;
    return { modifiedCount: 1 };
  });
  t.mock.method(Order, "create", async ([document]) => {
    persistedOrder = true;
    return [{ ...document, _id: "mock-order-id" }];
  });
  t.mock.method(mongoose, "startSession", async () => session);

  await assert.rejects(createOrder(orderRequest({
      items: [{ productId, quantity: 2 }],
      deliveryMethod: "standard",
      paymentMethod: "cod",
      address: {
        line1: "1 Test Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
      },
    }), responseRecorder()), {
    message: "Simulated transaction commit failure",
  });

  assert.equal(stock, 5);
  assert.equal(persistedOrder, false);
});

test("repeated checkout requests with the same key return one persisted order", async (t) => {
  const productId = "507f1f77bcf86cd799439028";
  let persistedOrder;
  let orderLookups = 0;
  let productLookups = 0;
  const session = {
    withTransaction: async (operation) => operation(),
    endSession: async () => {},
  };
  t.mock.method(Order, "findOne", () => ({
    select: () => ({
      lean: async () => {
        orderLookups += 1;
        return persistedOrder || null;
      },
    }),
  }));
  t.mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "Customer",
      email: "customer@example.invalid",
    }),
  }));
  t.mock.method(Product, "find", () => ({
    session: async () => {
      productLookups += 1;
      return [{
        _id: { toString: () => productId },
        name: "Demo product",
        price: 125,
        stock: 5,
        stockVerified: true,
      }];
    },
  }));
  t.mock.method(Product, "updateOne", async () => ({ modifiedCount: 1 }));
  t.mock.method(Order, "create", async ([document]) => {
    persistedOrder = { ...document, _id: "mock-idempotent-order" };
    return [persistedOrder];
  });
  t.mock.method(mongoose, "startSession", async () => session);

  const body = {
    items: [{ productId, quantity: 1 }],
    deliveryMethod: "standard",
    paymentMethod: "cod",
    address: {
      line1: "1 Test Street",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    },
  };
  const firstResponse = responseRecorder();
  await createOrder(orderRequest(body), firstResponse);
  const replayResponse = responseRecorder();
  await createOrder(orderRequest(body), replayResponse);

  assert.equal(firstResponse.statusCode, 201);
  assert.equal(replayResponse.statusCode, 200);
  assert.equal(replayResponse.body.idempotent, true);
  assert.equal(replayResponse.body.order._id, "mock-idempotent-order");
  assert.equal(orderLookups, 2);
  assert.equal(productLookups, 1);
});

test("reusing an idempotency key with changed order details is rejected", async (t) => {
  const productId = "507f1f77bcf86cd799439029";
  t.mock.method(Order, "findOne", () => ({
    select: () => ({
      lean: async () => ({ idempotencyFingerprint: "different-request" }),
    }),
  }));

  await assert.rejects(createOrder(orderRequest({
    items: [{ productId, quantity: 1 }],
    deliveryMethod: "standard",
    paymentMethod: "cod",
    address: {
      line1: "1 Test Street",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    },
  }), responseRecorder()), {
    message: "This checkout request key was already used with different order details.",
  });
});

test("admin order updates reject invalid transitions without changing payment status", async (t) => {
  const order = {
    orderStatus: "pending",
    paymentStatus: "pending",
    saved: false,
    set(path, value) {
      const [, field] = path.split(".");
      this.shipment = { ...this.shipment, [field]: value };
    },
    async save() {
      this.saved = true;
    },
  };
  t.mock.method(Order, "findById", async () => order);

  const invalidResponse = responseRecorder();
  await updateAdminOrder({
    params: { id: "507f1f77bcf86cd799439099" },
    body: { orderStatus: "delivered" },
  }, invalidResponse);
  assert.equal(invalidResponse.statusCode, 409);
  assert.equal(order.saved, false);

  const validResponse = responseRecorder();
  await updateAdminOrder({
    params: { id: "507f1f77bcf86cd799439099" },
    body: { orderStatus: "confirmed" },
  }, validResponse);
  assert.equal(order.orderStatus, "confirmed");
  assert.equal(order.paymentStatus, "pending");
  assert.equal(order.saved, true);

  const shipmentResponse = responseRecorder();
  await updateAdminOrder({
    params: { id: "507f1f77bcf86cd799439099" },
    body: { shipment: { trackingNumber: "TEST-TRACKING", status: "dispatched" } },
  }, shipmentResponse);
  assert.equal(order.shipment.trackingNumber, "TEST-TRACKING");
  assert.equal(order.shipment.status, "dispatched");
  assert.equal(order.paymentStatus, "pending");
});

test("cancelling an eligible order restores reserved stock atomically", async (t) => {
  const productId = "507f1f77bcf86cd799439022";
  const order = {
    _id: "507f1f77bcf86cd799439099",
    orderStatus: "pending",
    items: [{ product: productId, quantity: 2 }],
    set(path, value) {
      const [, field] = path.split(".");
      this.shipment = { ...this.shipment, [field]: value };
    },
    async save() {
      this.saved = true;
    },
  };
  const session = {
    withTransaction: async (operation) => operation(),
    endSession: async () => {},
  };
  let stockUpdate;
  let lookupCount = 0;

  t.mock.method(Order, "findById", (id) => {
    assert.equal(id, order._id);
    lookupCount += 1;
    if (lookupCount === 1) return Promise.resolve(order);
    return {
      session: async () => order,
    };
  });
  t.mock.method(Product, "updateOne", async (...args) => {
    stockUpdate = args;
    return { modifiedCount: 1 };
  });
  t.mock.method(mongoose, "startSession", async () => session);

  const response = responseRecorder();
  await updateAdminOrder({
    params: { id: order._id },
    body: { orderStatus: "cancelled" },
  }, response);

  assert.equal(order.orderStatus, "cancelled");
  assert.equal(order.saved, true);
  assert.equal(lookupCount, 2);
  assert.deepEqual(stockUpdate[0], { _id: productId });
  assert.deepEqual(stockUpdate[1], { $inc: { stock: 2 } });
  assert.equal(response.statusCode, 200);
});
