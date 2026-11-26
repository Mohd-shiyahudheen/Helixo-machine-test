import { sanitize } from "../src/utils/sanitize.js";

describe("sanitize", () => {
  it("returns empty string for null or non-string", () => {
    expect(sanitize(null)).toBe("");
    expect(sanitize(undefined)).toBe("");
    expect(sanitize(123)).toBe("");
  });

  it("trims whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("strips HTML tags", () => {
    expect(sanitize("<script>alert(1)</script>")).toBe("");
    expect(sanitize("<b>bold</b>")).toBe("bold");
  });

  it("allows plain text", () => {
    expect(sanitize("Black Friday Sale")).toBe("Black Friday Sale");
  });
});
