import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    source: { type: String }, // optional: where the message came from (web, mobile)
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Contact", ContactSchema);
