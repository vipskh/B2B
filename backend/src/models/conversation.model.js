import mongoose from "mongoose";

// A 1:1 thread between a buyer (User) and a vendor (company). Optionally scoped
// to a product the buyer is inquiring about.
const conversationSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    // unread counters per side, so list views can show badges cheaply
    buyerUnread: { type: Number, default: 0 },
    vendorUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// one thread per buyer+vendor pair
conversationSchema.index({ buyer: 1, vendor: 1 }, { unique: true });

export const Conversation = mongoose.model("Conversation", conversationSchema);
