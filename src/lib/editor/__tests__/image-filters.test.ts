import { describe, it, expect } from "vitest";
import {
  FILTER_PRESETS,
  DEFAULT_ADJUSTMENTS,
  adjustmentsToCSSFilter,
  type ManualAdjustments,
} from "../image-filters";

describe("FILTER_PRESETS", () => {
  it("has unique IDs", () => {
    const ids = FILTER_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all presets have non-empty filter values", () => {
    for (const preset of FILTER_PRESETS) {
      expect(preset.filter.length).toBeGreaterThan(0);
    }
  });

  it('"original" preset has filter = "none"', () => {
    const original = FILTER_PRESETS.find((p) => p.id === "original");
    expect(original).toBeDefined();
    expect(original!.filter).toBe("none");
  });

  it("contains at least 10 presets", () => {
    expect(FILTER_PRESETS.length).toBeGreaterThanOrEqual(10);
  });
});

describe("adjustmentsToCSSFilter", () => {
  it("with defaults produces brightness(1) contrast(1) saturate(1)", () => {
    const result = adjustmentsToCSSFilter(DEFAULT_ADJUSTMENTS);
    expect(result).toBe("brightness(1) contrast(1) saturate(1)");
  });

  it("with modified values includes all 3 properties", () => {
    const adj: ManualAdjustments = {
      brightness: 1.3,
      contrast: 0.8,
      saturation: 1.5,
      sharpness: 50,
    };
    const result = adjustmentsToCSSFilter(adj);
    expect(result).toContain("brightness(1.3)");
    expect(result).toContain("contrast(0.8)");
    expect(result).toContain("saturate(1.5)");
  });

  it("does NOT include sharpness (CSS cannot sharpen)", () => {
    const adj: ManualAdjustments = {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      sharpness: 75,
    };
    const result = adjustmentsToCSSFilter(adj);
    expect(result).not.toContain("sharp");
    expect(result).not.toContain("75");
  });

  it("handles extreme values without crashing (negative test)", () => {
    const adj: ManualAdjustments = {
      brightness: -1,
      contrast: -1,
      saturation: -1,
      sharpness: -1,
    };
    const result = adjustmentsToCSSFilter(adj);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("DEFAULT_ADJUSTMENTS", () => {
  it("has all 4 fields", () => {
    expect(DEFAULT_ADJUSTMENTS).toHaveProperty("brightness", 1);
    expect(DEFAULT_ADJUSTMENTS).toHaveProperty("contrast", 1);
    expect(DEFAULT_ADJUSTMENTS).toHaveProperty("saturation", 1);
    expect(DEFAULT_ADJUSTMENTS).toHaveProperty("sharpness", 0);
  });
});
