import { Router } from "express";
import { protectRoute, requireVendor } from "../middleware/auth.middleware.js";
import {
  createRFQ,
  getMyRFQs,
  getRFQById,
  getQuotesForRFQ,
  acceptQuote,
  listOpenRFQs,
  submitQuote,
  getMyQuotes,
} from "../controllers/rfq.controller.js";

const router = Router();

router.use(protectRoute);

// static paths first so they aren't captured by "/:id"
router.post("/", createRFQ);
router.get("/me", getMyRFQs);
router.get("/open", requireVendor, listOpenRFQs);
router.get("/quotes/mine", requireVendor, getMyQuotes);

// RFQ detail + quotes
router.get("/:id", getRFQById);
router.get("/:id/quotes", getQuotesForRFQ);
router.post("/:id/quotes", requireVendor, submitQuote);
router.patch("/:id/quotes/:quoteId/accept", acceptQuote);

export default router;
