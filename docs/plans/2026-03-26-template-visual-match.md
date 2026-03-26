# Template Visual Match — Implementation Plan v2 (Based on Gemini Analysis)

**Goal:** 6 NEW Sterbebild Innenseiten spread templates (T1-T6), each renders as a SINGLE-PAGE SPREAD (140×105mm), matching client reference images TI 04-09. Score ≥90/100 per template.

**Source:** Gemini atomic analysis — Data Dictionary, Layout Structural Matrix, Styling Properties.

**v2 fixes applied:**
- F1: Field renames have full consumer migration checklist (10 files)
- F2: TI 04-09 = NEW templates T1-T6. Existing S1-S4/E1-E2/F1-F2 UNCHANGED
- F3: Added `renderMode: "spread" | "pages"` flag per template
- F4: `SET_TEXT_STRING`/`SET_TEXT_NUMBER` action unions updated for all new fields
- F5: `isStepValid` + `StepOrder` + `StepText` updated for `fullName`
- F6: `ornamentAsset` maps to existing `decoration.assetUrl` in WizardState

---

## 1. Universal Data Schema (Atomic Keys)

Every template draws from these fields:

| Key | Type | Example | Used in |
|-----|------|---------|---------|
| `header` | string | "In Gedenken an unsere Mutter, Oma..." | T1, T2, T6 |
| `relationshipLabels` | string | "Mutter, Oma, Schwiegermutter und Ehefrau" | T1 |
| `fullName` | string | "Sieglinde Musterfrau" | ALL |
| `birthDate` | string | "* 08.04.1954" | ALL |
| `deathDate` | string | "† 01.01.2021" | ALL |
| `locationBirth` | string | "in Starnberg" | T4 |
| `locationDeath` | string | "in Augsburg" | T4 |
| `mainQuote` | string | "Ich glaube, daß wenn der Tod..." | T1, T3, T5, T6 |
| `quoteAuthor` | string | "(Arthur Schopenhauer)" | T1 |
| `closingVerse` | string | "O Herr, gib ihr die ewige Ruhe!" | T6 |
| `primaryImage` | URL | user uploaded portrait | T2, T3, T4, T5, T6 |
| `ornamentAsset` | URL | flower/cross SVG/PNG | T4, T6 |

### TextContent interface (EXPANDED — backward compatible)

**Strategy:** ADD new fields, keep old field names as aliases. No rename = no breaking change.

```typescript
interface TextContent {
  // ── Existing fields (UNCHANGED — no rename) ──
  heading: string;           // keep as-is, used by S1-S4/E1-E2/F1-F2
  name: string;              // keep as-is
  dates: string;             // keep as-is
  quote: string;             // keep as-is
  dividerSymbol: string;
  headingFontSize: number;
  nameFontSize: number;
  datesFontSize: number;
  quoteFontSize: number;
  fontFamily: string;
  fontColor: string;
  textAlign: "left" | "center" | "right";

  // ── NEW fields (for T1-T6 spread templates) ──
  relationshipLabels: string;  // default ""
  birthDate: string;           // default "" — separate from `dates`
  deathDate: string;           // default ""
  locationBirth: string;       // default ""
  locationDeath: string;       // default ""
  quoteAuthor: string;         // default ""
  closingVerse: string;        // default ""
  // Font sizes for new fields
  locationFontSize: number;    // default 10
  closingVerseFontSize: number;// default 10
  quoteAuthorFontSize: number; // default 9
}
```

**Key decision: NO RENAMES.** Old templates (S1-S4, E1-E2, F1-F2) use `heading`, `name`, `dates`, `quote`. New templates (T1-T6) use the new fields (`birthDate`, `deathDate`, `mainQuote` etc.) BUT `mainQuote` maps to existing `quote` field to avoid duplication. Similarly, `header` maps to `heading`.

**Field mapping for T1-T6 templates:**
- T1-T6 `textFields` use: `"heading"` (= header), `"name"` (= fullName), `"birthDate"`, `"deathDate"`, `"locationBirth"`, `"locationDeath"`, `"quote"` (= mainQuote), `"quoteAuthor"`, `"closingVerse"`, `"relationshipLabels"`, `"dividerSymbol"`
- No renames needed. `heading` IS the header. `name` IS the full name. `quote` IS the main quote.

