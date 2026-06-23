import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkout, getUserOrders, getOrderGroups } from "../controllers/order.controller.js";

const router = Router();

router.post("/checkout", protectRoute, checkout);
router.get("/", protectRoute, getUserOrders);
router.get("/groups", protectRoute, getOrderGroups);

export default router;
