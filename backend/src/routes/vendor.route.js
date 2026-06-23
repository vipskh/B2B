import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  applyAsVendor,
  getMyVendor,
  updateMyVendor,
  listVendors,
  getVendorBySlug,
  getVendorProducts,
} from "../controllers/vendor.controller.js";

const router = Router();

// current-vendor routes (must come before the public :slug route)
router.post("/apply", protectRoute, applyAsVendor);
router.get("/me", protectRoute, getMyVendor);
router.patch("/me", protectRoute, updateMyVendor);

// public supplier directory + store pages
router.get("/", listVendors);
router.get("/:id/products", getVendorProducts);
router.get("/:slug", getVendorBySlug);

export default router;
