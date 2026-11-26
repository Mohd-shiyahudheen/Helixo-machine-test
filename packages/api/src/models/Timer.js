import mongoose from "mongoose";

const designSchema = new mongoose.Schema(
  {
    color: { type: String, default: "#ffffff" },
    background: { type: String, default: "#000000" },
    position: { type: String, enum: ["top", "bottom"], default: "top" },
    size: { type: String, enum: ["small", "medium", "large"], default: "medium" },
    urgencyNotification: {
      type: String,
      enum: ["none", "color_pulse", "shake"],
      default: "color_pulse",
    },
  },
  { _id: false }
);

const timerSchema = new mongoose.Schema(
  {
    shopDomain: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    labelText: { type: String, default: "YOUR SPECIAL OFFER ENDS IN" },
    timerType: { type: String, enum: ["fixed", "evergreen"], required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    durationHours: { type: Number },
    targetType: { type: String, enum: ["all", "product", "collection"], required: true },
    targetIds: [{ type: String }],
    design: { type: designSchema, default: () => ({}) },
    status: { type: String, enum: ["active", "paused", "draft"], default: "active" },
  },
  { timestamps: true }
);

timerSchema.index({ shopDomain: 1, status: 1, targetType: 1 });

export const Timer = mongoose.model("Timer", timerSchema);