**This means: ZERO breaking changes to existing consumers.**

### Updated WizardAction unions

```typescript
// Add new fields to SET_TEXT_STRING
| { type: "SET_TEXT_STRING"; field:
    "heading" | "name" | "dates" | "dividerSymbol" | "quote" |
    "fontFamily" | "fontColor" |
    // NEW:
    "relationshipLabels" | "birthDate" | "deathDate" |
    "locationBirth" | "locationDeath" |
    "quoteAuthor" | "closingVerse";
    value: string }

// Add new fields to SET_TEXT_NUMBER
| { type: "SET_TEXT_NUMBER"; field:
    "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" |
    // NEW:
    "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize";
    value: number }
```

### DEFAULT_TEXT_CONTENT update

Add defaults for new fields (all empty strings, all 0 font sizes with sensible defaults):
```typescript
{
  ...existing defaults...,
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
}
```

**DRAFT_VERSION bump to 4** in Batch 0 (current code is 3). New fields have defaults → old v3 drafts get discarded on load (safe — they don't have the new fields anyway).

---

## 2. Template Rendering: `renderMode` flag

### New field on CardTemplate

```typescript
interface CardTemplate {
  id: string;
  name: string;
  description: string;
  cardTypes: CardType[];
  cardFormat: CardFormat;
  renderMode: "spread" | "pages";  // NEW
  panels: PanelTemplate[];         // "spread" = 1 panel (the spread), "pages" = N panels (each = 1 page)
}
```

**Existing templates S1-S4, E1-E2, F1-F2:** `renderMode: "pages"` (unchanged behavior — each panel = separate page)
**New templates T1-T6:** `renderMode: "spread"` (single page, left+right halves or 3 columns)

### card-to-html.ts rendering logic

```typescript
if (template.renderMode === "spread") {
  // ONE page — render spread panel at full dimensions (140×105mm)
  const spreadPanel = template.panels[0]; // spread has 1 panel
  pages += await renderPanel(spreadPanel, state, ...images, dims.widthMm, dims.heightMm);
} else if (isFolded) {
  // Existing folded logic (2 spread pages) — UNCHANGED
  ...
} else {
  // Existing single logic (each panel = 1 page) — UNCHANGED
  for (const panel of template.panels) {
    pages += await renderPanel(panel, ...);
    pages += PAGE_BREAK;
  }
}
```

---

## 3. Layout Structural Matrix (6 NEW Templates: T1-T6)

All T1-T6 have `renderMode: "spread"` and ONE panel (the full 140×105mm spread).

---

### T1 = TI 04: "Zwei-Spalten Text" (Two-Column Typography)

**Structure:** Two columns (60/40), NO image, NO decoration.

```
┌──────────────────────────┬─────────────────┐
│ LEFT (60%)                │ RIGHT (40%)      │
│                           │                  │
│ [heading]                 │                  │
│ [relationshipLabels]      │                  │
│                           │  [birthDate]     │
│ [name] (large, bold)      │  –               │
│                           │  [deathDate]     │
│ [quote] (italic)          │                  │
│                           │  (right-aligned, │
│ ([quoteAuthor])           │   vert. centered)│
└──────────────────────────┴─────────────────┘
```

**CSS Grid:** `grid-template-columns: 60% 40%; grid-template-rows: 1fr;`

**Slots:**
| Slot | gridArea | textFields | Style overrides |
|------|----------|------------|-----------------|
| left-text | 1/1/2/2 | heading, relationshipLabels, name, quote, quoteAuthor | textAlign: left, name: bold large, quote: italic |
| right-dates | 1/2/2/3 | birthDate, deathDate | textAlign: right, vert-center |

---

### T2 = TI 05: "Foto Links" (Classic 50/50 Split)

**Structure:** 50/50, full photo left, text right.

```
┌─────────────────────┬─────────────────────┐
│ LEFT (50%)           │ RIGHT (50%)          │
│                      │                      │
│   [photo]            │  [name] (bold)       │
│   (full, cover)      │  [birthDate]         │
│                      │  [deathDate]         │
└─────────────────────┴─────────────────────┘
```

**CSS Grid:** `grid-template-columns: 1fr 1fr; grid-template-rows: 1fr;`

**Slots:**
| Slot | gridArea | Content | Style |
|------|----------|---------|-------|
| left-photo | 1/1/2/2 | photo | cover, full |
| right-text | 1/2/2/3 | name, birthDate, deathDate | center, name bold |

---

### T3 = TI 06: "L-Form" (L-Shape Layout)

**Structure:** Photo top-left, name top-right, quote bottom full-width. ALL CAPS for name + quote.

```
┌────────────┬───────────────────────────────┐
│ TOP-LEFT    │ TOP-RIGHT                      │
│ [photo]     │ [name] (UPPERCASE, bold)       │
│ (square)    │ [birthDate] [deathDate]        │
├─────────────┴───────────────────────────────┤
│ BOTTOM (FULL WIDTH)                          │
│ [quote] (UPPERCASE, centered)                │
└──────────────────────────────────────────────┘
```

**CSS Grid:** `grid-template-columns: 2fr 3fr; grid-template-rows: 3fr 2fr;`

**Slots:**
| Slot | gridArea | Content | Style overrides |
|------|----------|---------|-----------------|
| top-left-photo | 1/1/2/2 | photo | square crop |
| top-right-text | 1/2/2/3 | name, birthDate, deathDate | name: UPPERCASE bold |
| bottom-quote | 2/1/3/3 | quote | UPPERCASE, centered, colSpan=2 |

---

### T4 = TI 07: "Drei-Spalten" (Three-Column Symbolic)

**Structure:** THREE columns — ornament / text / photo.

```
┌──────┬──────────────────────────┬───────────┐
│ (15%)│ CENTER (55%)              │ (30%)     │
│      │                           │           │
│[orna-│ [name] (large)            │ [photo]   │
│ ment]│ [birthDate]               │ (portrait,│
│      │ [locationBirth] (italic)  │  framed)  │
│      │ [deathDate]               │           │
│      │ [locationDeath] (italic)  │           │
│      │ [dividerSymbol]           │           │
└──────┴──────────────────────────┴───────────┘
```

**CSS Grid:** `grid-template-columns: 15% 55% 30%; grid-template-rows: 1fr;`

**Slots:**
| Slot | gridArea | Content | Style |
|------|----------|---------|-------|
| left-ornament | 1/1/2/2 | decoration (ornamentAsset) | contain, centered |
| center-text | 1/2/2/3 | name, birthDate, locationBirth, deathDate, locationDeath, dividerSymbol | locations: italic |
| right-photo | 1/3/2/4 | photo | portrait, with padding |

---

### T5 = TI 08: "Portrait-Fokus" (Portrait-Focus Stack)

**Structure:** Photo+name left (40%), quote right (60%).

```
┌─────────────────────┬─────────────────────┐
│ LEFT (40%)           │ RIGHT (60%)          │
│                      │                      │
│  [photo] (70%)       │  [quote]             │
│                      │  (italic, centered,  │
│──────────────────── │   spans full height) │
│  [name]              │                      │
│  [birthDate]         │                      │
│  [deathDate]         │                      │
└─────────────────────┴─────────────────────┘
```

**CSS Grid:** `grid-template-columns: 40% 60%; grid-template-rows: 7fr 3fr;`

**Slots:**
| Slot | gridArea | Content | Style |
|------|----------|---------|-------|
| left-photo | 1/1/2/2 | photo | cover |
| left-name | 2/1/3/2 | name, birthDate, deathDate | centered |
| right-quote | 1/2/3/3 | quote | italic, centered, rowSpan=2 |

---

### T6 = TI 09: "Ornamental Symmetrisch" (Three-Column Symmetrical)

**Structure:** Three columns — quote / ornament / content+photo.

```
┌──────────────────┬──────┬──────────────────┐
│ LEFT (42%)        │(16%) │ RIGHT (42%)       │
│                   │      │                   │
│ [quote]           │[orna-│ [heading]         │
│ (italic)          │ ment]│ [name] (bold)     │
│                   │      │ [birthDate]       │
│                   │      │ [deathDate]       │
│                   │      │ ─────────         │
│                   │      │ [closingVerse]    │
│                   │      │ (italic)          │
│                   │      │ [photo] (small)   │
└──────────────────┴──────┴──────────────────┘
```

**CSS Grid:** `grid-template-columns: 42% 16% 42%; grid-template-rows: 1fr;`

**Slots:**
| Slot | gridArea | Content | Style |
|------|----------|---------|-------|
| left-quote | 1/1/2/2 | quote | italic, vert-centered |
| center-ornament | 1/2/2/3 | decoration | contain, centered |
| right-content | 1/3/2/4 | heading, name, birthDate, deathDate, dividerSymbol, closingVerse | name bold, verse italic |

**Special — T6 right slot compound (text + small photo):**
The right slot is `type: "text"` but also needs a small photo at bottom. Solution: add optional `includePhoto: boolean` + `photoMaxHeight: string` to `TemplateSlot`. When `includePhoto` is true, the text slot renderer appends a photo div at the bottom:
```typescript
interface TemplateSlot {
  ...existing fields...
  includePhoto?: boolean;       // default false — only T6 right slot uses this
  photoMaxHeight?: string;      // e.g., "30%" — limits photo height within the slot
}
```
In `renderTextSlot()`: if `slot.includePhoto && state.photo.url`, append `<div style="max-height:30%;"><img src="..." style="object-fit:cover;width:100%;max-height:100%;" /></div>` after the text content. In `CardRenderer.tsx`: same logic — append `<Image>` after `<TextBlockRenderer>`.
This avoids a new slot type and keeps rendering simple.

---

## 4. Typography Rules

### Per-field default styles (in FIELD_STYLES map for card-to-html.ts):

| Field | font-weight | font-style | text-transform | font-size default |
|-------|------------|------------|----------------|-------------------|
| heading | normal | normal | none | 10px |
| relationshipLabels | normal | normal | none | 10px |
| name | **bold** | normal | none | 22px |
| birthDate | normal | normal | none | 12px |
| deathDate | normal | normal | none | 12px |
| locationBirth | normal | **italic** | none | 10px |
| locationDeath | normal | **italic** | none | 10px |
| quote | normal | **italic** | none | 11px |
| quoteAuthor | normal | normal | none | 9px |
| closingVerse | normal | **italic** | none | 10px |
| dividerSymbol | normal | normal | none | 12px |
| dates | normal | normal | none | 12px |

### Per-template style overrides

Some templates need different styling. Stored in `TemplateSlot`:

```typescript
interface TemplateSlot {
  id: string;
  type: SlotType;
  gridArea: string;
  placeholder: string;
  textFields?: string[];
  textAlign?: "left" | "center" | "right";  // NEW — per-slot override. Renderer uses: slot.textAlign ?? textContent.textAlign
  styleOverrides?: Record<string, { weight?: string; style?: string; transform?: string }>;  // NEW
}
```

**T1 left slot:** `textAlign: "left"`
**T1 right slot:** `textAlign: "right"`
**T3 top-right + bottom:** `styleOverrides: { name: { transform: "uppercase" }, quote: { transform: "uppercase" } }`

---

## 5. Scoring Engine (100 pts)

| # | Component | Points | Check |
|---|-----------|--------|-------|
| 1 | Layout Structure | 20 | correct columns/rows, correct proportions |
| 2 | Photo Placement | 15 | correct position, size, crop mode |
| 3 | Text Positioning | 15 | each text element in correct zone |
| 4 | Font Hierarchy | 15 | name > dates > quote sizes correct |
| 5 | Spacing/Margins | 10 | padding, gaps, negative space |
| 6 | Decoration Placement | 10 | ornament correct position or N/A |
| 7 | Typography Style | 10 | bold/italic/uppercase per field |
| 8 | Background | 5 | white, clean, no artifacts |

**Implementation:** `scripts/score-template.ts` — generates PDF, converts to PNG via Puppeteer screenshot, then runs programmatic checks on the generated HTML (parse grid values, check font-weight/style/transform, verify image presence). Manual visual comparison for spacing/margins.

**Pass: ≥90 pts.**

---

## 6. Execution Batches

### Batch 0: Foundation (NO breaking changes)
1. Add new fields to `TextContent` interface in `wizard-state.ts` (additive only)
2. Add new defaults to `DEFAULT_TEXT_CONTENT`
3. Expand `SET_TEXT_STRING` and `SET_TEXT_NUMBER` action unions
4. Add `FIELD_STYLES` map to `card-to-html.ts` with per-field bold/italic/uppercase
5. Expand `FIELD_FONT_SIZE_MAP` with new fields: `birthDate`→`datesFontSize`, `deathDate`→`datesFontSize`, `locationBirth`→`locationFontSize`, `locationDeath`→`locationFontSize`, `quoteAuthor`→`quoteAuthorFontSize`, `closingVerse`→`closingVerseFontSize`, `relationshipLabels`→`headingFontSize`
6. Update `renderTextSlot()` to apply `FIELD_STYLES` per field + use `slot.textAlign ?? textContent.textAlign`
6. Add `renderMode: "spread" | "pages"` to `CardTemplate` interface
7. Set `renderMode: "pages"` on ALL existing templates (S1-S4, E1-E2, F1-F2)
8. Add spread rendering path to `card-to-html.ts` (new branch, doesn't touch existing code)
9. Add per-slot `textAlign` and `styleOverrides` to `TemplateSlot` interface
10. `npx tsc --noEmit` — must pass with ZERO errors
11. Commit: "feat: foundation for spread templates — new fields, typography, renderMode"

### Batch 1: Template T1 (= TI 04 "Zwei-Spalten Text")
1. Add T1 template definition to `card-templates.ts`
2. Generate PDF with T1 test data → save to desktop
3. Compare with TI 04 reference → score
4. Fix layout/spacing/typography until ≥90
5. Email final PDF to ofir393@gmail.com

### Batch 2: Template T2 (= TI 05 "Foto Links")
Same process as Batch 1.

### Batch 3: Template T3 (= TI 06 "L-Form")
Same + UPPERCASE styleOverrides.

### Batch 4: Template T4 (= TI 07 "Drei-Spalten")
Same + 3-column grid + location italic.

### Batch 5: Template T5 (= TI 08 "Portrait-Fokus")
Same + rowSpan for quote slot.

### Batch 6: Template T6 (= TI 09 "Ornamental Symmetrisch")
Same + 3-column + closingVerse + small photo in right slot.

### Batch 7: Final verification
1. Score all 6 templates — all ≥90
2. Email all 6 PDFs
3. Commit + push

---

## 7. Verification Checklist (Gemini)

Per template:
- [ ] Negative Space — enough "air" around quote?
- [ ] Image Aspect Ratio — portrait vs square vs small?
- [ ] Symbol Placement — ornament aligned with text center?
- [ ] German Formatting — DD.MM.YYYY, * and † symbols?
- [ ] Single Spread — ONE page, not two?
- [ ] Typography — bold names, italic quotes/locations, uppercase where needed?

---

## 8. Consumer Impact Analysis

### Files that reference TextContent fields:

| File | References old fields? | Action needed |
|------|----------------------|---------------|
| `wizard-state.ts` | Yes — interface, defaults, actions, reducer, isStepValid | ADD new fields only. NO renames. |
| `card-templates.ts` | Yes — textFields arrays in S1-S4, E1-E2, F1-F2 | UNCHANGED. Add T1-T6 with new fields. |
| `card-to-html.ts` | Yes — FIELD_FONT_SIZE_MAP, getFieldValue, renderTextSlot | ADD FIELD_STYLES, expand maps. |
| `TextBlockRenderer.tsx` | Yes — destructures heading, name, dates, quote | ADD new field rendering. Generic loop preferred. |
| `StepText.tsx` | Yes — tc.heading, tc.name, tc.dates, tc.quote | ADD new field inputs for T1-T6 mode. |
| `StepOrder.tsx` | Yes — state.textContent.name | UNCHANGED (name field still exists). |
| `text-templates.ts` | Yes — { heading, name, dates, quote } | ADD templates for T1-T6 with new fields. |
| `de.json` / `en.json` | Yes — wizard.text.* | ADD new translation keys. |
| `StepPreview.tsx` | No direct field refs | UNCHANGED. |
| `StepDecorations.tsx` | No direct field refs | UNCHANGED. |

**Total: 8 files need changes, 2 unchanged. ZERO breaking changes because no renames.**

---

## 9. What stays UNCHANGED

- Templates S1-S4, E1-E2, F1-F2 — untouched, `renderMode: "pages"`
- Old wizard flow (8 steps) — works as before
- `isStepValid` — `state.textContent.name.trim()` still works (field not renamed)
- `StepOrder.tsx` — `state.textContent.name` still works
- Draft localStorage — v4 drafts backward compatible (new fields have defaults)
- E2E tests — existing tests pass (old templates unchanged)
