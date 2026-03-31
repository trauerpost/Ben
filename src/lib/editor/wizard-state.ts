import { getTemplateConfig } from "./template-configs";

// Internal values match DB constraint: sterbebild, trauerkarte, dankkarte
export type CardType = "sterbebild" | "trauerkarte" | "dankkarte";
export type CardFormat = "single" | "folded";

export const FONT_SIZE_UNIT = "pt"; // pt for print (1pt = 0.353mm)

export interface CardDimensions {
  widthMm: number;
  heightMm: number;
  label: string;
  description: string;
}

export const CARD_CONFIGS: Record<
  CardType,
  {
    label: string;
    availableFormats: CardFormat[];
    formats: Partial<Record<CardFormat, CardDimensions>>;
  }
> = {
  sterbebild: {
    label: "Erinnerungsbild",
    availableFormats: ["single"],
    formats: {
      single: { widthMm: 140, heightMm: 105, label: "Erinnerungsbild", description: "140 × 105 mm" },
    },
  },
  trauerkarte: {
    label: "Trauerkarte",
    availableFormats: ["single", "folded"],
    formats: {
      single: { widthMm: 185, heightMm: 115, label: "Trauerkarte (einfach)", description: "185 × 115 mm" },
      folded: { widthMm: 370, heightMm: 115, label: "Trauerkarte (gefaltet)", description: "370 × 115 mm (gefaltet: 185 × 115 mm)" },
    },
  },
  dankkarte: {
    label: "Dankeskarte",
    availableFormats: ["single", "folded"],
    formats: {
      single: { widthMm: 185, heightMm: 115, label: "Dankeskarte (einfach)", description: "185 × 115 mm" },
      folded: { widthMm: 370, heightMm: 115, label: "Dankeskarte (gefaltet)", description: "370 × 115 mm (gefaltet: 185 × 115 mm)" },
    },
  },
};

// ── Text Content (structured fields) ──

export interface TextContent {
  // Existing fields (used by S1-S4, E1-E2, F1-F2)
  heading: string;
  headingFontSize: number;
  name: string;
  nameFontSize: number;
  dates: string;
  datesFontSize: number;
  dividerSymbol: string;
  quote: string;
  quoteFontSize: number;
  fontFamily: string;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  // NEW fields (for T1-T6 spread templates)
  relationshipLabels: string;
  birthDate: string;
  deathDate: string;
  locationBirth: string;
  locationDeath: string;
  quoteAuthor: string;
  closingVerse: string;
  locationFontSize: number;
  closingVerseFontSize: number;
  quoteAuthorFontSize: number;
}

export const DEFAULT_TEXT_CONTENT: TextContent = {
  heading: "",
  headingFontSize: 11,
  name: "",
  nameFontSize: 22,
  dates: "",
  datesFontSize: 13,
  dividerSymbol: "",
  quote: "",
  quoteFontSize: 12,
  fontFamily: "Playfair Display",
  fontColor: "#1A1A1A",
  textAlign: "center",
  // New field defaults
  relationshipLabels: "",
  birthDate: "",
  deathDate: "",
  locationBirth: "",
  locationDeath: "",
  quoteAuthor: "",
  closingVerse: "",
  locationFontSize: 10,
  closingVerseFontSize: 10,
  quoteAuthorFontSize: 9,
};

// ── Fonts & Colors ──

export const WIZARD_FONTS = [
  "Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Lora", "EB Garamond",
  "Inter", "Montserrat", "Raleway", "Open Sans",
  "Great Vibes", "Dancing Script", "Tangerine",
  "Fira Sans", "Source Serif Pro",
  // Added for template engine v2
  "Pinyon Script", "Alex Brush",
  "Cormorant SC", "EB Garamond SC",
  "Cormorant Infant", "Crimson Pro",
] as const;

export const FONT_COLORS = [
  { name: "Black", value: "#1A1A1A" },
  { name: "Dark Gray", value: "#4A4A4A" },
  { name: "Dark Blue", value: "#1B3A5C" },
  { name: "Dark Green", value: "#2D5A3D" },
  { name: "Dark Red", value: "#7A2C2C" },
  { name: "Gold", value: "#8B7D3C" },
] as const;

export const BACKGROUND_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Cream", value: "#FFF8F0" },
  { name: "Light Gray", value: "#F5F5F5" },
  { name: "Light Blue", value: "#F0F4F8" },
  { name: "Warm", value: "#FAF5EF" },
] as const;

