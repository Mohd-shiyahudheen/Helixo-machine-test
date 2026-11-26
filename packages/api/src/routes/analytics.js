import { Router } from "express";
import { Timer } from "../models/Timer.js";
import { TimerAnalytics } from "../models/TimerAnalytics.js";
import { shopDomainValidator } from "../middleware/shopDomainValidator.js";

const router = Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

router.post("/impression", shopDomainValidator, async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const { timerId } = req.body;
    if (!timerId) {
      return res.status(400).json({ error: "timerId is required" });
    }
    const timerExists = await Timer.exists({ _id: timerId, shopDomain });
    if (!timerExists) {
      return res.status(404).json({ error: "Timer not found" });
    }
    const date = startOfDay(new Date());
    await TimerAnalytics.findOneAndUpdate(
      { timerId, shopDomain, date },
      { $inc: { impressions: 1 } },
      { new: true, upsert: true }
    );
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get("/", shopDomainValidator, async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const from = req.query.from ? startOfDay(new Date(req.query.from)) : startOfDay(new Date());
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const docs = await TimerAnalytics.find({
      shopDomain,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: -1 })
      .populate("timerId", "name")
      .lean();
    res.json({ analytics: docs });
  } catch (e) {
    next(e);
  }
});

export default router;
