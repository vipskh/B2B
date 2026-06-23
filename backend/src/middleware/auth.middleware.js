import { Users, Vendors, Products } from "../db/models.js";
import { Query } from "../appwrite/client.js";
import { ENV } from "../config/env.js";

// ⚠️ AUTH IS TEMPORARILY OFF (Appwrite/dev mode).
// The "current user" is resolved from the `x-dev-user-id` header that the
// frontend dev user-switcher sends. If absent, we fall back to an admin user so
// the API is usable out of the box. Swap this for Appwrite sessions later.
export const protectRoute = async (req, res, next) => {
  try {
    let user = null;
    const devId = req.headers["x-dev-user-id"];
    if (devId) user = await Users.get(String(devId));
    // no explicit user (e.g. the mobile storefront) → act as the demo buyer
    if (!user) {
      user =
        (await Users.findOne([Query.equal("role", "buyer")])) || (await Users.findOne([]));
    }
    if (!user) {
      return res.status(401).json({ message: "No users found — run `npm run seed` first" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized - user not found" });
    const isBootstrapAdmin = roles.includes("admin") && req.user.email === ENV.ADMIN_EMAIL;
    if (!roles.includes(req.user.role) && !isBootstrapAdmin) {
      return res.status(403).json({ message: `Forbidden - requires role: ${roles.join("/")}` });
    }
    next();
  };

export const adminOnly = requireRole("admin");

// Ensures the user owns an active (non-suspended) Vendor; attaches req.vendor.
export const requireVendor = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized - user not found" });
    if (!req.user.vendor) {
      return res.status(403).json({ message: "Forbidden - you don't have a seller account" });
    }
    const vendor = await Vendors.get(req.user.vendor);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    if (vendor.status === "suspended") {
      return res.status(403).json({ message: "Your seller account is suspended" });
    }
    req.vendor = vendor;
    next();
  } catch (error) {
    console.error("Error in requireVendor middleware", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Ensures the :id product belongs to the current vendor; attaches req.product.
export const ownsProduct = async (req, res, next) => {
  try {
    const product = await Products.get(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.vendor) !== String(req.vendor._id)) {
      return res.status(403).json({ message: "Forbidden - not your product" });
    }
    req.product = product;
    next();
  } catch (error) {
    console.error("Error in ownsProduct middleware", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
