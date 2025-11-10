import mongoose from "mongoose";

const userModel = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      set: function (value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
      },
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    type: {
      type: String,
      default: "seller",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Added check to prevent model overwrite in watch mode
const userSchema = mongoose.models.user || mongoose.model("user", userModel);

export default userSchema;
