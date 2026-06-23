import { Products, Orders, Vendors } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { uploadImages } from "../lib/storage.js";
import { withUser, withOrderItemProducts } from "../lib/populate.js";

function parsePriceTiers(raw) {
  if (!raw) return [];
  let tiers = raw;
  if (typeof raw === "string") {
    try {
      tiers = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(tiers)) return [];
  return tiers
    .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }))
    .filter((t) => Number.isFinite(t.minQty) && t.minQty >= 1 && Number.isFinite(t.price) && t.price >= 0)
    .sort((a, b) => a.minQty - b.minQty);
}

// ---------- PRODUCTS ----------
export async function createProduct(req, res) {
  try {
    const { name, description, price, stock, category, moq, unit } = req.body;
    if (!name || !description || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }
    if (req.files.length > 3) return res.status(400).json({ message: "Maximum 3 images allowed" });

    const images = await uploadImages(req.files);
    const product = await Products.create({
      vendor: req.vendor._id,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      moq: moq ? parseInt(moq) : 1,
      unit: unit || "piece",
      priceTiers: parsePriceTiers(req.body.priceTiers),
      images,
      status: "active",
    });
    await Vendors.incr(req.vendor._id, "totalProducts", 1);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error in seller createProduct:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyProducts(req, res) {
  try {
    const products = await Products.list([
      Query.equal("vendor", req.vendor._id),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    res.status(200).json(products);
  } catch (error) {
    console.error("Error in seller getMyProducts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { name, description, price, stock, category, moq, unit, status } = req.body;
    const patch = {};
    if (name) patch.name = name;
    if (description) patch.description = description;
    if (price !== undefined) patch.price = parseFloat(price);
    if (stock !== undefined) patch.stock = parseInt(stock);
    if (category) patch.category = category;
    if (moq !== undefined) patch.moq = parseInt(moq);
    if (unit) patch.unit = unit;
    if (status) patch.status = status;
    if (req.body.priceTiers !== undefined) patch.priceTiers = parsePriceTiers(req.body.priceTiers);
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) return res.status(400).json({ message: "Maximum 3 images allowed" });
      patch.images = await uploadImages(req.files);
    }
    const product = await Products.update(req.product._id, patch);
    res.status(200).json(product);
  } catch (error) {
    console.error("Error in seller updateProduct:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteProduct(req, res) {
  try {
    await Products.remove(req.product._id);
    await Vendors.incr(req.vendor._id, "totalProducts", -1);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in seller deleteProduct:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ---------- ORDERS ----------
export async function getMyOrders(req, res) {
  try {
    let orders = await Orders.list([
      Query.equal("vendor", req.vendor._id),
      Query.notEqual("status", "pending_payment"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    orders = await withUser(orders);
    orders = await withOrderItemProducts(orders);
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error in seller getMyOrders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateMyOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowed = ["confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const order = await Orders.get(orderId);
    if (!order || order.vendor !== req.vendor._id) {
      return res.status(404).json({ message: "Order not found" });
    }
    const patch = { status };
    if (status === "shipped" && !order.shippedAt) patch.shippedAt = new Date().toISOString();
    if (status === "delivered" && !order.deliveredAt) patch.deliveredAt = new Date().toISOString();
    const saved = await Orders.update(orderId, patch);
    res.status(200).json({ message: "Order status updated", order: saved });
  } catch (error) {
    console.error("Error in seller updateMyOrderStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ---------- STATS ----------
export async function getSellerStats(req, res) {
  try {
    const vendorId = req.vendor._id;
    const paidOrders = await Orders.list([
      Query.equal("vendor", vendorId),
      Query.notEqual("status", "pending_payment"),
      Query.limit(1000),
    ]);
    const totalRevenue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const totalProducts = await Products.count([Query.equal("vendor", vendorId)]);

    res.status(200).json({
      totalRevenue,
      totalOrders: paidOrders.length,
      totalProducts,
      rating: req.vendor.rating,
      verificationStatus: req.vendor.verificationStatus,
      status: req.vendor.status,
    });
  } catch (error) {
    console.error("Error in getSellerStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
