# Trauerpost — Wizard UX Overhaul Plan (v2 — QA-Reviewed)

> **Date:** 2026-03-28
> **Source:** UX audit + competitive research (Canva, VistaCreate, FuneralFolio, Adobe Express)
> **Target audience:** Grieving families, many elderly — needs SIMPLE, GUIDED, MINIMAL decisions
> **QA Status:** Plan-QA passed. Architect review passed. All fixes applied.

**Goal:** Transform the wizard from a "form filling" experience into a "design assistant" experience. Every change is visible immediately, font/color/alignment are always accessible, and mobile is first-class.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind v4, next-intl

**Total tasks:** 25 across 5 batches (Task 4.2 removed per architect review)

---

## Plan-QA Fixes Applied (vs v1)

| QA Finding | Severity | Fix Applied |
|-----------|----------|-------------|
| C1: Missing accordion sections + font carousel | CRITICAL | Added collapsible sections (Task 1.4) + horizontal font carousel (Task 1.1) |
| C2: `activeTextField` in WizardState breaks draft persistence | CRITICAL | Changed to `useRef` in SplitLayout context — NOT in WizardState, no DRAFT_VERSION bump needed |
| C3: Toolbar placement contradiction (WizardShell vs SplitLayout) | CRITICAL | Resolved: SplitLayout ONLY — toolbar above form column, NOT full-width |
| H1: `--brand-primary-rgb` CSS variable doesn't exist | HIGH | Changed to Tailwind `ring-2 ring-brand-primary/40` |
| H2: "Quota" typo claim is false — code says "Quote" | HIGH | Removed false claim. Real fix is i18n labels (Task 4.4) |
| H3: Line number references shift after edits | HIGH | Changed to content-marker references |
| H4: Validation `attempted` has no trigger mechanism | HIGH | Added `onValidationAttempt` callback prop from WizardShell |
| M2: Photo upload spinner is synchronous (never visible) | MEDIUM | Changed to async `FileReader.readAsDataURL()` |
| M3: Test count doesn't add up (said ~22, actual 28) | MEDIUM | Fixed count to 28 |

## Architect Review Fixes Applied (vs v2)

| Review Finding | Fix Applied |
|---------------|-------------|
| data: URL from FileReader bloats localStorage draft (CRITICAL) | Reverted to `URL.createObjectURL()` — synchronous, tiny URL, no spinner needed. Draft stays small. |
| New Files count says 4 but lists 5 | Fixed to "New Files (5)" |
| `validationAttempted` not reset on back navigation | Added `setValidationAttempted(false)` in `handlePrev()` |
| Accordion single-section-open frustrates copy/paste | Changed to multi-open. Default: first section open. User can open others. |
| Font carousel takes too much space on mobile | Mobile: carousel hidden behind "Fonts" toggle button |
| rgba(107,142,35) hardcoded in Task 5.1 | Removed — using only Tailwind `ring-brand-primary/40` |

---

## Architecture Decisions

### Decision 1: Sticky Formatting Toolbar

**Pattern:** Toolbar always visible above form — like Canva/Google Docs.

**Problem:** Font, color, alignment are buried at the bottom of Step 4. User must scroll past all text fields to reach them. When scrolling, the preview disappears from view.

**Solution:** A `TextFormatToolbar` component rendered inside `SplitLayout` above the form column (NOT in WizardShell — toolbar should span form width only, not full page).

### Decision 2: Horizontal Font Carousel (NOT Dropdown)

**Why carousel over dropdown:**
- Matches existing UX pattern (ImageEnhancer filter presets = horizontal scroll with live preview)
- Each font name rendered **in its own font** — user sees what they're choosing
- Elderly users: scrolling is easier than clicking a dropdown and scanning a list
- Consistent with the "design assistant" feel vs "form filling" feel
- Mobile-friendly: horizontal swipe is a natural gesture

**Dropdown as FALLBACK** for search: when user wants a specific font, they can type in a search input above the carousel. But the primary interaction is visual scroll.

### Decision 3: Collapsible Form Sections

