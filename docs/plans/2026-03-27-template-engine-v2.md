# Template Engine v2 — Coordinate-Based Rendering (Fixed)

**Goal:** 6 Sterbebild Innenseiten templates rendered from JSON configs using absolute coordinates on a 1000×1000 grid. Connected to the wizard for end-user card creation.

**v2 fixes applied (from QA + Review):**
- F1: Auto font-shrink for text overflow + wizard warning
- F2: Font units changed from px to pt (print standard)
- F3: Replace T1-T6 with TI04-TI09 (single system, delete old)
- F4: Photo crop support in renderer + drag-to-position in wizard
- F5: `fontFamily_override` added to TemplateElement schema
- F6: StepText shows dynamic fields per template config
- F7: Real miniature thumbnails for StepTemplate

---

## Card Dimensions

| Card Type | Spread Size | Grid 1000 = |
|-----------|------------|-------------|
| Erinnerungsbild | 140 × 105 mm | X: 0.14mm/unit, Y: 0.105mm/unit |

**Note:** Grid is NOT square in physical space. w:100 = 14mm, h:100 = 10.5mm. A grid-square (w=h) renders as a rectangle. Template authors must account for this.

---

## Part 1: Font Library (20 fonts)

### Current (14) + Add 6:

| Font | Category | Use case |
|------|----------|----------|
| Pinyon Script | Script | TI 04 decorative name |
| Alex Brush | Script | Alternative cursive |
| Cormorant SC | Small-Caps | TI 06 small-caps |
| EB Garamond SC | Small-Caps | Alternative |
| Cormorant Infant | Light Serif | TI 08 light (weight 300) |
| Crimson Pro | Variable Serif | Wide weight range |

### Google Fonts loading (F2 fix):
```typescript
// Load with multiple weights for pt-based rendering
`https://fonts.googleapis.com/css2?family=${font}:wght@300;400;700&display=swap`
```

---

## Part 2: TemplateElement Schema (F5 fix: fontFamily_override added)

```typescript
interface TemplateConfig {
  id: string;                    // "TI04", "TI05", etc.
  name: string;
  description: string;
  referenceImage: string;        // path to reference image
  cardType: CardType;
  cardFormat: CardFormat;
  spreadWidthMm: number;         // 140
  spreadHeightMm: number;        // 105
  requiredFields: string[];      // which wizard fields this template needs (F6)
  requiresPhoto: boolean;        // TI04=false, others=true
  elements: TemplateElement[];
}

type ElementType = "text" | "image" | "line" | "ornament";

