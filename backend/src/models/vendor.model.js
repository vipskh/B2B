import mongoose from "mongoose";

// A Vendor represents a company/supplier on the marketplace (1688-style).
// Exactly one User (the "owner") manages a Vendor.
const vendorSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    // url-friendly unique handle, e.g. "shenzhen-tech-co"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      enum: ["manufacturer", "trading_company", "wholesaler", "distributor", "other"],
      default: "other",
    },
    // location
    country: { type: String, default: "" },
    province: { type: String, default: "" },
    city: { type: String, default: "" },
    addressLine: { type: String, default: "" },
    yearEstablished: { type: Number },

    // contact
    contactName: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },

    // trust & verification (1688-style supplier badges)
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verifiedAt: { type: Date },
    badges: [
      {
        type: String,
        enum: ["verified_supplier", "trade_assurance", "gold_supplier", "assessed_supplier"],
      },
    ],

    // aggregated metrics
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, default: 0 },
    },
    responseRate: { type: Number, min: 0, max: 100, default: 0 }, // percent
    responseTimeHours: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },

    // moderation lifecycle: pending (just applied) -> active -> suspended
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },

    // payouts (Stripe Connect) — wired in a later phase
    stripeAccountId: { type: String, default: "" },
  },
  { timestamps: true }
);

// text index to support supplier search by company name / description
vendorSchema.index({ companyName: "text", description: "text" });

export const Vendor = mongoose.model("Vendor", vendorSchema);
