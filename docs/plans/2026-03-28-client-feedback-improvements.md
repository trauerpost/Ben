# Trauerpost — Client Feedback Improvements Plan (v3 — Architect-Reviewed)

> **Date:** 2026-03-28
> **Source:** Client feedback (Taube, WhatsApp 2026-03-27) + internal requirements
> **QA Status:** Plan-QA passed. Architect review passed. All fixes applied.

**Goal:** Address all client feedback — remove background step, add live side preview, fix preview/PDF bugs, add mockup display, add image enhancement, add local PDF download.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind v4, Puppeteer, `@huggingface/transformers` (background removal, dynamic import), CSS filters (image enhancement), Canvas API (sharpening)

**Total tasks:** 27 across 7 batches

---

## Architect Review Fixes Applied (vs v2)

| Review Finding | Fix Applied |
|---------------|-------------|
| Sharpening double-application bug | Added `sharpenedUrl` field — sharpening always works on source, never on previous result (Task 6.2, 6.3) |
| DRAFT_VERSION changed twice without order doc | Explicit sequence: Batch 1 sets 7, Batch 6 sets 8 (documented in both tasks) |
| `@huggingface/transformers` static import bloats bundle | Changed to `await import()` dynamic import — only loaded when user clicks button (Task 6.4) |
| `html2canvas` breaks SSR on Vercel | Changed to dynamic import inside click handler (Task 4.1) |

## Plan-QA Fixes Applied (vs v1)

| QA Finding | Fix Applied |
|-----------|-------------|
| C2: Two incompatible `photo` state shapes | Merged into ONE unified shape (Task 6.2) |
| H1: BUG-1 folded width already correct (370mm) | REMOVED BUG-1 entirely. Code is correct. |
| H2: Filter preset names bypass next-intl | Moved preset names to i18n (Task 7.3) |
| H3: SplitLayout `formContent` vs `children` | Changed to `children: React.ReactNode` |
| H4: `renderStepContent` doesn't exist | Uses actual function `renderStep(state, dispatch)` |
| M1: i18n key path wrong | Corrected to `wizard.steps.background` at `src/messages/de.json:178` |
| M2: `adjustmentsToFilter` ignores sharpness | Renamed to `adjustmentsToCSSFilter` + documented |

---

## Bugs Found During Investigation

| ID | File:Line | Issue | Severity |
|----|-----------|-------|----------|
| BUG-2 | `SpreadPreview.tsx:84` | Text scaled `* 0.8` in preview but NOT in PDF — 20% size mismatch | HIGH |
| BUG-3 | `route.ts:23` | Env var fallback chain `supabase_Secret || supabase_Secert` — typo. Also in `auth/register/route.ts:40` | HIGH |
| BUG-4 | `route.ts:11` | Only validates `cardType` — missing `templateId` and `name` validation | MEDIUM |
| BUG-5 | `pdf-generator.ts` | No error logging in Puppeteer — crashes produce no debug info | MEDIUM |
| BUG-6 | `card-to-html-v2.ts:22-23` | Image fetch failures return empty string silently | MEDIUM |
| BUG-7 | `SpreadPreview.tsx:233` | Google Fonts `<link>` in JSX — race condition, fonts may not load before render | LOW |

**NOTE:** Original BUG-1 (folded card width) was a false positive. `CARD_CONFIGS.trauerkarte.formats.folded.widthMm` is already `370` (double of 185mm single). The ternary `isFolded ? dims.widthMm : dims.widthMm` is redundant code but NOT a bug — both branches produce the correct value.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Background removal | `@huggingface/transformers` | Apache-2.0 license (not AGPL like @imgly), client-side, free, WebGPU support |
| Image filters | CSS `filter` property | Zero deps, hardware-accelerated, covers brightness/contrast/B&W/sepia/warm/cool |
| Sharpening | Canvas unsharp mask | ~30 lines, no library needed |
| Background blur | CSS `blur()` + Canvas compositing | Remove BG → composite subject over blurred original |
| Filter presets | Named CSS filter combos via i18n | "Warm", "Classic B&W", etc. — like Instagram. Names in `de.json`/`en.json` |
| PDF local download | Client-side `html2canvas-pro` + `jsPDF` | Fallback for testing, no Puppeteer dependency |
| Mockup display | CSS 3D transforms + shadow | No external assets needed, realistic card-on-table effect |

---

## Batch 1: Remove Background Step + Fix Step Numbering (3 tasks)

### Task 1.1: Remove StepBackImage from Wizard Flow

**Files to modify:**
- `src/components/wizard/WizardShell.tsx`
- `src/components/wizard/StepIndicator.tsx`
- `src/lib/editor/wizard-state.ts`

**Step 1: Update TOTAL_STEPS** (`wizard-state.ts:136`)

```typescript
// Before:
export const TOTAL_STEPS = 8;
// After:
export const TOTAL_STEPS = 7;
```

**Step 2: Update isStepValid()** (`wizard-state.ts:243-254`)

Remove case 3 (background validation). Renumber:

```typescript
export function isStepValid(state: WizardState, step: number): boolean {
  switch (step) {
    case 1: return state.cardType !== null && state.cardFormat !== null;
    case 2: return state.templateId !== null;
    case 3: return true; // photo optional (was step 4)
    case 4: return state.textContent.name.trim().length > 0; // was step 5
    case 5: return true; // decorations optional (was step 6)
    case 6: return true; // preview (was step 7)
    case 7: return true; // order (was step 8)
    default: return false;
  }
}
```

**Step 3: Update WizardShell renderStep** (`WizardShell.tsx:66-81`)

```typescript
const renderStep = useCallback(
  (stepState: WizardState, stepDispatch: React.Dispatch<WizardAction>) => {
    switch (stepState.currentStep) {
      case 1: return <StepCardType state={stepState} dispatch={stepDispatch} />;
      case 2: return <StepTemplate state={stepState} dispatch={stepDispatch} />;
      case 3: return <StepPhoto state={stepState} dispatch={stepDispatch} />;
      case 4: return <StepText state={stepState} dispatch={stepDispatch} />;
      case 5: return <StepDecorations state={stepState} dispatch={stepDispatch} />;
      case 6: return <StepPreview state={stepState} />;
      case 7: return <StepOrder state={stepState} dispatch={stepDispatch} />;
      default: return null;
    }
  },
  []
);
```

