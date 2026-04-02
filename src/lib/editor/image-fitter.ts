/**
 * Image Fitter — adapts uploaded photos to template slot dimensions.
 *
 * Given a slot's aspect ratio (from template config grid coordinates)
 * and the original image dimensions, calculates the optimal
 * background-position and background-size CSS to fill the slot
 * while keeping the face/center visible.
 */

export interface SlotDimensions {
  /** Slot width in grid units (0-1000) */
  gridW: number;
  /** Slot height in grid units (0-1000) */
  gridH: number;
  /** Card spread width in mm */
  spreadWidthMm: number;
  /** Card spread height in mm */
  spreadHeightMm: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface FitResult {
  /** CSS background-size value */
  backgroundSize: string;
  /** CSS background-position value */
  backgroundPosition: string;
  /** Whether the image was cropped */
  cropped: boolean;
  /** How much was cropped (0 = no crop, 1 = max crop) */
  cropRatio: number;
}

/**
 * Calculate the slot's physical aspect ratio in mm.
 */
export function getSlotAspectRatio(slot: SlotDimensions): number {
  const slotWidthMm = (slot.gridW / 1000) * slot.spreadWidthMm;
  const slotHeightMm = (slot.gridH / 1000) * slot.spreadHeightMm;
  return slotWidthMm / slotHeightMm;
}

/**
 * Calculate optimal CSS for fitting an image into a slot.
 *
 * Strategy:
 * - If image aspect ratio matches slot → simple cover, no crop
 * - If image is wider than slot → crop sides, keep vertical center
 * - If image is taller than slot → crop top/bottom, keep upper third (face area)
 *
 * The "face bias" keeps the top 1/3 of the image visible when cropping vertically,
 * since faces are usually in the upper portion of portraits.
 */
export function fitImageToSlot(
  image: ImageDimensions,
  slot: SlotDimensions,
  userCrop?: { x: number; y: number; width: number; height: number } | null,
): FitResult {
  // If user has set a custom crop, use it
  if (userCrop && userCrop.width > 0 && userCrop.height > 0) {
    const sizeX = (1 / userCrop.width * 100).toFixed(1);
    const sizeY = (1 / userCrop.height * 100).toFixed(1);
    // Use percentage-based positioning
    const posX = userCrop.width < 1
      ? (userCrop.x / (1 - userCrop.width) * 100).toFixed(1)
      : "0";
    const posY = userCrop.height < 1
      ? (userCrop.y / (1 - userCrop.height) * 100).toFixed(1)
      : "0";
    return {
      backgroundSize: `${sizeX}% ${sizeY}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      cropped: true,
      cropRatio: 1 - (userCrop.width * userCrop.height),
    };
  }

  const slotRatio = getSlotAspectRatio(slot);
  const imageRatio = image.width / image.height;

  // Perfect match (within 5% tolerance)
  if (Math.abs(slotRatio - imageRatio) / slotRatio < 0.05) {
    return {
      backgroundSize: "cover",
      backgroundPosition: "center center",
      cropped: false,
      cropRatio: 0,
    };
  }

  // Image is WIDER than slot → crop sides, keep center
  if (imageRatio > slotRatio) {
    const cropRatio = 1 - (slotRatio / imageRatio);
    return {
      backgroundSize: "cover",
      backgroundPosition: "center center",
      cropped: true,
      cropRatio,
    };
  }

  // Image is TALLER than slot → crop top/bottom, bias towards face (upper 1/3)
  const cropRatio = 1 - (imageRatio / slotRatio);
  return {
    backgroundSize: "cover",
    backgroundPosition: "center 25%", // Face bias — keep upper quarter visible
    cropped: true,
    cropRatio,
  };
}

/**
 * Calculate pixel offsets for Fabric.js cover-crop with face bias.
 *
 * Face bias: when image is taller than slot proportionally,
 * keep upper 25% visible (faces are usually in upper portion).
 */
export function getFabricCropOffset(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
): { offsetX: number; offsetY: number } {
  const coverScale = Math.max(targetW / imgW, targetH / imgH);
  const overflowX = imgW * coverScale - targetW;
  const overflowY = imgH * coverScale - targetH;

  // Face bias: if image is taller than slot proportionally, keep upper 25%
  const imageRatio = imgW / imgH;
  const slotRatio = targetW / targetH;
  const faceBias = imageRatio < slotRatio;

  return {
    offsetX: overflowX / 2,
    offsetY: faceBias ? overflowY * 0.25 : overflowY / 2,
  };
}

/**
 * Get recommended image dimensions for a template slot.
 * Returns the minimum pixel dimensions for print quality (300 DPI).
 */
export function getRecommendedImageSize(slot: SlotDimensions): { minWidth: number; minHeight: number } {
  const slotWidthMm = (slot.gridW / 1000) * slot.spreadWidthMm;
  const slotHeightMm = (slot.gridH / 1000) * slot.spreadHeightMm;
  // 300 DPI = 11.81 pixels per mm
  const pxPerMm = 11.81;
  return {
    minWidth: Math.ceil(slotWidthMm * pxPerMm),
    minHeight: Math.ceil(slotHeightMm * pxPerMm),
  };
}

/**
 * Check if an image is suitable for a slot (resolution check).
 */
export function isImageSuitable(
  image: ImageDimensions,
  slot: SlotDimensions,
): { suitable: boolean; message: string } {
  const recommended = getRecommendedImageSize(slot);

  if (image.width >= recommended.minWidth && image.height >= recommended.minHeight) {
    return { suitable: true, message: "Image resolution is sufficient for print quality." };
  }

  if (image.width >= recommended.minWidth * 0.5 && image.height >= recommended.minHeight * 0.5) {
    return { suitable: true, message: "Image resolution is acceptable but may appear slightly soft in print." };
  }

  return {
    suitable: false,
    message: `Image too small. Minimum recommended: ${recommended.minWidth}×${recommended.minHeight}px. Your image: ${image.width}×${image.height}px.`,
  };
}
