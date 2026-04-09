# 4-Side Bifold Card — Implementation Plan v3 (QA-Corrected)

**Date**: 2026-04-08
**Status**: Ready for implementation
**Priority**: P0 — Core product gap
**QA Fixes**: All 3 CRITICAL, 3 HIGH, 4 MEDIUM findings from plan-qa addressed

## Problem Statement

The Sterbebild is a **bifold card with 4 sides**, but only 2 inner pages are built. Outer cover, thumbnails, and print output are all missing. SpreadNavigator shows placeholder boxes instead of real template previews.

## Architecture Decision

**Reuse existing Fabric.js canvas + template element system.** Outer pages are just more template elements on an additional `page: "outside-spread"` page.

### Critical Design Choice: Do NOT Change `cardFormat`

**Why not?** Plan QA found that changing TI04-TI09 from `cardFormat: "single"` to `"folded"` breaks everything:
- `getTemplateConfigsForCard()` filters by format → templates **disappear** from V1 wizard AND V2 canvas builder
- `CARD_CONFIGS.sterbebild.availableFormats` only includes `"single"` → `getCanvasDimensions()` **throws**
- V1 wizard `StepPreview.tsx` hardcodes `isFolded` logic with `panelId: "inside-left"/"inside-right"`

**Instead:** Keep `cardFormat: "single"`. Detect outer pages from elements: `hasOuterPages = elements.some(el => el.page === "outside-spread")`. This is purely additive — no existing code breaks.

### Canvas Dimensions

The outer spread and inner spread use **the same dimensions** (140×105mm). No dimension changes needed.
- Outer spread canvas: `perPage: false` → 140×105mm (full width)
- Inner pages canvas: `perPage: true` → 70×105mm (half width)
- `getCanvasDimensions()` already supports this via the `perPage` parameter

### Page Model (3 canvas pages)

| Page ID | Label | Canvas size | What it is |
|---------|-------|-------------|------------|
| `outside-spread` | Außenseite | 140×105mm (`perPage: false`) | Front+back cover as ONE spread |
| `front` | Innen links | 70×105mm (`perPage: true`) | Inner left page (EXISTING) |
| `back` | Innen rechts | 70×105mm (`perPage: true`) | Inner right page (EXISTING) |

### Navigator order (user's mental model)
1. **Außenseite** — outside spread (cover)
2. **Innen links** — inner left (existing `page: "front"`)
3. **Innen rechts** — inner right (existing `page: "back"`)

---

## Batch Breakdown

### Batch 0: Prerequisites (2 files, ~10 lines)

**Goal**: Optimize TREE.png + extract shared `buildPageState()`.

#### Task 0.1: Compress TREE.png
- **File**: `public/TREE.png`
- Current: 9.7MB. Target: <500KB
- Use sharp/squoosh to compress to JPEG quality 85 or WebP
- Save as `public/TREE.jpg` (or .webp), update all references

#### Task 0.2: Extract `buildPageState()` to shared utility
- **Source**: Duplicate exists in BOTH `src/app/api/preview/route.ts:129` AND `src/lib/editor/pdf-generator.ts:167`
- **Target**: Move to `src/lib/editor/card-to-html-v2.ts` as named export
- Both files import from the shared location
- Signatures are identical — no change needed:
  ```typescript
  export function buildPageState(
    state: WizardState,
    config: ReturnType<typeof getTemplateConfig>,
    pageId: string
  ): WizardState
  ```
- **CRITICAL**: `buildPageState()` defaults elements without `page` to `"front"` (line 138: `el.page ?? "front"`). This is CORRECT for the new architecture — orphaned elements stay on the inner page, NOT the cover.

#### Task 0.3: Fix cover photo leak in `exportCanvasToWizardState()`
- **File**: `src/lib/editor/canvas-export.ts:70-73`
- **Bug**: When front page has no photo, it takes photo from ANY other page — including outside-spread. This means the cover photo (TREE.jpg) leaks into inner pages for text-only templates like TI04.
- **Fix**: Skip outside-spread when merging photos:
  ```typescript
  if (!wizardState.photo.url && pageState.photo.url && key !== "outside-spread") {
    wizardState.photo = pageState.photo;
  }
  ```

