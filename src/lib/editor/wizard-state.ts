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

// ── State ──

export const TOTAL_STEPS = 8;

export interface WizardState {
  currentStep: number;
  cardType: CardType | null;
  cardFormat: CardFormat | null;
  templateId: string | null;
  photo: {
    url: string | null;
    crop: { x: number; y: number; width: number; height: number } | null;
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
}

export type WizardAction =
  | { type: "SET_CARD_TYPE"; cardType: CardType }
  | { type: "SET_CARD_FORMAT"; cardFormat: CardFormat }
  | { type: "SET_TEMPLATE"; templateId: string }
  | { type: "SET_BACKGROUND"; background: WizardState["background"] }
  | { type: "SET_PHOTO"; url: string }
  | { type: "SET_PHOTO_CROP"; crop: WizardState["photo"]["crop"] }
  | { type: "SET_TEXT_STRING"; field: "heading" | "name" | "dates" | "dividerSymbol" | "quote" | "fontFamily" | "fontColor" | "relationshipLabels" | "birthDate" | "deathDate" | "locationBirth" | "locationDeath" | "quoteAuthor" | "closingVerse"; value: string }
  | { type: "SET_TEXT_NUMBER"; field: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize"; value: number }
  | { type: "SET_TEXT_ALIGN"; align: "left" | "center" | "right" }
  | { type: "SET_DECORATION"; assetId: string | null; assetUrl: string | null }
  | { type: "SET_BORDER"; id: string | null; url: string | null }
  | { type: "SET_CORNERS"; ids: string[]; urls: string[] }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "LOAD_STATE"; state: WizardState }
  | { type: "RESET" };

export const initialWizardState: WizardState = {
  currentStep: 1,
  cardType: null,
  cardFormat: null,
  templateId: null,
  photo: { url: null, crop: null },
  background: { type: "color", color: "#FFFFFF", imageUrl: null },
  textContent: { ...DEFAULT_TEXT_CONTENT },
  decoration: { assetUrl: null, assetId: null },
  border: { url: null, id: null },
  corners: { urls: [], ids: [] },
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_CARD_TYPE": {
      const config = CARD_CONFIGS[action.cardType];
      const autoFormat = config.availableFormats.length === 1 ? config.availableFormats[0] : null;
      return { ...state, cardType: action.cardType, cardFormat: autoFormat, templateId: null };
    }
    case "SET_CARD_FORMAT":
      return { ...state, cardFormat: action.cardFormat, templateId: null };
    case "SET_TEMPLATE":
      return { ...state, templateId: action.templateId };
    case "SET_BACKGROUND":
      return { ...state, background: action.background };
    case "SET_PHOTO":
      return { ...state, photo: { ...state.photo, url: action.url } };
    case "SET_PHOTO_CROP":
      return { ...state, photo: { ...state.photo, crop: action.crop } };
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
    case "LOAD_STATE":
      return action.state;
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
    case 3: return state.background.type === "color" || state.background.imageUrl !== null;
    case 4: return true; // photo optional
    case 5: return state.textContent.name.trim().length > 0;
    case 6: return true; // decorations optional
    case 7: return true; // preview
    case 8: return true; // order
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
const DRAFT_VERSION = 6;

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

export function loadDraft(): WizardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed.version === DRAFT_VERSION && parsed.state) {
      return parsed.state;
    }
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
