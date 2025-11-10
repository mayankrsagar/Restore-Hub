import mongoose from "mongoose";

// Define a proper nested schema for the snapshot
const itemSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, required: true },
    details: String,
    photo: mongoose.Schema.Types.Mixed, // Use Mixed for flexible photo object
    address: String,
    phone: String,
  },
  { _id: false }
); // Disable _id for subdocuments

const orderModel = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
      required: true,
    },
    // Use the nested schema definition
    itemSnapshot: {
      type: itemSnapshotSchema,
      required: true,
    },
    pricePaid: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "completed", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.order || mongoose.model("order", orderModel);
export default Order;
