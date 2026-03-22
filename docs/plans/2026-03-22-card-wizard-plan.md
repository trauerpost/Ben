# Card Builder Wizard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the raw canvas editor with a guided 7-step wizard for creating folding memorial cards (3 panels, 2 sizes, 14 fonts, decorations, 3D preview).

**Architecture:** Wizard state managed by `useReducer` + localStorage persistence. Each panel uses Fabric.js canvas. Preview uses CSS 3D transforms for flip + Three.js for 3D mockup. Wizard replaces `/builder` route.

**Tech Stack:** Fabric.js (already installed), Three.js / @react-three/fiber (3D preview), react-image-crop (photo crop), Google Fonts (14 curated fonts)

**Total tasks:** ~15 across 4 batches.

---

## Batch 1: Wizard Framework + Steps 1-2

### Task 1.1: Create Wizard State & Shell

**Files:**
- Create: `src/lib/editor/wizard-state.ts`
- Create: `src/components/wizard/WizardShell.tsx`
- Create: `src/components/wizard/StepIndicator.tsx`

**Step 1: Create wizard state types and reducer**

`src/lib/editor/wizard-state.ts`:
```ts
export type CardSize = "postcard" | "large";

export const CARD_DIMENSIONS = {
  postcard: { width: 420, height: 298, label: "Postkarte (A6)", mm: "105 × 148 mm" },
  large: { width: 594, height: 420, label: "Groß (A5)", mm: "148 × 210 mm" },
} as const;

export const WIZARD_FONTS = [
  "Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Lora", "EB Garamond",
  "Inter", "Montserrat", "Raleway", "Open Sans",
  "Great Vibes", "Dancing Script", "Tangerine",
  "Fira Sans", "Source Serif Pro",
] as const;

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
    cornerIds: string[];
    dividerIds: string[];
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
  | { type: "SET_DECORATION_BORDER"; id: string | null }
  | { type: "SET_DECORATION_CORNERS"; ids: string[] }
  | { type: "SET_DECORATION_DIVIDERS"; ids: string[] }
  | { type: "SET_STEP"; step: number }
  | { type: "LOAD_STATE"; state: WizardState };

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
  decorations: { borderId: null, cornerIds: [], dividerIds: [] },
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
    case "SET_DECORATION_BORDER": return { ...state, decorations: { ...state.decorations, borderId: action.id } };
    case "SET_DECORATION_CORNERS": return { ...state, decorations: { ...state.decorations, cornerIds: action.ids } };
    case "SET_DECORATION_DIVIDERS": return { ...state, decorations: { ...state.decorations, dividerIds: action.ids } };
    case "SET_STEP": return { ...state, currentStep: action.step };
    case "LOAD_STATE": return action.state;
    default: return state;
  }
}
```

**Step 2: Create StepIndicator component**

`src/components/wizard/StepIndicator.tsx`:
- Shows 7 steps as circles with labels
- Current step highlighted in brand-primary
- Completed steps show checkmark
- Mobile: compact (numbers only, no labels)

**Step 3: Create WizardShell**

`src/components/wizard/WizardShell.tsx`:
- Wraps all steps with `useReducer(wizardReducer, initialWizardState)`
- Auto-save to localStorage every change
- Load from localStorage on mount
- Renders StepIndicator + current step component + Back/Next buttons
- Next button disabled until step is valid (e.g., size selected in step 1)

**Step 4: Commit**

```bash
git add . && git commit -m "feat: add wizard state management and shell"
```

---

### Task 1.2: Step 1 — Choose Size

**Files:**
- Create: `src/components/wizard/steps/StepSize.tsx`

Visual size selector:
- Two cards side by side showing the size difference
- Each card shows dimensions in mm
- Click to select → green border + checkmark
- Responsive: stack on mobile

**Commit**

---

### Task 1.3: Step 2 — Choose Back Image

**Files:**
- Create: `src/components/wizard/steps/StepBackImage.tsx`

- Grid of landscape images from Supabase `assets` table (category = 'background')
- Tag filter buttons (mountain, forest, ocean, flowers, etc.)
- Selected image gets green border
- Live preview of the back panel on the right side
- Option to upload custom background image

**Commit**

---

### Task 1.4: Wire wizard into builder route

**Files:**
- Modify: `src/app/[locale]/builder/page.tsx`

Replace the old raw canvas builder with the new WizardShell.
Import dynamically (SSR-safe).

**Verify:** `npm run dev` → go to `/de/builder` → see Step 1 (size selector)

**Commit + push**

---

## Batch 2: Steps 3-5 (Photo, Text, Decorations)

### Task 2.1: Step 3 — Upload Photo

**Files:**
- Create: `src/components/wizard/steps/StepPhoto.tsx`
- Install: `react-image-crop`

