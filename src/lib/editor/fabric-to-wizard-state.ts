import type { CanvasDimensions } from "./canvas-dimensions";
import type { CardType, CardFormat, WizardState, ElementOverride } from "./wizard-state";
import { initialWizardState, DEFAULT_TEXT_CONTENT } from "./wizard-state";

interface FabricObjectJSON {
  type?: string;
  text?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  fill?: string;
  scaleX?: number;
  scaleY?: number;
  src?: string;
  data?: {
    field?: string;
    templateElementId?: string;
    elementType?: string;
    isImagePlaceholder?: boolean;
    fixedAsset?: string;
    slotWidth?: number;
    slotHeight?: number;
    slotLeft?: number;
    slotTop?: number;
  };
}

/**
 * A true placeholder is an image that was set by the template and never replaced by the user.
 * If isImagePlaceholder is true BUT the src is a blob:/data: URL or doesn't match
 * a known placeholder path, it's a user upload with a stale flag (old draft) → allow export.
 */
function isUnreplacedPlaceholder(obj: FabricObjectJSON): boolean {
  if (!obj.data?.isImagePlaceholder) return false;
  const src = obj.src ?? "";
  // User uploads have blob: or data: URLs — never placeholders
  if (src.startsWith("blob:") || src.startsWith("data:")) return false;
  // Known placeholder paths from template configs
  if (src.includes("/assets/photos/placeholder")) return true;
  // External URLs with isImagePlaceholder=true = stale flag from old draft → allow
  return false;
}

interface FabricCanvasJSON {
  version?: string;
  objects?: FabricObjectJSON[];
  background?: string;
  backgroundImage?: { src?: string };
}

/** Elements added by the user (not from template) that have no field binding */
export interface FreeFormElement {
  type: "text" | "image";
  left: number;
  top: number;
  width: number;
  height: number;
  text?: string;
  src?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  textAlign?: string;
}

/**
 * Convert Fabric.js canvas JSON back to a WizardState for the shared PDF pipeline.
 * Objects with `data.field` are mapped to WizardState.textContent fields.
 * Objects without `data.field` are collected as free-form elements.
 */
export function fabricToWizardState(
  canvasJSON: object,
  dims: CanvasDimensions,
  cardType: CardType,
  cardFormat: CardFormat,
  templateId: string
): WizardState {
  const json = canvasJSON as FabricCanvasJSON;
  const objects = json.objects ?? [];

  const textContent = { ...DEFAULT_TEXT_CONTENT };
  let photoUrl: string | null = null;
  let photoCrop: { x: number; y: number; width: number; height: number } | null = null;
  const freeFormElements: FreeFormElement[] = [];
  const elementOverrides: Record<string, ElementOverride> = {};
  let globalFontSet = false;

  // Debug: log image objects for tracing photo extraction on production
  const imageObjs = objects.filter(o => o.type === "image" || o.data?.elementType === "image");
  if (imageObjs.length > 0) {
    console.log("[fabricToWizardState] image objects:", imageObjs.map(o => ({
      type: o.type,
      elementType: o.data?.elementType,
      isPlaceholder: o.data?.isImagePlaceholder,
      field: o.data?.field,
      hasSrc: !!o.src,
      srcPrefix: o.src?.substring(0, 30),
    })));
  }

  for (const obj of objects) {
    const field = obj.data?.field;

    if (field && isTextContentField(field)) {
      // Bound text field → map to WizardState.textContent
      if (obj.text !== undefined) {
        (textContent as Record<string, unknown>)[field] = obj.text;
      }
      // Also capture font overrides for size fields
      mapFontSize(textContent, field, obj.fontSize);
      // Capture global formatting from the FIRST bound field only (avoid "last writer wins")
      if (!globalFontSet && obj.fontFamily) {
        textContent.fontFamily = obj.fontFamily;
        globalFontSet = true;
      }
      if (obj.fill && typeof obj.fill === "string") textContent.fontColor = obj.fill;
      if (obj.textAlign) textContent.textAlign = obj.textAlign as "left" | "center" | "right";

      // Build per-element overrides for font/color/align
      const elId = obj.data?.templateElementId ?? field;
      if (elId) {
        const override: Partial<ElementOverride> = {};
        if (obj.fontFamily) override.fontFamily = obj.fontFamily;
        if (obj.fill && typeof obj.fill === "string") override.fontColor = obj.fill;
        if (obj.textAlign) override.textAlign = obj.textAlign as "left" | "center" | "right";
        if (obj.fontSize !== undefined) override.fontSize = obj.fontSize;
        if (Object.keys(override).length > 0) {
          elementOverrides[elId] = { ...elementOverrides[elId], ...override };
        }
      }
    } else if (obj.data?.elementType === "image" && !isUnreplacedPlaceholder(obj)) {
      // Bound image → photo URL + crop
      if (obj.src) {
        photoUrl = obj.src;
        photoCrop = extractCropFromSlot(obj);
      }
    } else if (!obj.data?.field && !obj.data?.templateElementId) {
      // Free-form element (user-added)
      collectFreeForm(obj, freeFormElements);
    }
  }

  // Fallback: if no bound photo found, use the first free-form image
  // This handles photos added via the "Fotofeld" button (no data.elementType)
  if (!photoUrl) {
    const freeFormImg = freeFormElements.find(ff => ff.type === "image" && ff.src);
    if (freeFormImg) {
      photoUrl = freeFormImg.src!;
      // Remove from freeFormElements to avoid duplicate rendering
      const idx = freeFormElements.indexOf(freeFormImg);
      freeFormElements.splice(idx, 1);
    }
  }

  // Build background from canvas JSON
  const bgColor = typeof json.background === "string" ? json.background : "#FFFFFF";
  const bgImageUrl = json.backgroundImage?.src ?? null;

  return {
    ...initialWizardState,
    cardType,
    cardFormat,
    templateId,
    textContent,
    elementOverrides,
    photo: {
      ...initialWizardState.photo,
      url: photoUrl,
      originalUrl: photoUrl,
      crop: photoCrop,
    },
    background: {
      type: bgImageUrl ? "image" : "color",
      color: bgColor,
      imageUrl: bgImageUrl,
    },
    freeFormElements: freeFormElements.length > 0 ? freeFormElements : undefined,
  };
}

