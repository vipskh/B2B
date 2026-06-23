import { Router } from "express";
import { Users } from "../db/models.js";
import { Query } from "../appwrite/client.js";

// DEV-ONLY: lists seeded users so the frontend "user switcher" can impersonate a
// buyer / seller / admin (auth is temporarily off). Remove when real auth lands.
const router = Router();

router.get("/users", async (_req, res) => {
  try {
    const users = await Users.list([Query.orderAsc("role"), Query.limit(100)]);
    res.status(200).json({
      users: users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        vendor: u.vendor || null,
      })),
    });
  } catch (error) {
    console.error("Error in dev users route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