```bash
npm install react-image-crop
```

- File upload button (max 10MB, images only)
- After upload: show crop tool (square or custom aspect ratio)
- Live preview of inside-left panel with the photo
- "Skip" option (no photo)

**Commit**

---

### Task 2.2: Step 4 — Add Text

**Files:**
- Create: `src/components/wizard/steps/StepText.tsx`

- Large textarea for free text input
- Font selector dropdown (14 fonts with preview of each font name in that font)
- Font size slider (12-36px)
- Color picker (predefined palette: black, dark gray, dark blue, dark green, dark red, gold)
- Alignment buttons (left, center, right)
- Live preview of inside-right panel showing the text
- Load Google Fonts dynamically

**Commit**

---

### Task 2.3: Step 5 — Choose Decorations

**Files:**
- Create: `src/components/wizard/steps/StepDecorations.tsx`

Three tabs:
1. **Borders** — grid of border frame images from assets (category = 'border')
2. **Corners** — grid of corner ornament images (category = 'ornament')
3. **Dividers** — grid of divider images (category = 'symbol')

Click to select/deselect. Selected items have green border.
Live preview of inside-right panel with text + decorations applied.
"None" option for each category.

**Commit + push**

---

## Batch 3: Step 6 — Preview (Flat + Flip + 3D)

### Task 3.1: Flat Panel Overview

**Files:**
- Create: `src/components/wizard/steps/StepPreview.tsx`
- Create: `src/components/wizard/preview/FlatPreview.tsx`

Show all 3 panels side by side:
```
[Back] [Inside Left] [Inside Right]
```
Each panel rendered with actual content (image, photo, text, decorations).
Scale to fit viewport.

**Commit**

---

### Task 3.2: Interactive Flip

**Files:**
- Create: `src/components/wizard/preview/FlipCard.tsx`

CSS 3D transforms:
- Card container with `perspective: 1000px`
- Front face (back image) and rear face (inside panels)
- Click to flip with smooth `rotateY(180deg)` transition
- Touch swipe support on mobile

**Commit**

---

### Task 3.3: 3D Mockup

**Files:**
- Create: `src/components/wizard/preview/Card3D.tsx`
- Install: `@react-three/fiber @react-three/drei three`

```bash
npm install @react-three/fiber @react-three/drei three @types/three
```

Three.js scene:
- Two plane geometries joined at fold line
- Card textures from canvas panels
- Mouse drag to rotate
- Auto-rotate slowly when not interacting
- Fold/unfold animation

Dynamic import with `ssr: false`.

**Commit + push**

---

## Batch 4: Step 7 (Order) + Integration

### Task 4.1: Step 7 — Order

**Files:**
- Create: `src/components/wizard/steps/StepOrder.tsx`

- Quantity selector
- Price display (from Supabase `pricing` table)
- Customer type detection:
  - Logged in + regular → show credit balance + "Use credit" button
  - Not logged in / one-time → show "Pay with card" button (Stripe placeholder)
- Guest fields: name, email (if not logged in)
- "Place order" button → saves to Supabase `orders` table → navigates to confirmation

**Commit**

---

### Task 4.2: Save Order to Supabase

**Files:**
- Create: `src/lib/editor/save-order.ts`

Function that:
1. Collects all wizard state
2. Renders 3 panels to canvas JSON
3. Creates order in Supabase `orders` table with `card_data` JSON
4. Returns order ID
5. Clears localStorage draft

**Commit**

---

### Task 4.3: Wizard Translations

**Files:**
- Modify: `src/messages/de.json`
- Modify: `src/messages/en.json`

Add translations for all wizard steps:
- Step titles, descriptions, button labels
- Font names don't need translation
- Error messages (file too large, required fields)

**Commit**

---

### Task 4.4: Update Builder Route + Cleanup

**Files:**
- Modify: `src/app/[locale]/builder/page.tsx`
- Delete old editor components if fully replaced

Final verification:
1. Go to `/de/builder` → step 1 (size)
2. Select size → step 2 (back image grid)
3. Select image → step 3 (photo upload)
4. Upload/skip → step 4 (text + font)
5. Type text → step 5 (decorations)
6. Select decorations → step 6 (preview: flat + flip + 3D)
7. Proceed → step 7 (order + quantity)

**Commit + push**

---

## Summary

| Batch | Tasks | What |
|-------|-------|------|
| 1 | 1.1-1.4 | Wizard framework, size selector, back image, wiring |
| 2 | 2.1-2.3 | Photo upload+crop, text+fonts, decorations |
| 3 | 3.1-3.3 | Flat preview, flip animation, 3D mockup |
| 4 | 4.1-4.4 | Order step, Supabase save, translations, cleanup |
