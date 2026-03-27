import { describe, it, expect } from "vitest";

/**
 * Tests the crop math used in card-to-html-v2.ts and SpreadPreview.tsx.
 *
 * The crop-to-CSS formula:
 *   sizeX = 1 / width * 100
 *   sizeY = 1 / height * 100
 *   posX  = x / (1 - width) * 100
 *   posY  = y / (1 - height) * 100
 *
 * Guard: width > 0 && width < 1 && height > 0 && height < 1
 * If guard fails → fallback to cover positioning.
 */

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropCSS {
  backgroundSize: string;
  backgroundPosition: string;
}

const COVER_FALLBACK: CropCSS = {
  backgroundSize: "cover",
  backgroundPosition: "center top",
};

/**
 * Replicates the exact crop math from card-to-html-v2.ts and SpreadPreview.tsx.
 * Returns computed CSS values or the cover fallback.
 */
function computeCropCSS(crop: CropData | null | undefined): CropCSS {
  if (
    crop &&
    crop.width > 0 &&
    crop.width < 1 &&
    crop.height > 0 &&
    crop.height < 1
  ) {
    const sizeX = (1 / crop.width) * 100;
    const sizeY = (1 / crop.height) * 100;
    const posX = (crop.x / (1 - crop.width)) * 100;
    const posY = (crop.y / (1 - crop.height)) * 100;
    return {
      backgroundSize: `${sizeX.toFixed(1)}% ${sizeY.toFixed(1)}%`,
      backgroundPosition: `${posX.toFixed(1)}% ${posY.toFixed(1)}%`,
    };
  }
  return { ...COVER_FALLBACK };
}

describe("crop math (division-by-zero guard)", () => {
  it("normal crop values produce valid CSS", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 0.8, height: 0.6 });
    // sizeX = 1/0.8*100 = 125.0, sizeY = 1/0.6*100 = 166.7
    // posX = 0.1/(1-0.8)*100 = 50.0, posY = 0.2/(1-0.6)*100 = 50.0
    expect(result.backgroundSize).toBe("125.0% 166.7%");
    expect(result.backgroundPosition).toBe("50.0% 50.0%");
  });

  it("width=0 falls back to cover (would cause division by zero)", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 0, height: 0.6 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("width=1 falls back to cover (would cause division by zero in position calc)", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 1, height: 0.6 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("height=0 falls back to cover (would cause division by zero)", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 0.8, height: 0 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("height=1 falls back to cover (would cause division by zero in position calc)", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 0.8, height: 1 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("negative width falls back to cover", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: -0.5, height: 0.6 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("width > 1 falls back to cover", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 1.5, height: 0.6 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("negative height falls back to cover", () => {
    const result = computeCropCSS({ x: 0.1, y: 0.2, width: 0.8, height: -0.3 });
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("null crop falls back to cover", () => {
    const result = computeCropCSS(null);
    expect(result).toEqual(COVER_FALLBACK);
  });

  it("undefined crop falls back to cover", () => {
    const result = computeCropCSS(undefined);
    expect(result).toEqual(COVER_FALLBACK);
  });
});