interface TemplateElement {
  id: string;
  type: ElementType;
  // Position on 1000×1000 grid
  x: number;
  y: number;
  w: number;
  h: number;
  // Content source
  field?: string;                // wizard field: "name", "birthDate", etc.
  fixedContent?: string;         // for fixed text
  fixedAsset?: string;           // path to ornament file
  // Typography (F2: all sizes in pt, not px)
  fontSize?: number;             // in pt (1pt = 0.353mm). 22pt ≈ 7.8mm
  fontWeight?: string;           // "normal" | "bold" | "300"
  fontStyle?: string;            // "normal" | "italic"
  fontVariant?: string;          // "normal" | "small-caps"
  fontFamily?: string;           // F5: per-element font override (e.g., "Pinyon Script")
  textTransform?: string;        // "none" | "uppercase"
  textAlign?: string;            // "left" | "center" | "right"
  letterSpacing?: string;        // "0" | "1px" | "2px"
  color?: string;                // default "#1A1A1A"
  // Text overflow (F1)
  autoShrink?: boolean;          // default true — reduce fontSize until text fits
  minFontSize?: number;          // minimum pt size before clipping (default 6pt)
  // Image specific
  imageFit?: string;             // "cover" | "contain"
  imageClip?: string;            // "none" | "ellipse" | "rounded"
  imageBorder?: string;          // "none" | "1px solid #ddd"
  useCrop?: boolean;             // F4: use state.photo.crop for positioning
  // Line specific
  lineStyle?: string;            // "1px solid #ccc"
}
```

### Font unit convention (F2):
- **All font sizes in `pt`** (points). 1pt = 0.353mm = 1.333px at 96dpi.
- Puppeteer renders pt correctly in print mode.
- Conversion table:

| pt | mm | approx px (96dpi) | Use for |
|----|-----|-------------------|---------|
| 7 | 2.5 | 9 | Small captions |
| 9 | 3.2 | 12 | Author, footnotes |
| 11 | 3.9 | 15 | Dates, body text |
| 14 | 4.9 | 19 | Sub-headings |
| 18 | 6.4 | 24 | Names (medium) |
| 22 | 7.8 | 29 | Names (large) |
| 26 | 9.2 | 35 | Names (script/display) |

---

## Part 3: Text Overflow Strategy (F1)

### Problem:
User types long name or 20-line quote → text overflows its fixed-height box → silently clipped.

### Solution: Auto font-shrink + wizard warning

**In the HTML renderer (`card-to-html-v2.ts`):**

Each text element gets a container with `overflow:hidden`. The renderer uses Puppeteer's `page.evaluate()` to measure text height after rendering:

```typescript
async function applyAutoShrink(page: Page, elementId: string, maxFontSize: number, minFontSize: number): Promise<void> {
  await page.evaluate(({ id, min }) => {
    const el = document.getElementById(id);
    if (!el) return;
    let size = parseFloat(el.style.fontSize);
    while (el.scrollHeight > el.clientHeight && size > min) {
      size -= 0.5;
      el.style.fontSize = size + "pt";
    }
  }, { id: elementId, min: minFontSize });
}
```

After `page.setContent(html)`, loop through all text elements and shrink as needed. This is WYSIWYG — the final PDF matches exactly.

**In the wizard preview (StepText/StepPreview):**

```typescript
// Show warning when text is likely to overflow
function TextOverflowWarning({ text, maxChars }: { text: string; maxChars: number }) {
  if (text.length <= maxChars) return null;
  return (
    <p className="text-xs text-amber-600 mt-1">
      Text ist lang — Schriftgröße wird automatisch angepasst.
    </p>
  );
}
```

Approximate `maxChars` per element based on box size and font size. Not exact — just a UX hint.

**Per-element defaults:**
- `autoShrink: true` for all text elements
- `minFontSize: 6` (pt) — below this, text is unreadable in print

---

## Part 4: Photo Crop in Renderer (F4)

### Problem:
User uploads landscape photo → portrait slot → face gets cut off by `cover`.

### Solution: Use `state.photo.crop` + drag-to-position

**In renderer:**
```typescript
function renderImageElement(el: TemplateElement, state: WizardState, images: ImageMap, posStyle: string): string {
  const base64 = images[el.field ?? "photo"];
  if (!base64) return `<div style="${posStyle}background:#f5f5f5;"></div>`;

  let imgStyle = `background-image:url('${base64}');background-size:cover;`;

  // F4: Apply user crop if available
  if (el.useCrop !== false && state.photo.crop) {
    const { x, y, width, height } = state.photo.crop;
    // Convert crop rectangle to background-position/size
    imgStyle = `background-image:url('${base64}');`;
    imgStyle += `background-size:${(100 / width * 100).toFixed(1)}% ${(100 / height * 100).toFixed(1)}%;`;
    imgStyle += `background-position:${(-x / width * 100).toFixed(1)}% ${(-y / height * 100).toFixed(1)}%;`;
  }

  // Clip path
  let clipStyle = "";
  if (el.imageClip === "ellipse") clipStyle = "clip-path:ellipse(50% 50%);border-radius:50%;";
  if (el.imageClip === "rounded") clipStyle = "border-radius:8px;";

  const borderStyle = el.imageBorder && el.imageBorder !== "none" ? `border:${el.imageBorder};` : "";

  return `<div style="${posStyle}${imgStyle}${clipStyle}${borderStyle}background-repeat:no-repeat;"></div>`;
}
```

**In wizard (StepPhoto):**
Add drag-to-position on the photo preview. When user drags, update `state.photo.crop`. Implementation: simple `mousedown`/`mousemove` handler that updates x/y offset within the frame.

---

## Part 5: Replace T1-T6 with TI04-TI09 (F3)

### Current state:
- `card-templates.ts` has S1-S4 (pages mode) + E1-E2, F1-F2 (pages mode) + T1-T6 (spread mode, CSS Grid)
- `card-to-html.ts` has CSS Grid renderer with spread branch

### Migration:
1. **Delete** T1-T6 from `card-templates.ts` (they are the broken CSS Grid spreads)
2. **Keep** S1-S4, E1-E2, F1-F2 unchanged (they work for non-spread cards)
3. **Add** TI04-TI09 as new `TemplateConfig` objects in `template-configs.ts`
4. **Routing in renderer:**
   ```typescript
   if (templateId.startsWith("TI")) {
     // v2: absolute positioning from template-configs.ts
     return renderSpreadV2(config, state, images);
   } else {
     // v1: CSS Grid from card-templates.ts (S1-S4, E1, E2, F1, F2)
     return renderCardHTMLV1(state);
   }
   ```
5. **Bump DRAFT_VERSION to 5** — old drafts with T1-T6 templateIds are discarded
6. **StepTemplate** shows TI04-TI09 for sterbebild single, keeps S1-S4/E1-E2/F1-F2 for other card types

---

## Part 6: Dynamic StepText Fields (F6)

### Problem:
StepText shows hardcoded fields (heading, name, dates, quote). TI07 needs locationBirth/locationDeath. TI04 needs quoteAuthor. TI08 doesn't need quote at all.

### Solution: `requiredFields` on TemplateConfig

Each config specifies which wizard fields are needed:
```typescript
// TI04
requiredFields: ["heading", "relationshipLabels", "name", "quote", "quoteAuthor", "birthDate", "deathDate"]