#### Negative tests:
- `buildPageState()` with elements without `page` field → appear on `"front"`, never on `"outside-spread"`
- `exportCanvasToWizardState()` with TI04 (no inner photo) + outside-spread cover photo → cover photo does NOT leak into WizardState.photo

---

### Batch 1: Data Model + Page Definitions (2 files, ~50 lines)

**Goal**: Add `"outside-spread"` page support. No format changes.

#### Task 1.1: Update `getPageDefs()` to detect outer pages
- **File**: `src/components/canvas-builder/use-canvas-builder.ts:31-46`
- Change from format-based detection to element-based detection:
  ```typescript
  function getPageDefs(
    cardFormat: CardFormat | null,
    hasOuterPages: boolean
  ): SpreadPage[] {
    if (hasOuterPages) {
      return [
        { id: "outside-spread", label: "Außenseite", isSpread: true },
        { id: "front", label: "Innen links" },
        { id: "back", label: "Innen rechts" },
      ];
    }
    // existing 2-page logic unchanged
    return [
      { id: "front", label: "Vorderseite" },
      { id: "back", label: "Rückseite" },
    ];
  }
  ```
- Add `isSpread?: boolean` to `SpreadPage` interface in `SpreadNavigator.tsx:3-7`
- Remove the `slice(0,1)` guard (line 88) — always show all pages
- Detect outer pages: `const hasOuterPages = template.elements.some(el => el.page === "outside-spread");`

#### Task 1.2: Add outside-spread elements to TI04-TI09
- **File**: `src/lib/editor/template-configs.ts`
- **DO NOT change `cardFormat`** — keep `"single"`
- Add to each template's elements array:
  ```typescript
  { id: "cover-photo", page: "outside-spread", type: "ornament",
    x: 0, y: 0, w: 1000, h: 1000,
    fixedAsset: "/TREE.jpg", imageFit: "cover" },
  ```
- Uses `type: "ornament"` (NOT `"image"`) — `convertImagePlaceholder()` ignores `fixedAsset`, only `convertOrnamentElement()` uses it correctly.
- **Cover photo replacement**: User clicks the cover ornament on the canvas → replaces via toolbar → stored in Fabric.js JSON per page (`pagesDataRef["outside-spread"]`), NOT in `WizardState.photo`. PhotoToolbarPanel must NOT write to WizardState.photo when on outside-spread page.

#### Negative tests:
- Templates without `page: "outside-spread"` elements (TE01, TE02, TD01, TD02) show 2 pages as before
- Elements without `page` field default to `"front"` — they do NOT appear on the cover
- `getTemplateConfigsForCard("sterbebild", "single")` still returns TI04-TI09 (no templates disappear)

---

### Batch 2: Canvas Page Switching with Variable Sizes (1 file, ~60 lines)

**Goal**: Canvas resizes when switching between spread (140mm) and inner page (70mm).

#### Task 2.1: Resize canvas on page switch
- **File**: `src/components/canvas-builder/use-canvas-builder.ts`
- In `switchPage()` (line 177):
  ```typescript
  const switchPage = useCallback(async (pageId: string) => {
    const canvas = canvasRef.current;
    if (!canvas || pageId === activePageId) return;
    
    // Save current page
    pagesDataRef.current[activePageId] = canvas.toJSON();
    
    // Determine target dimensions
    const targetIsSpread = pages.find(p => p.id === pageId)?.isSpread ?? false;
    const targetDims = getCanvasDimensions(cardType!, cardFormat!, undefined, !targetIsSpread);
    canvas.resize(targetDims.width, targetDims.height);
    
    // Load target page (or blank)
    const targetJSON = pagesDataRef.current[pageId];
    if (targetJSON) {
      await canvas.loadJSON(targetJSON);
    } else {
      await canvas.loadJSON(JSON.stringify({ version: "6.0.0", objects: [], background: "#ffffff" }));
    }
    
    setActivePageId(pageId);
    setDims(targetDims);  // update dims state for zoom calculations
  }, [canvasRef, activePageId, pages, cardType, cardFormat]);
  ```
