# Template-Based Card Layout — Implementation Plan (v3.1)

> **v3.1 fixes:** isStepValid requires cardFormat, SET_TEXT_FIELD split for type safety, SET_CARD_TYPE resets templateId, added 2 single templates for trauerkarte/dankkarte (E1/E2), StepBackImage marked as full rewrite, removed actions listed, divider images replaced by text symbols (intentional simplification — image dividers → future phase).

**Goal:** Replace the fixed-layout card renderer with a template-based system. The user picks a visual template (matching the client's real samples), sees placeholders ("Ihr Name", "Foto hier"), and fills in content. No grid editing, no drag-and-drop — just pick template → fill content → done.

**Client samples analyzed (6 Innenseiten):**
- TI 04: text-only (heading + name + quote + dates) — no photo
- TI 05: photo left (large) + text right (name + dates)
- TI 06: photo left (small) + text right (name + dates + quote)
- TI 07: decoration left (flower + name + dates + ★★★) + photo right
- TI 08: photo left + name/dates bottom-left, quote right
- TI 09: 3 columns (quote left, decoration center, text+photo right)

**Key insight:** Every card is a combination of fixed blocks — photo, name, dates, quote, decoration — only the POSITION changes. Templates define positions, user fills content.

**Scope:** Template-first with placeholders. Free-form grid editing → later phase.

**Changes from v2:** Removed user-facing grid/zone concepts. Templates are now opaque — user doesn't see or edit zones, just fills content into a visual template.

---

## Template System

### How it works

1. User selects card type (sterbebild/trauerkarte/dankkarte) + format (single/folded)
2. System shows 4-6 template thumbnails matching that type
3. User picks one → sees the card with **visual placeholders**:
   - Gray rectangle with camera icon: "Foto hier"
   - Dotted box: "[Ihr Name]", "[Geburtsdatum – Sterbedatum]"
   - Flower/cross silhouette: "Dekoration"
4. User fills each placeholder in the wizard steps
5. Preview shows real content in the template layout
6. PDF uses same template layout

### Template Data Structure

Each template defines **slots** (not a user-facing grid):

```typescript
interface TemplateSlot {
  id: string;                    // "photo", "name", "dates", "heading", "quote", "decoration"
  type: "photo" | "text" | "decoration";
  // Position within the panel (CSS properties)
  gridArea: string;              // CSS grid-area value, e.g., "1 / 1 / 3 / 2"
  placeholder: string;           // "Foto hier", "[Ihr Name]", etc.
  defaultFontSize?: number;      // for text slots
}

interface PanelTemplate {
  panelId: "front" | "back" | "inside-left" | "inside-right";
  gridTemplateRows: string;      // e.g., "7fr 3fr"
  gridTemplateColumns: string;   // e.g., "1fr 1fr"
  slots: TemplateSlot[];
  defaultBackground: "white" | "image";
}

interface CardTemplate {
  id: string;                    // "sterbebild-klassisch"
  name: string;                  // "Klassisch"
  cardType: CardType;
  cardFormat: CardFormat;
  thumbnailDescription: string;  // for visual preview generation
  panels: PanelTemplate[];
}
```

### Templates (matching client samples)

**Erinnerungsbild (single, 140×105mm) — 4 templates:**

```
Template S1: "Klassisch" (= TI 07 / Franz Muster)
─────────────────────────────────────────────────
FRONT (left panel):              BACK (right panel):
gridRows: "80px 1fr"            gridRows: "7fr 3fr"
gridCols: "1fr"                 gridCols: "1fr"
┌─────────────────┐             ┌─────────────────┐
│ [Dekoration]    │             │                 │
├─────────────────┤             │  [Foto hier]    │
│ [Ihr Name]      │             │                 │
│ [* Geb. † Sterb]│             ├─────────────────┤
│ ✦✦✦             │             │ [Spruch/Gebet]  │
└─────────────────┘             └─────────────────┘
bg: white                       bg: white


Template S2: "Foto Links" (= TI 05 / Hans Mustermann)
──────────────────────────────────────────────────────
FRONT (left panel):              BACK (right panel):
gridRows: "1fr"                 gridRows: "1fr"
gridCols: "1fr"                 gridCols: "1fr 1fr"
┌─────────────────┐             ┌────────┬────────┐
│                 │             │        │[Name]  │
│  [Foto hier]    │             │ [Foto] │[Dates] │
│                 │             │        │        │
└─────────────────┘             └────────┴────────┘
bg: white                       bg: white


Template S3: "Foto + Text" (= TI 06 / Thilde Muster)
─────────────────────────────────────────────────────
FRONT (left panel):              BACK (right panel):
gridRows: "1fr"                 gridRows: "1fr"
gridCols: "2fr 3fr"            gridCols: "2fr 3fr"
┌──────┬──────────┐             same layout mirrored
│      │ [Name]   │             or text-only panel
│[Foto]│ [Dates]  │
│      │ [Spruch] │
└──────┴──────────┘
bg: white


Template S4: "Nur Text" (= TI 04 / Sieglinde Musterfrau)
─────────────────────────────────────────────────────────
FRONT (left panel):              BACK (right panel):
gridRows: "auto 1fr auto"      gridRows: "1fr"
gridCols: "1fr"                 gridCols: "1fr"
┌─────────────────┐             ┌─────────────────┐
│ [Überschrift]   │             │                 │
├─────────────────┤             │ [Spruch/Gebet]  │
│ [Ihr Name]      │             │                 │
│ [Spruch]        │             └─────────────────┘
├─────────────────┤
│ [Dates]         │
└─────────────────┘
bg: white
```

**Trauerkarte/Dankeskarte single (185×115mm) — 2 templates:**

```
Template E1: "Einfach Klassisch" (single trauerkarte/dankkarte)
FRONT:                           BACK:
gridRows: "1fr"                 gridRows: "1fr"
gridCols: "1fr"                 gridCols: "1fr"
┌─────────────────┐             ┌─────────────────┐
│  background     │             │ [Heading]       │
│  image          │             │ [Name]          │
│                 │             │ [Dates]         │
└─────────────────┘             │ [Spruch]        │
                                └─────────────────┘

Template E2: "Einfach mit Foto" (single with photo)
FRONT:                           BACK:
gridRows: "1fr"                 gridRows: "1fr"
gridCols: "2fr 3fr"            gridCols: "1fr"
┌────────┬────────┐             ┌─────────────────┐
│        │[Name]  │             │                 │
│ [Foto] │[Dates] │             │ [Spruch]        │
│        │        │             │                 │
└────────┴────────┘             └─────────────────┘
```

**Trauerkarte/Dankeskarte folded (370×115mm) — 2 templates:**

```
Template F1: "Klassisch Gefaltet"
FRONT COVER:        INSIDE LEFT:     INSIDE RIGHT:         BACK:
┌──────────┐       ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ bg image │       │          │     │[Dekoration]  │     │          │
│ + title  │       │ [Foto]   │     ├──────────────┤     │ (blank)  │
│          │       │          │     │[Name+Dates+  │     │          │
└──────────┘       └──────────┘     │ Spruch]      │     └──────────┘
                                    └──────────────┘

Template F2: "Modern Gefaltet"
FRONT COVER:        INSIDE LEFT:     INSIDE RIGHT:         BACK:
┌──────────┐       ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ bg image │       │ [Foto]   │     │[Name]        │     │          │
│          │       │──────────│     │[Dates]       │     │ (blank)  │
│          │       │ [Name]   │     │[Spruch]      │     │          │
└──────────┘       └──────────┘     └──────────────┘     └──────────┘
```

---

## Wizard Flow (updated)

```
Step 1: Card Type → pick sterbebild/trauerkarte/dankkarte + format
Step 2: Template  → pick layout template (NEW — visual thumbnails with placeholders)
Step 3: Background → image or solid color for front panel
Step 4: Photo     → upload portrait (slot shown with placeholder)
Step 5: Text      → fill structured fields: name, dates, heading, quote
Step 6: Decorations → pick flower/cross/candle for decoration slot
Step 7: Preview   → see final card + download PDF
Step 8: Order     → quantity + place order
```

**Change:** Step 2 is NEW (template picker). Total steps: **8** (was 7).

---

## Structured Text Fields

User fills separate fields (NOT one big textarea):

| Field | Example | Default font size | Required? |
|-------|---------|-------------------|-----------|
| `heading` | "In liebevoller Erinnerung an" | 11px | No |
| `name` | "Franz Muster" | 22px | **Yes** |
| `dates` | "* 08.04.1954  † 01.01.2021" | 13px | No |
| `dividerSymbol` | "✦✦✦" or "———" or none | 12px | No |
| `quote` | "Der Tod ist nicht das Ende..." | 12px | No |

Each field has its own font size slider. Shared: font family, color, alignment.

**Text templates** pre-fill all fields at once (user can edit after):
- "Klassisch": heading + name placeholder + dates placeholder + quote
- "Schlicht": name + dates only
- "Mit Spruch": heading + name + dates + German proverb

---

## State Model Changes

### New WizardState

```typescript
interface WizardState {
  currentStep: number;             // 1-8 (was 1-7)
  cardType: CardType | null;
  cardFormat: CardFormat | null;
  templateId: string | null;       // NEW — selected template
  // Content for template slots:
  photo: {
    url: string | null;
    crop: { x: number; y: number; width: number; height: number } | null;
  };
  background: {
    type: "color" | "image";
    color: string;                 // default "#FFFFFF"
    imageUrl: string | null;
  };
  textContent: TextContent;        // NEW — structured text fields
  decoration: {
    assetUrl: string | null;       // flower/cross/candle for decoration slot
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

interface TextContent {
  heading: string;
  headingFontSize: number;
  name: string;
  nameFontSize: number;
  dates: string;
  datesFontSize: number;
  dividerSymbol: string;           // "✦✦✦" | "———" | "❀❀❀" | ""
  quote: string;
  quoteFontSize: number;
  fontFamily: string;
  fontColor: string;
  textAlign: "left" | "center" | "right";
}
```

**Simplification vs v2:** No `CardLayout`, no `PanelLayout`, no `zones`. The template is a rendering instruction — the state just holds content. The renderer combines template + content at render time.

**Reducer behavior — `SET_CARD_TYPE` must reset `templateId: null`** (template depends on card type + format). Same for `SET_CARD_FORMAT`.

**Removed actions** (replaced by new ones above):
- `SET_SIZE` → replaced by `SET_CARD_TYPE` (already done in earlier batch)
- `SET_BACK_IMAGE` → replaced by `SET_BACKGROUND`
- `SET_TEXT` → replaced by `SET_TEXT_STRING`
- `SET_FONT` → replaced by `SET_TEXT_STRING` (field: "fontFamily")
- `SET_FONT_SIZE` → replaced by `SET_TEXT_NUMBER`
- `SET_FONT_COLOR` → replaced by `SET_TEXT_STRING` (field: "fontColor")
- `SET_TEXT_ALIGN` → replaced by new `SET_TEXT_ALIGN`
- `SET_DECORATION_BORDER` → replaced by `SET_BORDER`
- `SET_DECORATION_CORNERS` → replaced by `SET_CORNERS`
- `SET_DECORATION_DIVIDERS` → removed (divider images replaced by dividerSymbol text in TextContent)

### New Actions

```typescript
type WizardAction =
  | { type: "SET_CARD_TYPE"; cardType: CardType }
  | { type: "SET_CARD_FORMAT"; cardFormat: CardFormat }
  | { type: "SET_TEMPLATE"; templateId: string }
  | { type: "SET_BACKGROUND"; background: WizardState["background"] }
  | { type: "SET_PHOTO"; url: string }
  | { type: "SET_PHOTO_CROP"; crop: WizardState["photo"]["crop"] }
  | { type: "SET_TEXT_STRING"; field: "heading" | "name" | "dates" | "dividerSymbol" | "quote" | "fontFamily" | "fontColor"; value: string }
  | { type: "SET_TEXT_NUMBER"; field: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize"; value: number }
  | { type: "SET_TEXT_ALIGN"; align: "left" | "center" | "right" }
  | { type: "SET_DECORATION"; assetId: string | null; assetUrl: string | null }
  | { type: "SET_BORDER"; id: string | null; url: string | null }
  | { type: "SET_CORNERS"; ids: string[]; urls: string[] }
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "LOAD_STATE"; state: WizardState }
  | { type: "RESET" }
```

### isStepValid

```typescript
function isStepValid(state: WizardState, step: number): boolean {
  switch (step) {
    case 1: return state.cardType !== null && state.cardFormat !== null;
    case 2: return state.templateId !== null;
    case 3: return state.background.type === "color" || state.background.imageUrl !== null;
    case 4: return true;  // photo optional
    case 5: return state.textContent.name.trim().length > 0;
    case 6: return true;  // decorations optional
    case 7: return true;  // preview
    case 8: return true;  // order
    default: return false;
  }
}
```

**DRAFT_VERSION = 3** — old v2 drafts auto-discarded.
**TOTAL_STEPS = 8** (was 7).

---

## Batch 1: Data Model + Templates

### Task 1.1: Update wizard state

**File:** Modify `src/lib/editor/wizard-state.ts`

1. Add `TextContent` interface
2. Replace flat text/photo/decoration fields with structured groups
3. Add new actions (`SET_TEMPLATE`, `SET_BACKGROUND`, `SET_TEXT_FIELD`, etc.)
4. Update reducer
5. Update `isStepValid` for 8 steps
6. Update `TOTAL_STEPS = 8`
7. Update `DRAFT_VERSION = 3`
8. Update `initialWizardState` with new defaults
9. Add `FONT_SIZE_UNIT = "px"` constant

### Task 1.2: Create template definitions

**File:** Create `src/lib/editor/card-templates.ts`

1. Define `TemplateSlot`, `PanelTemplate`, `CardTemplate` interfaces
2. Define 6 templates (S1–S4 for single, F1–F2 for folded) with:
   - Panel grid definitions (`gridTemplateRows`, `gridTemplateColumns`)
   - Slot positions (`gridArea` CSS values)
   - Placeholders per slot
   - Default font sizes per text slot
3. Export `getTemplatesForCard(cardType, cardFormat): CardTemplate[]`
4. Export `getTemplateById(id): CardTemplate | null`

### Task 1.3: Update text templates for structured fields

**File:** Modify `src/lib/editor/text-templates.ts`

Change from `{ label, text: string }` to `{ label, textContent: Partial<TextContent> }`. Each template fills heading, name placeholder, dates placeholder, quote.

### Task 1.4: Verify + commit

```bash
npx tsc --noEmit
git commit -m "feat: template-based layout data model — 6 templates, structured text"
```

---

## Batch 2: Template-Based Renderer

### Task 2.1: Rewrite CardRenderer for templates

**File:** Rewrite `src/components/wizard/CardRenderer.tsx`

1. New props: `template: CardTemplate`, `panelId: string`, `state: WizardState`
2. Look up the `PanelTemplate` for this panel
3. Render as CSS Grid using template's `gridTemplateRows`/`gridTemplateColumns`
4. For each slot in the panel:
   - `type: "photo"` → render `state.photo.url` or placeholder (gray + camera icon)
   - `type: "text"` → render `TextBlockRenderer` or placeholder ("[Ihr Name]")
   - `type: "decoration"` → render `state.decoration.assetUrl` or placeholder (silhouette)
5. Background: `state.background.color` or `state.background.imageUrl`
6. Border/corners as overlays (responsive %)

### Task 2.2: Create TextBlockRenderer

**File:** Create `src/components/wizard/TextBlockRenderer.tsx`

Renders `TextContent` vertically: heading → name (large) → dates → divider → quote.
Each field uses its own fontSize. Empty fields skipped. Uses `FONT_SIZE_UNIT`.

### Task 2.3: Create TemplateThumbnail component

**File:** Create `src/components/wizard/TemplateThumbnail.tsx`

Small visual preview of a template (wireframe style). Shows zone layout with placeholder text. Used in template picker step.

### Task 2.4: Update StepPreview

**File:** Modify `src/components/wizard/steps/StepPreview.tsx`

Load template from `state.templateId`. Pass template + state to new CardRenderer per panel.

### Task 2.5: Verify + commit

```bash
npx tsc --noEmit && npx next build
git commit -m "feat: template-based CardRenderer with placeholders"
```

---

## Batch 3: Wizard Steps Update

### Task 3.1: Add StepTemplate (new step 2)

**File:** Create `src/components/wizard/steps/StepTemplate.tsx`

1. Show template thumbnails for selected card type + format
2. Each thumbnail is a `TemplateThumbnail` component (clickable)
3. Selecting dispatches `SET_TEMPLATE`
4. Show template name + short description below

### Task 3.2: Rewrite StepText for structured fields

**File:** Rewrite `src/components/wizard/steps/StepText.tsx`

1. Separate inputs: heading, name (required), dates, divider picker, quote textarea
2. Each with font size slider
3. Shared: font family picker, color palette, alignment
4. Template selector at top (pre-fills all fields)
5. Live preview: shows the actual panel with template layout

### Task 3.3: Rewrite StepBackImage for background types

**File:** Rewrite `src/components/wizard/steps/StepBackImage.tsx` (full rewrite — old component dispatches `SET_BACK_IMAGE` which no longer exists)

1. Toggle: "Bild" / "Farbe"
2. Color: white (default) + palette (cream, light gray, light blue)
3. Image: existing Unsplash gallery + upload
4. Dispatches `SET_BACKGROUND`

### Task 3.4: Update StepDecorations

**File:** Modify `src/components/wizard/steps/StepDecorations.tsx`

1. **Decoration assets** (flowers, crosses, candles) → fills template decoration slot
2. **Borders** → panel-level overlay (unchanged)
3. **Corners** → panel-level (unchanged)
4. Divider symbol → moved to StepText (dividerSymbol picker)

### Task 3.5: Update WizardShell for 8 steps

**File:** Modify `src/components/wizard/WizardShell.tsx`

1. Add `StepTemplate` as step 2
2. Shift all subsequent steps by 1
3. Import new component
4. Update step rendering switch

### Task 3.6: Update StepIndicator for 8 steps

**File:** Modify `src/components/wizard/StepIndicator.tsx`

Add "Template"/"Vorlage" step key.

### Task 3.7: Add translations for new step

**Files:** Modify `src/messages/de.json`, `src/messages/en.json`

Add `wizard.steps.template`, `wizard.template.*` namespace.

### Task 3.8: Verify + commit

```bash
npx tsc --noEmit && npx next build
git commit -m "feat: 8-step wizard with template picker and structured text"
```

---

## Batch 4: PDF Renderer

### Task 4.1: Rewrite card-to-html.ts

**File:** Rewrite `src/lib/editor/card-to-html.ts`

1. Accept `WizardState` with `templateId`
2. Look up template → get panel definitions
3. Render each panel as CSS Grid with template's row/column sizes
4. Render slots: text block (structured HTML), photo (base64), decoration (base64)
5. Background: color or image per panel
6. Font sizes in `px` (using `FONT_SIZE_UNIT`)
7. Google Fonts link for selected fontFamily

### Task 4.2: Update pdf-generator.ts

**File:** Modify `src/lib/editor/pdf-generator.ts`

Update `generateCardPDF` to work with new state model. Dimensions still come from `getCardDimensions`.

### Task 4.3: Update generate-pdf route

**File:** Modify `src/app/api/generate-pdf/route.ts`

Accept new WizardState format.

### Task 4.4: Generate test PDF matching "Franz Muster" sample

Create PDF using Template S1 with real content. Save to desktop. Compare with client sample visually.

### Task 4.5: Commit

```bash
git commit -m "feat: PDF renderer for template-based layout"
```

---

## Batch 5: E2E Tests + Cleanup

### Task 5.1: Update existing E2E tests

Update `e2e/wizard-card-types.spec.ts` and `e2e/wizard-e2e-real.spec.ts` for 8-step flow + template selection.

### Task 5.2: Write template E2E tests

**File:** Create `e2e/wizard-templates.spec.ts`

Tests:
1. Template picker shows templates for sterbebild
2. Selecting "Klassisch" shows correct placeholder layout
3. Structured text fields appear (name, dates, heading, quote)
4. Background color picker shows white as default
5. PDF generation with template returns valid PDF
6. Full flow: template → background → photo → text → preview → order
7. **Negative:** no template selected → can't advance

### Task 5.3: Delete obsolete files

Remove old `text-templates.ts` format if fully replaced.

### Task 5.4: Commit + push

```bash
git commit -m "test: E2E tests for template-based card creation"
git push
```

---

## Summary

| Batch | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1–1.4 | Data model — templates, structured text, 8 steps |
| 2 | 2.1–2.5 | CardRenderer — template-based with CSS Grid + placeholders |
| 3 | 3.1–3.8 | Wizard steps — template picker, structured text, backgrounds |
| 4 | 4.1–4.5 | PDF renderer + verify against client sample |
| 5 | 5.1–5.4 | E2E tests + cleanup |

**Total: 5 batches, ~22 tasks.**

**Key decisions:**
- **Templates are opaque** — user picks a layout, doesn't edit zones
- **6 templates** — S1–S4 (single), F1–F2 (folded) — covers all client samples
- **Structured text** — separate fields with individual font sizes (not one textarea)
- **8 wizard steps** — added Template step between CardType and Background
- **State is simple** — no CardLayout/PanelLayout in state, just content. Template = rendering instruction.
- **Placeholders** — visual UX showing where content goes before user fills it

**NOT in scope (future phase):**
- Custom grid editing (user arranges zones)
- Drag-and-drop
- Custom template creation by user
- More than 6 templates (add later as assets)
