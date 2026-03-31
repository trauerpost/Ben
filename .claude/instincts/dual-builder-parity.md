---
name: dual-builder-parity
trigger: editing any file in src/lib/editor/ or src/components/wizard/ or src/components/canvas-builder/
confidence: 1.0
scope: project
---

# Dual Builder Parity

BENJEMIN has TWO builders that share template-configs.ts:
- **Wizard** (`/builder`) — uses wizardReducer → SpreadPreview
- **Canvas Builder** (`/builder-v2`) — uses use-canvas-builder → templateToFabricConfigs → Fabric.js

## Rule: Any change to shared code MUST be tested in BOTH builders

Shared files that affect both:
- `src/lib/editor/template-configs.ts` — template definitions
- `src/lib/editor/wizard-state.ts` — state types
- `src/lib/editor/canvas-dimensions.ts` — sizing
- `src/lib/editor/template-to-fabric.ts` — canvas builder rendering

## Before claiming "done":
1. Run `node scripts/quality-gate.mjs`
2. Quality gate must exit 0 (PASS)
3. If it fails, DO NOT push — fix first

## Known divergence points:
- Wizard pre-fills placeholder data via wizardReducer SET_TEMPLATE
- Canvas builder calls templateToFabricConfigs WITHOUT textContent — shows [fieldName]
- Wizard falls back to v1 templates for trauerkarte/dankkarte; canvas builder does NOT

## Lesson origin:
2026-03-31: Shipped UX overhaul that only worked in wizard. Canvas builder was broken with raw field names. QA only tested wizard path. Customer saw broken product.