const TEXT_CONTENT_FIELDS = new Set([
  "heading", "name", "dates", "dividerSymbol", "quote",
  "fontFamily", "fontColor", "textAlign",
  "relationshipLabels", "birthDate", "deathDate",
  "locationBirth", "locationDeath", "quoteAuthor", "closingVerse",
]);

function isTextContentField(field: string): boolean {
  return TEXT_CONTENT_FIELDS.has(field);
}

const FONT_SIZE_MAP: Record<string, string> = {
  heading: "headingFontSize",
  name: "nameFontSize",
  dates: "datesFontSize",
  birthDate: "datesFontSize",
  deathDate: "datesFontSize",
  quote: "quoteFontSize",
  quoteAuthor: "quoteAuthorFontSize",
  closingVerse: "closingVerseFontSize",
  locationBirth: "locationFontSize",
  locationDeath: "locationFontSize",
};

function mapFontSize(
  textContent: Record<string, unknown>,
  field: string,
  fontSize: number | undefined
): void {
  if (fontSize === undefined) return;
  const sizeField = FONT_SIZE_MAP[field];
  if (sizeField) {
    textContent[sizeField] = fontSize;
  }
}

/**
 * Compute normalized 0-1 crop rectangle from position-based cover crop.
 * Returns null if no slot data or image fits exactly (no overflow).
 */
function extractCropFromSlot(
  obj: FabricObjectJSON
): { x: number; y: number; width: number; height: number } | null {
  const data = obj.data;
  if (!data?.slotWidth || !data?.slotHeight) return null;

  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const imgW = (obj.width ?? 1) * scaleX;
  const imgH = (obj.height ?? 1) * scaleY;
  const slotW = data.slotWidth;
  const slotH = data.slotHeight;
  const slotLeft = data.slotLeft ?? 0;
  const slotTop = data.slotTop ?? 0;
  const objLeft = obj.left ?? 0;
  const objTop = obj.top ?? 0;

  // Normalized visible region
  const x = (slotLeft - objLeft) / imgW;
  const y = (slotTop - objTop) / imgH;
  const w = slotW / imgW;
  const h = slotH / imgH;

  // If image fits exactly (no overflow), no crop needed
  if (Math.abs(w - 1) < 0.001 && Math.abs(h - 1) < 0.001 &&
      Math.abs(x) < 0.001 && Math.abs(y) < 0.001) {
    return null;
  }

  return { x, y, width: w, height: h };
}

function collectFreeForm(obj: FabricObjectJSON, list: FreeFormElement[]): void {
  if (obj.type === "textbox" || obj.type === "i-text") {
    list.push({
      type: "text",
      left: obj.left ?? 0,
      top: obj.top ?? 0,
      width: obj.width ?? 100,
      height: obj.height ?? 50,
      text: obj.text,
      fontSize: obj.fontSize,
      fontFamily: obj.fontFamily,
      fill: obj.fill,
      textAlign: obj.textAlign,
    });
  } else if (obj.type === "image" && obj.src) {
    list.push({
      type: "image",
      left: obj.left ?? 0,
      top: obj.top ?? 0,
      width: obj.width ?? 100,
      height: obj.height ?? 100,
      src: obj.src,
    });
  }
}
