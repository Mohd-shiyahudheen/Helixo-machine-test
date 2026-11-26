import { validateTimerPayload, sanitizeHexColor } from "../src/utils/timerValidation.js";

describe("timerValidation", () => {
  it("rejects missing timer name on create", () => {
    const res = validateTimerPayload({ timerType: "fixed", endDate: "2027-01-01T00:00:00Z" });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/name/i);
  });

  it("strips XSS HTML from name, description, and labelText", () => {
    const res = validateTimerPayload({
      name: "<script>alert(1)</script>Flash Sale",
      description: "<img src=x onerror=alert(1)>Limited time",
      labelText: "<b>HURRY UP</b>",
      timerType: "evergreen",
      durationHours: 12,
      targetType: "all",
    });
    expect(res.valid).toBe(true);
    expect(res.data.name).toBe("Flash Sale");
    expect(res.data.description).toBe("Limited time");
    expect(res.data.labelText).toBe("HURRY UP");
    expect(res.data.targetIds).toEqual([]);
  });

  it("rejects fixed timer where endDate is before startDate", () => {
    const res = validateTimerPayload({
      name: "Bad Dates",
      timerType: "fixed",
      startDate: "2027-05-10T10:00:00Z",
      endDate: "2027-05-09T10:00:00Z",
      targetType: "all",
    });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/after start date/i);
  });

  it("rejects invalid durationHours for evergreen timer", () => {
    const res = validateTimerPayload({
      name: "Bad Evergreen",
      timerType: "evergreen",
      durationHours: -5,
      targetType: "all",
    });
    expect(res.valid).toBe(false);
  });

  it("normalizes design size, position, urgencyNotification, and hex colors", () => {
    const res = validateTimerPayload({
      name: "Styled Timer",
      timerType: "evergreen",
      durationHours: 24,
      targetType: "collection",
      targetIds: ["gid://shopify/Collection/123", "<b>456</b>"],
      design: {
        color: "#ff0000",
        background: "not-a-color",
        position: "bottom",
        size: "large",
        urgencyNotification: "shake",
      },
    });
    expect(res.valid).toBe(true);
    expect(res.data.design).toEqual({
      color: "#ff0000",
      background: "#000000",
      position: "bottom",
      size: "large",
      urgencyNotification: "shake",
    });
    expect(res.data.targetIds).toEqual(["gid://shopify/Collection/123", "456"]);
  });

  it("sanitizeHexColor validates 3 and 6 digit hex colors", () => {
    expect(sanitizeHexColor("#abc", "#000000")).toBe("#abc");
    expect(sanitizeHexColor("#123456", "#000000")).toBe("#123456");
    expect(sanitizeHexColor("red", "#000000")).toBe("#000000");
  });

  it("preserves existing design fields on partial update", () => {
    const existing = {
      timerType: "fixed",
      startDate: new Date("2027-01-01T00:00:00Z"),
      endDate: new Date("2027-01-10T00:00:00Z"),
      targetType: "all",
      design: {
        color: "#112233",
        background: "#445566",
        position: "bottom",
        size: "small",
        urgencyNotification: "shake",
      },
    };
    const res = validateTimerPayload(
      { design: { size: "large" } },
      { isUpdate: true, existing }
    );
    expect(res.valid).toBe(true);
    expect(res.data.design).toEqual({
      color: "#112233",
      background: "#445566",
      position: "bottom",
      size: "large",
      urgencyNotification: "shake",
    });
  });

  it("rejects product/collection targeting without targetIds", () => {
    const res = validateTimerPayload({
      name: "Missing Targets",
      timerType: "evergreen",
      durationHours: 12,
      targetType: "product",
      targetIds: [],
    });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/product ID is required/i);
  });
});
