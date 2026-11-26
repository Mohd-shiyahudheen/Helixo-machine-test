import { getRemainingFixed, getRemainingEvergreen, pad, isUrgent } from "../src/countdownUtils.js";

describe("countdown", () => {
  describe("getRemainingFixed", () => {
    it("returns zero and expired when end date is in the past", () => {
      const past = new Date(Date.now() - 10000).toISOString();
      const r = getRemainingFixed(past);
      expect(r.expired).toBe(true);
      expect(r.totalMs).toBe(0);
      expect(r.days).toBe(0);
      expect(r.hours).toBe(0);
      expect(r.minutes).toBe(0);
      expect(r.seconds).toBe(0);
    });

    it("returns positive remaining when end date is in the future", () => {
      const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString();
      const r = getRemainingFixed(future);
      expect(r.expired).toBe(false);
      expect(r.days).toBe(2);
      expect(r.totalMs).toBeGreaterThan(0);
    });
  });

  describe("getRemainingEvergreen", () => {
    it("returns expired when end time is in the past", () => {
      const pastEnd = Date.now() - 5000;
      const r = getRemainingEvergreen(pastEnd);
      expect(r.expired).toBe(true);
      expect(r.totalMs).toBe(0);
    });

    it("returns remaining when end time is in the future", () => {
      const futureEnd = Date.now() + 60 * 60 * 1000;
      const r = getRemainingEvergreen(futureEnd);
      expect(r.expired).toBe(false);
      expect(r.hours).toBe(1);
      expect(r.totalMs).toBeGreaterThan(0);
    });
  });

  describe("pad", () => {
    it("pads single digit with zero", () => {
      expect(pad(5)).toBe("05");
      expect(pad(0)).toBe("00");
    });
    it("does not pad double digit", () => {
      expect(pad(10)).toBe("10");
      expect(pad(59)).toBe("59");
    });
  });

  describe("isUrgent", () => {
    it("returns true when remaining time is within urgency threshold", () => {
      expect(isUrgent(5 * 60 * 1000)).toBe(true);
      expect(isUrgent(15 * 60 * 1000)).toBe(true);
    });
    it("returns false when expired or above threshold", () => {
      expect(isUrgent(0)).toBe(false);
      expect(isUrgent(-100)).toBe(false);
      expect(isUrgent(30 * 60 * 1000)).toBe(false);
    });
  });
});
