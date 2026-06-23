import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // which side of the thread sent it (the vendor side is still a User account)
    senderRole: {
      type: String,
      enum: ["buyer", "vendor"],
      required: true,
    },
    text: { type: String, default: "" },
    images: [{ type: String }],
    readAt: { type: Date },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
