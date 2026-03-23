export type CardSize = "postcard" | "large";

export const CARD_DIMENSIONS = {
  postcard: { width: 420, height: 298, label: "Postkarte (A6)", mm: "105 × 148 mm" },
  large: { width: 594, height: 420, label: "Groß (A5)", mm: "148 × 210 mm" },
} as const;

export const WIZARD_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Libre Baskerville",
  "Lora",
  "EB Garamond",
  "Inter",
  "Montserrat",
  "Raleway",
  "Open Sans",
  "Great Vibes",
  "Dancing Script",
  "Tangerine",
  "Fira Sans",
  "Source Serif Pro",
] as const;

export const FONT_COLORS = [
  { name: "Black", value: "#1A1A1A" },
  { name: "Dark Gray", value: "#4A4A4A" },
  { name: "Dark Blue", value: "#1B3A5C" },
  { name: "Dark Green", value: "#2D5A3D" },
  { name: "Dark Red", value: "#7A2C2C" },
  { name: "Gold", value: "#8B7D3C" },
] as const;

export const TOTAL_STEPS = 7;

export interface WizardState {
  currentStep: number;
  size: CardSize | null;
  backImageUrl: string | null;
  photoUrl: string | null;
  photoCrop: { x: number; y: number; width: number; height: number } | null;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  decorations: {
    borderId: string | null;
    borderUrl: string | null;
    cornerIds: string[];
    cornerUrls: string[];
    dividerIds: string[];
    dividerUrls: string[];
  };
}

export type WizardAction =
  | { type: "SET_SIZE"; size: CardSize }
  | { type: "SET_BACK_IMAGE"; url: string }
  | { type: "SET_PHOTO"; url: string }
  | { type: "SET_PHOTO_CROP"; crop: WizardState["photoCrop"] }
  | { type: "SET_TEXT"; text: string }
  | { type: "SET_FONT"; fontFamily: string }
  | { type: "SET_FONT_SIZE"; fontSize: number }
  | { type: "SET_FONT_COLOR"; color: string }
  | { type: "SET_TEXT_ALIGN"; align: "left" | "center" | "right" }
  | { type: "SET_DECORATION_BORDER"; id: string | null; url: string | null }
  | { type: "SET_DECORATION_CORNERS"; ids: string[]; urls: string[] }
  | { type: "SET_DECORATION_DIVIDERS"; ids: string[]; urls: string[] }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "LOAD_STATE"; state: WizardState }
  | { type: "RESET" };

export const initialWizardState: WizardState = {
  currentStep: 1,
  size: null,
  backImageUrl: null,
  photoUrl: null,
  photoCrop: null,
  text: "",
  fontFamily: "Playfair Display",
  fontSize: 18,
  fontColor: "#1A1A1A",
  textAlign: "center",
  decorations: { borderId: null, borderUrl: null, cornerIds: [], cornerUrls: [], dividerIds: [], dividerUrls: [] },
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_SIZE": return { ...state, size: action.size };
    case "SET_BACK_IMAGE": return { ...state, backImageUrl: action.url };
    case "SET_PHOTO": return { ...state, photoUrl: action.url };
    case "SET_PHOTO_CROP": return { ...state, photoCrop: action.crop };
    case "SET_TEXT": return { ...state, text: action.text };
    case "SET_FONT": return { ...state, fontFamily: action.fontFamily };
    case "SET_FONT_SIZE": return { ...state, fontSize: action.fontSize };
    case "SET_FONT_COLOR": return { ...state, fontColor: action.color };
    case "SET_TEXT_ALIGN": return { ...state, textAlign: action.align };
    case "SET_DECORATION_BORDER": return { ...state, decorations: { ...state.decorations, borderId: action.id, borderUrl: action.url } };
    case "SET_DECORATION_CORNERS": return { ...state, decorations: { ...state.decorations, cornerIds: action.ids, cornerUrls: action.urls } };
    case "SET_DECORATION_DIVIDERS": return { ...state, decorations: { ...state.decorations, dividerIds: action.ids, dividerUrls: action.urls } };
    case "SET_STEP": return { ...state, currentStep: action.step };
    case "NEXT_STEP": return { ...state, currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS) };
    case "PREV_STEP": return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
    case "LOAD_STATE": return action.state;
    case "RESET": return initialWizardState;
    default: return state;
  }
}

export function isStepValid(state: WizardState, step: number): boolean {
  switch (step) {
    case 1: return state.size !== null;
    case 2: return state.backImageUrl !== null;
    case 3: return true; // photo is optional
    case 4: return state.text.trim().length > 0;
    case 5: return true; // decorations are optional
    case 6: return true; // preview, always valid
    case 7: return true; // order
    default: return false;
  }
}

const STORAGE_KEY = "trauerpost_wizard_draft";

export function saveDraft(state: WizardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function loadDraft(): WizardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