Remove `import StepBackImage` from line 18.

**Step 4: Update photo skip logic** (`WizardShell.tsx:50-63`)

```typescript
// Before: skip from 3→5 (background→text)
// After: skip from 2→4 (template→text, skipping photo at step 3)
function handleNext() {
  if (shouldSkipPhoto && state.currentStep === 2) {
    dispatch({ type: "SET_STEP", step: 4 }); // skip photo → text
  } else {
    dispatch({ type: "NEXT_STEP" });
  }
}

function handlePrev() {
  if (shouldSkipPhoto && state.currentStep === 4) {
    dispatch({ type: "SET_STEP", step: 2 }); // skip photo ← text
  } else {
    dispatch({ type: "PREV_STEP" });
  }
}
```

**Step 5: Update StepIndicator stepKeys** (`StepIndicator.tsx:13-22`)

```typescript
// Before:
const stepKeys = ["cardType", "template", "background", "photo", "text", "decorations", "preview", "order"];
// After:
const stepKeys = ["cardType", "template", "photo", "text", "decorations", "preview", "order"];
```

**Step 6: Increment DRAFT_VERSION** (`wizard-state.ts:265`)

```typescript
const DRAFT_VERSION = 7; // was 6 — old drafts auto-discarded
```

> **DRAFT_VERSION sequence:** This plan changes DRAFT_VERSION twice:
> - Batch 1 (here): 6 → 7 (step removed, step numbers changed)
> - Batch 6 (Task 6.2): 7 → 8 (photo shape extended with filter/BG fields)
> Batch 6 MUST run after Batch 1. Both increments are intentional.

**Step 7: Set default background in initialWizardState** (`wizard-state.ts:186+`)

Ensure the initial state always sets white background:
```typescript
background: {
  type: "color" as const,
  color: "#FFFFFF",
  imageUrl: null,
},
```
This is already the case — verify and leave unchanged.

**Verification:**
- Wizard shows 7 steps in indicator
- Navigation: 1→2→3→4→5→6→7 (no gaps)
- Photo skip: 1→2→4→5→6→7 (for TI04 no-photo templates)
- Old drafts (version 6) auto-discarded on load
- No import/reference to StepBackImage remains (`grep StepBackImage src/`)

**Negative test:** `isStepValid(state, 8)` returns `false` (default case).

---

### Task 1.2: Remove i18n Keys for Background Step

**Files to modify:**
- `src/messages/de.json`
- `src/messages/en.json`

**Step 1:** Remove `wizard.steps.background` key (de.json line 178).

**Step 2:** Remove `wizard.background` section (de.json lines 216+) — the entire background step translations.

**Step 3:** Repeat for `en.json`.

**Verification:** `grep -r "background" src/messages/` — no wizard.background references remain.

---

### Task 1.3: Unit Tests for Step Removal

**File to modify:** `src/lib/editor/__tests__/wizard-state.test.ts`

**Step 1:** Update all existing tests that reference step numbers ≥ 3 to new numbering.

Current tests to update:
- `isStepValid` tests for steps 3-8 → renumber to 3-7
- `TOTAL_STEPS` test → expect 7
- `step 9 returns false` test → keep (still beyond TOTAL_STEPS)

**Step 2: Add new tests**

```
- TOTAL_STEPS equals 7
- isStepValid(state, 3) returns true (photo optional)
- isStepValid(state, 4) with name → true (text step)
- isStepValid(state, 4) without name → false
- isStepValid(state, 7) returns true (order step)
- isStepValid(state, 8) returns false (beyond TOTAL_STEPS)
```

**Step 3: Draft migration test**

```
- loadDraft() with version 6 saved → returns null (discarded)
- loadDraft() with version 7 saved → returns state
```

**Verification:** `npx vitest run src/lib/editor/__tests__/wizard-state.test.ts` — all pass.

---

## Batch 2: Fix Preview + PDF Bugs (5 tasks)

### Task 2.1: Fix SpreadPreview Text Scale Mismatch (BUG-2)

**File:** `src/components/wizard/SpreadPreview.tsx:84`

**Current code:**
```typescript
fontSize: `${fontSize * 0.8}pt`,
```

**Fix:** Remove the `* 0.8` scaling. Add `overflow: hidden` on text containers to prevent overflow (the likely reason 0.8 was added):

```typescript
fontSize: `${fontSize}pt`,
// Add to the parent div style:
overflow: "hidden",
```

**Verification:** Compare preview text size vs PDF output visually — must match.

**Negative test:** Template with 30pt name text — verify it clips (not overflows) the container.

---

### Task 2.2: Simplify PDF Generator Folded Width (cleanup, NOT a bug fix)

**File:** `src/lib/editor/pdf-generator.ts:31`

**Current code (redundant but correct):**
```typescript
pageWidthMm = isFolded ? dims.widthMm : dims.widthMm;
```

**Fix — simplify:**
```typescript
pageWidthMm = dims.widthMm; // folded dims already include full spread width (e.g., 370mm)
```

**Add logging:**
```typescript
console.log(`[pdf] Template: ${state.templateId}, Page: ${pageWidthMm}x${pageHeightMm}mm, Folded: ${isFolded}`);
```

**Verification:** Generate PDF for folded card (F1 template). Page width = 370mm in PDF metadata. Generate for single card — page width = 185mm.

---

### Task 2.3: Fix API Route — Env Var + Validation (BUG-3, BUG-4)

**File:** `src/app/api/generate-pdf/route.ts`

**Step 1: Fix env var** (line 23)

Check `.env.local` for actual key name. Replace fallback chain with correct name:
```typescript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_Secret;
```
Remove `supabase_Secert` (typo).

Also fix `src/app/api/auth/register/route.ts:40` which uses the typo directly.

**Step 2: Add validation** (after line 11)

```typescript
if (!state?.cardType) {
  return NextResponse.json({ error: "Missing cardType" }, { status: 400 });
}
if (!state.templateId) {
  return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
}
if (!state.textContent?.name?.trim()) {
  return NextResponse.json({ error: "Missing name" }, { status: 400 });
}
```