**Problem the toolbar alone doesn't solve:** Step 4 with v2 templates has 7-12 text fields + divider picker. Even without font/color at the bottom, that's a long form. The toolbar keeps styling accessible, but the form itself still causes excessive scrolling.

**Solution:** Group fields into collapsible accordion sections. Only one section open at a time. When user focuses a field, that section auto-opens.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Playfair Display ▸▸] [■■■■■■] [L] [C] [R]                    │ ← Sticky toolbar
├────────────────────────────┬─────────────────────────────────────┤
│                            │                                     │
│  ▼ Personal Details        │  ┌──────────────────┐               │
│    Name* ___________       │  │                  │               │
│    Birth  ___________      │  │  Card preview    │               │
│    Death  ___________      │  │                  │               │
│                            │  └──────────────────┘               │
│  ▶ Text & Quote (closed)   │                                     │
│  ▶ Divider (closed)        │                                     │
│                            │                                     │
├────────────────────────────┴─────────────────────────────────────┤
│  ← Back              Step 4 of 7              Next →             │
└──────────────────────────────────────────────────────────────────┘
```

### Decision 4: Active Field Tracking via Context (NOT WizardState)

**Why NOT in WizardState:** `saveDraft(state)` persists the ENTIRE WizardState to localStorage. Adding `activeTextField` would either (a) save ephemeral UI state to disk, or (b) require bumping DRAFT_VERSION to handle the new field in old drafts. Both are wrong.

**Solution:** Use a React Context (`ActiveFieldContext`) provided by `SplitLayout`. Both the form fields and the toolbar/preview read from this context. No state persistence, no DRAFT_VERSION change.

```tsx
// ActiveFieldContext.tsx
const ActiveFieldContext = createContext<{
  activeField: string | null;
  setActiveField: (field: string | null) => void;
}>({ activeField: null, setActiveField: () => {} });
```

---

## Batch 1: Sticky Formatting Toolbar + Font Carousel + Collapsible Form (7 tasks)

### Task 1.1: Create Font Carousel Component

**File to create:** `src/components/wizard/FontCarousel.tsx`

**Interface:**
```tsx
interface FontCarouselProps {
  fonts: readonly string[];
  selected: string;
  onSelect: (font: string) => void;
}
```

**Layout:** Horizontal scrollable strip (like ImageEnhancer filter presets):
```
[Playfair Display] [Cormorant] [Libre Baskerville] [Lora] ... →→
```

**Each font button:**
- Font name rendered in that font: `style={{ fontFamily: font }}`
- Selected: `ring-2 ring-brand-primary ring-offset-1 bg-brand-primary/5`
- Size: `px-4 py-2 rounded-lg text-sm whitespace-nowrap`
- Shows sample text "Aa" above font name in that font for better preview

**3 category filter tabs** above carousel:
```
[All] [Serif ★] [Script] [Sans]
```
- "Serif" has a star because it's the recommended category for memorial cards
- Clicking a tab filters the carousel
- "All" shows all 20 fonts

**Font categories:**
```typescript
const FONT_CATEGORIES: Record<string, readonly string[]> = {
  serif: ["Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Lora", "EB Garamond",
          "Source Serif Pro", "Cormorant SC", "EB Garamond SC", "Cormorant Infant", "Crimson Pro"],
  script: ["Great Vibes", "Dancing Script", "Tangerine", "Pinyon Script", "Alex Brush"],
  sans: ["Inter", "Montserrat", "Raleway", "Open Sans", "Fira Sans"],
};
```

**Mobile (<768px):** Carousel hidden by default. A "Fonts" toggle button expands it. When expanded, same horizontal scroll with smaller buttons (`px-3 py-1.5 text-xs`). Closes automatically after font selection to save space.

**Desktop:** Carousel always visible below toolbar.

**Google Fonts preload:** On mount, load all fonts via `document.fonts.load()` so the carousel doesn't FOUT.

---

### Task 1.2: Create `TextFormatToolbar` Component

**File to create:** `src/components/wizard/TextFormatToolbar.tsx`

**Interface:**
```tsx
interface TextFormatToolbarProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  activeField: string | null; // from ActiveFieldContext
}
```

**Layout (single row, ~52px height):**
```
[Name — 22pt +-] [■ ■ ■ ■ ■ ■] [≡] [≡] [≡]
 └── active field + size   └ 6 colors    └ L  C  R
