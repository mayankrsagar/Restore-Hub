import mongoose from "mongoose";

const itemModel = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    name: {
      type: String,
      required: [true, "name is required"],
    },
    address: {
      type: String,
      required: [true, "address is required"],
    },
    price: {
      type: String,
      required: [true, "price is required"],
    },
    phone: {
      type: String,
      required: [true, "phone is required"],
    },
    type: {
      type: String,
      required: [true, "type is required"],
    },
    details: {
      type: String,
      required: [true, "details is required"],
    },
    photo: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const itemSchema = mongoose.models.item || mongoose.model("item", itemModel);

export default itemSchema;
