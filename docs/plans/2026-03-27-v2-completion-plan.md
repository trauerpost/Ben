# Template Engine v2 — Completion Plan

**Created**: 2026-03-27
**Status**: ARCHITECT-REVIEWED — ready for execution
**Executed by**: Multi-agent parallel execution
**QA Fixes Applied**: C1 (PDF write conflict), H1 (Agent A→C dependency), H2 (scorer CLI contract)
**Architect Fixes Applied**: R1 (PDF page count tool), R2 (data-testid for E2E), R3 (production URL)
**Production URL**: https://ben-trauerpost.vercel.app (Vercel auto-deploy from `trauerpost/Ben` GitHub repo)

---

## Overview

Complete the remaining 5 workstreams for the Template Engine v2. Each workstream is independently executable by a separate agent with controlled file access.

### Dependency Graph

```
Agent A (TI04/TI09 Refinement) ──┐
                                  ├──→ Agent E (PDF Verification)
Agent B (Scorer Improvement)   ──┤                │
                                  │                v
Agent C (Extended E2E Tests)   ──┴──→ Agent D (Deploy + Verify)
```

**Parallelism rules:**
- A, B can run in **full parallel** (no shared files, no data dependencies)
- C runs in **parallel with A and B** but MUST NOT assert on template names that Agent A might change. Agent A constraint: **MUST NOT change `name` or `description` fields** in TI04/TI09 — only `elements` array coordinates.
- E runs **after A completes** (needs final template configs for PDF generation)
- D runs **after A+B+C+E all complete** (final gate before deploy)

### Already Done (DO NOT REDO)
- DRAFT_VERSION already bumped to 6 in `wizard-state.ts`
- TI05-TI08 refined to 95+ score
- 7 E2E tests passing
- Committed and pushed to GitHub

---

## Agent A: TI04/TI09 Visual Refinement

**Files touched**: `src/lib/editor/template-configs.ts` (TI04 + TI09 `elements` arrays ONLY)
**Output**: Updated configs + screenshots in `public/test-pdfs/TI04.png`, `TI09.png`

### CONSTRAINTS (from QA review)
- **MUST NOT change** `id`, `name`, `description`, `requiredFields`, `requiresPhoto`, or `thumbnail` fields — only `elements` array coordinates/styles
- This ensures Agent C's E2E tests don't break (they assert on template names in the DOM)

### Tasks

#### A1. TI04 "Nur Text" (Sieglinde) — Self-Score Iteration
1. Read current TI04 config (elements array, coordinates)
2. Run `npx tsx scripts/screenshot-v2.ts TI04`
3. Read generated `public/test-pdfs/TI04.png`
4. Score against ideal two-column text layout:
   - Left column: heading, relationship labels, name (Pinyon Script), quote (italic), author — vertically balanced
   - Right column: birthDate, deathDate — vertically centered at ~40-50% from top
   - No photo, no ornaments
   - Scoring: vertical balance (25pts), font hierarchy (20pts), column proportions (20pts), whitespace (15pts), text readability (20pts)
5. If score < 90: adjust coordinates in `elements` array, repeat from step 2
6. Final: save screenshot

#### A2. TI09 "Floral Symmetrisch" (Renate) — Self-Score Iteration
1. Read current TI09 config
2. Run `npx tsx scripts/screenshot-v2.ts TI09`
3. Read generated `public/test-pdfs/TI09.png`
4. Score against ideal floral layout:
   - Top: floral divider ornament centered
   - Left: long quote text (italic, left-aligned)
   - Right: heading, name (bold), dates, line, closing verse, photo (rounded, bottom-right)
   - Scoring: ornament position (10pts), quote readability (20pts), right-column vertical balance (25pts), photo size/position (15pts), overall composition (20pts), font hierarchy (10pts)
5. If score < 90: adjust coordinates in `elements` array, repeat from step 2
6. Final: save screenshot

### Acceptance Criteria
- Both templates score 90+ (self-assessed)
- Screenshots saved to `public/test-pdfs/`
- Only `elements` arrays changed — no metadata field changes

---

## Agent B: Scorer Improvement

**Files touched**: NEW `scripts/score-visual.ts` (Agent B does NOT modify `score-v2.ts`)
**Output**: Visual scorer script + negative test results