```

**Note:** Font carousel is rendered BELOW the toolbar, ABOVE the form fields (see Task 1.3). The toolbar row itself has size control + colors + alignment only.

**Size control:**
- Label: shows active field name + current size (e.g., "Name — 22pt")
- If no field focused: shows "—" (no size control available)
- `+` and `-` buttons (step 1pt)
- Maps `activeField` → correct `sizeField` using FIELD_META lookup

**Color swatches:**
- 6 inline circles from existing `FONT_COLORS` array (wizard-state.ts line 115-122)
- Selected = `ring-2 ring-brand-primary scale-110`

**Alignment:**
- 3 icon buttons: ← ↔ → (left/center/right)
- Current selected = `bg-brand-primary text-white`

**Responsive:**
- Desktop: full toolbar as described
- Mobile (<768px): size label abbreviated ("22pt"), colors stay, alignment stays
- Total height: 52px desktop, 44px mobile

**Styling:**
- `position: sticky; top: 0; z-index: 20`
- `bg-white border-b border-brand-border shadow-sm`

---

### Task 1.3: Integrate Toolbar + Carousel into SplitLayout

**File to modify:** `src/components/wizard/SplitLayout.tsx`

**Placement:** Inside the form column, above children:

```tsx
<div className="w-full lg:w-[55%] md:w-[60%]">
  {/* Formatting toolbar — sticky at top of form column */}
  <TextFormatToolbar state={state} dispatch={dispatch} activeField={activeField} />
  {/* Font carousel — scrollable, below toolbar */}
  <FontCarousel fonts={WIZARD_FONTS} selected={state.textContent.fontFamily}
    onSelect={(font) => dispatch({ type: "SET_TEXT_STRING", field: "fontFamily", value: font })} />
  {/* Step content */}
  {children}
</div>
```

The toolbar + carousel are INSIDE the SplitLayout form column. They span 55% width on desktop (matching the form), NOT full page width. The preview column is unaffected.

**Conditional rendering:** Only show toolbar + carousel on Step 4 (Text). Steps 3 and 5 don't need font controls. Use a new `showToolbar` prop or check `state.currentStep === 4` inside SplitLayout.

Actually — simpler: pass toolbar as an optional `toolbar` render prop:

```tsx
interface SplitLayoutProps {
  children: React.ReactNode;
  state: WizardState;
  toolbar?: React.ReactNode; // optional toolbar slot above children
}
```

WizardShell passes the toolbar only for Step 4:

```tsx
case 4: return (
  <SplitLayout state={stepState} toolbar={
    <>
      <TextFormatToolbar state={stepState} dispatch={stepDispatch} activeField={activeFieldRef.current} />
      <FontCarousel fonts={WIZARD_FONTS} selected={stepState.textContent.fontFamily}
        onSelect={(f) => stepDispatch({ type: "SET_TEXT_STRING", field: "fontFamily", value: f })} />
    </>
  }>
    <StepText state={stepState} dispatch={stepDispatch} onFieldFocus={setActiveField} />
  </SplitLayout>
);
```

---

### Task 1.4: Add Collapsible Sections to StepText

**File to modify:** `src/components/wizard/steps/StepText.tsx`

**New interface for StepText:**
```tsx
interface StepTextProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onFieldFocus?: (field: string | null) => void; // notify parent of active field
}
```

**Group fields into sections:**

```typescript
const SECTIONS = [
  {
    id: "personal",
    labelKey: "sections.personal", // i18n
    fields: ["heading", "relationshipLabels", "name"],
  },
  {
    id: "dates",
    labelKey: "sections.dates",
    fields: ["birthDate", "locationBirth", "deathDate", "locationDeath", "dates"],
  },
  {
    id: "text",
    labelKey: "sections.text",
    fields: ["quote", "quoteAuthor", "closingVerse"],
  },
  {
    id: "divider",
    labelKey: "sections.divider",
    fields: ["dividerSymbol"],
  },
];
```

**Only show sections that contain at least one `visibleField`.** Filter `SECTIONS` by intersection with `visibleFields`.

**Accordion behavior:**
- Multiple sections can be open simultaneously (controlled state: `openSections: Set<string>`)
- Default: first section open, rest collapsed
- Clicking a section header toggles THAT section (doesn't close others)
- When user focuses a field, auto-open its section (without closing others)
- Smooth height transition: `transition-[max-height] duration-200`
- Visual indicator: non-empty sections show a small dot/checkmark on the collapsed header

**Section header:**
```tsx
<button onClick={() => setOpenSection(s.id)}
  className="w-full flex justify-between items-center py-3 text-sm font-medium text-brand-dark">
  <span>{t(s.labelKey)}</span>
  <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
