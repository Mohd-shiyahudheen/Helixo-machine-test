import {
  normalizeProductIds,
  normalizeCollectionIds,
  isTimerCurrentlyActive,
  selectBestMatchingTimer,
} from "../src/utils/timerMatcher.js";

describe("timerMatcher", () => {
  const now = new Date("2026-11-26T12:00:00Z");

  it("normalizes numeric and GID product and collection IDs", () => {
    expect(normalizeProductIds("123")).toEqual(["123", "gid://shopify/Product/123"]);
    expect(normalizeProductIds("gid://shopify/Product/123")).toEqual([
      "gid://shopify/Product/123",
      "123",
    ]);
    expect(normalizeCollectionIds("10,gid://shopify/Collection/20")).toEqual([
      "10",
      "gid://shopify/Collection/10",
      "gid://shopify/Collection/20",
      "20",
    ]);
  });

  it("filters out scheduled and expired fixed timers", () => {
    const scheduled = {
      status: "active",
      timerType: "fixed",
      startDate: "2026-11-27T00:00:00Z",
      endDate: "2026-11-28T00:00:00Z",
    };
    const expired = {
      status: "active",
      timerType: "fixed",
      startDate: "2026-11-20T00:00:00Z",
      endDate: "2026-11-25T00:00:00Z",
    };
    const active = {
      status: "active",
      timerType: "fixed",
      startDate: "2026-11-25T00:00:00Z",
      endDate: "2026-11-27T00:00:00Z",
    };

    expect(isTimerCurrentlyActive(scheduled, now)).toBe(false);
    expect(isTimerCurrentlyActive(expired, now)).toBe(false);
    expect(isTimerCurrentlyActive(active, now)).toBe(true);
  });

  it("prioritizes product > collection > all", () => {
    const allTimer = { _id: "1", status: "active", timerType: "evergreen", targetType: "all", targetIds: [] };
    const colTimer = {
      _id: "2",
      status: "active",
      timerType: "evergreen",
      targetType: "collection",
      targetIds: ["gid://shopify/Collection/55"],
    };
    const prodTimer = {
      _id: "3",
      status: "active",
      timerType: "evergreen",
      targetType: "product",
      targetIds: ["gid://shopify/Product/99"],
    };

    const pIds = normalizeProductIds("99");
    const cIds = normalizeCollectionIds("55");

    expect(selectBestMatchingTimer([allTimer, colTimer, prodTimer], pIds, cIds, now)._id).toBe("3");
    expect(selectBestMatchingTimer([allTimer, colTimer], pIds, cIds, now)._id).toBe("2");
    expect(selectBestMatchingTimer([allTimer], pIds, [], now)._id).toBe("1");
  });
});