### CONSTRAINTS (from QA review)
- **DO NOT modify `scripts/score-v2.ts`** — it's used by Agent D as-is. Create a NEW script instead.
- The new `score-visual.ts` MUST support the same CLI interface: `npx tsx scripts/score-visual.ts --all` and `npx tsx scripts/score-visual.ts TI04`
- Output format per template: `TOTAL: N/100 PASS/FAIL` (PASS threshold: ≥80)

### Tasks

#### B1. Analyze Current Scorer Limitations
1. Read `scripts/score-v2.ts` — understand current HTML-only checks
2. Document what it CANNOT catch:
   - Elements overlapping
   - Text overflowing visible area
   - Background not white
   - Photo missing when required
   - Ornament not rendering (broken SVG)

#### B2. Create Visual Scorer (`scripts/score-visual.ts`)
1. New script using Puppeteer to render HTML → screenshot
2. Analyze the screenshot pixel data:
   - **Background check**: Sample 4 corners — expect white (#FFFFFF ±5)
   - **Photo presence**: For templates with `requiresPhoto: true` (read from `template-configs.ts`), check that the photo region is NOT all-white (has pixel variance)
   - **Text presence**: For each text element, check its bounding box has non-white pixels
   - **Element overlap**: For each pair of elements, check bounding boxes don't overlap more than 5%
   - **Dimensions check**: Screenshot dimensions match expected mm→px conversion
3. Scoring: 100 points total
   - Background correct: 10pts
   - Photo renders (if required): 20pts
   - All text fields render: 30pts (5pts each, up to 6 fields)
   - No overlaps: 20pts
   - Correct dimensions: 10pts
   - Ornaments render (if present): 10pts
4. CLI: `--all` flag runs all 6, per-ID runs one. Output: `TOTAL: N/100 PASS` or `TOTAL: N/100 FAIL`

#### B3. Negative Tests
1. Create deliberately broken test cases IN the script (not separate files):
   - Template with missing photo URL but `requiresPhoto: true` → must score <50
   - Template with overlapping elements (name on top of photo) → must score <70
   - Template with wrong background color → must detect
2. Run with `npx tsx scripts/score-visual.ts --negative` flag
3. Verify negative cases FAIL (<50), positive cases PASS (≥80)

### Acceptance Criteria
- `npx tsx scripts/score-visual.ts --all` runs successfully, all 6 templates ≥80
- `npx tsx scripts/score-visual.ts --negative` runs, at least 2 cases score <50
- No changes to `score-v2.ts`, `template-configs.ts`, or any wizard component

---

## Agent C: Extended E2E Tests

**Files touched**: `e2e/wizard-v2-templates.spec.ts` (extend), NEW `e2e/wizard-v2-mobile.spec.ts`, NEW `e2e/wizard-v2-negative.spec.ts`
**Output**: 20+ passing test cases

### CONSTRAINTS (from QA + Architect review)
- Tests MUST use resilient selectors — don't hardcode template names that Agent A might change
- **Agent C MAY add `data-testid={item.id}` attribute** to the template button in `src/components/wizard/steps/StepTemplate.tsx` (one-line change, line ~130). This is the ONLY source file change allowed.
- Then use `page.locator('[data-testid="TI05"]')` instead of `page.getByText("Foto 50/50")` for template selection
- Existing 7 tests in `wizard-v2-templates.spec.ts` already pass — don't break them

### Tasks

#### C1. All-Templates Coverage
Add test for each of the 6 templates in `wizard-v2-templates.spec.ts`:
1. **TI04**: Select "Nur Text" → skip photo → fill name → preview shows text only (no photo element)
2. **TI05**: (already tested) — verify existing test still passes
3. **TI06**: Select → upload photo → fill name + dates + quote → preview renders
4. **TI07**: (already tested for location fields) — extend to full flow
5. **TI08**: (already tested for crop canvas) — extend to full flow
6. **TI09**: Select → upload photo → fill heading + name + dates + closingVerse + quote → preview

#### C2. Negative Tests (`e2e/wizard-v2-negative.spec.ts`)
1. **Empty name blocks next**: Go to step 5, leave name empty → Next button disabled
2. **No template selected blocks next**: On step 2, don't select → Next disabled
3. **Back from step 5 to step 3 for TI04**: Verify photo step skipped in both directions
4. **Draft persistence**: Fill fields → reload page → verify fields restored
5. **Draft version mismatch**: Set old version (e.g., version: 1) in localStorage → reload → verify draft cleared

#### C3. Mobile Tests (`e2e/wizard-v2-mobile.spec.ts`)
1. Use `devices["iPhone 14"]` project (confirmed in playwright.config.ts)
2. Test TI05 flow on mobile viewport
3. Verify:
   - Step indicator visible and readable
   - Template cards scrollable
   - Photo upload works
   - Crop canvas fits viewport
   - Text inputs accessible
   - Preview renders at mobile scale
   - Next/Back buttons visible and tappable

### Acceptance Criteria
- All tests pass: `npx playwright test e2e/wizard-v2-templates.spec.ts e2e/wizard-v2-negative.spec.ts --project=chromium`
- Mobile tests pass: `npx playwright test e2e/wizard-v2-mobile.spec.ts --project=mobile-safari`
- At least 5 negative tests present and passing
- Only allowed source change: adding `data-testid={item.id}` to StepTemplate.tsx button element

---

## Agent D: Deployment + Production Verification

**Depends on**: Agents A, B, C, E ALL completed
**Files touched**: None (verification + git operations only)
**Output**: Production verification report

### Tasks

#### D1. Pre-Deploy Checks
1. Run `npx next build` — must compile clean
2. Run `npx playwright test --project=chromium` — all tests must pass
3. Run `npx tsx scripts/score-v2.ts --all` — all 6 templates ≥90 (original HTML scorer)
4. Run `npx tsx scripts/score-visual.ts --all` — all 6 templates ≥80 (visual scorer from Agent B)
5. Verify PDFs already generated by Agent E in `public/test-pdfs/` — DO NOT regenerate (avoids write conflict)

#### D2. Deploy
1. Stage specific files: `git add src/ scripts/ e2e/ public/test-pdfs/ public/assets/`
2. `git commit` with descriptive message
3. `git push` to trigger Vercel auto-deploy
4. Wait for Vercel deploy to complete

#### D3. Production Verification
1. Open production URL `https://ben-trauerpost.vercel.app/de/builder` (or check `vercel ls` for current URL if domain changed)
2. Verify:
   - Step 1: Card type selection works
   - Step 2: All 6 TI templates visible with reference thumbnails
   - Step 3: Background color selection
   - Step 4: Photo upload + crop UI functional
   - Step 5: Dynamic text fields per template
   - Step 7: SpreadPreview renders correctly
   - PDF download works (returns valid PDF)
3. Test on mobile viewport (responsive)

#### D4. Email Final PDFs
1. Use PDFs from Agent E's `public/test-pdfs/` (already verified)
2. Send to business email (ofir393@gmail.com) via the app's email system or manual attachment

### Acceptance Criteria
- Vercel deploy succeeds (no build errors)
- Production wizard flow works end-to-end
- PDF download returns valid 140×105mm PDF
- All 6 template PDFs sent to business email

---

## Agent E: PDF Verification

**Depends on**: Agent A completed (final template configs)
**Files touched**: NEW `scripts/verify-pdfs.ts`, WRITE `public/test-pdfs/*.pdf`
**Dependencies to install**: `npm install --save-dev pdf-parse` (Puppeteer CANNOT read PDFs — it can only generate them)
**Output**: PDF verification report + 6 verified PDFs

### Tasks

#### E1. Install pdf-parse
1. Run `npm install --save-dev pdf-parse`
2. This library reads PDF files and extracts: page count, text content, metadata (including page dimensions)

#### E2. Generate All PDFs
1. Run `npx tsx scripts/generate-v2.ts --all`
2. Verify all 6 files created in `public/test-pdfs/`
3. These are the AUTHORITATIVE PDFs — Agent D uses them for deployment, does NOT regenerate

#### E3. Create PDF Verification Script
1. New script `scripts/verify-pdfs.ts`
2. For each PDF, use `pdf-parse` (NOT Puppeteer) to verify:
   - File exists and size > 10KB
   - `pdf-parse` returns `numpages === 1` (single page)
   - PDF text content includes expected strings (e.g., template's test name like "Sieglinde Musterfrau")
   - File size is reasonable (10KB-500KB range — too small = blank, too large = corrupted)
3. For page dimensions: read the raw PDF buffer and check for `/MediaBox` entry which contains `[0 0 WIDTH HEIGHT]` in PDF points (1pt = 0.3528mm). Expected: ~397 × 298 pts (≈140×105mm ±5pts tolerance)
4. Report PASS/FAIL per template
5. CLI: `npx tsx scripts/verify-pdfs.ts` — runs all 6

#### E4. Compare PDF Text to Template Fields
1. For each template: extract text via `pdf-parse` → verify all `requiredFields` content is present
2. Cross-reference: TI04 should contain "Sieglinde Musterfrau" + "Arthur Schopenhauer", TI05 should contain "Brigitte Musterfrau" + "Albert Schweitzer", etc.
3. Report any missing text fields

### Acceptance Criteria
- `npm install pdf-parse` succeeds
- All 6 PDFs pass verification (correct page count, dimensions, text content)
- Text extraction confirms required fields are rendered
- Verification script runs: `npx tsx scripts/verify-pdfs.ts`

---

## File Ownership Matrix

| File | Agent A | Agent B | Agent C | Agent D | Agent E |
|------|---------|---------|---------|---------|---------|
| `template-configs.ts` | WRITE (elements only) | READ | READ | READ | READ |
| `StepTemplate.tsx` | — | — | WRITE (data-testid only) | — | — |
| `scripts/score-v2.ts` | — | **READ ONLY** | — | RUN | — |
| `scripts/score-visual.ts` | — | CREATE | — | RUN | — |
| `scripts/verify-pdfs.ts` | — | — | — | — | CREATE |
| `e2e/wizard-v2-*.spec.ts` | — | — | CREATE/WRITE | RUN | — |
| `public/test-pdfs/*.png` | WRITE (TI04+TI09) | READ | — | READ | READ |
| `public/test-pdfs/*.pdf` | — | — | — | **READ ONLY** | WRITE |
| `package.json` | — | — | — | — | WRITE (pdf-parse dep) |

**Conflict resolution:**
- Agent D does NOT write PDFs — reads Agent E's output (fixes C1)
- Agent B does NOT modify score-v2.ts — creates new score-visual.ts (fixes H2)
- Agent A only changes `elements` arrays — C's name-based selectors safe (fixes H1)

---

## Execution Timeline

```
T+0:   Launch Agents A, B, C in parallel
T+5m:  Agent A completes (TI04/TI09 refined)
T+5m:  Launch Agent E (needs Agent A's final configs)
T+10m: Agent B completes (visual scorer)
T+10m: Agent C completes (E2E tests)
T+12m: Agent E completes (PDFs verified)
T+12m: Launch Agent D (all 4 agents done → deploy)
T+20m: Agent D completes — ALL DONE
```

Total estimated time: ~20 minutes with parallel execution.

---

## QA Review Log

| Finding | Severity | Fix Applied |
|---------|----------|-------------|
| C1: Agent D + E both write PDFs | CRITICAL | D now READ ONLY on PDFs, E is sole writer |
| H1: Agent C tests depend on Agent A template names | HIGH | Agent A constrained to elements-only changes |
| H2: Agent B rewrites score-v2.ts but D depends on it | HIGH | B creates NEW score-visual.ts, score-v2.ts untouched |
| M1: Two scorers with different thresholds | MEDIUM | D runs BOTH: score-v2 ≥90 AND score-visual ≥80 |
| M2: DRAFT_VERSION already bumped | MEDIUM | Marked as "Already Done" in overview |

## Architect Review Log

| Finding | Severity | Fix Applied |
|---------|----------|-------------|
| R1: Agent E uses Puppeteer to read PDFs (impossible) | MUST FIX | Replaced with `pdf-parse` npm package + raw MediaBox check |
| R2: Agent C told to use data-testid but none exist | MUST FIX | Agent C MAY add data-testid to StepTemplate.tsx (one-line change) |
| R3: No production URL specified for Agent D | MUST FIX | Added explicit URL: `https://ben-trauerpost.vercel.app` |
