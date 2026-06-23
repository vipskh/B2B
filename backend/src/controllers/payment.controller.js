import Stripe from "stripe";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { OrderGroup } from "../models/ordergroup.model.js";
import { Vendor } from "../models/vendor.model.js";
import { resolveUnitPrice, checkMoq, SHIPPING_PER_VENDOR, TAX_RATE } from "../lib/pricing.js";

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
  try {
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // Validate every item and GROUP BY VENDOR. The server is the single source
    // of truth for prices (wholesale tier resolution + MOQ enforcement).
    const groups = new Map(); // vendorId -> { vendorId, items[], subtotal }

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product?.name || ""} not found` });
      }
      if (product.status !== "active") {
        return res.status(400).json({ error: `${product.name} is not available` });
      }

      const qty = Number(item.quantity);
      if (product.stock < qty) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const moq = checkMoq(product, qty);
      if (!moq.ok) return res.status(400).json({ error: moq.message });

      const unitPrice = resolveUnitPrice(product, qty);
      const vendorId = product.vendor.toString();

      if (!groups.has(vendorId)) groups.set(vendorId, { vendorId, items: [], subtotal: 0 });
      const g = groups.get(vendorId);
      g.items.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        quantity: qty,
        image: product.images[0],
      });
      g.subtotal += unitPrice * qty;
    }

    // Compute per-vendor and grand totals (shipping + tax charged per vendor)
    let itemsPrice = 0;
    let shippingPrice = 0;
    let taxPrice = 0;
    for (const g of groups.values()) {
      g.shipping = SHIPPING_PER_VENDOR;
      g.tax = g.subtotal * TAX_RATE;
      g.total = g.subtotal + g.shipping + g.tax;
      itemsPrice += g.subtotal;
      shippingPrice += g.shipping;
      taxPrice += g.tax;
    }
    const grandTotal = itemsPrice + shippingPrice + taxPrice;

    if (grandTotal <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    // find or create the Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { clerkId: user.clerkId, userId: user._id.toString() },
      });
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
    }

    // Create the OrderGroup + one pending Order per vendor up front; the webhook
    // flips them to "pending" (paid) and decrements stock once payment succeeds.
    const orderGroup = await OrderGroup.create({
      user: user._id,
      clerkId: user.clerkId,
      shippingAddress,
      itemsPrice,
      shippingPrice,
      taxPrice,
      grandTotal,
      paymentStatus: "pending",
    });

    const orderIds = [];
    for (const g of groups.values()) {
      const order = await Order.create({
        orderGroup: orderGroup._id,
        vendor: g.vendorId,
        user: user._id,
        clerkId: user.clerkId,
        orderItems: g.items,
        shippingAddress,
        subtotal: g.subtotal,
        shippingPrice: g.shipping,
        taxPrice: g.tax,
        totalPrice: g.total,
        status: "pending_payment",
      });
      orderIds.push(order._id);
    }
    orderGroup.orders = orderIds;
    await orderGroup.save();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotal * 100), // cents
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        clerkId: user.clerkId,
        userId: user._id.toString(),
        orderGroupId: orderGroup._id.toString(),
      },
    });

    orderGroup.paymentResult = { id: paymentIntent.id, status: paymentIntent.status };
    await orderGroup.save();

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
}

export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log("Payment succeeded:", paymentIntent.id);

    try {
      const { orderGroupId } = paymentIntent.metadata;

      const group = await OrderGroup.findById(orderGroupId);
      if (!group) {
        console.log("OrderGroup not found for payment:", paymentIntent.id);
        return res.json({ received: true });
      }
      // idempotency: ignore duplicate webhook deliveries
      if (group.paymentStatus === "paid") {
        return res.json({ received: true });
      }

      group.paymentStatus = "paid";
      group.paymentResult = { id: paymentIntent.id, status: "succeeded" };
      await group.save();

      // finalize each vendor's order: mark paid, decrement stock, bump vendor stats
      const orders = await Order.find({ orderGroup: group._id });
      for (const order of orders) {
        order.status = "pending";
        order.paymentResult = { id: paymentIntent.id, status: "succeeded" };
        await order.save();

        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }
        await Vendor.findByIdAndUpdate(order.vendor, { $inc: { totalOrders: 1 } });
      }

      console.log("OrderGroup paid & split into vendor orders:", group._id.toString());
    } catch (error) {
      console.error("Error finalizing order from webhook:", error);
    }
  }

  res.json({ received: true });
}
