import { cacheKey } from "../src/services/cacheService.js";

describe("cacheService", () => {
  describe("cacheKey", () => {
    it("builds key with shop domain and product id", () => {
      expect(cacheKey("store1.myshopify.com", "123")).toBe("timer:store1:123");
    });
    it("strips .myshopify.com from domain", () => {
      expect(cacheKey("mystore.myshopify.com", "gid://shopify/Product/456")).toBe(
        "timer:mystore:gid://shopify/Product/456"
      );
    });
  });
});