export const DIVIDER_SYMBOLS = ["", "✦ ✦ ✦", "— — —", "❀ ❀ ❀", "✝", "☆ ☆ ☆"] as const;

// ── Element Overrides (per-element position/style overrides for interactive preview) ──

export interface ElementOverride {
  x?: number;          // 0-1000 grid position
  y?: number;
  w?: number;          // 0-1000 grid size (min 50)
  h?: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  textAlign?: "left" | "center" | "right";
  hidden?: boolean;    // Delete = hide (template is immutable)
}

function clampGrid(value: number): number {
  return Math.max(0, Math.min(1000, Math.round(value)));
}

function clampSize(value: number): number {
  return Math.max(50, Math.min(1000, Math.round(value)));
}

/**
 * Merge template element defaults + per-element overrides + global styles.
 * Cascade: override > template > global
 */
export function getMergedElement(
  el: { id: string; x: number; y: number; w: number; h: number; fontFamily?: string; fontSize?: number; color?: string; textAlign?: string },
  overrides: Record<string, ElementOverride>,
  globalStyles: { fontFamily: string; fontColor: string; textAlign: string }
): {
  x: number; y: number; w: number; h: number;
  fontFamily: string; fontSize: number; fontColor: string; textAlign: string;
  hidden: boolean;
} {
  const ov = overrides[el.id];
  return {
    x: clampGrid(ov?.x ?? el.x),
    y: clampGrid(ov?.y ?? el.y),
    w: clampSize(ov?.w ?? el.w),
    h: clampSize(ov?.h ?? el.h),
    fontFamily: ov?.fontFamily ?? el.fontFamily ?? globalStyles.fontFamily,
    fontSize: ov?.fontSize ?? el.fontSize ?? 12,
    fontColor: ov?.fontColor ?? el.color ?? globalStyles.fontColor,
    textAlign: ov?.textAlign ?? (el.textAlign as "left" | "center" | "right") ?? globalStyles.textAlign,
    hidden: ov?.hidden ?? false,
  };
}

// ── State ──

export const TOTAL_STEPS = 7;

export interface WizardState {
  currentStep: number;
  cardType: CardType | null;
  cardFormat: CardFormat | null;
  templateId: string | null;
  photo: {
    url: string | null;
    originalUrl: string | null;
    sharpenedUrl: string | null;
    crop: { x: number; y: number; width: number; height: number } | null;
    filter: string;
    filterId: string;
    adjustments: import("./image-filters").ManualAdjustments | null;
    backgroundRemoved: boolean;
    backgroundBlurred: boolean;
  };
  background: {
    type: "color" | "image";
    color: string;
    imageUrl: string | null;
  };
  textContent: TextContent;
  decoration: {
    assetUrl: string | null;
    assetId: string | null;
  };
  border: {
    url: string | null;
    id: string | null;
  };
  corners: {
    urls: string[];
    ids: string[];
  };
  elementOverrides: Record<string, ElementOverride>;
}

