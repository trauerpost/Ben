import type { CanvasDimensions } from "./canvas-dimensions";
import type { CardType, CardFormat, WizardState } from "./wizard-state";
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
  src?: string;
  data?: {
    field?: string;
    templateElementId?: string;
    elementType?: string;
    isImagePlaceholder?: boolean;
    fixedAsset?: string;
  };
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
  const freeFormElements: FreeFormElement[] = [];

  for (const obj of objects) {
    const field = obj.data?.field;

    if (field && isTextContentField(field)) {
      // Bound text field → map to WizardState.textContent
      if (obj.text !== undefined) {
        (textContent as Record<string, unknown>)[field] = obj.text;
      }
      // Also capture font overrides for size fields
      mapFontSize(textContent, field, obj.fontSize);
      // Capture global formatting from any bound field
      if (obj.fontFamily) textContent.fontFamily = obj.fontFamily;
      if (obj.fill && typeof obj.fill === "string") textContent.fontColor = obj.fill;
      if (obj.textAlign) textContent.textAlign = obj.textAlign as "left" | "center" | "right";
    } else if (obj.data?.elementType === "image" && !obj.data?.isImagePlaceholder) {
      // Bound image → photo URL
      if (obj.src) {
        photoUrl = obj.src;
      }
    } else if (!obj.data?.field && !obj.data?.templateElementId) {
      // Free-form element (user-added)
      collectFreeForm(obj, freeFormElements);
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
    photo: {
      ...initialWizardState.photo,
      url: photoUrl,
      originalUrl: photoUrl,
    },
    background: {
      type: bgImageUrl ? "image" : "color",
      color: bgColor,
      imageUrl: bgImageUrl,
    },
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
