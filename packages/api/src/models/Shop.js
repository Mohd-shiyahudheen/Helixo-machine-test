import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    shopDomain: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    installedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Shop = mongoose.model("Shop", shopSchema);