**Step 3: Improve error response** (line 67-71)

```typescript
catch (error) {
  console.error("[generate-pdf] Error:", error);
  return NextResponse.json({
    error: "PDF generation failed",
    details: error instanceof Error ? error.message : "Unknown error"
  }, { status: 500 });
}
```

**Verification:**
- POST `{ state: { cardType: "sterbebild", templateId: "TI05", textContent: { name: "Test" } } }` → 200 + PDF
- POST `{}` → 400 "Missing cardType"
- POST `{ state: { cardType: "sterbebild" } }` → 400 "Missing templateId"

**Negative test:** POST with `{}` body → 400 (not 500 crash).

---

### Task 2.4: Fix Image Loading Error Handling (BUG-6)

**File:** `src/lib/editor/card-to-html-v2.ts`

**Step 1:** Add warning logs to `imageToBase64()`:
```typescript
} catch (err) {
  console.warn(`[card-html] Failed to load image: ${url}`, err);
  return "";
}
```

**Step 2:** After photo conversion in `renderSpreadHTML()`:
```typescript
if (state.photo?.url && !images["photo"]) {
  console.warn("[card-html] Photo URL provided but conversion failed:", state.photo.url);
}
```

**Verification:** Invalid photo URL → console warning, PDF renders with placeholder (no crash).

---

### Task 2.5: Fix Google Fonts Race Condition (BUG-7)

**File:** `src/components/wizard/SpreadPreview.tsx`

**Step 1:** Move font loading to `useEffect` with `document.head`:
```tsx
useEffect(() => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = fontUrl;
  document.head.appendChild(link);
  return () => { document.head.removeChild(link); };
}, [fontUrl]);
```

**Step 2:** Track font readiness:
```tsx
const [fontsReady, setFontsReady] = useState(false);
useEffect(() => {
  document.fonts.ready.then(() => setFontsReady(true));
}, [fontUrl]);
```

**Step 3:** Show skeleton until fonts ready (optional — subtle shimmer on text areas).

**Verification:** Switch between templates with different fonts — no FOUT (Flash of Unstyled Text).

---

## Batch 3: Live Side Preview During Editing (4 tasks)

### Task 3.1: Create SplitLayout Wrapper Component

**File to create:** `src/components/wizard/SplitLayout.tsx`

**Purpose:** 2-column layout for steps 3-5: form left, live card preview right.

**Layout:**
```
┌──────────────────────────────────────────────┐
│  Step Indicator (full width)                 │
├───────────────────────┬──────────────────────┤
│                       │                      │
│   Form Controls       │   Live Card Preview  │
│   (scrollable)        │   (sticky, centered) │
│                       │                      │
│   [Back]    [Next]    │                      │
├───────────────────────┴──────────────────────┤
```

**Interface:**
```tsx
interface SplitLayoutProps {
  children: React.ReactNode;  // form content (step component)
  state: WizardState;
}
```

**Responsive breakpoints:**
- Desktop ≥1024px: side-by-side, 55% form / 45% preview
- Tablet 768-1023px: side-by-side, 60% form / 40% preview
- Mobile <768px: stacked — form only, collapsible preview toggle at bottom

**Preview rendering:**
- V2 templates (TI prefix): `<SpreadPreview state={state} />`
- V1 templates: `<CardRenderer templateId={...} panelId="front" state={state} />`
- Preview panel: `position: sticky; top: 2rem`, scales card to fit available width

**Verification:** Resize browser — layout switches at 768px and 1024px breakpoints.

---

### Task 3.2: Integrate SplitLayout into WizardShell

**File:** `src/components/wizard/WizardShell.tsx`

**Step 1:** Import SplitLayout.

**Step 2:** Modify `renderStep` to wrap steps 3-5:

```tsx
const renderStep = useCallback(
  (stepState: WizardState, stepDispatch: React.Dispatch<WizardAction>) => {
    const stepContent = (() => {
      switch (stepState.currentStep) {
        case 1: return <StepCardType state={stepState} dispatch={stepDispatch} />;
        case 2: return <StepTemplate state={stepState} dispatch={stepDispatch} />;
        case 3: return <StepPhoto state={stepState} dispatch={stepDispatch} />;
        case 4: return <StepText state={stepState} dispatch={stepDispatch} />;
        case 5: return <StepDecorations state={stepState} dispatch={stepDispatch} />;
        case 6: return <StepPreview state={stepState} />;
        case 7: return <StepOrder state={stepState} dispatch={stepDispatch} />;
        default: return null;
      }
    })();

    // Steps 3-5 get split layout with live preview
    if (stepState.currentStep >= 3 && stepState.currentStep <= 5) {
      return <SplitLayout state={stepState}>{stepContent}</SplitLayout>;
    }

    return stepContent;
  },
  []
);
```

**Verification:** Steps 1-2 full-width. Steps 3-5 show form + preview side-by-side. Steps 6-7 full-width.

---

### Task 3.3: Mobile Preview Toggle

**File:** `src/components/wizard/SplitLayout.tsx` (part of Task 3.1 component)

**Add to SplitLayout for mobile (<768px):**

- Floating "Show Preview" button fixed at bottom of screen
- Tapping opens a bottom sheet (70vh height) with card preview
- Sheet has close button
- Button hidden on desktop via `@media (min-width: 768px) { display: none }`

**Verification (iPhone 14, 390x844):**
- Toggle button visible at bottom
- Tap → preview sheet slides up
- Card renders correctly at mobile width
- Close button dismisses sheet

---

### Task 3.4: E2E Tests for Split Layout

**File to create:** `e2e/split-preview.spec.ts`

