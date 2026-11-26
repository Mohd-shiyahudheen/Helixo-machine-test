import {
  getEvergreenStart,
  setEvergreenStart,
  getEvergreenEndTime,
  ensureEvergreenEndTime,
} from "../src/evergreen.js";

describe("evergreen", () => {
  const key = (id) => "helixo_timer_" + id + "_start";

  beforeEach(() => {
    localStorage.clear();
  });

  describe("getEvergreenStart", () => {
    it("returns null when no start stored", () => {
      expect(getEvergreenStart("t1")).toBeNull();
    });

    it("returns stored timestamp when present", () => {
      const now = Date.now();
      localStorage.setItem(key("t1"), String(now));
      expect(getEvergreenStart("t1")).toBe(now);
    });

    it("returns null for null timerId", () => {
      expect(getEvergreenStart(null)).toBeNull();
    });
  });

  describe("setEvergreenStart", () => {
    it("stores current time for timer", () => {
      const before = Date.now();
      setEvergreenStart("t1");
      const stored = localStorage.getItem(key("t1"));
      const after = Date.now();
      expect(Number(stored)).toBeGreaterThanOrEqual(before);
      expect(Number(stored)).toBeLessThanOrEqual(after);
    });
  });

  describe("getEvergreenEndTime", () => {
    it("returns null when no start set", () => {
      expect(getEvergreenEndTime("t1", 24)).toBeNull();
    });

    it("returns start + durationHours in ms when start set", () => {
      const start = 1000000;
      localStorage.setItem(key("t1"), String(start));
      const end = getEvergreenEndTime("t1", 24);
      expect(end).toBe(start + 24 * 60 * 60 * 1000);
    });
  });

  describe("ensureEvergreenEndTime", () => {
    it("resets expired evergreen timer to a fresh future end time", () => {
      const expiredStart = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem(key("t1"), String(expiredStart));
      const nextEnd = ensureEvergreenEndTime("t1", 24);
      expect(nextEnd).toBeGreaterThan(Date.now());
      expect(getEvergreenStart("t1")).toBeGreaterThan(expiredStart);
    });
  });
});
