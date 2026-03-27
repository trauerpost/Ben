# Next Session Prompt — Template Engine v2 Completion

## Project
BENJEMIN (Trauerpost) — Memorial card builder platform
**Dir:** `C:\Users\fires\OneDrive\Git\BENJEMIN`

## Context
We're building a template-based card creation system. The foundation is done — 6 templates (TI04-TI09) with coordinate-based rendering on a 1000×1000 grid. PDFs generate but need visual refinement.

## What's Done
- Template Engine v2 with absolute positioning (not CSS Grid)
- `src/lib/editor/template-configs.ts` — 6 template JSON configs (TI04-TI09)
- `src/lib/editor/card-to-html-v2.ts` — HTML renderer with pt fonts, auto font-shrink
- `src/lib/editor/pdf-generator.ts` — v1/v2 routing (TI* → v2, others → v1)
- `src/lib/editor/image-fitter.ts` — image fit calculation (needs integration)
- 20 Google Fonts including script, small-caps, light weights
- Ornament assets in `public/assets/ornaments/` (cross, flowers)
- Test PDFs in `public/test-pdfs/` (all 6 generated)
- Scorer at `scripts/score-v2.ts` (checks HTML structure, not visual quality)
- Generate script at `scripts/generate-v2.ts`
- Plan at `docs/plans/2026-03-27-template-engine-v2.md`
- Reference images at `docs/WhatsApp Image 2026-03-27 at *.jpeg` (4 images: TI05 Brigitte, TI06 Thilde, TI07 Franziska, TI08 Erna)

## What Needs To Be Done

### 1. Photo Crop UI in Wizard (CRITICAL)
StepPhoto needs a crop tool where the user:
- Sees the template's photo frame (exact slot dimensions)
- Can **zoom** (resize) the photo inside the frame
- Can **drag** the photo to position it (like profile picture crop)
- The result is stored in `state.photo.crop` (x, y, width, height — all 0-1 fractions)
- The renderer uses this crop for `background-position` + `background-size`

Current state: `StepPhoto.tsx` just uploads a photo. No crop UI. `state.photo.crop` exists but is never set.

### 2. Fix TI09 (Broken)
- Background is gray instead of white (SVG ornament issue)
- Flower ornament (`flower-outline.svg`) renders poorly — may need a better asset
- Photo is too small and badly positioned
- Compare with reference: should be quote left, ornament center-top, text+photo right

### 3. Visual Refinement of ALL Templates
Each template needs coordinate adjustments comparing PDF output to reference images:
- TI04: dates need to be more vertically centered
- TI05: check line positions, text spacing
- TI06: photo should be more square, check small-caps rendering
- TI07: cross ornament positioning, photo needs padding
- TI08: oval clip, cross + line alignment, light font weight
- TI09: complete rework needed

Reference images are in `docs/` folder — open them and compare side by side.

### 4. Dynamic StepText (per template fields)
`StepText.tsx` currently shows fixed fields. Needs to show ONLY the fields each template requires.
Each `TemplateConfig` has `requiredFields: string[]` — use this to filter inputs dynamically.

### 5. StepTemplate Thumbnails
`StepTemplate.tsx` wireframe is broken for spread templates.
Need real miniature thumbnails rendered from the actual template configs.

### 6. Wizard Integration
- StepTemplate shows TI04-TI09 for sterbebild
- StepPhoto skip for TI04 (requiresPhoto: false)
- StepPreview uses v2 renderer for TI* templates
- StepOrder unchanged

### 7. Scorer Improvement
Current scorer checks HTML properties (position:absolute, font-style:italic, etc.) — gives 100/100 to visually broken templates. Needs to also check:
- Actual rendered pixel dimensions (Puppeteer screenshot comparison)
- Background color verification
- Element overlap detection
- Photo presence/size verification

### 8. E2E Tests
Playwright tests for full wizard flow with each template.

## Key Files
```
src/lib/editor/template-configs.ts    — 6 JSON configs
src/lib/editor/card-to-html-v2.ts     — v2 renderer
src/lib/editor/pdf-generator.ts       — v1/v2 routing
src/lib/editor/image-fitter.ts        — image fit (needs integration)
src/lib/editor/wizard-state.ts        — state model (TextContent with new fields)
src/lib/editor/card-templates.ts      — v1 templates (S1-S4, E1-E2, F1-F2)
src/components/wizard/steps/StepPhoto.tsx
src/components/wizard/steps/StepText.tsx
src/components/wizard/steps/StepTemplate.tsx
src/components/wizard/steps/StepPreview.tsx
src/components/wizard/CardRenderer.tsx
scripts/generate-v2.ts                — generate test PDFs
scripts/score-v2.ts                   — score templates
public/test-pdfs/                     — generated PDFs
public/assets/ornaments/              — SVG/PNG ornaments
docs/plans/2026-03-27-template-engine-v2.md — approved plan
```

## Template Reference Mapping
| Template | Reference Image | Subject |
|----------|----------------|---------|
| TI04 | (from Drive screenshot) | Sieglinde — text only, Pinyon Script |
| TI05 | WhatsApp 07.39.46.jpeg | Brigitte — photo 50/50 + lines |
| TI06 | WhatsApp 07.40.59.jpeg | Thilde — L-form, small-caps |
| TI07 | WhatsApp 07.41.17.jpeg | Franziska — 3-zone + cross |
| TI08 | WhatsApp 07.42.05.jpeg | Erna — oval photo + cross + lines |
| TI09 | (from Drive screenshot) | Renate — floral + quote left |

## Execution Order
1. Photo crop UI (resize + drag in wizard)
2. Fix TI09
3. Visual refinement template by template (compare with references)
4. Dynamic StepText
5. StepTemplate thumbnails
6. Full wizard integration
7. E2E tests
8. Final verification + email all 6 PDFs

## Important Notes
- Font sizes are in **pt** (not px) — 1pt = 0.353mm
- Grid 1000×1000 is NOT square physically (1 unit X = 0.14mm, Y = 0.105mm)
- v2 renderer ignores global `textContent.textAlign` — uses element-level only
- Auto font-shrink runs via Puppeteer `page.evaluate()` after HTML load
- DRAFT_VERSION = 5
- Existing S1-S4/E1-E2/F1-F2 templates (v1 CSS Grid) still work, untouched
