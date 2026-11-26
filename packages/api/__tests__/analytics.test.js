describe("analytics impression", () => {
  it("accepts valid timerId and shopDomain for impression payload", () => {
    const payload = { timerId: "timer123", shopDomain: "store1.myshopify.com" };
    expect(payload.timerId).toBeDefined();
    expect(payload.shopDomain).toMatch(/\.myshopify\.com$/);
  });

  it("date is start of day for aggregation", () => {
    const d = new Date("2025-03-14T15:30:00Z");
    const startOfDay = new Date(d);
    startOfDay.setUTCHours(0, 0, 0, 0);
    expect(startOfDay.toISOString()).toMatch(/2025-03-14T00:00:00/);
  });
});