// TI07
requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath", "dividerSymbol"]

// TI08
requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath"]
```

**StepText dynamically renders inputs:**
```typescript
const config = getTemplateConfig(state.templateId);
const fields = config?.requiredFields ?? ["name", "birthDate", "deathDate"];

return (
  <div>
    {fields.includes("heading") && <TextInput field="heading" ... />}
    {fields.includes("relationshipLabels") && <TextInput field="relationshipLabels" ... />}
    {fields.includes("name") && <TextInput field="name" required ... />}
    {fields.includes("birthDate") && <TextInput field="birthDate" ... />}
    {fields.includes("deathDate") && <TextInput field="deathDate" ... />}
    {fields.includes("locationBirth") && <TextInput field="locationBirth" ... />}
    {fields.includes("locationDeath") && <TextInput field="locationDeath" ... />}
    {fields.includes("quote") && <TextArea field="quote" ... />}
    {fields.includes("quoteAuthor") && <TextInput field="quoteAuthor" ... />}
    {fields.includes("closingVerse") && <TextArea field="closingVerse" ... />}
    {fields.includes("dividerSymbol") && <DividerPicker ... />}
  </div>
);
```

---

## Part 7: Real Thumbnails for StepTemplate (F7)

### Problem:
Current StepTemplate wireframe uses CSS Grid `panelId: "front"` — spread templates have `panelId: "spread"` → blank thumbnails.

### Solution: Pre-rendered miniature thumbnails

Each `TemplateConfig` includes a thumbnail that's a miniature HTML render of the template with placeholder content:

```typescript
interface TemplateConfig {
  ...
  thumbnail: {
    previewName: string;      // "Max Mustermann"
    previewDates: string;     // "* 01.01.1940  † 01.01.2024"
    previewQuote?: string;    // "Ruhe in Frieden"
  };
}
```

**StepTemplate renders miniature cards:**
```typescript
function TemplateThumbnail({ config }: { config: TemplateConfig }) {
  // Render a scaled-down version (width: 200px) of the actual template
  // Using the same coordinate-based rendering as the full PDF
  // With placeholder text from config.thumbnail
  return (
    <div style={{ width: 200, height: 150, position: "relative", transform: "scale(0.15)", transformOrigin: "top left" }}>
      {config.elements.map(el => renderMiniElement(el, config.thumbnail))}
    </div>
  );
}
```

This shows the REAL layout with placeholder text — not a wireframe.

---

## Part 8: 6 Template Configs (with all fixes applied)

All configs use: `pt` font sizes, `autoShrink: true`, `fontFamily` per element, `useCrop: true` on photos.

### TI 04 — "Nur Text" (Sieglinde)
```
requiredFields: ["heading", "relationshipLabels", "name", "quote", "quoteAuthor", "birthDate", "deathDate"]
requiresPhoto: false
```
| Element | field | x | y | w | h | fontSize (pt) | style | fontFamily |
|---------|-------|---|---|---|---|--------------|-------|------------|
| heading | heading | 30 | 50 | 520 | 40 | 8 | normal | (global) |
| labels | relationshipLabels | 30 | 90 | 520 | 40 | 8 | normal | (global) |
| name | name | 30 | 150 | 520 | 100 | 20 | normal | **Pinyon Script** |
| quote | quote | 30 | 270 | 520 | 280 | 9 | italic | (global) |
| author | quoteAuthor | 30 | 560 | 520 | 30 | 7 | normal | (global) |
| birthDate | birthDate | 600 | 350 | 370 | 40 | 9 | normal, right | (global) |
| deathDate | deathDate | 600 | 400 | 370 | 40 | 9 | normal, right | (global) |

### TI 05 — "Foto 50/50" (Brigitte)
```
requiredFields: ["heading", "name", "birthDate", "deathDate", "quote", "quoteAuthor"]
requiresPhoto: true
```
| Element | field/type | x | y | w | h | fontSize (pt) | style |
|---------|-----------|---|---|---|---|--------------|-------|
| photo | image | 0 | 0 | 500 | 1000 | — | cover, useCrop |
| heading | heading | 510 | 150 | 460 | 40 | 8 | italic, center |
| line-top | line | 510 | 200 | 460 | 1 | — | 1px solid #ccc |
| name | name | 510 | 220 | 460 | 80 | 18 | bold, center |
| birth | birthDate | 510 | 310 | 460 | 30 | 9 | center |
| death | deathDate | 510 | 345 | 460 | 30 | 9 | center |
| line-mid | line | 510 | 395 | 460 | 1 | — | 1px solid #ccc |
| quote | quote | 510 | 420 | 460 | 150 | 8 | italic, center |
| author | quoteAuthor | 510 | 580 | 460 | 30 | 7 | center |

### TI 06 — "L-Form" (Thilde)
```
requiredFields: ["name", "birthDate", "deathDate", "quote"]
requiresPhoto: true
```
| Element | field/type | x | y | w | h | fontSize (pt) | style |
|---------|-----------|---|---|---|---|--------------|-------|
| photo | image | 30 | 30 | 300 | 470 | — | cover, border 1px #ddd, useCrop |
| name | name | 380 | 80 | 580 | 100 | 16 | small-caps, bold, letter-spacing 2px |
| birth | birthDate | 380 | 200 | 580 | 30 | 9 | center |
| death | deathDate | 380 | 240 | 580 | 30 | 9 | center |
| quote | quote | 380 | 520 | 580 | 230 | 8 | small-caps, letter-spacing 1px, center |

### TI 07 — "Drei-Zonen" (Franziska)
```
requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath", "dividerSymbol"]
requiresPhoto: true
```
| Element | field/type | x | y | w | h | fontSize (pt) | style |
|---------|-----------|---|---|---|---|--------------|-------|
| ornament | fixedAsset | 20 | 40 | 130 | 510 | — | cross-with-roses.png, contain |
| name | name | 170 | 180 | 380 | 170 | 18 | normal (2-line) |
| birth | birthDate | 170 | 370 | 380 | 30 | 9 | normal |
| birthPlace | locationBirth | 170 | 405 | 380 | 25 | 8 | normal |
| death | deathDate | 170 | 450 | 380 | 30 | 9 | normal |
| deathPlace | locationDeath | 170 | 485 | 380 | 25 | 8 | normal |
| divider | dividerSymbol | 170 | 550 | 380 | 30 | 9 | red #cc0000, center |
| photo | image | 580 | 40 | 390 | 660 | — | cover, rounded 8px, border, useCrop |

### TI 08 — "Oval-Spiegel" (Erna)
```
requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath"]
requiresPhoto: true
```
| Element | field/type | x | y | w | h | fontSize (pt) | style |
|---------|-----------|---|---|---|---|--------------|-------|
| cross | fixedAsset | 30 | 50 | 50 | 150 | — | cross-simple.svg, contain |
| line-top | line | 80 | 120 | 360 | 1 | — | 1px solid #999 |
| name | name | 100 | 240 | 340 | 180 | 20 | weight 300 (2-line) |
| birth | birthDate | 100 | 440 | 340 | 30 | 9 | normal |
| birthPlace | locationBirth | 100 | 475 | 340 | 25 | 8 | normal |
| death | deathDate | 100 | 520 | 340 | 30 | 9 | normal |
| deathPlace | locationDeath | 100 | 555 | 340 | 25 | 8 | normal |
| line-bottom | line | 30 | 700 | 410 | 1 | — | 1px solid #999 |
| photo | image | 500 | 80 | 460 | 680 | — | cover, **ellipse clip**, useCrop |

### TI 09 — "Floral Symmetrisch" (Renate)
```
requiredFields: ["heading", "name", "birthDate", "deathDate", "closingVerse", "quote"]
requiresPhoto: true
```
| Element | field/type | x | y | w | h | fontSize (pt) | style |
|---------|-----------|---|---|---|---|--------------|-------|
| ornament | fixedAsset | 350 | 20 | 300 | 130 | — | flower-outline.svg, contain |
| quote | quote | 30 | 200 | 440 | 550 | 8 | italic |
| heading | heading | 530 | 150 | 430 | 40 | 8 | center |
| name | name | 530 | 210 | 430 | 100 | 18 | bold, center |
| birth | birthDate | 530 | 320 | 430 | 30 | 9 | center |
| death | deathDate | 530 | 355 | 430 | 30 | 9 | center |
| line | line | 530 | 410 | 430 | 1 | — | 1px solid #ccc |
| verse | closingVerse | 530 | 430 | 430 | 80 | 8 | italic, center |
| photo | image | 650 | 600 | 300 | 250 | — | cover, small, useCrop |

---

## Part 9: Execution Batches

### Batch 0: Foundation
1. Add 6 fonts to `WIZARD_FONTS` (20 total)
2. Create `src/lib/editor/template-configs.ts` — TemplateConfig + TemplateElement interfaces + 6 configs
3. Create `src/lib/editor/card-to-html-v2.ts` — absolute-position renderer with:
   - `pt` font units
   - Auto font-shrink via `page.evaluate()`
   - Photo crop support (`state.photo.crop` → `background-position`/`background-size`)
   - Line rendering
   - Ornament rendering
   - `fontFamily` per element
4. Update `pdf-generator.ts` — routing: TI* → v2 renderer, others → v1
5. Delete T1-T6 from `card-templates.ts`
6. Bump `DRAFT_VERSION` to 5
7. `npx tsc --noEmit` → must pass
8. Commit

### Batch 1-6: One template per batch (TI04 → TI09)
Each batch:
1. Generate PDF with test data
2. **Open PDF + reference image side by side**
3. Check every element position, font, size, style
4. Adjust coordinates if needed
5. Re-generate until match
6. Save to `public/test-pdfs/{id}.pdf`
7. Commit

### Batch 7: Wizard integration
1. Update `StepTemplate.tsx` — show TI04-TI09 with real miniature thumbnails (F7)
2. Update `StepText.tsx` — dynamic fields from `config.requiredFields` (F6)
3. Update `StepPhoto.tsx` — skip for TI04 (requiresPhoto=false), drag-to-crop for others (F4)
4. Update `CardRenderer.tsx` — v2 renderer for browser preview
5. Add overflow warning component (F1)
6. `npx tsc --noEmit && npx next build`
7. Commit

### Batch 8: E2E tests
1. Playwright: full wizard flow for each template
2. PDF generation API test for each template
3. Commit + push

### Batch 9: Final verification
1. Generate all 6 PDFs → visual comparison → all pass
2. Email all 6 to ofir393@gmail.com (ONE TIME, not before this point)
3. Push

---

## Files

| File | Action |
|------|--------|
| `src/lib/editor/wizard-state.ts` | Modify — add 6 fonts, DRAFT_VERSION=5 |
| `src/lib/editor/template-configs.ts` | **Create** — 6 JSON configs + interfaces |
| `src/lib/editor/card-to-html-v2.ts` | **Create** — absolute-position renderer |
| `src/lib/editor/card-templates.ts` | Modify — delete T1-T6 |
| `src/lib/editor/pdf-generator.ts` | Modify — routing v1/v2 |
| `src/components/wizard/steps/StepTemplate.tsx` | Modify — real thumbnails |
| `src/components/wizard/steps/StepText.tsx` | Modify — dynamic fields |
| `src/components/wizard/steps/StepPhoto.tsx` | Modify — skip/crop |
| `src/components/wizard/CardRenderer.tsx` | Modify — v2 preview |
| `public/assets/ornaments/` | Exists |
| `public/test-pdfs/` | Output |