- **Key**: `perPage: true` for inner pages (70mm), `perPage: false` for spread (140mm). Uses EXISTING `getCanvasDimensions()` parameter.

#### Task 2.2: Handle template loading for 3 pages
- **File**: `src/components/canvas-builder/use-canvas-builder.ts`
- In `loadTemplate()` (line 90):
  - Detect `hasOuterPages` from template elements
  - Split elements into up to 3 groups by `page` field
  - **Default page for orphaned elements remains `"front"`** (matches `buildPageState()` behavior)
  - Build outside-spread at full width, inner pages at half width
  - First page to display = `"outside-spread"` (if exists) for first-time load
  ```typescript
  const firstPageId = hasOuterPages ? "outside-spread" : pageDefs[0].id;
  ```
  - Elements without `page` field → filtered to `"front"` group (NOT first page)
  ```typescript
  const frontConfigs = allConfigs.filter(
    cfg => {
      const page = (cfg.options.data as Record<string, unknown>)?.page;
      return page === "front" || !page;  // explicit "front" OR no page = inner left
    }
  );
  ```

#### Task 2.3: Store dimensions per page in pagesDataRef
- Store alongside JSON: `pagesDataRef.current[pageId] = JSON.stringify({ json: canvas.toJSON(), width, height })`
- On restore: verify dimensions match before loading
- Prevents: objects serialized at 140mm loaded into 70mm canvas (H2 fix)

#### Negative tests:
- Switching spread → inner → spread preserves all objects on each page
- Elements at x=900 on the spread (140mm) don't overflow when switching to inner page (different canvas)
- Orphaned elements (no `page` field) always appear on `"front"`, never on `"outside-spread"`

---

### Batch 3: Fold Line + Safe Zone + Bleed (3 files, ~120 lines)

**Goal**: Show fold line, safe zone, and bleed area on the canvas.

#### Task 3.1: Fold line overlay on spread canvas
- **File**: `src/components/canvas-builder/FabricCanvas.tsx`
- Add `showFoldLine?: boolean` prop
- When `true`, draw a **dashed vertical line** at center (50% width) using Fabric.js Line:
  ```typescript
  new fabric.Line([centerX, 0, centerX, height], {
    stroke: "rgba(255, 0, 0, 0.4)",
    strokeDashArray: [8, 4],
    selectable: false, evented: false, excludeFromExport: true,
    data: { isFoldLine: true },
  });
  ```
- Small "Falz" label above the line (excludeFromExport)
- Pattern follows existing `toggleGrid()` implementation (line 215-255)

#### Task 3.2: Safe zone indicators
- **File**: `src/components/canvas-builder/FabricCanvas.tsx`
- Add `showSafeZone?: boolean` prop
- Semi-transparent rectangles 5mm from edges and 5mm from fold line
- Non-selectable, `excludeFromExport: true`
- Toggleable via toolbar button

#### Task 3.3: Bleed area visualization (3mm) — OVERLAY ONLY
- **File**: `src/components/canvas-builder/FabricCanvas.tsx`
- **DO NOT change canvas dimensions** — bleed is visual-only in the editor
- Show bleed as a subtle shaded border 3mm inward from canvas edge
- Dotted rectangle at bleed boundary, non-selectable, `excludeFromExport: true`
- **Bleed in PDF only**: PDF generator (Batch 9) adds 3mm bleed by expanding rendered HTML during page creation — NOT by changing canvas coordinates
- This preserves the grid (0-1000) → pixel mapping used by all templates

#### Task 3.4: Warning when elements overlap safe zone
- **File**: `src/components/canvas-builder/use-canvas-builder.ts`
- On `object:modified` event, check text element bounds vs safe zone
- Non-blocking warning toast: "Text ist zu nah am Rand/Falz"

#### Negative tests:
- Fold line does NOT appear on single-format cards (TE01, TD01)
- Grid toggle + fold line don't interfere (both use `excludeFromExport`)
- Safe zone warning fires when text touches the fold, doesn't fire when text is safely positioned

---

### Batch 4: Live Thumbnails (2 files, ~80 lines)

