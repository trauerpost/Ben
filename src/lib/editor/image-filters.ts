export interface FilterPreset {
  id: string;
  filter: string;  // CSS filter value
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", filter: "none" },
  { id: "bright", filter: "brightness(1.15) contrast(1.05)" },
  { id: "warm", filter: "brightness(1.05) saturate(1.2) hue-rotate(-10deg) sepia(0.1)" },
  { id: "cool", filter: "brightness(1.05) saturate(0.9) hue-rotate(10deg)" },
  { id: "bw", filter: "grayscale(1) brightness(1.1) contrast(1.2)" },
  { id: "sepia", filter: "sepia(0.6) brightness(1.05) contrast(1.1)" },
  { id: "vivid", filter: "saturate(1.4) contrast(1.1) brightness(1.05)" },
  { id: "soft", filter: "brightness(1.1) contrast(0.95) saturate(0.85)" },
  { id: "classic", filter: "contrast(1.15) brightness(1.05) saturate(0.9)" },
  { id: "portrait", filter: "brightness(1.08) contrast(1.05) saturate(1.1)" },
];

export interface ManualAdjustments {
  brightness: number;  // 0.5 - 1.5, default 1
  contrast: number;    // 0.5 - 1.5, default 1
  saturation: number;  // 0 - 2, default 1
  sharpness: number;   // 0 - 100, default 0 (handled by Canvas, NOT CSS)
}

/** Converts adjustments to CSS filter string. NOTE: sharpness is excluded
 *  because CSS `filter` doesn't support sharpening — handled separately
 *  by Canvas convolution in image-sharpen.ts */
export function adjustmentsToCSSFilter(adj: ManualAdjustments): string {
  return `brightness(${adj.brightness}) contrast(${adj.contrast}) saturate(${adj.saturation})`;
}

export const DEFAULT_ADJUSTMENTS: ManualAdjustments = {
  brightness: 1, contrast: 1, saturation: 1, sharpness: 0,
};
