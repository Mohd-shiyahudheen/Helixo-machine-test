import { Router } from "express";
import { Timer } from "../models/Timer.js";
import { getCachedTimer, setCachedTimer } from "../services/cacheService.js";
import {
  normalizeProductIds,
  normalizeCollectionIds,
  isTimerCurrentlyActive,
  selectBestMatchingTimer,
} from "../utils/timerMatcher.js";

const router = Router();
const CACHE_CONTROL_HEADER = "public, max-age=30, stale-while-revalidate=60";

router.get("/", async (req, res, next) => {
  try {
    const shopDomain = req.shopDomain;
    const productId = req.query.productId;
    if (!productId) {
      return res.status(400).json({ error: "productId query is required" });
    }

    const productCandidates = normalizeProductIds(productId);
    const collectionCandidates = normalizeCollectionIds(req.query.collectionIds);

    res.set("Cache-Control", CACHE_CONTROL_HEADER);

    const cached = await getCachedTimer(shopDomain, productId, collectionCandidates);
    if (cached) {
      if (!cached.timer || isTimerCurrentlyActive({ ...cached.timer, status: "active" }, new Date())) {
        return res.json(cached);
      }
    }

    const orClauses = [
      { targetType: "all" },
      { targetType: "product", targetIds: { $in: productCandidates } },
    ];
    if (collectionCandidates.length > 0) {
      orClauses.push({ targetType: "collection", targetIds: { $in: collectionCandidates } });
    }

    const candidates = await Timer.find({
      shopDomain,
      status: "active",
      $or: orClauses,
    }).lean();

    const timer = selectBestMatchingTimer(
      candidates,
      productCandidates,
      collectionCandidates,
      new Date()
    );

    if (!timer) {
      const empty = { timer: null };
      await setCachedTimer(shopDomain, productId, empty, collectionCandidates);
      return res.json(empty);
    }

    const payload = {
      timer: {
        id: timer._id.toString(),
        name: timer.name,
        description: timer.description || "",
        labelText: timer.labelText || "YOUR SPECIAL OFFER ENDS IN",
        timerType: timer.timerType,
        startDate: timer.startDate,
        endDate: timer.endDate,
        durationHours: timer.durationHours,
        targetType: timer.targetType,
        design: timer.design || {},
      },
    };
    await setCachedTimer(shopDomain, productId, payload, collectionCandidates);
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

export default router;