export type WizardAction =
  | { type: "SET_CARD_TYPE"; cardType: CardType }
  | { type: "SET_CARD_FORMAT"; cardFormat: CardFormat }
  | { type: "SET_TEMPLATE"; templateId: string }
  | { type: "SET_BACKGROUND"; background: WizardState["background"] }
  | { type: "SET_PHOTO"; url: string }
  | { type: "SET_PHOTO_CROP"; crop: WizardState["photo"]["crop"] }
  | { type: "SET_PHOTO_FILTER"; filter: string; filterId: string }
  | { type: "SET_PHOTO_ADJUSTMENTS"; adjustments: import("./image-filters").ManualAdjustments }
  | { type: "SET_PHOTO_PROCESSED"; url: string; backgroundRemoved: boolean; backgroundBlurred: boolean }
  | { type: "SET_PHOTO_SHARPENED"; sharpenedUrl: string | null }
  | { type: "RESTORE_ORIGINAL_PHOTO" }
  | { type: "REMOVE_PHOTO" }
  | { type: "SET_TEXT_STRING"; field: "heading" | "name" | "dates" | "dividerSymbol" | "quote" | "fontFamily" | "fontColor" | "relationshipLabels" | "birthDate" | "deathDate" | "locationBirth" | "locationDeath" | "quoteAuthor" | "closingVerse"; value: string }
  | { type: "SET_TEXT_NUMBER"; field: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize"; value: number }
  | { type: "SET_TEXT_ALIGN"; align: "left" | "center" | "right" }
  | { type: "SET_DECORATION"; assetId: string | null; assetUrl: string | null }
  | { type: "SET_BORDER"; id: string | null; url: string | null }
  | { type: "SET_CORNERS"; ids: string[]; urls: string[] }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_ELEMENT_OVERRIDE"; elementId: string; override: Partial<ElementOverride> }
  | { type: "SET_ELEMENT_POSITION"; elementId: string; x: number; y: number }
  | { type: "SET_ELEMENT_SIZE"; elementId: string; w: number; h: number }
  | { type: "CLEAR_ELEMENT_OVERRIDE"; elementId: string }
  | { type: "LOAD_STATE"; state: WizardState }
  | { type: "RESET" };

export const initialWizardState: WizardState = {
  currentStep: 1,
  cardType: null,
  cardFormat: null,
  templateId: null,
  photo: {
    url: null,
    originalUrl: null,
    sharpenedUrl: null,
    crop: null,
    filter: "none",
    filterId: "original",
    adjustments: null,
    backgroundRemoved: false,
    backgroundBlurred: false,
  },
  background: { type: "color", color: "#FFFFFF", imageUrl: null },
  textContent: { ...DEFAULT_TEXT_CONTENT },
  decoration: { assetUrl: null, assetId: null },
  border: { url: null, id: null },
  corners: { urls: [], ids: [] },
  elementOverrides: {},
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_CARD_TYPE": {
      const config = CARD_CONFIGS[action.cardType];
      const autoFormat = config.availableFormats[0];
      return { ...state, cardType: action.cardType, cardFormat: autoFormat, templateId: null };
    }
    case "SET_CARD_FORMAT":
      return { ...state, cardFormat: action.cardFormat, templateId: null };
    case "SET_TEMPLATE": {
      // Pre-fill text with placeholder data so the card is never blank
      const tplConfig = getTemplateConfig(action.templateId);
      const ph = tplConfig?.placeholderData;
      const prefilled: Partial<TextContent> = ph ? {
        heading: ph.heading ?? "",
        name: ph.name,
        birthDate: ph.birthDate,
        deathDate: ph.deathDate,
        quote: ph.quote ?? "",
        quoteAuthor: ph.quoteAuthor ?? "",
        relationshipLabels: ph.relationshipLabels ?? "",
        closingVerse: ph.closingVerse ?? "",
        locationBirth: ph.locationBirth ?? "",
        locationDeath: ph.locationDeath ?? "",
        dividerSymbol: ph.dividerSymbol ?? "",
      } : {};
      return {
        ...state,
        templateId: action.templateId,
        elementOverrides: {},
        textContent: { ...state.textContent, ...prefilled },
      };
    }
    case "SET_BACKGROUND":
      return { ...state, background: action.background };
    case "SET_PHOTO":
      return {
        ...state,
        photo: {
          url: action.url,
          originalUrl: action.url,
          sharpenedUrl: null,
          crop: null,
          filter: "none",
          filterId: "original",
          adjustments: null,
          backgroundRemoved: false,
          backgroundBlurred: false,
        },
      };
    case "SET_PHOTO_CROP":
      return { ...state, photo: { ...state.photo, crop: action.crop } };
    case "SET_PHOTO_FILTER":
      return { ...state, photo: { ...state.photo, filter: action.filter, filterId: action.filterId } };
    case "SET_PHOTO_ADJUSTMENTS":
      return { ...state, photo: { ...state.photo, adjustments: action.adjustments } };
    case "SET_PHOTO_PROCESSED":
      return { ...state, photo: { ...state.photo, url: action.url, backgroundRemoved: action.backgroundRemoved, backgroundBlurred: action.backgroundBlurred } };
    case "SET_PHOTO_SHARPENED":
      return { ...state, photo: { ...state.photo, sharpenedUrl: action.sharpenedUrl } };
    case "RESTORE_ORIGINAL_PHOTO":
      return { ...state, photo: { ...state.photo, url: state.photo.originalUrl, sharpenedUrl: null, backgroundRemoved: false, backgroundBlurred: false } };
    case "REMOVE_PHOTO":
      return {
        ...state,
        photo: {
          url: null,
          originalUrl: null,
          sharpenedUrl: null,
          crop: null,
          filter: "none",
          filterId: "original",
          adjustments: null,
          backgroundRemoved: false,
          backgroundBlurred: false,
        },
      };
    case "SET_TEXT_STRING":
      return { ...state, textContent: { ...state.textContent, [action.field]: action.value } };
    case "SET_TEXT_NUMBER":
      return { ...state, textContent: { ...state.textContent, [action.field]: action.value } };
    case "SET_TEXT_ALIGN":
      return { ...state, textContent: { ...state.textContent, textAlign: action.align } };
    case "SET_DECORATION":
      return { ...state, decoration: { assetId: action.assetId, assetUrl: action.assetUrl } };
    case "SET_BORDER":
      return { ...state, border: { id: action.id, url: action.url } };
    case "SET_CORNERS":
      return { ...state, corners: { ids: action.ids, urls: action.urls } };
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP":
      return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
    case "SET_ELEMENT_OVERRIDE": {
      const existing = state.elementOverrides[action.elementId] ?? {};
      const merged: ElementOverride = { ...existing, ...action.override };
      // Clamp position/size values
      if (merged.x !== undefined) merged.x = clampGrid(merged.x);
      if (merged.y !== undefined) merged.y = clampGrid(merged.y);
      if (merged.w !== undefined) merged.w = clampSize(merged.w);
      if (merged.h !== undefined) merged.h = clampSize(merged.h);
      return { ...state, elementOverrides: { ...state.elementOverrides, [action.elementId]: merged } };
    }
    case "SET_ELEMENT_POSITION": {
      const existing = state.elementOverrides[action.elementId] ?? {};
      return {
        ...state,
        elementOverrides: {
          ...state.elementOverrides,
          [action.elementId]: { ...existing, x: clampGrid(action.x), y: clampGrid(action.y) },
        },
      };
    }
    case "SET_ELEMENT_SIZE": {
      const existing = state.elementOverrides[action.elementId] ?? {};
      return {
        ...state,
        elementOverrides: {
          ...state.elementOverrides,
          [action.elementId]: { ...existing, w: clampSize(action.w), h: clampSize(action.h) },
        },
      };
    }
    case "CLEAR_ELEMENT_OVERRIDE": {
      const { [action.elementId]: _, ...rest } = state.elementOverrides;
      return { ...state, elementOverrides: rest };
    }
    case "LOAD_STATE":
      return { ...action.state, elementOverrides: action.state.elementOverrides ?? {} };
    case "RESET":
      return initialWizardState;
    default:
      return state;
  }
}

