import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(protectRoute);

router.post("/conversations", startConversation);
router.get("/conversations", getMyConversations);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);

export default router;
