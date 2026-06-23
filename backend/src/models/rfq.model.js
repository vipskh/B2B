import mongoose from "mongoose";

// RFQ = Request For Quotation. A buyer posts what they want to source; vendors
// respond with Quotes. Core 1688/Alibaba B2B sourcing flow.
const rfqSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clerkId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "piece" },
    targetPrice: { type: Number, min: 0 }, // optional buyer budget per unit
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "closed", "awarded"],
      default: "open",
      index: true,
    },
    quotesCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const quoteSchema = new mongoose.Schema(
  {
    rfq: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 }, // quoted unit price
    moq: { type: Number, default: 1, min: 1 },
    leadTimeDays: { type: Number, min: 0 },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// a vendor may submit at most one quote per RFQ
quoteSchema.index({ rfq: 1, vendor: 1 }, { unique: true });

export const RFQ = mongoose.model("RFQ", rfqSchema);
export const Quote = mongoose.model("Quote", quoteSchema);
