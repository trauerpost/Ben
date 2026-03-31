import type { CardType, CardFormat } from "./wizard-state";
import { CARD_CONFIGS } from "./wizard-state";

export interface CanvasDimensions {
  width: number;
  height: number;
  dpi: number;
}

const DEFAULT_DPI = 150;

/**
 * Convert card physical dimensions (mm) to pixel dimensions at a given DPI.
 * Formula: Math.round(mm * dpi / 25.4)
 */
export function getCanvasDimensions(
  cardType: CardType,
  cardFormat: CardFormat,
  dpi: number = DEFAULT_DPI
): CanvasDimensions {
  const config = CARD_CONFIGS[cardType];
  if (!config) {
    throw new Error(`Unknown card type: "${cardType}"`);
  }

  if (!config.availableFormats.includes(cardFormat)) {
    throw new Error(
      `Card type "${cardType}" does not support format "${cardFormat}". Available: ${config.availableFormats.join(", ")}`
    );
  }

  const dims = config.formats[cardFormat];
  if (!dims) {
    throw new Error(`No dimensions found for "${cardType}" / "${cardFormat}"`);
  }

  return {
    width: Math.round(dims.widthMm * dpi / 25.4),
    height: Math.round(dims.heightMm * dpi / 25.4),
    dpi,
  };
}