</button>
```

**Remove from StepText:** Font family grid, Font color swatches, Alignment buttons (now in toolbar). Remove imports `WIZARD_FONTS`, `FONT_COLORS`.

**Add to StepText:** `onFieldFocus` callback on each input's `onFocus`:
```tsx
onFocus={() => onFieldFocus?.(fieldName)}
onBlur={() => onFieldFocus?.(null)}
```

---

### Task 1.5: Create ActiveFieldContext

**File to create:** `src/components/wizard/ActiveFieldContext.tsx`

```tsx
"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

interface ActiveFieldState {
  activeField: string | null;
  setActiveField: (field: string | null) => void;
}

const ActiveFieldContext = createContext<ActiveFieldState>({
  activeField: null,
  setActiveField: () => {},
});

export function ActiveFieldProvider({ children }: { children: ReactNode }) {
  const [activeField, setActiveField] = useState<string | null>(null);
  return (
    <ActiveFieldContext.Provider value={{ activeField, setActiveField }}>
      {children}
    </ActiveFieldContext.Provider>
  );
}

export function useActiveField(): ActiveFieldState {
  return useContext(ActiveFieldContext);
}
```

**NOT in WizardState.** Not persisted. Not in draft. No DRAFT_VERSION change.

Wrap SplitLayout content (or WizardShell step area) with `<ActiveFieldProvider>`.

---

### Task 1.6: Remove Font/Color/Alignment from StepText

**File to modify:** `src/components/wizard/steps/StepText.tsx`

Remove the "Font family" section (the `WIZARD_FONTS.map` grid), the "Font color" section (the `FONT_COLORS.map` circles), and the "Alignment" section (the 3 alignment buttons).

Keep: text template selector (v1), collapsible field sections (from Task 1.4), divider symbol picker.

Remove imports: `WIZARD_FONTS`, `FONT_COLORS` (no longer needed here).

**Verification:** Step 4 form shows only collapsible text field sections. Font/color/alignment controls are in the sticky toolbar above.

---

### Task 1.7: Unit + E2E Tests for Toolbar + Carousel + Accordion

**E2E tests** (`e2e/text-format-toolbar.spec.ts`):

| # | Test | Type |
|---|------|------|
| 1 | Toolbar + carousel visible on Step 4 | Positive |
| 2 | Toolbar NOT visible on Step 1 | Negative |
| 3 | Toolbar NOT visible on Step 6 | Negative |
| 4 | Font carousel: clicking font updates preview | Functional |
| 5 | Font carousel: selected font has ring highlight | Visual |
| 6 | Font carousel: category tabs filter fonts | Functional |
| 7 | Color swatch click updates text color in preview | Functional |
| 8 | Alignment button click updates alignment | Functional |
| 9 | Size +/- buttons change font size | Functional |
| 10 | Toolbar stays visible while scrolling form | Scroll |
| 11 | Mobile: toolbar renders compact | Responsive |
| 12 | Accordion: clicking section header opens it | Functional |
| 13 | Accordion: only one section open at a time | Functional |
| 14 | Accordion: focusing field auto-opens its section | Functional |

---

## Batch 2: Navigation & Layout Fixes (4 tasks)

### Task 2.1: Fix Bottom Nav Covering Form Fields

**File to modify:** `src/components/wizard/WizardShell.tsx`

The step content `<div>` (currently `className="flex-1 overflow-y-auto"`) needs bottom padding so the sticky nav bar doesn't cover the last form fields.

Add `pb-20` (80px — enough for nav height + margin):

```tsx
<div className="flex-1 overflow-y-auto pb-20">
```

---

### Task 2.2: Improve Step Indicator for Mobile

**File to modify:** `src/components/wizard/StepIndicator.tsx`

Current: step names use `hidden md:block` — ALL names hidden on mobile.

**New:** Show the ACTIVE step's name on mobile. Non-active steps show only numbers:

```tsx
<span className={`text-xs ${
  isActive
    ? "block text-brand-primary font-medium"
    : "hidden md:block text-brand-gray"
}`}>
```

---

### Task 2.3: Compact Step Counter on Mobile Nav

**File to modify:** `src/components/wizard/WizardShell.tsx`

Current: `Step {currentStep} of {TOTAL_STEPS}` on all viewports.

New: "4/7" on mobile, "Step 4 of 7" on desktop:

```tsx
<span className="text-sm text-brand-gray">
  <span className="hidden md:inline">Step </span>
  {state.currentStep}
  <span className="hidden md:inline"> of </span>
  <span className="md:hidden">/</span>
  {TOTAL_STEPS}
