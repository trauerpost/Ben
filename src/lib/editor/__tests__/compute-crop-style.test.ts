import { describe, it, expect } from "vitest";
import { computeCropStyle } from "../card-to-html-v2";

describe("computeCropStyle", () => {
  // ── Positive tests ──

  it("landscape photo in portrait slot: width<1, height=1.0 → crop applied", () => {
    // Cover crop: image wider than slot, full height visible, sides cropped
    const result = computeCropStyle({ x: 0.2333, y: 0, width: 0.5333, height: 1.0 });
    expect(result).not.toBeNull();
    // background-size: 1/0.5333 ≈ 187.5%, 1/1.0 = 100%
    expect(result).toContain("background-size:187.5% 100.0%");
    // background-position: x/(1-0.5333) ≈ 50%, y is 0% (height=1)
    expect(result).toContain("background-position:50.0% 0%");
  });

  it("portrait photo in landscape slot: width=1.0, height<1 → crop applied", () => {
    // Cover crop: image taller than slot, full width visible, top/bottom cropped
    const result = computeCropStyle({ x: 0, y: 0.15, width: 1.0, height: 0.7 });
    expect(result).not.toBeNull();
    // background-size: 100%, 1/0.7 ≈ 142.9%
    expect(result).toContain("background-size:100.0% 142.9%");
    // background-position: 0% (width=1), y/(1-0.7) = 0.15/0.3 = 50%
    expect(result).toContain("background-position:0% 50.0%");
  });

  it("both axes cropped → crop applied with correct offsets", () => {
    const result = computeCropStyle({ x: 0.1, y: 0.2, width: 0.6, height: 0.5 });
    expect(result).not.toBeNull();
    // background-size: 1/0.6 ≈ 166.7%, 1/0.5 = 200%
    expect(result).toContain("background-size:166.7% 200.0%");
    // background-position: 0.1/0.4 = 25%, 0.2/0.5 = 40%
    expect(result).toContain("background-position:25.0% 40.0%");
  });

  // ── Null cases (no crop needed) ──

  it("full image (w=1,h=1,x=0,y=0) → null", () => {
    expect(computeCropStyle({ x: 0, y: 0, width: 1, height: 1 })).toBeNull();
  });

  it("invalid: width=0 → null", () => {
    expect(computeCropStyle({ x: 0, y: 0, width: 0, height: 0.5 })).toBeNull();
  });

  it("invalid: height=0 → null", () => {
    expect(computeCropStyle({ x: 0, y: 0, width: 0.5, height: 0 })).toBeNull();
  });

  // ── NEG: old bug regression ──

  it("NEG regression: height=1.0 must NOT be rejected (was < 1 check)", () => {
    // This is the exact bug: cover crop with height=1.0 was silently dropped
    const result = computeCropStyle({ x: 0.25, y: 0, width: 0.5, height: 1.0 });
    expect(result).not.toBeNull();
    expect(result).toContain("background-size:");
    expect(result).toContain("background-position:");
  });
});
