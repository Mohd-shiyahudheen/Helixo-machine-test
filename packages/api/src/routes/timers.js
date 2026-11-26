import { Router } from "express";
import { Timer } from "../models/Timer.js";
import { validateTimerPayload } from "../utils/timerValidation.js";
import { invalidateShopCache } from "../services/cacheService.js";
import { shopDomainValidator } from "../middleware/shopDomainValidator.js";

const router = Router();
router.use(shopDomainValidator);

router.get("/", async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const query = { shopDomain };
    if (req.query.search && typeof req.query.search === "string") {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped) {
        query.$or = [
          { name: { $regex: escaped, $options: "i" } },
          { description: { $regex: escaped, $options: "i" } },
        ];
      }
    }
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { name: 1 },
      startDate: { startDate: 1 },
    };
    const sortOption = sortMap[req.query.sort] || { createdAt: -1 };
    const timers = await Timer.find(query).sort(sortOption);
    res.json({ timers });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const timer = await Timer.findOne({ _id: req.params.id, shopDomain });
    if (!timer) return res.status(404).json({ error: "Timer not found" });
    res.json(timer);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const result = validateTimerPayload(req.body, { isUpdate: false });
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    const timer = await Timer.create({
      shopDomain,
      ...result.data,
    });
    await invalidateShopCache(shopDomain);
    res.status(201).json(timer);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const existing = await Timer.findOne({ _id: req.params.id, shopDomain }).lean();
    if (!existing) return res.status(404).json({ error: "Timer not found" });
    const result = validateTimerPayload(req.body, { isUpdate: true, existing });
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    const timer = await Timer.findOneAndUpdate(
      { _id: req.params.id, shopDomain },
      { $set: result.data },
      { new: true }
    );
    await invalidateShopCache(shopDomain);
    res.json(timer);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const result = await Timer.findOneAndDelete({ _id: req.params.id, shopDomain });
    if (!result) return res.status(404).json({ error: "Timer not found" });
    await invalidateShopCache(shopDomain);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
