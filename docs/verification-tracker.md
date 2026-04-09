# BENJEMIN Verification Tracker

Last updated: 2026-04-08

## Purpose
Tracks EVERY test that must pass before claiming a feature is done.
"PASS" requires actual command output or Gemini score — not assumptions.

---

## Bifold Card Feature (2026-04-08)

### Unit Tests
| Test | Command | Status | Output |
|------|---------|--------|--------|
| TypeScript compilation | `npx tsc --noEmit` | PASS | 0 errors |
| Vitest unit tests | `npx vitest run --exclude e2e --exclude *.spec.ts` | PASS | 233/233 |
| Quality gate | `node scripts/quality-gate.mjs` | PASS | 68/68 |

### E2E Tests (Playwright)
| Test | Script | Status | Output |
|------|--------|--------|--------|
| Bifold navigation (19 checks) | `verify-bifold.mjs` | PASS | 19/19 |
| Halbbild preview (4 checks) | `verify-halbbild.mjs` | PASS | 4/4 |
| Undo/redo (6 checks) | `verify-undo-redo.mjs` | PASS | 6/6 |
| Fold line + upload (5 checks) | `verify-fold-and-upload.mjs` | PASS | 5/5 |

### Gemini Visual Scoring (MANDATORY)
| Test | Script | Status | Score |
|------|--------|--------|-------|
| Outside spread (canvas vs preview) | `verify-bifold-visual.mjs` Test A | PASS | 100/100 |
| Inside spread (no cut-off) | `verify-bifold-visual.mjs` Test B | PASS | 100/100 |
| Halbbild mode (half image) | `verify-bifold-visual.mjs` Test C | PASS | 100/100 |
| PDF page 1 (outside spread) | NOT YET | PENDING | - |
| PDF page 2 (inside left 70mm) | NOT YET | PENDING | - |
| PDF page 3 (inside right 70mm) | NOT YET | PENDING | - |

### Regression Checks
| Check | Status | Evidence |
|-------|--------|----------|
| TI04 cover photo doesn't leak inside | PASS | Unit test NEG |
| V1 wizard still works | PASS | Quality gate 68/68 |
| TE01/TD01 have no cover pages | PASS | E2E negative test |
| Past bug: photo duplicate | SAFE | Code audit |
| Past bug: text/font in preview | SAFE | Code audit |
| Past bug: PDF generation | PENDING | PDF not visually verified |

### Production Deployment
| Check | Status |
|-------|--------|
| Pushed to Vercel | PENDING |
| Live URL works | PENDING |
| Mobile viewport | PENDING |

---

## OPEN ISSUES

1. **PDF inner pages at wrong dimensions** — pages 2-3 render at 140mm instead of 70mm. Code fix applied but NOT visually verified.
2. **PDF not Gemini-scored** — need to render PDF pages to PNG and score.
3. **Not deployed to production** — all tests on localhost.

---

## Rules for This Tracker

1. **"PASS" requires evidence** — command output, Gemini score, or screenshot path
2. **"PENDING" = NOT DONE** — don't claim done while any test is PENDING
3. **Visual tests are MANDATORY** — unit tests passing does NOT mean visual output is correct
4. **Update this file** after every test run — it's the single source of truth