export function isStepValid(state: WizardState, step: number): boolean {
  switch (step) {
    case 1: return state.cardType !== null && state.cardFormat !== null;
    case 2: return state.templateId !== null;
    case 3: return true; // photo optional
    case 4: return state.textContent.name.trim().length > 0;
    case 5: return true; // decorations optional
    case 6: return true; // preview
    case 7: return true; // order
    default: return false;
  }
}

export function getCardDimensions(state: WizardState): CardDimensions | null {
  if (!state.cardType) return null;
  const config = CARD_CONFIGS[state.cardType];
  const format = state.cardFormat ?? config.availableFormats[0];
  return config.formats[format] ?? null;
}

const STORAGE_KEY = "trauerpost_wizard_draft";
const DRAFT_VERSION = 9;

interface DraftEnvelope {
  version: number;
  state: WizardState;
}

export function saveDraft(state: WizardState): void {
  try {
    const envelope: DraftEnvelope = { version: DRAFT_VERSION, state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch { /* ignore */ }
}

function migrateDraft(parsed: { version: number; state: unknown }): WizardState | null {
  if (parsed.version === DRAFT_VERSION) {
    return parsed.state as WizardState;
  }
  // v8 → v9: add empty elementOverrides
  if (parsed.version === 8) {
    const v8State = parsed.state as Omit<WizardState, "elementOverrides">;
    return { ...v8State, elementOverrides: {} } as WizardState;
  }
  return null; // too old, discard
}

export function loadDraft(): WizardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const migrated = migrateDraft(parsed);
    if (migrated) return migrated;
    console.warn("[wizard] Discarding old draft — layout model changed");
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  return null;
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