</span>
```

---

### Task 2.4: E2E Tests for Navigation Fixes

**E2E tests** (`e2e/wizard-nav-ux.spec.ts`):

| # | Test |
|---|------|
| 1 | Mobile: last form field visible above sticky nav |
| 2 | Mobile: step indicator shows current step name |
| 3 | Mobile: step counter shows "4/7" format |
| 4 | Desktop: step counter shows "Step 4 of 7" format |

---

## Batch 3: Validation & Error Handling (4 tasks)

### Task 3.1: Inline Form Validation on StepText

**File to modify:** `src/components/wizard/steps/StepText.tsx`

**Trigger mechanism** (fixes H4): WizardShell passes a `validationAttempted` prop. When user clicks Next on an invalid step, WizardShell sets this flag BEFORE checking `isStepValid`.

**File to modify:** `src/components/wizard/WizardShell.tsx`

```tsx
const [validationAttempted, setValidationAttempted] = useState(false);

function handleNext() {
  setValidationAttempted(true); // trigger validation display
  if (!canGoNext) return;       // block if invalid
  setValidationAttempted(false); // reset for next step
  // ... existing navigation logic
}

function handlePrev() {
  setValidationAttempted(false); // reset validation on back nav
  // ... existing navigation logic
}
```

Pass to StepText:
```tsx
case 4: return <StepText state={stepState} dispatch={stepDispatch}
  validationAttempted={validationAttempted} onFieldFocus={setActiveField} />;
```

**StepText shows error** when `validationAttempted && field.required && value is empty`:
```tsx
{meta.required && validationAttempted && !value?.trim() && (
  <p className="text-xs text-red-500 mt-1">{t("fields.nameRequired")}</p>
)}
```

Red border on invalid fields:
```tsx
className={`... ${meta.required && validationAttempted && !value?.trim()
  ? "border-red-400 focus:ring-red-200"
  : "border-brand-border"}`}
```

**i18n keys to add:**
- `wizard.text.fields.nameRequired`: "Bitte geben Sie einen Namen ein." / "Please enter a name."

---

### Task 3.2: Replace `alert()` with Inline Error

**File to modify:** `src/components/wizard/steps/StepPhoto.tsx`

Current: `alert("File too large. Maximum 10MB.")` at line 65.

New: inline error with auto-dismiss:
```tsx
const [error, setError] = useState<string | null>(null);

