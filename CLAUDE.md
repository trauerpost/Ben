@AGENTS.md

---

## IRON RULES — BENJEMIN PRODUCT

### Rule 1: No Technical Artifacts — EVER
A customer must NEVER see: `[fieldName]`, dashed borders, gray placeholder boxes, "undefined", "null", empty white areas, or ANY developer output. Every template must load looking like a FINISHED, beautiful memorial card — with a real sample photo (nature scene, candle, flowers), real German names ("Maria Musterfrau"), real dates, real quotes. The customer REPLACES content, never builds from scratch.

### Rule 2: Two Builders = Test BOTH
BENJEMIN has two builders: Wizard (`/builder`) and Canvas Builder (`/builder-v2`). They share template code but render differently. ANY change to templates, rendering, or state MUST be verified in BOTH builders, in BOTH languages (DE + EN), for ALL card types (sterbebild, trauerkarte, dankkarte). Run `node scripts/quality-gate.mjs` before ANY push.

### Rule 3: Screenshot = Truth
Never claim something works based on test results, DOM checks, or TypeScript compilation. Open the page, LOOK at the screenshot, describe what you SEE. If you can't show a screenshot proving it looks correct, it's not done. Canvas (Fabric.js) renders PIXELS — `page.textContent()` cannot detect what's on a canvas.

### Rule 6: Templates Must Be Perfect — Zero Excuses
Never say "the customer will replace it" or "it's slightly stretched." If a photo doesn't fit, use proper cover-crop with face centering. V1 wizard has smart image handling — use the same standard. Every template must look like a finished product someone would PAY for.

### Rule 5: Never Scope Out Visible Bugs
If you can see a bug on the page you're testing — it's in scope. The customer sees ONE page, not "components." Don't narrow scope unless the user explicitly says to. "Funeral mail" in the header of the builder page means the builder is broken, even if the header is "a different component."

### Rule 4: Kartenmacherei is the Standard
The reference is https://configurator.www.kartenmacherei.de — study their configurator. Cards start pre-filled with background images, sample text, page thumbnails at the bottom. We must match this level of polish. White boxes with dashed borders are unacceptable.

---

## MEMORY PROTOCOL

### Session Start — always at the beginning of every session:
1. Run: `bash scripts/git-context.sh`
2. Read: `.claude/primer.md`
3. Say in one line: "Status: [branch] | Working on: [active task from primer]"

### Session End — always before ending:
Update `.claude/primer.md` with:
- What was completed today (date + short description)
- Exact next step (not "continue" — file name + action)
- Updated test counts if changed
- Open blockers

### Push Rule:
If there are more than 10 unpushed commits — remind user to push before starting.

### Priority order for instructions:
1. `CLAUDE.md` + `~/.claude/CLAUDE.md` — iron rules (don't change)
2. `.claude/primer.md` — live state (updated every session)
3. `git-context.sh` output — what actually changed
4. `~/.claude/plans/` — only when working on a specific task
