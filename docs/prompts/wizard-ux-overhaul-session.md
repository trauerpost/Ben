# Session Prompt — Wizard UX Overhaul

## Project
BENJEMIN (Trauerpost). Dir: `C:\Users\fires\OneDrive\Git\BENJEMIN`

## Task
Execute `docs/plans/2026-03-28-wizard-ux-overhaul.md` — the Wizard UX Overhaul Plan (v3, architect-reviewed).

25 tasks across 5 batches. The plan passed plan-qa AND architect review. All findings were fixed. Execute as-is — do not redesign.

## What the plan does
1. **Batch 1 (7 tasks):** Sticky formatting toolbar (color + alignment + size), horizontal font carousel (like filter presets — each font rendered in its font), collapsible accordion sections for Step 4 text fields, ActiveFieldContext (NOT in WizardState)
2. **Batch 2 (4 tasks):** Bottom nav padding fix, mobile step indicator names, compact step counter
3. **Batch 3 (4 tasks):** Inline validation with `validationAttempted` prop, replace `alert()` with toast, disabled-Next reason text
4. **Batch 4 (4 tasks):** Single-column template grid on mobile, responsive photo canvas, i18n field labels (DE+EN)
5. **Batch 5 (6 tasks):** Active field highlight in preview, pulse animation on text change, consistent py-8 spacing, mobile preview z-index fix, Google Fonts preload

## Execution rules
- Use `/execute-plan` to run batches with checkpoints
- Batches 1+2 can run in parallel
- Batches 3+4 can run in parallel (after 1+2)
- Batch 5 is last (depends on ActiveFieldContext from Batch 1)
- After each batch: build (`npx next build`) + unit tests (`npx vitest run --exclude 'e2e/**'`) must pass
- Use max parallel agents where possible
- Do NOT change the architecture decisions — they were reviewed and approved

## Key architecture decisions (DO NOT CHANGE)
- **Font carousel** (horizontal scroll), NOT dropdown — matches ImageEnhancer filter presets UX
- **ActiveFieldContext** (React context), NOT WizardState — avoids draft persistence bloat
- **Toolbar in SplitLayout** form column only, NOT in WizardShell full-width
- **Multi-open accordion** — user can open multiple sections, not single-section-only
- **Keep `URL.createObjectURL()`** for photo upload — do NOT use FileReader (bloats localStorage)
- **`validationAttempted` resets** in BOTH `handleNext()` AND `handlePrev()`
- **Tailwind `ring-brand-primary/40`** for active field highlight — no hardcoded rgba colors
- **Mobile:** font carousel hidden behind "Fonts" toggle, expands on tap, auto-closes after selection

## After ALL batches complete — MANDATORY
Run the full QA skill:
```
/benjemin-qa
```
This runs comprehensive pre-release QA on every template (TI04-TI09, S1-S6), preview modes, mockup, PDF generation, mobile, and produces a GO/NO-GO verdict. Do NOT declare done until QA passes.

Also run:
- `npx tsx scripts/score-v2.ts --all` — all 6 templates must score ≥90
- `npx playwright test e2e/wave3-*.spec.ts --project=chromium` — existing Wave 3 tests must still pass
- Template scorer + Playwright on production Vercel URL after push

## Current state (before this session)
- Wave 3 (Batches 5+6) deployed to Vercel — mockup + image enhancement
- 127 unit tests pass, 23 Playwright E2E pass, 6 template scores pass
- Build passes (TypeScript + compile)
- StepText currently has font grid + color swatches + alignment at bottom of form (to be moved to toolbar)
- No ActiveFieldContext exists yet
- No collapsible sections yet
- Step indicator hides names on mobile
- No bottom padding on step content area
- `alert()` used for file size errors in StepPhoto
