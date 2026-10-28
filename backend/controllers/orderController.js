const mongoose = require("mongoose");
const { createHash } = require("node:crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const allowedOrderStatuses = new Set([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
const allowedShipmentStatuses = new Set([
  "pending",
  "dispatched",
  "in_transit",
  "delivered",
  "returned",
]);
const statusTransitions = {
  pending: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["processing", "cancelled"]),
  processing: new Set(["shipped", "cancelled"]),
  shipped: new Set(["delivered"]),
  delivered: new Set(),
  cancelled: new Set(),
};

function isValidOrderTransition(currentStatus, nextStatus) {
  return currentStatus === nextStatus || Boolean(statusTransitions[currentStatus]?.has(nextStatus));
}

function orderIdFilter(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid order id");
    error.statusCode = 400;
    throw error;
  }
  return id;
}

function notFoundError() {
  const error = new Error("Order not found");
  error.statusCode = 404;
  return error;
}

async function createOrder(req, res) {
  if (req.app && req.app.locals.orderIdempotencyIndexReady !== true) {
    const error = new Error("Checkout setup is incomplete. An administrator must prepare the demo database first.");
    error.statusCode = 503;
    throw error;
  }

  const idempotencyKey = typeof req.get === "function"
    ? req.get("Idempotency-Key")
    : req.headers?.["idempotency-key"];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey || "")) {
    const error = new Error("A valid checkout request key is required.");
    error.statusCode = 400;
    throw error;
  }

  const quantities = new Map();
  for (const item of req.body.items) {
    const quantity = (quantities.get(item.productId) || 0) + item.quantity;
    if (quantity > 10) {
      const error = new Error("A product quantity cannot exceed 10 per order.");
      error.statusCode = 400;
      throw error;
    }
    quantities.set(item.productId, quantity);
  }

  const fingerprint = createHash("sha256")
    .update(JSON.stringify({
      customer: req.user.userId,
      items: [...quantities.entries()].sort(([left], [right]) => left.localeCompare(right)),
      coupon: req.body.coupon || null,
      deliveryMethod: req.body.deliveryMethod,
      paymentMethod: req.body.paymentMethod,
      phone: req.body.phone || "",
      address: {
        line1: req.body.address.line1,
        city: req.body.address.city,
        state: req.body.address.state,
        postalCode: req.body.address.postalCode,
        country: req.body.address.country || "India",
      },
    }))
    .digest("hex");
  const existingOrder = await Order.findOne({
    customer: req.user.userId,
    idempotencyKey,
  }).select("+idempotencyFingerprint").lean();
  if (existingOrder) {
    if (existingOrder.idempotencyFingerprint !== fingerprint) {
      const error = new Error("This checkout request key was already used with different order details.");
      error.statusCode = 409;
      throw error;
    }
    return res.status(200).json({ order: existingOrder, idempotent: true });
  }

  const user = await User.findById(req.user.userId).select("name email phone");
  if (!user) throw notFoundError();

  const productIds = [...quantities.keys()];
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      if (products.length !== productIds.length) {
        const error = new Error("One or more products are no longer available.");
        error.statusCode = 409;
        throw error;
      }

      const productById = new Map(products.map((product) => [product._id.toString(), product]));
      const items = productIds.map((productId) => {
        const product = productById.get(productId);
        const quantity = quantities.get(productId);
        if (product.stockVerified !== true || !Number.isInteger(product.stock) || product.stock < 0) {
          const error = new Error(`${product.name} does not have a verified numeric stock quantity.`);
          error.statusCode = 409;
          throw error;
        }
        if (product.stock < quantity) {
          const error = new Error(`${product.name} does not have enough stock.`);
          error.statusCode = 409;
          throw error;
        }
        return {
          product: product._id,
          name: product.name,
          quantity,
          unitPrice: product.price,
          lineTotal: product.price * quantity,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const discount = req.body.coupon === "SHOP10"
        ? Math.round(subtotal * 0.1)
        : req.body.coupon === "FLAT100"
          ? Math.min(100, subtotal)
          : 0;
      const shipping = req.body.deliveryMethod === "express"
        ? 149
        : subtotal >= 499
          ? 0
          : 49;

      for (const item of items) {
        const result = await Product.updateOne(
          { _id: item.product, stockVerified: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );
        if (result.modifiedCount !== 1) {
          const error = new Error("Product stock changed during checkout. Refresh your cart and try again.");
          error.statusCode = 409;
          throw error;
        }
      }

      const [order] = await Order.create(
        [{
          customer: user._id,
          idempotencyKey,
          idempotencyFingerprint: fingerprint,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: req.body.phone || user.phone || "",
          items,
          subtotal,
          discount,
          shipping,
          total: Math.max(0, subtotal - discount + shipping),
          deliveryMethod: req.body.deliveryMethod,
          paymentMethod: req.body.paymentMethod,
          paymentStatus: "pending",
          orderStatus: "pending",
          address: req.body.address,
        }],
        { session }
      );
      createdOrder = order;
    });
  } catch (error) {
    if (error.code === 11000) {
      const concurrentOrder = await Order.findOne({
        customer: req.user.userId,
        idempotencyKey,
      }).select("+idempotencyFingerprint").lean();
      if (concurrentOrder) {
        if (concurrentOrder.idempotencyFingerprint !== fingerprint) {
          const conflict = new Error("This checkout request key was already used with different order details.");
          conflict.statusCode = 409;
          throw conflict;
        }
        return res.status(200).json({ order: concurrentOrder, idempotent: true });
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return res.status(201).json({ order: createdOrder });
}

async function listCustomerOrders(req, res) {
  const orders = await Order.find({ customer: req.user.userId }).sort({ createdAt: -1 }).lean();
  return res.status(200).json({ orders });
}

async function getCustomerOrder(req, res) {
  const order = await Order.findOne({
    _id: orderIdFilter(req.params.id),
    customer: req.user.userId,
  }).lean();
  if (!order) throw notFoundError();
  return res.status(200).json({ order });
}

async function listAdminOrders(req, res) {
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json({ orders });
}

async function getAdminOrder(req, res) {
  const order = await Order.findById(orderIdFilter(req.params.id)).lean();
  if (!order) throw notFoundError();
  return res.status(200).json({ order });
}

async function updateAdminOrder(req, res) {
  let order = await Order.findById(orderIdFilter(req.params.id));
  if (!order) throw notFoundError();

  const { orderStatus, shipment } = req.body;
  const shipmentFields = new Set([
    "trackingNumber",
    "courier",
    "dispatchDate",
    "estimatedDeliveryDate",
    "actualDeliveryDate",
    "status",
  ]);
  if (!orderStatus && !shipment) {
    return res.status(400).json({ message: "Provide an order status or shipment details to update." });
  }
  if (shipment && Object.keys(shipment).some((key) => !shipmentFields.has(key))) {
    return res.status(400).json({ message: "Shipment update contains an unsupported field." });
  }
  if (orderStatus && !isValidOrderTransition(order.orderStatus, orderStatus)) {
    return res.status(409).json({
      message: `Order status cannot change from ${order.orderStatus} to ${orderStatus}.`,
    });
  }

  const nextOrderStatus = orderStatus || order.orderStatus;
  if (shipment?.status === "delivered" && nextOrderStatus !== "delivered") {
    return res.status(400).json({ message: "Mark the order delivered before setting shipment status to delivered." });
  }
  if (shipment?.actualDeliveryDate && nextOrderStatus !== "delivered") {
    return res.status(400).json({ message: "An actual delivery date requires a delivered order status." });
  }
  if (shipment && !Object.keys(shipment).some((key) => shipment[key] !== undefined)) {
    return res.status(400).json({ message: "Enter at least one shipment detail to update." });
  }

  const applyChanges = (targetOrder) => {
    if (orderStatus) targetOrder.orderStatus = orderStatus;
    if (shipment) {
      for (const [key, value] of Object.entries(shipment)) {
        if (value !== undefined) targetOrder.set(`shipment.${key}`, value);
      }
    }
  };

  if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const currentOrder = await Order.findById(order._id).session(session);
        if (!currentOrder || currentOrder.orderStatus !== order.orderStatus
          || !isValidOrderTransition(currentOrder.orderStatus, "cancelled")) {
          const error = new Error("Order status changed. Refresh and try again.");
          error.statusCode = 409;
          throw error;
        }

        for (const item of currentOrder.items) {
          const result = await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
          );
          if (result.modifiedCount !== 1) {
            const error = new Error("Could not restore stock for a product in this order.");
            error.statusCode = 409;
            throw error;
          }
        }
        applyChanges(currentOrder);
        await currentOrder.save({ session });
        order = currentOrder;
      });
    } finally {
      await session.endSession();
    }
  } else {
    applyChanges(order);
    await order.save();
  }

  return res.status(200).json({ order });
}

module.exports = {
  allowedOrderStatuses,
  allowedShipmentStatuses,
  createOrder,
  getAdminOrder,
  getCustomerOrder,
  isValidOrderTransition,
  listAdminOrders,
  listCustomerOrders,
  updateAdminOrder,
};
