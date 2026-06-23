import mongoose from "mongoose";

// A wholesale price break: "buy >= minQty, pay `price` per unit".
const priceTierSchema = new mongoose.Schema(
  {
    minQty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // owner company — every product belongs to a Vendor on the marketplace
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // base/reference unit price; used as a fallback when no priceTiers match
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // wholesale tiered pricing (sorted ascending by minQty). Empty => flat `price`.
    priceTiers: {
      type: [priceTierSchema],
      default: [],
    },
    // minimum order quantity (B2B wholesale)
    moq: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // unit of sale: piece, set, carton, kg, box, pair, ...
    unit: {
      type: String,
      default: "piece",
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "active", "out_of_stock", "suspended"],
      default: "active",
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// keep tiers ordered so price resolution can scan ascending
productSchema.pre("save", function (next) {
  if (Array.isArray(this.priceTiers)) {
    this.priceTiers.sort((a, b) => a.minQty - b.minQty);
  }
  next();
});

// text index for product search
productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);