**Goal**: SpreadNavigator shows real-time mini-previews.

#### Task 4.1: Thumbnail generation with debounce
- **File**: `src/components/canvas-builder/use-canvas-builder.ts`
- Add `thumbnails` state: `useState<Record<string, string>>({})`
- On canvas `object:modified` / `object:added` events → debounced (500ms):
  ```typescript
  const updateThumbnail = useDebouncedCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setThumbnails(prev => ({ ...prev, [activePageId]: canvas.toDataURL() }));
  }, 500);
  ```
- On page switch → snapshot outgoing page before switching
- For non-active pages → use last saved snapshot from `pagesDataRef`

#### Task 4.2: Wire thumbnails to SpreadNavigator
- **File**: `src/components/canvas-builder/SpreadNavigator.tsx`
- Already supports `thumbnail` prop — just wire `thumbnails[page.id]` to each page
- Spread thumbnail renders at aspect ratio 2:1 (140×105mm → wider than inner 70×105mm)
  ```typescript
  const thumbClass = page.isSpread ? "w-24 h-12" : "w-16 h-12";
  ```
- Active page has subtle border animation

#### Negative tests:
- Rapid page switches don't cause stale thumbnails
- `toDataURL()` excludes grid lines and fold line (`excludeFromExport: true`)
- Memory doesn't grow unbounded (thumbnails are replaced, not appended)

---

### Batch 5: Mobile Responsive Navigator (1 file, ~40 lines)

**Goal**: 3 thumbnails fit on small screens.

#### Task 5.1: Responsive SpreadNavigator
- **File**: `src/components/canvas-builder/SpreadNavigator.tsx`
- Desktop (≥640px): horizontal row, spread thumbnail 2x wider
- Mobile (<640px): horizontal scroll with `overflow-x-auto scroll-snap-x-mandatory`
- Spread thumbnail takes 2x width of inner thumbnails (proportional)
- Touch swipe support via CSS scroll-snap

#### Negative test: Navigator doesn't overflow on 320px viewport

---

### Batch 6: Undo/Redo Per Page (1 file, ~40 lines)

**Goal**: Undo/redo works correctly when switching between pages.

**Good news**: FabricCanvas ALREADY has undo/redo built in (`FabricCanvas.tsx:257-287`) with `historyRef` and `historyIndexRef`. The problem is that page switches load new JSON, which pollutes the history stack.

#### Task 6.1: Save/restore undo history per page
- **File**: `src/components/canvas-builder/use-canvas-builder.ts`
- Add `pagesHistoryRef: Record<string, { stack: string[]; index: number }>`
- On page switch (in `switchPage()`):
  1. Save current history: `pagesHistoryRef.current[activePageId] = { stack: [...historyRef.current], index: historyIndexRef.current }`
  2. Restore target history: load from `pagesHistoryRef.current[targetPageId]` or start fresh
- **Problem**: `historyRef` and `historyIndexRef` are internal to FabricCanvas (useRef inside forwardRef). They're NOT exposed via `FabricCanvasHandle`.
- **Fix**: Add to `FabricCanvasHandle` interface:
  ```typescript
  getHistory: () => { stack: string[]; index: number };
  setHistory: (stack: string[], index: number) => void;
  ```

#### Negative tests:
- Undo on page 2 does NOT affect page 1
- Page switch + undo + page switch back preserves all states
- History cap (MAX_HISTORY) still applies per page

---

### Batch 7: Cover Mode Toggle (2 files, ~60 lines)

**Goal**: User toggles between full-wrap and left-only cover modes.

#### Task 7.1: Cover mode toggle UI
- **File**: `src/components/canvas-builder/CanvasBuilderPage.tsx`
- When `activePageId === "outside-spread"`, show toggle buttons:
  - "Vollbild" (full-wrap) — image spans full 1000 grid width
  - "Halbbild" (left-only) — image constrained to 0-500 grid width, right half dimmed
- Toggle button styled consistently with existing ZoomControls

