import express from "express";
import path from "path";
import cors from "cors";

import { ENV } from "./config/env.js";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import vendorRoutes from "./routes/vendor.route.js";
import sellerRoutes from "./routes/seller.route.js";
import rfqRoutes from "./routes/rfq.route.js";
import chatRoutes from "./routes/chat.route.js";
import devRoutes from "./routes/dev.route.js";

const app = express();
const __dirname = path.resolve();

app.use(express.json({ limit: "5mb" }));
// auth is header-based (x-dev-user-id) for now, so allow any dev origin
app.use(cors({ origin: true }));

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dev", devRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Success" });
});

// serve the built admin in production
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../admin/dist")));
  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin", "dist", "index.html"));
  });
}

app.listen(ENV.PORT, () => {
  console.log(`✅ Server running on http://localhost:${ENV.PORT}`);
});
