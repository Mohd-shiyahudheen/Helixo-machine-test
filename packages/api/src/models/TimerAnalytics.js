import mongoose from "mongoose";

const timerAnalyticsSchema = new mongoose.Schema(
  {
    timerId: { type: mongoose.Schema.Types.ObjectId, ref: "Timer", required: true },
    shopDomain: { type: String, required: true, index: true },
    impressions: { type: Number, default: 0 },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

timerAnalyticsSchema.index({ timerId: 1, date: 1 }, { unique: true });
timerAnalyticsSchema.index({ shopDomain: 1, date: 1 });

export const TimerAnalytics = mongoose.model("TimerAnalytics", timerAnalyticsSchema);
