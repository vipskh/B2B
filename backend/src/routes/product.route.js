import { Router } from "express";
import { getProducts, getProductById } from "../controllers/product.controller.js";

const router = Router();

// public catalog — anyone can browse products & suppliers (1688-style)
router.get("/", getProducts);
router.get("/:id", getProductById);

export default router;
