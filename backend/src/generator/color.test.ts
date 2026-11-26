import { describe, expect, it } from "vitest";
import { mixOklch, withAlpha } from "./color.ts";

/** Channels of two hex colors differ by at most `tolerance` (out of 255). */
const close = (a: string, b: string, tolerance = 1) =>
  [1, 3, 5].every(
    (i) =>
      Math.abs(
        parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16),
      ) <= tolerance,
  );

describe("withAlpha", () => {
  it("keeps the color and sets the alpha byte", () => {
    expect(withAlpha("#64748B", 30)).toBe("#64748B4D");
    expect(withAlpha("#2563eb", 80)).toBe("#2563EBCC");
    expect(withAlpha("#000000", 0)).toBe("#00000000");
  });

  it("rejects anything that isn't a 6- or 8-digit hex", () => {
    expect(() => withAlpha("red", 50)).toThrow(/6- or 8-digit hex/);
    expect(() => withAlpha("#fff", 50)).toThrow(/6- or 8-digit hex/);
  });
});

describe("mixOklch", () => {
  it("matches what Chrome computes for color-mix(in oklch, a, b 5%)", () => {
    // Chrome's results for shadcn's secondary hover, converted to hex.
    expect(close(mixOklch("#F1F5F9", "#0F172A", 5), "#E5E8EE")).toBe(true);
    expect(close(mixOklch("#334155", "#F8FAFC", 5), "#3C495D")).toBe(true);
  });

  it("returns the first color at 0% and the second at 100%", () => {
    expect(close(mixOklch("#2563EB", "#991B1B", 0), "#2563EB")).toBe(true);
    expect(close(mixOklch("#2563EB", "#991B1B", 100), "#991B1B")).toBe(true);
  });
});