#### Task 7.2: Cover mode implementation via Fabric.js
- **File**: `src/components/canvas-builder/use-canvas-builder.ts`
- Add `coverMode` state: `"full-wrap" | "left-only"` (default: `"full-wrap"`)
- Algorithm for mode switch:
  ```typescript
  function applyCoverMode(canvas: FabricCanvasHandle, mode: "full-wrap" | "left-only") {
    const fabricCanvas = canvas.getCanvas();
    if (!fabricCanvas) return;
    const coverObj = fabricCanvas.getObjects().find(
      o => (o as any).data?.id === "cover-photo"
    );
    if (!coverObj) return;
    
    const canvasW = fabricCanvas.getWidth();
    if (mode === "full-wrap") {
      coverObj.set({ left: 0, width: canvasW, scaleX: canvasW / (coverObj.width ?? canvasW) });
    } else {
      coverObj.set({ left: 0, width: canvasW / 2, scaleX: (canvasW / 2) / (coverObj.width ?? canvasW) });
    }
    fabricCanvas.renderAll();
  }
  ```
- Store separate crop per mode in `DraftEnvelope`:
  ```typescript
  coverCrops?: { "full-wrap"?: CropData; "left-only"?: CropData };
  coverMode?: "full-wrap" | "left-only";
  ```
- **Bump `DRAFT_VERSION` from 1 to 2** — old drafts auto-cleared on version mismatch (existing logic at line 308-310)
- Warning toast before switching if user has edited: "Bildausschnitt wird angepasst"

#### Task 7.3: Right-half dimming for left-only mode
- **File**: `src/components/canvas-builder/FabricCanvas.tsx`
- When cover mode is `"left-only"`, draw semi-transparent white rect on right half
- `excludeFromExport: true`, non-selectable
- Pattern: same as fold line / safe zone overlays

#### Negative tests:
- Switching mode 3 times preserves crop data for both modes
- Cover mode toggle only appears when `outside-spread` is active
- `DraftEnvelope` version 1 (old drafts) auto-cleared, no crash

---

### Batch 8: Preview — 3 Views (2 files, ~60 lines)

**Goal**: Preview renders outside spread + inside left + inside right.

#### Task 8.1: Update preview route for 3 pages
- **File**: `src/app/api/preview/route.ts`
- Detect outer pages: `const hasOuterPages = config.elements.some(el => el.page === "outside-spread");`
- If `hasOuterPages`:
  1. Render outside spread: `buildPageState(state, config, "outside-spread")` — full width
  2. Render inside left: `buildPageState(state, config, "front")` — half width
  3. Render inside right: `buildPageState(state, config, "back")` — half width
- `buildPageState()` already defaults elements without `page` to `"front"` → cover only shows `page: "outside-spread"` elements. Inner pages show existing elements. **No orphaned elements leak to the cover.**
- Compute separate dimensions: outer spread at full `spreadWidthMm`, inner pages at `spreadWidthMm / 2`

#### Task 8.2: Render outside spread HTML
- **File**: `src/lib/editor/card-to-html-v2.ts`
- `renderSpreadHTML()` already handles all element types at arbitrary dimensions
- Pass full-width dimensions for outside spread, half-width for inner pages
- Add fold line indicator as CSS dashed border at center for outside spread

#### Negative tests:
- Preview with no cover photo shows TREE.jpg default (from `fixedAsset`)
- Elements without `page` field appear ONLY on "Innen links", never on "Außenseite"
- Single-format templates (TE01, TD01) still render 1 or 2 pages, not 3

---

### Batch 9: PDF — Print-Ready Output (2 files, ~100 lines)

**Goal**: PDF has 2 spreads with bleed and crop marks.

#### Task 9.1: Outside spread PDF page
- **File**: `src/lib/editor/pdf-generator.ts`
- Detect `hasOuterPages` from config elements
- Page 1: Outside spread at 146×111mm (140+3mm bleed each side × 105+3mm bleed each side)
- **Imposition**: Spread rendered as-is (left = back cover, right = front cover). When printed and folded, right side becomes the front.
- Uses shared `buildPageState(state, config, "outside-spread")`

