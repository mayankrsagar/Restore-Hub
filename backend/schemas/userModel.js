import bcrypt from 'bcrypt';
// src/models/User.js
import mongoose from 'mongoose';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const userModel = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      set: function (value) {
        if (!value) return value;
        return value.charAt(0).toUpperCase() + value.slice(1);
      },
    },

    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "password is required"],
    },

    type: {
      type: String,
      enum: ["seller", "buyer"],
      default: "seller",
    },

    role: { type: String, enum: ["user", "staff", "admin"], default: "user" },

    phone: { type: String, required: [true, "phone is required"], trim: true },

    address: { type: String, trim: true, default: "" },

    bio: { type: String, default: "", trim: true },

    shopName: { type: String, trim: true, default: "" },

    whatsapp: { type: String, trim: true, default: "" },
    instagram: { type: String, trim: true, default: "" },
    facebook: { type: String, trim: true, default: "" },

    preferredContact: {
      type: String,
      enum: ["phone", "whatsapp", "email"],
      default: "phone",
    },

    avatar: {
      url: { type: String, default: "" }, // e.g. secure_url
      public_id: { type: String, default: "" },
    },

    // optional denormalized stats (Profile fetches /user/stats — keep for fast reads)
    itemsSold: { type: Number, default: 0 },
    itemsBought: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },

    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userModel.index({ email: 1 });
userModel.index({ phone: 1 });

// -------------------------------
// Pre-save hook: hash password
// -------------------------------
userModel.pre("save", async function (next) {
  try {
    const user = this;
    // only hash if the password field was modified (or is new)
    if (!user.isModified("password")) {
      return next();
    }
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    return next();
  } catch (err) {
    return next(err);
  }
});

// -------------------------------
// Instance method: comparePassword
// Usage: const ok = await user.comparePassword(plainTextPassword)
// -------------------------------
userModel.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    // On error, don't authenticate
    return false;
  }
};

// -------------------------------
// Static: recomputeRating(userId)
// Aggregates reviews for the given user and updates ratingAverage and ratingCount.
//
// ASSUMPTIONS (adapt to your app):
// - Reviews collection is named 'reviews' (model 'Review')
// - Each review doc has fields: { seller: ObjectId(user), rating: Number }
// Modify the aggregation field names if your schema differs.
// -------------------------------
userModel.statics.recomputeRating = async function (userId) {
  const User = this;
  if (!userId) throw new Error("recomputeRating requires userId");

  try {
    // try to access Review model (if you have one)
    const Review = mongoose.models.Review || mongoose.model("Review");
    // aggregate average & count
    const agg = await Review.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$seller",
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = agg && agg.length ? agg[0] : { average: 0, count: 0 };

    const updated = await User.findByIdAndUpdate(
      userId,
      { ratingAverage: stats.average || 0, ratingCount: stats.count || 0 },
      { new: true }
    ).lean();

    return updated;
  } catch (err) {
    // If Review model doesn't exist or aggregation fails, swallow and return null
    // Caller can decide to ignore or log.
    console.warn("recomputeRating failed:", err.message || err);
    return null;
  }
};

// -------------------------------
// Static: recomputeStats(userId)
// Attempts to recompute totalListings, itemsSold, itemsBought for the user.
// This is intentionally defensive — adjust collection names/fields to match your app.
// ASSUMPTIONS (adapt):
// - Items collection: model 'Item' with field 'seller' referencing user
// - Orders collection: model 'Order' with fields: { seller: ObjectId, buyer: ObjectId, status: 'sold'|'pending' }
//   OR Orders may have an array orderItems with seller references; you can adapt below.
// -------------------------------
userModel.statics.recomputeStats = async function (userId) {
  const User = this;
  if (!userId) throw new Error("recomputeStats requires userId");

  const updates = {};

  try {
    const Item = mongoose.models.Item || mongoose.model("Item");
    // totalListings = number of items where seller == userId and not deleted
    const totalListings = await Item.countDocuments({
      seller: mongoose.Types.ObjectId(userId),
      // if you have isDeleted field on items, uncomment:
      // isDeleted: { $ne: true }
    });
    updates.totalListings = totalListings || 0;
  } catch (err) {
    // ignore if Item model not present
    console.warn(
      "recomputeStats: Item aggregation failed:",
      err.message || err
    );
  }

  try {
    const Order = mongoose.models.Order || mongoose.model("Order");
    // Attempt 1: orders with seller field
    const soldCount1 = await Order.countDocuments({
      seller: mongoose.Types.ObjectId(userId),
      status: "sold",
    }).catch(() => 0);

    // Attempt 2 (fallback): orders containing orderItems where seller is userId
    // This assumes orderItems is an array of { seller: ObjectId, quantity: Number, status }
    let soldCount2 = 0;
    try {
      const agg = await Order.aggregate([
        { $unwind: "$orderItems" },
        {
          $match: {
            "orderItems.seller": mongoose.Types.ObjectId(userId),
            "orderItems.status": "sold",
          },
        },
        { $group: { _id: null, soldItems: { $sum: "$orderItems.quantity" } } },
      ]);
      if (agg && agg.length) soldCount2 = agg[0].soldItems || 0;
    } catch (_) {
      soldCount2 = 0;
    }

    // choose best non-zero
    updates.itemsSold = soldCount1 || soldCount2 || 0;

    // itemsBought: count orders where buyer == userId and status == sold
    const itemsBought = await Order.countDocuments({
      buyer: mongoose.Types.ObjectId(userId),
      status: "sold",
    }).catch(() => 0);
    updates.itemsBought = itemsBought || 0;
  } catch (err) {
    console.warn(
      "recomputeStats: Order aggregation failed:",
      err.message || err
    );
  }

  // Apply updates if any
  try {
    if (Object.keys(updates).length) {
      const updated = await User.findByIdAndUpdate(userId, updates, {
        new: true,
      }).lean();
      return updated;
    }
    return null;
  } catch (err) {
    console.warn("recomputeStats: update failed:", err.message || err);
    return null;
  }
};

// -------------------------------
// Convenience statics: increment/decrement counters
// Useful if you update counts incrementally instead of full recompute.
// -------------------------------
userModel.statics.incrementCounter = async function (userId, field, by = 1) {
  const allowed = ["itemsSold", "itemsBought", "totalListings", "ratingCount"];
  if (!allowed.includes(field))
    throw new Error(`incrementCounter: field ${field} not allowed`);
  const update = { $inc: {} };
  update.$inc[field] = by;
  return this.findByIdAndUpdate(userId, update, { new: true }).lean();
};

userModel.statics.decrementCounter = async function (userId, field, by = 1) {
  return this.incrementCounter(userId, field, -Math.abs(by));
};

// -------------------------------
// Transform output to client
// -------------------------------
userModel.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;

    if (ret.avatar && typeof ret.avatar === "object") {
      ret.avatar = ret.avatar.url || null;
    } else if (!ret.avatar) {
      ret.avatar = null;
    }

    ret.rating = {
      average: ret.ratingAverage || 0,
      count: ret.ratingCount || 0,
    };
    delete ret.ratingAverage;
    delete ret.ratingCount;

    return ret;
  },
});

userModel.virtual("avatarUrl").get(function () {
  if (this.avatar && typeof this.avatar === "object") {
    return this.avatar.url || null;
  }
  return null;
});

const User = mongoose.models.User || mongoose.model("User", userModel);
export default User;
