# BENJEMIN Session Primer
<!-- AUTO-UPDATED by Claude at end of every session -->
<!-- Last updated: 2026-03-31 -->

## Active Task
COMPLETE REBUILD PLAN — Canvas builder broken (shows [fieldName] tags, dashed boxes). Wizard works only for sterbebild. Must match kartenmacherei: every template = FINISHED card with real photos + text. Quality gate fails 5+ bugs. New plan via /write-plan → /plan-qa → /review-plan.

## Current Branch
master

## Builders Status
- **Wizard** (`/builder`): Production-ready, 114 QA checks in benjemin-qa v4
- **Canvas Builder** (`/builder-v2`): Implemented, needs live testing + E2E tests

## Completed This Session (2026-03-31)
- Analyzed kartenmacherei.de configurator (Playwright + screenshots)
- Designed Canvas Builder V2 plan (8 batches + QA batch)
- Ran plan-qa (4 fixes) + review-plan (6 fixes)
- Implemented all 8 batches (22 new files, 2,888 lines)
- 44 unit tests passing, 0 TS errors
- Playwright smoke test: all UI elements render, 0 console errors
- Updated benjemin-qa skill v3 → v4 (added 39 canvas builder checks)
- Committed: `17eff8a` feat: add Canvas Builder V2 at /builder-v2
- Set up session primer system (this file + git-context.sh)

## Next Step (be specific)
1. **CHECK what ROFLO is** — look at `C:\Users\fires\OneDrive\Git\QlikModelBuilder\` for ROFLO system. User wants it installed here.
2. **Fix template picker** — show actual card preview thumbnails instead of "TI04", "TI05" code names
3. **Fix English builder** — `/en/builder` loads but shows empty/broken content
4. **Make wizard look like kartenmacherei** — the current step-by-step form doesn't look professional enough. Study kartenmacherei screenshots in `docs/competitor-thorough/`

## Critical User Feedback (2026-03-31)
- "This doesn't look like the site I showed you at all"
- "Why are there no preview thumbnails in the template picker?"
- "What does TI04 mean to a customer?"
- "Why did I waste tokens on this?"
- User wants ROFLO system from QlikMCP Builder project installed

## Open Blockers
- None

## Test Status
- Vitest (canvas builder): 44 passing (5 files)
- Vitest (wizard + all): not yet run together — may have pre-existing failures
- E2E Playwright (wizard): visual-verify.ts exists
- E2E Playwright (canvas builder): visual-verify-canvas.ts NOT YET WRITTEN

## Key Files (Canvas Builder V2)
- Route: `src/app/[locale]/builder-v2/page.tsx`
- Main page: `src/components/canvas-builder/CanvasBuilderPage.tsx`
- Fabric canvas: `src/components/canvas-builder/FabricCanvas.tsx`
- Hook: `src/components/canvas-builder/use-canvas-builder.ts`
- Converters: `src/lib/editor/template-to-fabric.ts`, `fabric-to-wizard-state.ts`
- Plan: `~/.claude/plans/jolly-shimmying-corbato.md`