#### Task 9.2: Inside spread PDF page
- **File**: `src/lib/editor/pdf-generator.ts`
- Page 2: Inside left + inside right side by side at 146×111mm
- Uses existing `buildPageState()` for `"front"` and `"back"`

#### Task 9.3: Crop marks + bleed
- Add 0.25pt lines at each corner showing trim boundaries
- Bleed area extends 3mm beyond trim
- PDF page size includes bleed; content area matches trim

#### Task 9.4: Update client-side PDF
- **File**: `src/lib/editor/canvas-export.ts` (function `exportCanvasToPDF`, line 97)
- Add outside-spread as first PDF page when present
- Sort pages: `"outside-spread"` first, then `"front"`, then `"back"`

#### Negative tests:
- PDF with left-only mode has white right half on outside spread
- Single-format templates produce 1-page PDF (no outside spread)
- PDF dimensions include 3mm bleed on all sides

---

### Batch 10: Template Picker + QA (2 files, ~30 lines + testing)

**Goal**: Template picker shows cover preview, full production QA.

#### Task 10.1: Template picker shows cover indicator
- **File**: `src/components/canvas-builder/TemplatePicker.tsx`
- For templates with `outside-spread` elements: show small "Außenseite" badge
- Don't need full cover preview (all templates use same TREE.jpg default)

#### Task 10.2: Full QA pass
- Quality gate: `node scripts/quality-gate.mjs` — must PASS
- Unit tests: `npx vitest --maxWorkers=2` — must PASS, no regressions
- All 10 templates render (TI04-TI09 with cover + TE01-TD02 without)
- Playwright E2E on localhost:
  - Select template → see 3 thumbnails → navigate between pages
  - Upload cover photo → see live thumbnail update
  - Switch cover mode → fold line + dimming visible
  - Preview → 3 sections (outside + inside left + inside right)
  - PDF → 2 pages with bleed
  - Switch to single-format template → 2 pages, no fold line
- Push to Vercel → verify on https://trauerpost.vercel.app
- Mobile viewport (375px, 414px) — navigator doesn't overflow
- V1 wizard (`/builder`) — TI04-TI09 still appear and render correctly (no breakage)
- V2 canvas builder (`/builder-v2`) — all 3 pages work

#### Negative tests:
- Single-format templates (TE01, TE02, TD01, TD02) show 2 pages, no fold line, no cover
- Template without outside-spread elements renders without crash
- PDF generates correctly for both single and folded formats
- V1 wizard StepTemplate still shows TI04-TI09 (cardFormat filter unchanged)

---

## File Impact Summary

| File | Batches | Changes |
|------|---------|---------|
| `public/TREE.png` → `TREE.jpg` | 0 | Compress from 9.7MB to <500KB |
| `src/lib/editor/card-to-html-v2.ts` | 0, 8 | Extract `buildPageState()`, fold line CSS |
| `src/lib/editor/template-configs.ts` | 1 | Add `cover-photo` elements to TI04-TI09 |
| `src/components/canvas-builder/use-canvas-builder.ts` | 1, 2, 3, 4, 6, 7 | Page defs, resize, thumbnails, undo, cover mode |
| `src/components/canvas-builder/SpreadNavigator.tsx` | 1, 4, 5 | `isSpread` flag, thumbnails, responsive |
| `src/components/canvas-builder/FabricCanvas.tsx` | 3, 6, 7 | Fold line, safe zone, bleed, history API, dimming |
| `src/lib/editor/canvas-dimensions.ts` | 3 | `getCanvasDimensionsWithBleed()` |
| `src/components/canvas-builder/CanvasBuilderPage.tsx` | 7 | Cover mode toggle UI |
| `src/app/api/preview/route.ts` | 0, 8 | Import shared `buildPageState()`, 3-page render |
| `src/lib/editor/pdf-generator.ts` | 0, 9 | Import shared `buildPageState()`, 2-spread PDF, bleed |
| `src/lib/editor/canvas-export.ts` | 9 | `exportCanvasToPDF()` with outside-spread |
| `src/components/canvas-builder/TemplatePicker.tsx` | 10 | Cover badge |

## Batch Dependencies

