import { Router } from "express";
import { protectRoute, requireVendor, ownsProduct } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getMyOrders,
  updateMyOrderStatus,
  getSellerStats,
} from "../controllers/seller.controller.js";

const router = Router();

// every seller-center route requires an authenticated, non-suspended vendor
router.use(protectRoute, requireVendor);

// products (own)
router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getMyProducts);
router.put("/products/:id", ownsProduct, upload.array("images", 3), updateProduct);
router.delete("/products/:id", ownsProduct, deleteProduct);

// orders (own)
router.get("/orders", getMyOrders);
router.patch("/orders/:orderId/status", updateMyOrderStatus);

// dashboard
router.get("/stats", getSellerStats);

export default router;
