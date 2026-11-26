export function shopDomainValidator(req, res, next) {
  const shopDomain = req.query.shopDomain || req.body?.shopDomain || req.get("X-Shop-Domain");
  if (!shopDomain || typeof shopDomain !== "string") {
    return res.status(400).json({ error: "shopDomain is required" });
  }
  const normalized = shopDomain.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  if (!normalized.endsWith(".myshopify.com")) {
    return res.status(400).json({ error: "Invalid shop domain" });
  }
  req.shopDomain = normalized;
  next();
}
