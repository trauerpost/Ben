# BENJEMIN Session Primer
<!-- AUTO-UPDATED by Claude at end of every session -->
<!-- Last updated: 2026-04-03 -->

## Active Task
**EXECUTE: Fix 5 Preview Bugs** — Plan v3 APPROVED after plan-qa + review-plan cycle.
Plan: `docs/plans/2026-04-03-preview-fix-implementation-plan.md`

## Current Branch
master — all pushed to production

## What Was Done (2026-04-03)

### Planning Session (plan-qa + review-plan loop)
- **Plan v1**: Written from action plan. Plan-qa found 2 CRITICAL: wrong BUG 1 root cause (placeholder excluded by `isImagePlaceholder`, not relative URL failure) + auto-shrink runs before fonts load.
- **Plan v2**: Fixed all 7 plan-qa findings. Review-plan found 2 must-fix: PreviewModal.tsx hardcoded 560×780 iframe missing from plan + single-page path has no scaling.
- **Plan v3 APPROVED**: All findings fixed. 6 files, 4 batches.

### Earlier (same day): QA Overhaul
- 100/100 tests pass, quality gate 64/64
- 10 new flow tests (CB-F1 through CB-F5)
- Server-side preview via `/api/preview` endpoint

## Next Step — EXECUTE PLAN v3
Read `docs/plans/2026-04-03-preview-fix-implementation-plan.md` and execute in order:

### Batch 1: Fix photo rendering (BUG 1) — 3 files
- `src/lib/editor/card-to-html-v2.ts` — `RenderOptions` interface, `baseUrl` param on `imageToBase64`, placeholder fallback via `config.placeholderPhotoSrc`
- `src/app/api/preview/route.ts` — extract request origin, pass as `baseUrl`
- `src/lib/editor/pdf-generator.ts` — accept + pass `baseUrl`

### Batch 2: Fix text clipping (BUG 3, 4, 5) — 2 files
- `src/lib/editor/card-to-html-v2.ts` — append auto-shrink `<script>` wrapped in `document.fonts.ready.then()`
- `src/app/api/preview/route.ts` — iframe `sandbox="allow-same-origin allow-scripts"`

### Batch 3: Fix iframe sizing (BUG 2) — 2 files
- `src/app/api/preview/route.ts` — dynamic `transform: scale()` for BOTH multi-page AND single-page paths
- `src/components/canvas-builder/PreviewModal.tsx` — remove hardcoded 560×780, use `width: 100%; height: 100%`

### Batch 4: Strengthen tests + deploy — 2 files
- `e2e/specs/visual-verify-canvas-v2.spec.ts` — strengthen CB-F4, add negative test F4c
- `src/app/api/generate-pdf/route.ts` — extract origin, pass `baseUrl`
- Deploy → screenshot → verify

## Builders Status
- **Wizard** (`/builder`): Redirects to V2
- **Canvas Builder** (`/builder-v2`): 100/100 tests pass. Preview broken (5 bugs — plan ready).

## Test Status
- Playwright: 100/100 pass
- Quality gate: 64/64 PASS
- TypeScript: 0 errors

## CRITICAL RULES (learned this session)
1. **Server-only code stays server-side** — Buffer/fs/Puppeteer cannot run in browser
2. **Flow tests > static tests** — 90 static tests passed while preview was broken
3. **Screenshot = truth** — never claim "fixed" without rendered output
4. **Don't patch symptoms** — fix the architecture
5. **Tests that pass on broken code are lying** — strengthen assertions
6. **`isImagePlaceholder` guard** — Fabric→WizardState excludes placeholders. Preview must fall back to `config.placeholderPhotoSrc`
7. **PreviewModal has its OWN iframe** — 3 layers total: PreviewModal iframe → outer HTML → inner iframes

## Open Issues (from known-issues.md)
- #6: No "Clear Draft" button
- #7: Date text truncated/clipped (CONFIRMED — fixing in this plan)
- #8: Decoration symbol tiny
- #9: Border frame centered
- #10: Mockup doesn't match
- #11: PDF buttons not accessible from Mockup
- #12: PDF output doesn't match design
- 4 templates untested (TE01, TE02, TD01, TD02)