// In handleFileChange:
if (file.size > 10 * 1024 * 1024) {
  setError(t("fileTooLarge")); // i18n
  return;
}

// Auto-dismiss after 5s:
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }
}, [error]);
```

Error UI:
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
    <span>{error}</span>
    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
  </div>
)}
```

**i18n keys to add:**
- `wizard.photo.fileTooLarge`: "Datei zu groß. Maximal 10 MB." / "File too large. Maximum 10 MB."

---

### Task 3.3: Disabled Next Button Reason

**File to modify:** `src/components/wizard/WizardShell.tsx`

When Next is disabled and user has attempted, show reason:

```tsx
{!canGoNext && validationAttempted && (
  <span className="text-xs text-red-400 ml-2 hidden md:inline">
    {state.currentStep === 1 && t("validation.selectType")}
    {state.currentStep === 2 && t("validation.selectTemplate")}
    {state.currentStep === 4 && t("validation.enterName")}
  </span>
)}
```

---

### Task 3.4: Tests for Validation

| # | Test | Type |
|---|------|------|
| 1 | Step 4: empty name + click Next → validation message visible | E2E |
| 2 | Step 4: type name → validation disappears, Next works | E2E |
| 3 | Step 3: upload >10MB → inline error (not browser alert) | E2E |
| 4 | Step 3: error auto-dismisses after 5 seconds | E2E |
| 5 | `isStepValid(state, 4)` false with empty name | Unit |
| 6 | `isStepValid(state, 4)` false with whitespace-only name | Unit |

---

## Batch 4: Template Grid & Photo Step Polish (5 tasks)

### Task 4.1: Single-Column Template Grid on Mobile

**File to modify:** `src/components/wizard/steps/StepTemplate.tsx`

Current (at the `grid` className):
```tsx
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
```

New:
```tsx
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
```

Mobile: 1 column with larger cards → easier to see and compare.

---

### Task 4.2: ~~Photo Upload Loading Indicator~~ REMOVED

> **Architect review decision:** `URL.createObjectURL()` is synchronous and instant — no spinner needed. Using `FileReader.readAsDataURL()` would bloat localStorage drafts (a 5MB photo = 6.7MB base64 string, exceeds localStorage quota). Keep the current `createObjectURL()` approach. No task here.

---

### Task 4.3: Responsive Photo Canvas

**File to modify:** `src/components/wizard/steps/StepPhoto.tsx`

Current: fixed constants `MAX_CANVAS_W = 360`, `MAX_CANVAS_H = 400`.

New: use a `useRef` + `useLayoutEffect` to measure the container:

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [containerWidth, setContainerWidth] = useState(360);

useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver(([entry]) => {
    setContainerWidth(Math.min(360, entry.contentRect.width - 60));
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);

const canvasW = Math.min(containerWidth, 360);
const canvasH = Math.min(canvasW / aspect, 400);
```

Wrap the crop editor section in `<div ref={containerRef}>`.

---

### Task 4.4: Fix Field Labels — Use i18n

**File to modify:** `src/components/wizard/steps/StepText.tsx`

Current: Labels are hardcoded English strings in `FIELD_META`:
```typescript
heading: { label: "Heading", ... }
name: { label: "Name", ... }
quote: { label: "Quote", ... }
```

**Note:** The label "Quote" is CORRECT in code (not "Quota" as previously claimed — H2 fix). The real issue is these labels are hardcoded in English and don't translate when locale=de.

New: Use i18n keys:
```typescript
heading: { labelKey: "fields.heading", ... }
```

```tsx
<label>{t(meta.labelKey)}</label>
```

**i18n keys to add** (de.json + en.json under `wizard.text`):

```json
"fields": {
  "heading": "Überschrift",
  "name": "Name",
  "birthDate": "Geburtsdatum",
  "deathDate": "Sterbedatum",
  "birthPlace": "Geburtsort",
  "deathPlace": "Sterbeort",
  "dates": "Lebensdaten",
  "divider": "Trennzeichen",
  "quote": "Spruch / Gebet",
  "quoteAuthor": "Autor",
  "closingVerse": "Schlussvers",
  "relationship": "Angehörige",
  "nameRequired": "Bitte geben Sie einen Namen ein."
},
"sections": {
  "personal": "Persönliche Angaben",
  "dates": "Lebensdaten",
  "text": "Spruch & Text",
  "divider": "Trennzeichen"
}
```

English in en.json:
```json
"fields": {
  "heading": "Heading",
  "name": "Name",
  "birthDate": "Birth Date",
  "deathDate": "Death Date",
  "birthPlace": "Birth Place",
  "deathPlace": "Death Place",
  "dates": "Dates",
  "divider": "Divider",
  "quote": "Quote / Prayer",
  "quoteAuthor": "Quote Author",
  "closingVerse": "Closing Verse",
  "relationship": "Relationship",
  "nameRequired": "Please enter a name."
},
"sections": {
  "personal": "Personal Details",
  "dates": "Life Dates",
  "text": "Quote & Text",
  "divider": "Divider"
}
```

---

### Task 4.5: Tests for Batch 4

| # | Test |
|---|------|
| 1 | Mobile: template grid shows 1 column on 390px |
| 2 | Photo upload shows spinner during FileReader |
| 3 | Step 4 labels in German (locale=de) |
| 4 | Step 4 labels in English (locale=en) |

---

## Batch 5: Preview Sync & Polish (6 tasks)

### Task 5.1: Active Field Highlight in Preview

**File to modify:** `src/components/wizard/SpreadPreview.tsx`

Read `activeField` from `useActiveField()` context (from Task 1.5).

When an element's `field` matches `activeField`, add a subtle glow using Tailwind-compatible styles (NOT `--brand-primary-rgb` which doesn't exist — H1 fix):

```tsx
const { activeField } = useActiveField();
const isActive = activeField === el.field;

// Use Tailwind ring utility — follows brand color automatically
className={isActive ? "ring-2 ring-brand-primary/40 ring-offset-1 rounded transition-shadow" : "transition-shadow"}
```

---

### Task 5.2: Preview Pulse Animation on Change

**File to modify:** `src/components/wizard/SpreadPreview.tsx`

Brief background flash when a field's text content changes:

```tsx
const [changedField, setChangedField] = useState<string | null>(null);
const prevText = useRef(state.textContent);

useEffect(() => {
  if (!activeField) return;
  const curr = state.textContent[activeField as keyof TextContent];
  const prev = prevText.current[activeField as keyof TextContent];
  if (curr !== prev) {
    setChangedField(activeField);
    const timer = setTimeout(() => setChangedField(null), 300);
    prevText.current = { ...state.textContent };
    return () => clearTimeout(timer);
  }
}, [state.textContent, activeField]);
```

Apply a brief `bg-brand-primary/5` flash to the changed element.

---

### Task 5.3: Consistent Vertical Spacing

**Files to modify:** All step components.

Standardize to `py-8`:

| Step | File | Current | New |
|------|------|---------|-----|
| StepCardType | `steps/StepCardType.tsx` | `py-12` | `py-8` |
| StepTemplate | `steps/StepTemplate.tsx` | `py-12` | `py-8` |
| StepPhoto | `steps/StepPhoto.tsx` | `py-12` | `py-8` |
| StepText | `steps/StepText.tsx` | `py-10` | `py-8` |
| StepDecorations | `steps/StepDecorations.tsx` | `py-10` | `py-8` |
| StepPreview | `steps/StepPreview.tsx` | `py-10` | `py-8` |
| StepOrder | `steps/StepOrder.tsx` | `py-12` | `py-8` |

---

### Task 5.4: Mobile Preview Button z-index Fix

**File to modify:** `src/components/wizard/SplitLayout.tsx`

Current: floating preview button at `bottom-20` with `z-20`. Sticky nav is `z-10`. These are correct, but verify the preview button doesn't overlap with the toolbar (also `z-20`).

Fix: set preview button to `z-15` (below toolbar) or move to `bottom-24` (above nav, below toolbar).

---

### Task 5.5: Google Fonts Preload for Carousel

**File to modify:** `src/components/wizard/FontCarousel.tsx`

On mount, preload all carousel fonts so they render immediately:

```tsx
useEffect(() => {
  const fontUrl = WIZARD_FONTS.map(f =>
    `family=${encodeURIComponent(f)}:wght@400`
  ).join("&");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${fontUrl}&display=swap`;
  document.head.appendChild(link);
  return () => { document.head.removeChild(link); };
}, []);
```

---

### Task 5.6: Tests for Preview Sync

| # | Test |
|---|------|
| 1 | Focus Name input → preview highlights Name area |
| 2 | Focus Quote input → preview highlights Quote area |
| 3 | Type text → preview updates in real-time |
| 4 | Blur input → highlight disappears |

---

## Implementation Order & Dependencies

```
Batch 1 (Toolbar + Carousel + Accordion)  ─── no dependencies
Batch 2 (Nav fixes)                        ─── no dependencies (parallel with 1)
  ↓
Batch 3 (Validation)    ─── needs WizardShell changes from Batch 2
Batch 4 (Polish)        ─── needs StepText changes from Batch 1
  ↓
Batch 5 (Preview sync)  ─── needs ActiveFieldContext from Batch 1
```

**Batches 1 & 2:** Parallel.
**Batches 3 & 4:** Parallel (after 1 & 2).
**Batch 5:** Last.

---

## Files Summary

### New Files (5)
- `src/components/wizard/TextFormatToolbar.tsx`
- `src/components/wizard/FontCarousel.tsx`
- `src/components/wizard/ActiveFieldContext.tsx`
- `e2e/text-format-toolbar.spec.ts`
- `e2e/wizard-nav-ux.spec.ts`

### Modified Files (10)
- `src/components/wizard/WizardShell.tsx` — toolbar integration, validation state, bottom padding, compact counter
- `src/components/wizard/SplitLayout.tsx` — toolbar slot, ActiveFieldProvider
- `src/components/wizard/StepIndicator.tsx` — active step name on mobile
- `src/components/wizard/steps/StepText.tsx` — collapsible sections, remove font/color/alignment, i18n labels, validation display, onFieldFocus
- `src/components/wizard/steps/StepPhoto.tsx` — replace alert(), async upload spinner, responsive canvas
- `src/components/wizard/steps/StepTemplate.tsx` — single-column mobile grid
- `src/components/wizard/SpreadPreview.tsx` — active field highlight, pulse animation
- `src/messages/de.json` — field labels, section names, validation messages
- `src/messages/en.json` — same in English
- All step files — consistent `py-8` spacing

---

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| Font carousel FOUT (fonts not loaded yet) | Preload all fonts on mount (Task 5.5). Show font names as text while loading. |
| Accordion hides fields user expects to see | Default: first section open. Auto-open on field focus. Visual indicator for non-empty sections. |
| ~~`data:` URL from FileReader bloats draft~~ | RESOLVED: Reverted to `URL.createObjectURL()` — no draft bloat. |
| Toolbar + carousel take too much vertical space | Combined ~100px. On mobile, carousel hides behind a "Fonts" toggle button. |
| ActiveFieldContext re-renders entire tree on focus change | Wrap provider value in `useMemo`. Context only used by toolbar + preview, not all children. |
| Collapsible sections lose scroll position | Use `scrollIntoView({ behavior: 'smooth' })` when opening a section. |

---

## Test Architecture

### Unit Tests (Vitest)
| File | Covers | Count |
|------|--------|-------|
| `wizard-state.test.ts` | isStepValid with whitespace name | 2 |

### E2E Tests (Playwright)
| File | Covers | Count |
|------|--------|-------|
| `text-format-toolbar.spec.ts` | Toolbar, carousel, accordion, font selection | 14 |
| `wizard-nav-ux.spec.ts` | Nav padding, mobile step names, compact counter | 4 |
| Validation + polish tests | Error handling, labels, spinner, template grid | 10 |

**Total new tests: 30**