**Tests:**
```
1. Desktop — steps 3-5 show side-by-side layout
   - Navigate to step 3 (photo)
   - Verify form panel visible on left
   - Verify preview panel visible on right
   - Enter text in step 4 → verify preview updates in real-time

2. Desktop — steps 1-2 and 6-7 are full-width (no split)
   - Navigate to step 1 → no preview panel
   - Navigate to step 6 (preview) → full-width

3. Mobile — preview toggle works (iPhone 14, 390x844)
   - Navigate to step 4 (text)
   - Verify preview panel HIDDEN
   - Click "Show Preview" → preview sheet appears
   - Click close → sheet dismissed

4. Mobile — live update in preview sheet
   - Open preview sheet on step 4
   - Type name "Test Name"
   - Close/reopen → "Test Name" visible in preview

5. Tablet — side-by-side with narrower preview (768x1024)
   - Navigate to step 4
   - Verify 60/40 split layout
```

**Run:** `npx playwright test e2e/split-preview.spec.ts`

---

## Batch 4: Fix PDF + Local Download (3 tasks)

### Task 4.1: Add Client-Side PDF Download

**Files:**
- Create: `src/lib/editor/client-pdf-generator.ts`
- Modify: `src/components/wizard/steps/StepPreview.tsx`

**Step 1: Install deps**
```bash
npm install html2canvas-pro jspdf
```

**Step 2: Create client generator**

> **SSR GUARD:** `html2canvas` and `jsPDF` require `document`/`window` which don't exist
> during Next.js server-side rendering. Use dynamic `import()` so they're only loaded
> in the browser when the user clicks the button. NEVER use static `import` at top of file.

```typescript
// src/lib/editor/client-pdf-generator.ts

export async function generateClientPDF(
  previewElement: HTMLElement,
  widthMm: number,
  heightMm: number
): Promise<Blob> {
  // Dynamic imports — only loaded client-side when function is called
  const { default: html2canvas } = await import("html2canvas-pro");
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(previewElement, {
    scale: 3,
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
  });

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
  return pdf.output("blob");
}
```

**Step 3: Add buttons to StepPreview**

Add `useRef` on the SpreadPreview/CardRenderer container. Add two buttons:
- "Download PDF (Local)" → calls `generateClientPDF()` with ref element
- "Generate PDF (High Quality)" → existing server-side Puppeteer call

**Step 4: Wire up ref**

