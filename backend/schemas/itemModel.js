import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    // Store individual ratings per user
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        value: { type: Number, min: 1, max: 5 },
      },
    ],

    // Cached average and count for quick queries
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to get rating object { average, count }
itemSchema.virtual("rating").get(function () {
  return {
    average: this.ratingAverage || 0,
    count: this.ratingCount || 0,
  };
});

// Indexes for performance
itemSchema.index({ sellerId: 1 });
itemSchema.index({ ratingAverage: -1 });
itemSchema.index({ type: 1 });
itemSchema.index({ isDeleted: 1 });

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

export default Item;
