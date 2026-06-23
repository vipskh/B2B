import { Orders, OrderGroups, Carts, Products, Vendors, Reviews } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { withVendor, withOrderItemProducts } from "../lib/populate.js";
import { resolveUnitPrice, checkMoq, SHIPPING_PER_VENDOR, TAX_RATE } from "../lib/pricing.js";

// POST /api/orders/checkout
// Reads the user's server-side cart, validates + applies wholesale tier pricing,
// then splits it into one OrderGroup + one Order per vendor. No Stripe (payments
// deferred) — orders are marked paid immediately for dev/testing.
export async function checkout(req, res) {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress) return res.status(400).json({ error: "Shipping address is required" });

    const cart = await Carts.findOne([Query.equal("user", req.user._id)]);
    const items = cart?.items || [];
    if (!items.length) return res.status(400).json({ error: "Cart is empty" });

    const groups = new Map();
    for (const it of items) {
      const product = await Products.get(it.product);
      if (!product) return res.status(404).json({ error: "A product in your cart no longer exists" });
      if (product.status !== "active") {
        return res.status(400).json({ error: `${product.name} is not available` });
      }
      const qty = Number(it.quantity);
      const variantId = it.variant?.id || null;
      const stockAvail = variantId
        ? (product.variants || []).find((v) => v.id === variantId)?.stock ?? 0
        : product.stock;
      if (stockAvail < qty) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      const moq = checkMoq(product, qty);
      if (!moq.ok) return res.status(400).json({ error: moq.message });

      // variant products price per selected SKU; flat products use wholesale tiers
      const unit = it.variant ? it.variant.price : resolveUnitPrice(product, qty);
      const label = it.variant
        ? `${product.name} (${Object.values(it.variant.options).join(" / ")})`
        : product.name;
      const image = it.variant?.image || product.images?.[0] || "";

      const vid = product.vendor;
      if (!groups.has(vid)) groups.set(vid, { vendorId: vid, items: [], subtotal: 0 });
      const g = groups.get(vid);
      g.items.push({ product: product._id, name: label, price: unit, quantity: qty, image, variant: it.variant || null });
      g.subtotal += unit * qty;
    }

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
    const paymentResult = { id: `dev-${Date.now()}`, status: "paid" };

    const group = await OrderGroups.create({
      user: req.user._id,
      clerkId: req.user.clerkId || "",
      shippingAddress,
      itemsPrice,
      shippingPrice,
      taxPrice,
      grandTotal,
      paymentStatus: "paid",
      paymentResult,
      orders: [],
    });

    const orderIds = [];
    for (const g of groups.values()) {
      const order = await Orders.create({
        orderGroup: group._id,
        vendor: g.vendorId,
        user: req.user._id,
        clerkId: req.user.clerkId || "",
        orderItems: g.items,
        shippingAddress,
        subtotal: g.subtotal,
        shippingPrice: g.shipping,
        taxPrice: g.tax,
        totalPrice: g.total,
        status: "pending",
        paymentResult,
      });
      orderIds.push(order._id);
      for (const it of g.items) {
        const p = await Products.get(it.product);
        if (!p) continue;
        if (it.variant) {
          const variants = (p.variants || []).map((v) =>
            v.id === it.variant.id ? { ...v, stock: Math.max(0, (v.stock || 0) - it.quantity) } : v
          );
          await Products.update(it.product, { variants });
        } else {
          await Products.update(it.product, { stock: Math.max(0, (p.stock || 0) - it.quantity) });
        }
      }
      await Vendors.incr(g.vendorId, "totalOrders", 1);
    }

    await OrderGroups.update(group._id, { orders: orderIds });
    if (cart) await Carts.update(cart._id, { items: [] });

    res.status(201).json({ message: "Order placed", orderGroupId: group._id, orders: orderIds.length });
  } catch (error) {
    console.error("Error in checkout controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/orders — buyer's per-vendor orders (flat)
export async function getUserOrders(req, res) {
  try {
    let orders = await Orders.list([
      Query.equal("user", req.user._id),
      Query.notEqual("status", "pending_payment"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    orders = await withVendor(orders, { select: ["companyName", "slug"] });
    orders = await withOrderItemProducts(orders);

    const orderIds = orders.map((o) => o._id);
    let reviewedIds = new Set();
    if (orderIds.length) {
      const reviews = await Reviews.list([Query.equal("orderId", orderIds), Query.limit(1000)]);
      reviewedIds = new Set(reviews.map((r) => r.orderId));
    }
    const withReview = orders.map((o) => ({ ...o, hasReviewed: reviewedIds.has(o._id) }));
    res.status(200).json({ orders: withReview });
  } catch (error) {
    console.error("Error in getUserOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/orders/groups — buyer's checkouts grouped
export async function getOrderGroups(req, res) {
  try {
    const groups = await OrderGroups.list([
      Query.equal("user", req.user._id),
      Query.equal("paymentStatus", "paid"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    const populated = [];
    for (const grp of groups) {
      let orders = await Promise.all((grp.orders || []).map((id) => Orders.get(id)));
      orders = orders.filter(Boolean);
      orders = await withVendor(orders, { select: ["companyName", "slug"] });
      orders = await withOrderItemProducts(orders);
      populated.push({ ...grp, orders });
    }
    res.status(200).json({ groups: populated });
  } catch (error) {
    console.error("Error in getOrderGroups controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
