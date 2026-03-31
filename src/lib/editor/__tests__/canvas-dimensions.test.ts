import { describe, it, expect } from "vitest";
import { getCanvasDimensions } from "../canvas-dimensions";

describe("getCanvasDimensions", () => {
  // ── Positive tests ──

  it("Sterbebild single at 150 DPI → 827×620", () => {
    const dims = getCanvasDimensions("sterbebild", "single");
    expect(dims.width).toBe(827);
    expect(dims.height).toBe(620);
    expect(dims.dpi).toBe(150);
  });

  it("Trauerkarte single at 150 DPI → 1093×679", () => {
    const dims = getCanvasDimensions("trauerkarte", "single");
    // 185 * 150 / 25.4 = 1092.52 → rounds to 1093
    expect(dims.width).toBe(1093);
    expect(dims.height).toBe(679);
    expect(dims.dpi).toBe(150);
  });

  it("Trauerkarte folded at 150 DPI → 2185×679", () => {
    const dims = getCanvasDimensions("trauerkarte", "folded");
    expect(dims.width).toBe(2185);
    expect(dims.height).toBe(679);
    expect(dims.dpi).toBe(150);
  });

  it("Dankkarte single at 150 DPI → 1093×679", () => {
    const dims = getCanvasDimensions("dankkarte", "single");
    // 185 * 150 / 25.4 = 1092.52 → rounds to 1093
    expect(dims.width).toBe(1093);
    expect(dims.height).toBe(679);
  });

  it("Dankkarte folded at 150 DPI → 2185×679", () => {
    const dims = getCanvasDimensions("dankkarte", "folded");
    expect(dims.width).toBe(2185);
    expect(dims.height).toBe(679);
  });

  it("custom DPI (300) doubles pixel values", () => {
    const dims150 = getCanvasDimensions("sterbebild", "single", 150);
    const dims300 = getCanvasDimensions("sterbebild", "single", 300);
    // 300 DPI should be approximately 2x of 150 DPI (rounding may differ by ±1)
    expect(Math.abs(dims300.width - dims150.width * 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(dims300.height - dims150.height * 2)).toBeLessThanOrEqual(1);
    expect(dims300.dpi).toBe(300);
  });

  it("default DPI is 150", () => {
    const dims = getCanvasDimensions("sterbebild", "single");
    expect(dims.dpi).toBe(150);
  });

  // ── Negative tests ──

  it("NEG: invalid cardType throws descriptive error", () => {
    expect(() =>
      getCanvasDimensions("invalid" as never, "single")
    ).toThrow(/unknown card type/i);
  });

  it("NEG: folded format on Sterbebild throws (single-only)", () => {
    expect(() =>
      getCanvasDimensions("sterbebild", "folded")
    ).toThrow(/does not support format.*folded/i);
  });

  it("NEG: invalid format on valid card type throws", () => {
    expect(() =>
      getCanvasDimensions("trauerkarte", "invalid" as never)
    ).toThrow(/does not support format/i);
  });
});
