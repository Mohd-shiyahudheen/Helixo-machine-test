import { Router } from "express";
import { Shop } from "../models/Shop.js";

const router = Router();

router.get("/:shopDomain", async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ shopDomain: req.params.shopDomain });
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json({ shopDomain: shop.shopDomain, installedAt: shop.installedAt });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { shopDomain, accessToken } = req.body;
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: "shopDomain and accessToken required" });
    }
    const shop = await Shop.findOneAndUpdate(
      { shopDomain },
      { shopDomain, accessToken, installedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json({ shopDomain: shop.shopDomain });
  } catch (e) {
    next(e);
  }
});

export default router;
