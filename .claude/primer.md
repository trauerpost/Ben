# BENJEMIN Session Primer
<!-- AUTO-UPDATED by Claude at end of every session -->
<!-- Last updated: 2026-04-02 -->

## Active Task
TEMPLATE CALIBRATION — TI05 done (98/100), TI06 done (front 100, back 93). TI07 in progress, TI08 in progress.

## Current Branch
master (many unpushed commits + uncommitted changes)

## Builders Status
- **Wizard** (`/builder`): Production-ready, CSS grid only (no Fabric.js)
- **Canvas Builder** (`/builder-v2`): TI05 back 98/100, TI06 front 100/100 + back 93/100. TI07+TI08 in calibration.

## Completed This Session (2026-04-02)
- RuFlo MCP activated (fix: `claude mcp add` instead of `.mcp.json`, `npx.cmd` on Windows)
- **Scorer rewritten**: measurement-based approach — Gemini measures each image independently as JSON (x,y,w,h %), we compute diff numerically. Replaces old subjective 2-image comparison. Much more consistent.
- **Scorer prompt**: ONE universal prompt for ALL page types, same schema, same grid language
- **Key rotation**: scorer auto-rotates Gemini API keys on 429 (`GEMINI_API_KEY` + `Gemini_key` from .env.local)
- **TI07 restructured**: front=text+ornament, back=photo (NOT the typical front=photo pattern)
- **TI07 ornament**: uses `FlowerBest.png` (transparent cross-rose from user), NOT hand-drawn SVG
- **TI07 back: 100/100** — photo x=150 y=140 w=700 h=670, rounded corners
- **TI07 front: 74/100** — text positions near-perfect, ornament w slightly narrow (28 vs 38 ref)
- **TI07 stars**: changed from red `✦ ✦ ✦` to black `✦  ✦  ✦`, bold
- **TI08 restructured**: front=cross+text, back=oval photo. Uses `T8_Cross.png` (transparent thin cross)
- **TI08 reference**: `docs/T8New.png` (better quality)
- **TI08 positions adjusted** but not yet scored (Gemini quota exhausted)

## Next Step (be specific)
1. **Wait for Gemini quota reset** — both keys exhausted
2. **Score TI08 front + back** — measure, compare, adjust
3. **Fine-tune TI07 front** — ornament container wider to match ref w=38%
4. **TI09** — restructure + calibrate
5. **Grid overlay feature** — user requested 10×10 grid in builder (like PowerPoint)

## CRITICAL RULES (learned across sessions — DO NOT FORGET)
1. **Gemini 3.1 Pro is the ONLY judge** — never use rule-based scoring for visual layout
2. **ALWAYS add grid axes** (red 0-100% on X and Y) to both images before sending to Gemini
3. **temperature=0 + median of 3 runs** — eliminates variance
4. **Fix architecture first** (aspect ratio), then pixels
5. **Never cheat with retries** — median score is the real score
6. **Gemini Flash is useless** for visual comparison — only 3.1 Pro
7. **Every change → run scorer → show screenshots → compare before/after**
8. **ALL sterbebild = TWO pages** — front + back. NEVER single-page without page prop.
9. **Front page photos need VISIBLE padding** — never full-bleed unless reference shows it
10. **ALWAYS show full site screenshot** to user after layout changes — scores alone are not proof
11. **NEVER fake a test pass** — don't remove references or add trivial checks to bypass failures
12. **Calibrate pages SEPARATELY** — one at a time, front then back
13. **Use SC fonts for small-caps** — Fabric.js can't do CSS font-variant, use Playfair Display SC
14. **Clip photos to slot** — always add rect clipPath for photo elements
15. **Measurement-based scoring** — ONE prompt measures each image as JSON, we compare numbers. NO subjective scoring.
16. **Use REAL ornament images** — never hand-draw SVGs for complex ornaments. Use high-quality PNGs with transparent backgrounds.
17. **Front page ≠ always photo** — TI07 has text+ornament on front, photo on back. Use `promptType` in REFERENCE_MAP.
18. **Gemini key rotation** — multiple keys in .env/.env.local, auto-rotate on 429

## Scorer Architecture
- **File:** `e2e/helpers/template-scorer.ts`
- **Method:** Grid axes → Gemini 3.1 Pro measures EACH image independently → JSON positions → numeric diff
- **Prompt:** Universal `GEMINI_MEASURE_PROMPT` for all page types (one schema, one language)
- **Anchored prompt:** For build measurement — tells Gemini what elements to expect from reference
- **Key rotation:** `GEMINI_API_KEY` (.env) + `Gemini_key` (.env.local), auto-switch on 429
- **Score computation:** `computeLayoutScore()` — per-element Δx+Δy+Δw/2+Δh/2, averaged, scaled to 0-100
- **References:** `e2e/T5NEW.JPG` (TI05), `docs/T6.jpeg` (TI06), `docs/7NEWT.png` (TI07), `docs/T8New.png` (TI08)
- **Score command:** `npx playwright test e2e/specs/scoring/reference-comparison.spec.ts --project=chromium --grep "TI07 back" --timeout=240000`

## Card Dimensions (VERIFIED)
- **Sterbebild:** 140×105mm spread = TWO portrait pages 70×105mm each (413×620px at 150 DPI)

## TI07 Config (scored 74/100 front, 100/100 back)
- **Front (text+ornament):** ornament x=10 y=10 w=500 h=820 (`FlowerBest.png`), name x=490 y=380 fontSize=38, dates x=510-560 fontSize=15/13, divider black bold x=560 y=830
- **Back (photo):** x=150 y=140 w=700 h=670 rounded corners
- **Placeholder photo:** `placeholder-man-2.jpg`

## TI08 Config (not yet scored)
- **Front (cross+text):** cross x=80 y=50 w=180 h=700 (`cross-simple-thin.png`), line x=80 y=360, name x=300 y=360 fontSize=42, dates x=420 fontSize=16 bold
- **Back (photo):** x=150 y=80 w=700 h=840 ellipse clip
- **Placeholder photo:** `placeholder-man-2.jpg`
- **Reference:** `docs/T8New.png`, cross ornament: `docs/T8_Cross.png`

## Test Status
- Vitest: 202 passing
- Quality gate: 64/64 PASS
- E2E scoring: TI05 back 98/100, TI06 front 100/100, TI06 back 93/100, TI07 back 100/100, TI07 front 74/100

## Key Files
- Scorer: `e2e/helpers/template-scorer.ts`
- Reference spec: `e2e/specs/scoring/reference-comparison.spec.ts`
- Template configs: `src/lib/editor/template-configs.ts`
- Canvas dimensions: `src/lib/editor/canvas-dimensions.ts`
- Template to Fabric: `src/lib/editor/template-to-fabric.ts`
- Canvas builder hook: `src/components/canvas-builder/use-canvas-builder.ts`
- Measure script: `scripts/measure-ti07.mjs`
- Ornaments: `public/assets/ornaments/` (cross-rose-vine.png, cross-simple-thin.png)

## Open Issues
- TI07 front ornament width gap (28% vs 38% ref)
- TI08 needs Gemini scoring (quota exhausted)
- TI09 needs reference images + calibration
- Grid overlay feature requested (10×10 grid in builder like PowerPoint)
- FlowerBest.png shows checkered background in some views (transparency rendering)
- Page navigation thumbnails still blank
- Need to commit + push (many uncommitted changes)
