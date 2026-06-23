import mongoose from "mongoose";

// An OrderGroup is the buyer-facing "checkout": one payment + one shipping
// address that fans out into one Order per vendor (1688-style multi-seller cart).
const groupShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  { _id: false }
);

const orderGroupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
    },
    // child orders, one per vendor
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    shippingAddress: {
      type: groupShippingAddressSchema,
      required: true,
    },
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0, default: 0 },
    taxPrice: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentResult: {
      id: String,
      status: String,
    },
  },
  { timestamps: true }
);

export const OrderGroup = mongoose.model("OrderGroup", orderGroupSchema);