```
Batch 0 (prerequisites: compress image, extract buildPageState)
  └── Batch 1 (page defs + template elements)
        ├── Batch 2 (page switching + resize)
        │     └── Batch 6 (undo/redo per page)
        ├── Batch 3 (fold line / bleed / safe zone)
        ├── Batch 4 (live thumbnails)
        │     └── Batch 5 (mobile responsive)
        ├── Batch 7 (cover mode toggle)
        ├── Batch 8 (preview) — needs Batch 0 (shared buildPageState)
        │     └── Batch 9 (PDF)
        └── Batch 10 (picker + QA) — depends on ALL above
```

## QA Findings Addressed

| Finding | Severity | How Fixed |
|---------|----------|-----------|
| C1: Default page sends orphans to cover | CRITICAL | Hardcode `"front"` as default, don't derive from `pageDefs[0]` |
| C2: V1 wizard breaks | CRITICAL | Keep `cardFormat: "single"`, detect outer pages from elements |
| C3: "4 pages" vs "3 pages" inconsistency | CRITICAL | Consistently "3 pages (1 spread + 2 inner)" everywhere |
| H1: Cover mode toggle undefined | HIGH | Defined exact Fabric.js API: `getObjects().find()` + `set()` |
| H2: Objects serialized at wrong canvas size | HIGH | Store dimensions per page in `pagesDataRef` |
| H3: Duplicate `buildPageState()` | HIGH | Extract to shared `card-to-html-v2.ts` in Batch 0 |
| M1: Batch 2 file count wrong | MEDIUM | Fixed: 1 file |
| M2: Batch 3 file count wrong | MEDIUM | Fixed: 3 files |
| M3: `DraftEnvelope` name collision | MEDIUM | Changes go to canvas builder's DraftEnvelope only |
| M4: TREE.png 9.7MB not optimized | MEDIUM | Batch 0 Task 0.1: compress to <500KB |

## Lessons Applied (from MEMORY.md)

| Lesson | How Applied |
|--------|-------------|
| Rule 2: Test BOTH builders | Batch 10 QA explicitly tests V1 wizard + V2 canvas |
| Lesson 19: Name translation across stages | Kept `"front"`/`"back"` page IDs unchanged, no cross-stage name mismatch |
| Lesson 25: Type change = grep ALL consumers | Verified ALL callers of `getPageDefs`, `getCanvasDimensions`, `getTemplateConfigsForCard` |
| Lesson 33: Simplified matching names mask bugs | Negative tests use realistic templates (TI04 has no page field, TI05 has front+back) |
| Lesson 41: Every safety net needs negative test | Every batch has explicit negative tests |

## Risks

1. **P1-P3 bugs still open** — preview/PDF pipeline may change during those fixes. Mitigated: Batch 0 extracts shared code first.
2. **Fabric.js canvas resize flicker** — switching between 140mm and 70mm may cause visual jank. Mitigated: show loading indicator during page switch.
3. **Print house page order** — need to CONFIRM outside spread goes on page 1. If reversed, change Batch 9 ordering.
4. **FabricCanvas history internals** — exposing `historyRef`/`historyIndexRef` via handle requires changes to FabricCanvas internals.

## Success Criteria

- [ ] 3 pages visible in canvas builder (1 spread + 2 inner)
- [ ] SpreadNavigator shows 3 live thumbnails with correct aspect ratios
- [ ] Fold line visible on outside spread only
- [ ] Safe zone + bleed indicators toggleable
- [ ] Cover mode toggle (full/half) preserves crop per mode
- [ ] Preview shows 3 views (outside + inside left + inside right)
- [ ] PDF outputs 2 spreads with 3mm bleed + crop marks
- [ ] Undo/redo isolated per page
- [ ] Mobile navigator scrollable, not overflowing
- [ ] Template picker shows cover badge
- [ ] V1 wizard (`/builder`) still works for TI04-TI09 — no breakage
- [ ] V2 canvas builder (`/builder-v2`) has full 3-page support
- [ ] All existing unit tests pass (216+)
- [ ] All Playwright tests pass (101+)
- [ ] Quality gate passes (68+)
- [ ] Production deployed and verified on trauerpost.vercel.app
