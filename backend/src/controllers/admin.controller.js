import { Products, Orders, Users, Vendors } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { uploadImages } from "../lib/storage.js";
import { withUser, withVendor, withOrderItemProducts } from "../lib/populate.js";

export async function createProduct(req, res) {
  try {
    const { name, description, price, stock, category, vendor, moq, unit } = req.body;
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!vendor) return res.status(400).json({ message: "vendor (company id) is required" });
    const vendorDoc = await Vendors.get(vendor);
    if (!vendorDoc) return res.status(404).json({ message: "Vendor not found" });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }
    if (req.files.length > 3) return res.status(400).json({ message: "Maximum 3 images allowed" });

    const images = await uploadImages(req.files);
    const product = await Products.create({
      vendor,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      moq: moq ? parseInt(moq) : 1,
      unit: unit || "piece",
      images,
      status: "active",
    });
    await Vendors.incr(vendor, "totalProducts", 1);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllProducts(_req, res) {
  try {
    const rows = await Products.list([Query.orderDesc("$createdAt"), Query.limit(100)]);
    const products = await withVendor(rows, { select: ["companyName", "slug"] });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await Products.get(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, price, stock, category } = req.body;
    const patch = {};
    if (name) patch.name = name;
    if (description) patch.description = description;
    if (price !== undefined) patch.price = parseFloat(price);
    if (stock !== undefined) patch.stock = parseInt(stock);
    if (category) patch.category = category;
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) return res.status(400).json({ message: "Maximum 3 images allowed" });
      patch.images = await uploadImages(req.files);
    }
    const saved = await Products.update(id, patch);
    res.status(200).json(saved);
  } catch (error) {
    console.error("Error updating products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Products.get(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await Products.remove(req.params.id);
    if (product.vendor) await Vendors.incr(product.vendor, "totalProducts", -1);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export async function getAllOrders(_req, res) {
  try {
    let orders = await Orders.list([
      Query.notEqual("status", "pending_payment"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    orders = await withUser(orders);
    orders = await withVendor(orders, { select: ["companyName", "slug"] });
    orders = await withOrderItemProducts(orders);
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error in getAllOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const order = await Orders.get(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const patch = { status };
    if (status === "shipped" && !order.shippedAt) patch.shippedAt = new Date().toISOString();
    if (status === "delivered" && !order.deliveredAt) patch.deliveredAt = new Date().toISOString();
    const saved = await Orders.update(orderId, patch);
    res.status(200).json({ message: "Order status updated successfully", order: saved });
  } catch (error) {
    console.error("Error in updateOrderStatus controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAllCustomers(_req, res) {
  try {
    const customers = await Users.list([Query.orderDesc("$createdAt"), Query.limit(100)]);
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getDashboardStats(_req, res) {
  try {
    const paidOrders = await Orders.list([
      Query.notEqual("status", "pending_payment"),
      Query.limit(1000),
    ]);
    const totalRevenue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const [totalCustomers, totalProducts, totalVendors, pendingVendors] = await Promise.all([
      Users.count(),
      Products.count(),
      Vendors.count(),
      Vendors.count([Query.equal("verificationStatus", "pending")]),
    ]);
    res.status(200).json({
      totalRevenue,
      totalOrders: paidOrders.length,
      totalCustomers,
      totalProducts,
      totalVendors,
      pendingVendors,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------- VENDOR MANAGEMENT ----------
export async function getAllVendors(req, res) {
  try {
    const { status, verificationStatus, search } = req.query;
    const q = [Query.orderDesc("$createdAt"), Query.limit(100)];
    if (status) q.push(Query.equal("status", status));
    if (verificationStatus) q.push(Query.equal("verificationStatus", verificationStatus));
    if (search) q.push(Query.search("companyName", String(search)));
    let vendors = await Vendors.list(q);
    vendors = await withUser(vendors, { field: "owner", select: ["name", "email"] });
    res.status(200).json({ vendors });
  } catch (error) {
    console.error("Error in getAllVendors controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function verifyVendor(req, res) {
  try {
    const { badges } = req.body;
    const vendor = await Vendors.get(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    const saved = await Vendors.update(req.params.id, {
      verificationStatus: "verified",
      verifiedAt: new Date().toISOString(),
      status: "active",
      badges: Array.isArray(badges) && badges.length ? badges : ["verified_supplier"],
    });
    res.status(200).json({ message: "Vendor verified", vendor: saved });
  } catch (error) {
    console.error("Error in verifyVendor controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateVendorStatus(req, res) {
  try {
    const { status, verificationStatus } = req.body;
    const vendor = await Vendors.get(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    const patch = {};
    if (status) {
      if (!["pending", "active", "suspended"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      patch.status = status;
    }
    if (verificationStatus) {
      if (!["unverified", "pending", "verified", "rejected"].includes(verificationStatus)) {
        return res.status(400).json({ error: "Invalid verificationStatus" });
      }
      patch.verificationStatus = verificationStatus;
    }
    const saved = await Vendors.update(req.params.id, patch);
    res.status(200).json({ message: "Vendor updated", vendor: saved });
  } catch (error) {
    console.error("Error in updateVendorStatus controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