```tsx
const previewRef = useRef<HTMLDivElement>(null);

async function handleClientPdf(): Promise<void> {
  if (!previewRef.current) return;
  const dims = getCardDimensions(state);
  if (!dims) return;
  // Dynamic import — SSR safe, only loads in browser
  const { generateClientPDF } = await import("@/lib/editor/client-pdf-generator");
  const blob = await generateClientPDF(previewRef.current, dims.widthMm, dims.heightMm);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trauerpost-${state.cardType}-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Wrap the SpreadPreview/CardRenderer area in `<div ref={previewRef}>`.

**Verification:**
- Click "Download PDF (Local)" → PDF downloads instantly
- Open PDF → content matches preview
- Compare with server PDF → layout similar (not pixel-perfect)

**Negative test:** Client PDF with no photo → renders with placeholder, no crash.

---

### Task 4.2: PDF Error Handling UI

**File:** `src/components/wizard/steps/StepPreview.tsx`

**Step 1:** Enhanced error display:
```tsx
{pdfError && (
  <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
    <p className="text-red-700 font-medium">{t("error")}</p>
    <p className="text-red-600 text-sm mt-1">{pdfError}</p>
    <button onClick={handleClientPdf} className="mt-2 text-sm underline text-brand-primary">
      {t("tryLocal")}
    </button>
  </div>
)}
```

**Step 2:** Loading state:
```tsx
{pdfLoading && (
  <div className="flex items-center gap-2 mt-4">
    <div className="animate-spin h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full" />
    <span className="text-sm text-gray-600">{t("generating")}</span>
  </div>
)}
```

**Verification:** Disconnect network → Generate PDF → error shown with local fallback link.

---

### Task 4.3: Unit Tests for Client PDF Generator

**File to create:** `src/lib/editor/__tests__/client-pdf-generator.test.ts`

**Tests (limited — html2canvas needs real DOM, full testing in E2E):**
```
1. generateClientPDF is exported and callable
2. Function signature accepts HTMLElement + dimensions
3. Returns Promise<Blob>
```

**Verification:** `npx vitest run src/lib/editor/__tests__/client-pdf-generator.test.ts`

---

## Batch 5: Mockup Display (3 tasks)

### Task 5.1: Create CardMockup Component

**File to create:** `src/components/wizard/CardMockup.tsx`

**Purpose:** Realistic mockup — card at slight 3D angle on textured surface with shadows.

**Interface:**
```tsx
interface CardMockupProps {
  state: WizardState;
  style?: "table" | "envelope" | "flat";
}
```

**CSS 3D:**
```css
.mockup-card {
  transform: perspective(1200px) rotateY(-5deg) rotateX(3deg);
  box-shadow:
    10px 15px 30px rgba(0, 0, 0, 0.15),
    2px 3px 8px rgba(0, 0, 0, 0.1);
}
.mockup-surface {
  background: linear-gradient(135deg, #f5f0eb 0%, #e8e2dc 100%);
}
```

**Three styles:**
1. "table" — card on warm surface at angle (default)
2. "envelope" — card partially inside envelope
3. "flat" — clean flat with subtle shadow

**Inside:** Renders `<SpreadPreview>` for v2, `<CardRenderer>` for v1.

**Verification:** Card renders inside realistic frame with 3D perspective and shadow.

---

### Task 5.2: Integrate Mockup into Preview + Order

**Files:**
- `src/components/wizard/steps/StepPreview.tsx`
- `src/components/wizard/steps/StepOrder.tsx`

**Step 1: StepPreview** — Add "Mockup" as 4th view mode tab (alongside flat/flip/3D for v1, or as second option for v2):

For v2 templates, add a toggle between "Preview" and "Mockup".
For v1 templates, add "Mockup" to the existing modes array.

**Step 2: StepOrder** — Show mockup on order success:

```tsx
{orderSuccess && (
  <div className="text-center">
    <CardMockup state={state} style="table" />
    <h2 className="mt-6 text-2xl font-serif text-brand-dark">{t("successTitle")}</h2>
    <p className="text-gray-600 mt-2">{t("successMessage")}</p>
    <div className="flex gap-4 justify-center mt-6">
      <button onClick={handleDownloadPDF}>{t("downloadPdf")}</button>
      <button onClick={handleNewCard}>{t("newCard")}</button>
    </div>
  </div>
)}
```

**Verification:**
- Step 6: "Mockup" tab shows 3D card
- Order success: mockup displayed with card data

---

### Task 5.3: E2E Tests for Mockup

**File to create:** `e2e/mockup.spec.ts`

**Tests:**
```
1. Preview step mockup tab
   - Navigate to step 6, click "Mockup" tab
   - Verify CSS transform property set
   - Verify box-shadow exists

2. Mobile mockup scales correctly (iPhone 14)
   - Navigate to mockup view
   - Verify no horizontal scroll

3. Negative — no-photo template (TI04)
   - Use TI04, skip to mockup view
   - Verify renders without crash

4. Order success shows mockup
   - Complete wizard flow
   - Verify mockup container renders on success
```

**Run:** `npx playwright test e2e/mockup.spec.ts`

---

## Batch 6: Image Enhancement (6 tasks)

### Task 6.1: Create Image Filter Presets

**Files to create:**
- `src/lib/editor/image-filters.ts`
- `src/components/wizard/ImageEnhancer.tsx`

**Step 1: Filter logic** (`image-filters.ts`)

```typescript
export interface FilterPreset {
  id: string;
  filter: string;  // CSS filter value
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", filter: "none" },
  { id: "bright", filter: "brightness(1.15) contrast(1.05)" },
  { id: "warm", filter: "brightness(1.05) saturate(1.2) hue-rotate(-10deg) sepia(0.1)" },
  { id: "cool", filter: "brightness(1.05) saturate(0.9) hue-rotate(10deg)" },
  { id: "bw", filter: "grayscale(1) brightness(1.1) contrast(1.2)" },
  { id: "sepia", filter: "sepia(0.6) brightness(1.05) contrast(1.1)" },
  { id: "vivid", filter: "saturate(1.4) contrast(1.1) brightness(1.05)" },
  { id: "soft", filter: "brightness(1.1) contrast(0.95) saturate(0.85)" },
  { id: "classic", filter: "contrast(1.15) brightness(1.05) saturate(0.9)" },
  { id: "portrait", filter: "brightness(1.08) contrast(1.05) saturate(1.1)" },
];

// Display names come from i18n: wizard.photo.filters.<id>

export interface ManualAdjustments {
  brightness: number;  // 0.5 - 1.5, default 1
  contrast: number;    // 0.5 - 1.5, default 1
  saturation: number;  // 0 - 2, default 1
  sharpness: number;   // 0 - 100, default 0 (handled by Canvas, NOT CSS)
}

/** Converts adjustments to CSS filter string. NOTE: sharpness is excluded
 *  because CSS `filter` doesn't support sharpening — handled separately
 *  by Canvas convolution in image-sharpen.ts */
export function adjustmentsToCSSFilter(adj: ManualAdjustments): string {
  return `brightness(${adj.brightness}) contrast(${adj.contrast}) saturate(${adj.saturation})`;
}

export const DEFAULT_ADJUSTMENTS: ManualAdjustments = {
  brightness: 1, contrast: 1, saturation: 1, sharpness: 0,
};
```

**Step 2: ImageEnhancer component**

```
┌─────────────────────────────────────┐
│  Filter Presets (horizontal scroll) │
│  [Original] [Warm] [B&W] [Sepia].. │
│                                     │
│  Manual Adjustments                 │
│  Brightness ───●─────── 1.15       │
│  Contrast   ────●────── 1.05       │
│  Saturation ─────●───── 1.10       │
│  Sharpness  ──●──────── 20         │
│                                     │
│  [Reset to Original]                │
└─────────────────────────────────────┘
```

**Interface:**
```tsx
interface ImageEnhancerProps {
  photoUrl: string;
  currentFilter: string;
  currentFilterId: string;
  adjustments: ManualAdjustments | null;
  onFilterChange: (filter: string, filterId: string) => void;
  onAdjustmentsChange: (adj: ManualAdjustments) => void;
}
```

- Each preset shows tiny thumbnail with CSS filter applied
- Clicking preset applies it AND resets sliders
- Manual sliders override preset
- Sharpness handled via Canvas (see Task 6.3)
- Preset display names from `useTranslations("wizard.photo.filters")`

**Verification:** Upload photo → 10 presets visible → click "Warm" → photo updates.

---

### Task 6.2: Integrate ImageEnhancer + State Changes

**Files:**
- `src/lib/editor/wizard-state.ts`
- `src/components/wizard/steps/StepPhoto.tsx`
- `src/components/wizard/SpreadPreview.tsx`
- `src/lib/editor/card-to-html-v2.ts`

**Step 1: Extend WizardState.photo** (unified shape — covers filters + BG removal)

```typescript
// wizard-state.ts — REPLACE existing photo type:
photo: {
  url: string | null;              // current photo (may be processed by BG removal)
  originalUrl: string | null;      // raw upload, always preserved for "Restore Original"
  sharpenedUrl: string | null;     // sharpened version (always generated FROM originalUrl/url, never from itself)
  crop: { x: number; y: number; width: number; height: number } | null;
  filter: string;                  // CSS filter value, default "none"
  filterId: string;                // preset ID, default "original"
  adjustments: ManualAdjustments | null;  // manual slider values
  backgroundRemoved: boolean;      // true if BG was removed
  backgroundBlurred: boolean;      // true if BG was blurred
};
```

> **SHARPENING ARCHITECTURE:** `sharpenedUrl` is a DERIVED field, never a source.
> The sharpening pipeline is: `url` (source) → `sharpenImage()` → `sharpenedUrl` (output).
> Preview and PDF use: `sharpenedUrl ?? url` (prefer sharpened, fall back to source).
> When sharpness slider changes, ALWAYS re-sharpen from `url`, never from `sharpenedUrl`.
> This prevents "double-sharpening" artifacts (sharpening an already-sharpened image).

**Step 2: Add WizardAction union members**

```typescript
| { type: "SET_PHOTO"; url: string }  // existing — now also sets originalUrl
| { type: "SET_PHOTO_CROP"; crop: WizardState["photo"]["crop"] }  // existing
| { type: "SET_PHOTO_FILTER"; filter: string; filterId: string }  // NEW
| { type: "SET_PHOTO_ADJUSTMENTS"; adjustments: ManualAdjustments }  // NEW
| { type: "SET_PHOTO_PROCESSED"; url: string; backgroundRemoved: boolean; backgroundBlurred: boolean }  // NEW
| { type: "RESTORE_ORIGINAL_PHOTO" }  // NEW
| { type: "REMOVE_PHOTO" }  // NEW — clears photo + resets all filter state
```

**Step 3: Update wizardReducer** for new actions:
- `SET_PHOTO` → sets `url` AND `originalUrl` to the same value, resets filter/adjustments/bg flags
- `SET_PHOTO_FILTER` → updates `filter` and `filterId`
- `SET_PHOTO_ADJUSTMENTS` → updates `adjustments`
- `SET_PHOTO_PROCESSED` → updates `url` (processed), sets bg flags
- `RESTORE_ORIGINAL_PHOTO` → sets `url = originalUrl`, clears bg flags
- `REMOVE_PHOTO` → resets entire photo to initial state

**Step 4: Update initialWizardState**

```typescript
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
```

**Step 5: Update DRAFT_VERSION** to 8 (photo shape changed — was set to 7 in Task 1.1, now 8 because photo gained filter/BG/sharpened fields).

**Step 6: Show ImageEnhancer in StepPhoto**

After the AvatarEditor crop section:
```tsx
{state.photo.url && (
  <ImageEnhancer
    photoUrl={state.photo.url}
    currentFilter={state.photo.filter}
    currentFilterId={state.photo.filterId}
    adjustments={state.photo.adjustments}
    onFilterChange={(filter, id) => dispatch({ type: "SET_PHOTO_FILTER", filter, filterId: id })}
    onAdjustmentsChange={(adj) => dispatch({ type: "SET_PHOTO_ADJUSTMENTS", adjustments: adj })}
  />
)}
```

**Step 7: Apply filter + sharpened URL in SpreadPreview**

On the photo element's container div, use `sharpenedUrl` when available:
```tsx
// Use sharpened photo if available, otherwise original
const photoSrc = state.photo.sharpenedUrl ?? state.photo.url;
// Apply CSS filter on top
style={{ ...existingStyles, filter: state.photo.filter || "none" }}
// Use photoSrc as the background-image source
```

**Step 8: Apply filter in card-to-html-v2.ts**

In the photo image element rendering, add CSS filter to inline style:
```typescript
const photoFilter = state.photo?.filter && state.photo.filter !== "none"
  ? `filter: ${state.photo.filter};`
  : "";
// Add to imgStyle string
```

**Verification:**
- Upload photo → enhancer appears below crop
- Select "Warm" → side preview updates
- Generate PDF → PDF photo has filter
- Filter persists across step navigation
- Remove photo → filter resets to "original"

---

### Task 6.3: Canvas Sharpening

**File to create:** `src/lib/editor/image-sharpen.ts`

```typescript
export function sharpenImage(imageUrl: string, amount: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      if (amount > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpened = applyUnsharpMask(imageData, amount / 100);
        ctx.putImageData(sharpened, 0, 0);
      }

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
```

**Integration:** When sharpness slider changes:
1. Always call `sharpenImage()` with `state.photo.url` (the source), NEVER with `state.photo.sharpenedUrl`
2. Debounce 300ms to avoid excessive processing
3. Store result in `state.photo.sharpenedUrl` (via new action `SET_PHOTO_SHARPENED`)
4. When sharpness = 0, set `sharpenedUrl = null` (use original)
5. Preview and PDF rendering use `sharpenedUrl ?? url`

**Performance guard:** Before sharpening, scale image down to max 1500px width using Canvas. Full-res images (4000x3000 = 12M pixels) would freeze the main thread for 2-5 seconds on mobile.

```typescript
// Add SET_PHOTO_SHARPENED to WizardAction:
| { type: "SET_PHOTO_SHARPENED"; sharpenedUrl: string | null }
```

**Verification:** Blurry photo + sharpness 50 → edges more defined. Sharpness 0 → `sharpenedUrl` null, original displayed.

**Negative test:** Move sharpness slider from 50 → 0 → 50 → 0 — image must be identical each time (no progressive degradation from double-sharpening).

---

### Task 6.4: Background Removal Feature

**Files:**
- Create: `src/components/wizard/BackgroundRemover.tsx`
- Modify: `src/components/wizard/steps/StepPhoto.tsx`

**Step 1:** `npm install @huggingface/transformers`

**Step 2: BackgroundRemover component**

```tsx
interface BackgroundRemoverProps {
  photoUrl: string;
  onResult: (resultUrl: string, mode: "removed" | "blurred") => void;
  onRestore: () => void;
  isProcessed: boolean;  // show "Restore Original" if true
}
```

**UI:**
```
┌───────────────────────────────────────┐
│  [Remove Background] [Blur Background]│
│  ████████████████░░░░░░ 65%           │
│  Processing... (first time downloads  │
│  AI model ~15MB)                      │
│  [Restore Original]                   │
└───────────────────────────────────────┘
```

**Logic:**

> **CRITICAL: Dynamic import only.** `@huggingface/transformers` is ~48MB unpacked.
> A static `import` at top of file would include the entire library in the page bundle,
> slowing down load for ALL users — even those who never use background removal.
> Use `await import()` so it's only loaded when the user clicks the button.

```typescript
// CORRECT — dynamic import, only loaded on click:
async function removeBackground(imageUrl: string) {
  const { pipeline } = await import("@huggingface/transformers");
  const segmenter = await pipeline("image-segmentation", "briaai/RMBG-1.4", {
    device: "webgpu",  // fallback to "wasm" if WebGPU unavailable
    dtype: "q8",
  });
  const result = await segmenter(imageUrl);
  // Composite mask result onto white background (Canvas)
}

// WRONG — DO NOT DO THIS:
// import { pipeline } from "@huggingface/transformers";  // ← bloats bundle!
```

**Background blur:** Get mask → blur original (Canvas `ctx.filter = "blur(8px)"`) → composite sharp subject over blurred background.

**Progress:** Show progress during model download (first use) and processing.

**Wire to state:** On result, dispatch `SET_PHOTO_PROCESSED`. On restore, dispatch `RESTORE_ORIGINAL_PHOTO`.

**Verification:**
- Upload portrait → "Remove Background" → subject on white
- "Blur Background" → background blurred, subject sharp
- "Restore Original" → original photo back
- First use shows download progress

**Negative test:** Non-portrait image → processes (may have poor quality, no crash). Offline → error message.

---

### Task 6.5: Unit Tests for Image Filters

**File to create:** `src/lib/editor/__tests__/image-filters.test.ts`

**Tests:**
```
1. All FILTER_PRESETS have unique IDs
2. All FILTER_PRESETS have non-empty filter values
3. "original" preset has filter = "none"
4. adjustmentsToCSSFilter() with defaults → "brightness(1) contrast(1) saturate(1)"
5. adjustmentsToCSSFilter() with modified values includes all 3 properties
6. adjustmentsToCSSFilter() does NOT include sharpness (CSS can't sharpen)
7. DEFAULT_ADJUSTMENTS has all 4 fields
```

**Negative test:** `adjustmentsToCSSFilter({ brightness: -1, contrast: -1, saturation: -1, sharpness: -1 })` → produces valid CSS string (no crash).

**Verification:** `npx vitest run src/lib/editor/__tests__/image-filters.test.ts`

---

### Task 6.6: E2E Tests for Image Enhancement

**File to create:** `e2e/image-enhancement.spec.ts`

**Tests:**
```
1. Filter presets render after photo upload
   - Navigate to step 3 (photo), upload test image
   - Verify 10 preset thumbnails visible
   - Click "Warm" → photo element has CSS filter applied

2. Manual sliders update preview
   - Upload photo, drag brightness to 1.3
   - Verify CSS filter includes "brightness(1.3)"
   - Verify side preview also shows filtered photo

3. Filter persists across steps
   - Upload photo, apply "B&W"
   - Navigate to step 4, back to step 3
   - "B&W" still selected, photo still grayscale

4. Reset restores original
   - Upload photo, apply filter
   - Click "Reset" → filter = "none", preset = "original"

5. Background removal (if model available — skip if offline)
   - Upload portrait, click "Remove Background"
   - Wait up to 30s for processing
   - Verify photo changed
   - Click "Restore Original" → original restored

6. Mobile — presets scroll horizontally (iPhone 14)
   - Upload photo
   - Verify horizontal scroll on presets container

7. Negative — no photo = no enhancer
   - Step 3 without upload → ImageEnhancer NOT rendered

8. PDF includes filter
   - Upload photo, apply "Sepia"
   - Navigate to step 6, click "Download PDF (Local)"
   - Verify PDF generated without error
```

**Run:** `npx playwright test e2e/image-enhancement.spec.ts`

---

## Batch 7: Integration Testing + Polish (4 tasks)

### Task 7.1: Full Wizard E2E Flow

**File to create:** `e2e/full-wizard-flow.spec.ts`

**Tests:**
```
1. Sterbebild with photo + filter + mockup
   a. Step 1: Select "Sterbebild", "Single"
   b. Step 2: Select TI05
   c. Step 3 (Photo): Upload, apply "Warm", crop
   d. Verify: Side preview shows warm-filtered photo
   e. Step 4 (Text): Enter "Maria Musterfrau", dates, quote
   f. Verify: Side preview updates live
   g. Step 5 (Decorations): Skip
   h. Step 6 (Preview): Card renders, switch to "Mockup"
   i. Step 6: Click "Download PDF (Local)" → downloads
   j. Step 7 (Order): Summary shows correct info

2. No-photo template (TI04)
   a. Step 1: "Sterbebild", "Single"
   b. Step 2: TI04 (Nur Text)
   c. Step 3 SKIPPED (photo not required)
   d. Step 3 is actually Text (step 4 after skip)
   e. Enter name → side preview shows text-only card
   f. Step 5 (Preview): Download PDF → success

3. Folded card (V1 template F1)
   a. Step 1: "Trauerkarte", "Folded"
   b. Step 2: F1
   c. Step 3: Upload photo
   d. Step 4: Enter text
   e. Step 6: Multi-panel preview, 3D fold mode

4. Navigation edge cases
   a. Forward to step 4, back to step 2, forward again
   b. State preserved across navigation

5. Draft persistence
   a. Fill steps 1-4, reload page
   b. Draft restored, photo + filter preserved
```

**Run:** `npx playwright test e2e/full-wizard-flow.spec.ts`

---

### Task 7.2: Mobile E2E Tests

**File to create:** `e2e/mobile-wizard.spec.ts`

**All on iPhone 14 (390x844):**
```
1. Wizard navigation — all 7 steps accessible, buttons ≥44px touch target
2. Photo upload — crop tool fits viewport, filter presets scroll
3. Preview toggle — floating button, bottom sheet works
4. PDF download — button visible, tap downloads
5. Mockup on mobile — scales to fit, no horizontal scroll
6. Breakpoints — 390px stacked, 768px side-by-side, 1024px full desktop
```

**Run:** `npx playwright test e2e/mobile-wizard.spec.ts --project=mobile-safari --project=mobile-chrome`

---

### Task 7.3: Add i18n Keys

**Files:** `src/messages/de.json`, `src/messages/en.json`

**New keys to add under `wizard`:**

```json
{
  "wizard": {
    "preview": {
      "mockup": "Mockup",
      "downloadLocal": "PDF herunterladen (Lokal)",
      "downloadServer": "PDF generieren (Hochqualität)",
      "generating": "PDF wird generiert...",
      "error": "PDF-Erstellung fehlgeschlagen",
      "tryLocal": "Lokalen Download versuchen"
    },
    "photo": {
      "enhance": "Foto verbessern",
      "presets": "Filter",
      "adjustments": "Anpassungen",
      "brightness": "Helligkeit",
      "contrast": "Kontrast",
      "saturation": "Sättigung",
      "sharpness": "Schärfe",
      "resetFilter": "Zurücksetzen",
      "removeBackground": "Hintergrund entfernen",
      "blurBackground": "Hintergrund weichzeichnen",
      "restoreOriginal": "Original wiederherstellen",
      "processing": "Verarbeitung...",
      "downloadingModel": "KI-Modell wird heruntergeladen...",
      "showPreview": "Vorschau anzeigen",
      "hidePreview": "Vorschau schließen",
      "filters": {
        "original": "Original",
        "bright": "Aufgehellt",
        "warm": "Warm",
        "cool": "Kühl",
        "bw": "Schwarz-Weiß",
        "sepia": "Sepia",
        "vivid": "Lebendig",
        "soft": "Sanft",
        "classic": "Klassisch",
        "portrait": "Porträt"
      }
    },
    "order": {
      "successTitle": "Bestellung aufgegeben!",
      "successMessage": "Ihre Trauerkarte wurde erfolgreich bestellt."
    }
  }
}
```

Plus English equivalents in `en.json`.

**Verification:** Switch DE↔EN — all new UI elements show translated text.

---

### Task 7.4: Performance Audit

**No new files — testing only.**

**Checks:**
```
1. Bundle size — npm run build before/after, target < 500KB increase
   - html2canvas-pro: ~50KB gzipped
   - jspdf: ~90KB gzipped
   - @huggingface/transformers: tree-shaken ~20KB (model at runtime)

2. Preview performance — Chrome DevTools, steps 3-5 with split preview
   Target: < 100ms re-render per state change

3. Filter preset application
   Target: < 16ms (single frame, CSS-only)

4. Background removal
   Target: model download < 15s on 4G, processing < 10s

5. Client PDF generation
   Target: < 5s for single-page card

6. Mobile — throttled 4G, wizard remains responsive
```

---

## Test Architecture Summary

### Unit Tests (Vitest)

| File | Covers | Est. Count |
|------|--------|------------|
| `wizard-state.test.ts` | Step removal, validation, draft version | ~12 |
| `image-filters.test.ts` | Filter presets, CSS filter output | ~8 |
| `client-pdf-generator.test.ts` | Export/signature validation | ~3 |

### E2E Tests (Playwright)

| File | Covers | Devices | Est. Count |
|------|--------|---------|------------|
| `split-preview.spec.ts` | Layout, mobile toggle | Desktop + iPhone + iPad | 5 |
| `mockup.spec.ts` | Mockup display, order success | Desktop + iPhone | 4 |
| `image-enhancement.spec.ts` | Filters, presets, BG removal | Desktop + iPhone | 8 |
| `full-wizard-flow.spec.ts` | Complete wizard paths | Desktop | 5 |
| `mobile-wizard.spec.ts` | Mobile-specific flows | iPhone + Pixel | 6 |

**Total new tests:** ~23 unit + ~28 E2E = **~51 tests**

---

## Implementation Order & Dependencies

```
Batch 1 (Step Removal)      ─── no dependencies
Batch 2 (Bug Fixes)         ─── no dependencies
  ↓                            ↓
Batch 3 (Split Preview)     Batch 4 (PDF Fix + Local)
  ↓                            (independent of Batch 3)
Batch 5 (Mockup)  ←── depends on Batch 3
Batch 6 (Image Enhancement) ←── depends on Batch 3
  ↓
Batch 7 (Integration Tests) ←── depends on ALL
```

**Batches 1 & 2:** Parallel.
**Batches 3 & 4:** Parallel (after 1 & 2).
**Batches 5 & 6:** Parallel (after 3).
**Batch 7:** Last.

---

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| `@huggingface/transformers` model too large for mobile | Use q4 quantization (~5MB). Show download progress. Cache in browser. |
| `@huggingface/transformers` bloats bundle | Dynamic `import()` only — NEVER static import. Verified in Task 6.4. |
| `html2canvas`/`jspdf` break SSR on Vercel | Dynamic `import()` only — loaded in browser click handler. Verified in Task 4.1. |
| CSS filters don't match in PDF (Puppeteer) | Puppeteer supports CSS filters natively. Test explicitly in Task 6.6 test 8. |
| `html2canvas-pro` misses Google Fonts | Pre-load with `document.fonts.ready` before capture. |
| React 19 compatibility | Test each new library import before deep integration. |
| Draft version change breaks user drafts | Auto-discard (existing behavior). Sequence: 6→7 (Batch 1) → 8 (Batch 6). |
| Split layout breaks step component CSS | SplitLayout wraps without modifying step internals. |
| BG removal quality poor on some photos | "Results may vary" disclaimer. Always allow "Restore Original". |
| Sharpening double-application artifacts | `sharpenedUrl` is derived field — always sharpened from source `url`, never from itself. |
| Sharpening freezes UI on large images | Scale down to max 1500px before convolution. Add loading indicator. |
| Mobile preview toggle overlaps nav bar | Preview button uses `z-20` + `bottom: 5rem` to sit above sticky nav (`z-10`). |

---

## Files Summary

### New Files (8)
- `src/components/wizard/SplitLayout.tsx`
- `src/components/wizard/CardMockup.tsx`
- `src/components/wizard/ImageEnhancer.tsx`
- `src/components/wizard/BackgroundRemover.tsx`
- `src/lib/editor/image-filters.ts`
- `src/lib/editor/image-sharpen.ts`
- `src/lib/editor/client-pdf-generator.ts`
- 5 new E2E test files in `e2e/`

### Modified Files (13)
- `src/components/wizard/WizardShell.tsx`
- `src/components/wizard/StepIndicator.tsx`
- `src/components/wizard/SpreadPreview.tsx`
- `src/components/wizard/steps/StepPhoto.tsx`
- `src/components/wizard/steps/StepPreview.tsx`
- `src/components/wizard/steps/StepOrder.tsx`
- `src/lib/editor/wizard-state.ts`
- `src/lib/editor/pdf-generator.ts`
- `src/lib/editor/card-to-html-v2.ts`
- `src/app/api/generate-pdf/route.ts`
- `src/app/api/auth/register/route.ts` (env var typo fix)
- `src/messages/de.json`
- `src/messages/en.json`

### New Dependencies (3)
- `html2canvas-pro` — client-side HTML→Canvas
- `jspdf` — client-side PDF generation
- `@huggingface/transformers` — AI background removal
