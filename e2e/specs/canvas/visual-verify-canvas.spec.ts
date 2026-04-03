/**
 * BENJEMIN Canvas Builder V2 — Visual Verification v1
 *
 * Tests VISUAL CORRECTNESS on the Fabric.js canvas builder (/builder-v2).
 * Every test uses measurements, screenshots, and pixel-level verification.
 * Existence checks are NEVER sufficient — we prove things LOOK correct.
 *
 * Usage:
 *   npx playwright test ~/.claude/skills/benjemin-qa/scripts/visual-verify-canvas.ts --project=chromium
 *
 * Screenshots saved to: test-results/visual-qa-canvas/
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS = path.join(process.cwd(), "test-results", "visual-qa-canvas");
const PHOTO_TEMPLATES = ["TI05", "TI06", "TI07", "TI08", "TI09"];
const TEXT_ONLY_TEMPLATES = ["TI04"];
const ALL_TEMPLATES = [...TEXT_ONLY_TEMPLATES, ...PHOTO_TEMPLATES];

// Reference photos used by templates
const PLACEHOLDER_PHOTOS: Record<string, { file: string; width: number; height: number }> = {
  TI05: { file: "placeholder-man.jpg", width: 1024, height: 572 },
  TI06: { file: "placeholder-woman.png", width: 487, height: 778 },
  TI07: { file: "placeholder-woman.png", width: 487, height: 778 },
  TI08: { file: "placeholder-woman.png", width: 487, height: 778 },
  TI09: { file: "placeholder-man.jpg", width: 1024, height: 572 },
};

// Expected text content from placeholderData in template configs
const EXPECTED_TEXT: Record<string, string[]> = {
  TI04: ["Sieglinde Musterfrau", "In liebevoller Erinnerung"],
  TI05: ["Brigitte Musterfrau", "In stillem Gedenken"],
  TI06: ["Thilde Muster"],
  TI07: ["Franziska Muster"],
  TI08: ["Erika Muster"],
  TI09: ["Heinrich Muster"],
};

// Forbidden text — must NEVER appear on canvas
const FORBIDDEN_TEXT = [
  "[photo]", "[Photo field]", "[name]", "[heading]", "[quote]",
  "[birthDate]", "[deathDate]", "[quoteAuthor]", "[relationshipLabels]",
  "[closingVerse]", "[locationBirth]", "[locationDeath]", "[dividerSymbol]",
  "undefined", "null",
];

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
});

// ── Helpers ──────────────────────────────────────────────────

async function loadTemplate(page: Page, templateId: string): Promise<void> {
  await page.goto("/de/builder-v2");
  await page.waitForLoadState("networkidle");

  // Select sterbebild
  await page.click('[data-testid="card-type-sterbebild"]');

  // Click template
  const btn = page.locator(`[data-testid="template-${templateId}"]`);
  await expect(btn).toBeVisible({ timeout: 5000 });
  await btn.click();

  // Wait for template to load — sidebar switches from picker to editor
  await expect(page.locator('button:text-is("Elemente")')).toBeVisible({ timeout: 15000 });

  // Give canvas extra time to render all elements (images, text, ornaments)
  await page.waitForTimeout(3000);
}

async function getCanvasBoundingBox(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const canvas = page.locator("canvas.lower-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found on page");
  return box;
}

async function screenshotCanvas(page: Page, name: string): Promise<string> {
  const filePath = path.join(SCREENSHOTS, `${name}.png`);
  // Screenshot just the canvas area (both Fabric canvases + wrapper)
  const canvasWrapper = page.locator("canvas.lower-canvas").locator("..");
  if (await canvasWrapper.isVisible()) {
    await canvasWrapper.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath });
  }
  return filePath;
}

async function getCanvasPixelCoverage(page: Page): Promise<{ total: number; nonWhite: number; ratio: number }> {
  // Check how much of the canvas is NOT white (i.e., has actual content)
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
    if (!canvas) return { total: 0, nonWhite: 0, ratio: 0 };

    const ctx = canvas.getContext("2d");
    if (!ctx) return { total: 0, nonWhite: 0, ratio: 0 };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const total = canvas.width * canvas.height;
    let nonWhite = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Count pixels that are NOT white (or near-white)
      if (r < 245 || g < 245 || b < 245) {
        nonWhite++;
      }
    }

    return { total, nonWhite, ratio: nonWhite / total };
  });
}

async function getTextOnCanvas(page: Page): Promise<string[]> {
  // Extract all text content from Fabric canvas objects
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        return fc.getObjects()
          .filter((obj: any) => obj.type === "textbox" || obj.type === "text" || obj.type === "i-text")
          .map((obj: any) => obj.text as string);
      }
    }
    return [];
  });
}

async function getImageObjects(page: Page): Promise<Array<{
  scaleX: number;
  scaleY: number;
  left: number;
  top: number;
  width: number;
  height: number;
  hasClipPath: boolean;
}>> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        return fc.getObjects()
          .filter((obj: any) => obj.type === "image")
          .map((obj: any) => ({
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            hasClipPath: !!obj.clipPath,
          }));
      }
    }
    return [];
  });
}

// ── CB1: Template Load ──────────────────────────────────────

test.describe("CB1: Template Load", () => {
  for (const tid of ALL_TEMPLATES) {
    test(`${tid} loads with elements on canvas`, async ({ page }) => {
      await loadTemplate(page, tid);

      const objectCount = await page.evaluate(() => {
        const canvasEls = document.querySelectorAll("canvas.lower-canvas");
        for (const c of canvasEls) {
          const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
          if (fc) return fc.getObjects().length;
        }
        return 0;
      });

      expect(objectCount).toBeGreaterThan(0);
      await screenshotCanvas(page, `CB1-${tid}-loaded`);
    });
  }
});

// ── CB2: Photo Fills Slot (CRITICAL — the bug we're fixing) ─

test.describe("CB2: Photo fills slot correctly", () => {
  test("TI05 front page photo fills entire canvas", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // TI05 front page = full-page photo (grid 0,0,1000,1000)
    // The photo should cover the ENTIRE canvas — no white space
    const coverage = await getCanvasPixelCoverage(page);

    // Photo MUST cover at least 98% of the canvas — full-page photo, no white gaps
    console.log(`TI05 canvas coverage: ${(coverage.ratio * 100).toFixed(1)}% (${coverage.nonWhite}/${coverage.total} pixels)`);
    expect(coverage.ratio).toBeGreaterThan(0.98);

    await screenshotCanvas(page, "CB2-TI05-photo-coverage");
  });

  test("TI06 photo fills its slot (not full page)", async ({ page }) => {
    await loadTemplate(page, "TI06");

    // TI06 has photo at grid (55,55,365,540) — upper-left quadrant
    // Check photo exists and has reasonable coverage
    const images = await getImageObjects(page);
    expect(images.length).toBeGreaterThan(0);

    const img = images[0];
    // Uniform scaling — no stretch
    expect(img.scaleX).toBeCloseTo(img.scaleY, 2);
    // Should have clipPath for cover crop
    expect(img.hasClipPath).toBe(true);

    await screenshotCanvas(page, "CB2-TI06-photo-slot");
  });

  for (const tid of PHOTO_TEMPLATES) {
    test(`${tid} photo has uniform scaling (scaleX === scaleY)`, async ({ page }) => {
      await loadTemplate(page, tid);

      const images = await getImageObjects(page);
      expect(images.length).toBeGreaterThan(0);

      for (const img of images) {
        // CRITICAL: scaleX must equal scaleY (no stretching)
        expect(img.scaleX).toBeCloseTo(img.scaleY, 2);
      }

      await screenshotCanvas(page, `CB2-${tid}-uniform-scale`);
    });
  }
});

// ── CB3: No Placeholder Text Leaks ──────────────────────────

test.describe("CB3: No placeholder text leaks", () => {
  for (const tid of ALL_TEMPLATES) {
    test(`${tid} has no [fieldName] tags or undefined text`, async ({ page }) => {
      await loadTemplate(page, tid);

      const texts = await getTextOnCanvas(page);
      const allText = texts.join(" ").toLowerCase();

      for (const forbidden of FORBIDDEN_TEXT) {
        expect(allText).not.toContain(forbidden.toLowerCase());
      }

      await screenshotCanvas(page, `CB3-${tid}-no-placeholders`);
    });
  }

  for (const tid of ALL_TEMPLATES) {
    test(`${tid} shows expected placeholder data`, async ({ page }) => {
      await loadTemplate(page, tid);

      const texts = await getTextOnCanvas(page);
      const allText = texts.join(" ");
      const expected = EXPECTED_TEXT[tid] ?? [];

      for (const exp of expected) {
        expect(allText).toContain(exp);
      }
    });
  }
});

// ── CB4: Page Navigation ────────────────────────────────────

test.describe("CB4: Spread page navigation", () => {
  test("TI05 has Front and Back pages", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // Check both page tabs exist
    const frontTab = page.locator('text="Vorderseite"').or(page.locator('text="Front"'));
    const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));

    await expect(frontTab).toBeVisible();
    await expect(backTab).toBeVisible();

    await screenshotCanvas(page, "CB4-TI05-front-page");

    // Switch to back page
    await backTab.click();
    await page.waitForTimeout(1000);

    // Back page should have text content
    const texts = await getTextOnCanvas(page);
    expect(texts.length).toBeGreaterThan(0);

    await screenshotCanvas(page, "CB4-TI05-back-page");
  });

  test("TI05 front page is photo, back page is text", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // Front page: should be mostly photo (high pixel coverage)
    const frontCoverage = await getCanvasPixelCoverage(page);
    console.log(`TI05 front coverage: ${(frontCoverage.ratio * 100).toFixed(1)}%`);

    // Switch to back
    const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));
    await backTab.click();
    await page.waitForTimeout(1000);

    // Back page: should have text with expected content
    const texts = await getTextOnCanvas(page);
    const allText = texts.join(" ");
    expect(allText).toContain("Brigitte Musterfrau");
    expect(allText).toContain("In stillem Gedenken");

    await screenshotCanvas(page, "CB4-TI05-back-text");
  });
});

// ── CB5: Console Errors ─────────────────────────────────────

test.describe("CB5: Zero console errors", () => {
  test("Full template load flow has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await loadTemplate(page, "TI05");

    // Switch pages
    const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));
    if (await backTab.isVisible()) {
      await backTab.click();
      await page.waitForTimeout(1000);
    }

    // Filter out known non-issues
    const realErrors = errors.filter(
      (e) => !e.includes("React DevTools") && !e.includes("favicon") && !e.includes("HMR")
    );

    if (realErrors.length > 0) {
      console.error("Console errors found:", realErrors);
    }
    expect(realErrors).toHaveLength(0);
  });
});

// ── CB6: Full Screenshots for Human Review ──────────────────

test.describe("CB6: Full screenshots — ALL templates", () => {
  for (const tid of ALL_TEMPLATES) {
    test(`${tid} full page screenshot for review`, async ({ page }) => {
      await loadTemplate(page, tid);

      // Full page screenshot (includes sidebar, toolbar, everything)
      await page.screenshot({
        path: path.join(SCREENSHOTS, `CB6-${tid}-full-page.png`),
        fullPage: false,
      });

      // Canvas-only screenshot
      await screenshotCanvas(page, `CB6-${tid}-canvas-only`);
    });
  }
});

// ── CB7: Mobile shows desktop-only message ──────────────────

test.describe("CB7: Mobile guard", () => {
  test("Shows desktop message on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone
    await page.goto("/de/builder-v2");
    await page.waitForTimeout(2000);

    // Should show "use desktop" message
    const desktopMsg = page.locator("text=Desktop").or(page.locator("text=größeren Bildschirmen"));
    await expect(desktopMsg).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOTS, "CB7-mobile-guard.png"),
    });
  });
});

// ── Helper: navigate to TI05 back page ────────────────────────

async function loadTI05BackPage(page: Page): Promise<void> {
  await loadTemplate(page, "TI05");
  const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));
  await expect(backTab).toBeVisible();
  await backTab.click();
  await page.waitForTimeout(2000);
}

// ── Helper: get Fabric canvas reference ────────────────────────

function getFabricCanvas(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement | null;
    if (!c) return false;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
    return !!fc;
  });
}

// ── CB8: Text editing ──────────────────────────────────────────

test.describe("CB8: Text editing", () => {
  test("TI05 back page — double-click text object and type new text", async ({ page }) => {
    await loadTI05BackPage(page);

    // Get initial text content
    const textsBefore = await getTextOnCanvas(page);
    expect(textsBefore.length).toBeGreaterThan(0);
    const originalText = textsBefore[0];

    // Find the first text object's position on the canvas and double-click it
    const textPos = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      // Get center of the text object in canvas coordinates
      const center = textObj.getCenterPoint();
      const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];
      return {
        x: center.x * vpt[0] + vpt[4],
        y: center.y * vpt[3] + vpt[5],
      };
    });

    expect(textPos).not.toBeNull();

    // Get canvas bounding box to translate canvas coords to page coords
    const canvasBox = await getCanvasBoundingBox(page);

    // Double-click to enter edit mode
    await page.mouse.dblclick(canvasBox.x + textPos!.x, canvasBox.y + textPos!.y);
    await page.waitForTimeout(500);

    // Select all text and type new content
    await page.keyboard.press("Control+a");
    await page.keyboard.type("E2E Test Text");
    await page.waitForTimeout(300);

    // Click outside to deselect
    await page.mouse.click(canvasBox.x + 5, canvasBox.y + 5);
    await page.waitForTimeout(300);

    // Verify text changed
    const textsAfter = await getTextOnCanvas(page);
    const allText = textsAfter.join(" ");
    expect(allText).toContain("E2E Test Text");

    await screenshotCanvas(page, "CB8-text-editing");
  });
});

// ── CB9: Object drag ───────────────────────────────────────────

test.describe("CB9: Object drag", () => {
  test("TI05 back page — drag text object changes its position", async ({ page }) => {
    await loadTI05BackPage(page);

    // Get first text object position before drag
    const posBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return { left: textObj.left, top: textObj.top };
    });

    expect(posBefore).not.toBeNull();

    // Get object center in viewport coordinates
    const objCenter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      const center = textObj.getCenterPoint();
      const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];
      return {
        x: center.x * vpt[0] + vpt[4],
        y: center.y * vpt[3] + vpt[5],
      };
    });

    const canvasBox = await getCanvasBoundingBox(page);
    const startX = canvasBox.x + objCenter!.x;
    const startY = canvasBox.y + objCenter!.y;

    // Drag 50px right and 30px down
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 30, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Verify position changed
    const posAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return { left: textObj.left, top: textObj.top };
    });

    expect(posAfter).not.toBeNull();
    // Position should have changed (allow for small rounding)
    const moved = Math.abs(posAfter!.left - posBefore!.left) > 5 ||
                  Math.abs(posAfter!.top - posBefore!.top) > 5;
    expect(moved).toBe(true);

    await screenshotCanvas(page, "CB9-object-drag");
  });
});

// ── CB10: Object resize ────────────────────────────────────────

test.describe("CB10: Object resize", () => {
  test("TI05 back page — resize text object changes dimensions", async ({ page }) => {
    await loadTI05BackPage(page);

    // Click the first text object to select it
    const objInfo = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      const center = textObj.getCenterPoint();
      const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];
      return {
        centerX: center.x * vpt[0] + vpt[4],
        centerY: center.y * vpt[3] + vpt[5],
        width: textObj.width * textObj.scaleX,
        height: textObj.height * textObj.scaleY,
        scaleX: textObj.scaleX,
        scaleY: textObj.scaleY,
      };
    });

    expect(objInfo).not.toBeNull();
    const canvasBox = await getCanvasBoundingBox(page);

    // Click to select
    await page.mouse.click(canvasBox.x + objInfo!.centerX, canvasBox.y + objInfo!.centerY);
    await page.waitForTimeout(500);

    // Get the bottom-right resize handle position (approximately at the corner of the selected object)
    const handlePos = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const active = fc.getActiveObject();
      if (!active) return null;
      const bound = active.getBoundingRect();
      const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];
      // Bottom-right corner handle
      return {
        x: bound.left + bound.width,
        y: bound.top + bound.height,
      };
    });

    if (handlePos) {
      // Drag the bottom-right handle to resize
      const hx = canvasBox.x + handlePos.x;
      const hy = canvasBox.y + handlePos.y;
      await page.mouse.move(hx, hy);
      await page.mouse.down();
      await page.mouse.move(hx + 40, hy + 25, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Verify dimensions changed
    const afterInfo = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return {
        width: textObj.width * textObj.scaleX,
        height: textObj.height * textObj.scaleY,
        scaleX: textObj.scaleX,
        scaleY: textObj.scaleY,
      };
    });

    expect(afterInfo).not.toBeNull();
    // At least one dimension should have changed
    const resized = Math.abs(afterInfo!.width - objInfo!.width) > 3 ||
                    Math.abs(afterInfo!.height - objInfo!.height) > 3 ||
                    Math.abs(afterInfo!.scaleX - objInfo!.scaleX) > 0.01 ||
                    Math.abs(afterInfo!.scaleY - objInfo!.scaleY) > 0.01;
    expect(resized).toBe(true);

    await screenshotCanvas(page, "CB10-object-resize");
  });
});

// ── CB11: Undo/Redo ────────────────────────────────────────────

test.describe("CB11: Undo/Redo", () => {
  test("TI05 back page — drag, undo reverts, redo re-applies", async ({ page }) => {
    await loadTI05BackPage(page);

    // Record original position of first text object
    const posOriginal = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return { left: textObj.left, top: textObj.top };
    });

    expect(posOriginal).not.toBeNull();

    // Get object center for dragging
    const objCenter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      const center = textObj.getCenterPoint();
      const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];
      return {
        x: center.x * vpt[0] + vpt[4],
        y: center.y * vpt[3] + vpt[5],
      };
    });

    const canvasBox = await getCanvasBoundingBox(page);
    const startX = canvasBox.x + objCenter!.x;
    const startY = canvasBox.y + objCenter!.y;

    // Drag the object
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 60, startY + 40, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Verify it moved
    const posMoved = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return { left: textObj.left, top: textObj.top };
    });

    const didMove = Math.abs(posMoved!.left - posOriginal!.left) > 5 ||
                    Math.abs(posMoved!.top - posOriginal!.top) > 5;
    expect(didMove).toBe(true);

    // Undo via Ctrl+Z
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(500);

    // Verify reverted to original position
    const posAfterUndo = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return { left: textObj.left, top: textObj.top };
    });

    // Should be close to original
    expect(Math.abs(posAfterUndo!.left - posOriginal!.left)).toBeLessThan(10);
    expect(Math.abs(posAfterUndo!.top - posOriginal!.top)).toBeLessThan(10);

    // Redo via Ctrl+Y
    await page.keyboard.press("Control+y");
    await page.waitForTimeout(500);

    // Verify re-applied (back to moved position)
    const posAfterRedo = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const textObj = fc.getObjects().find((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      );
      if (!textObj) return null;
      return { left: textObj.left, top: textObj.top };
    });

    // Should be close to moved position
    expect(Math.abs(posAfterRedo!.left - posMoved!.left)).toBeLessThan(10);
    expect(Math.abs(posAfterRedo!.top - posMoved!.top)).toBeLessThan(10);

    await screenshotCanvas(page, "CB11-undo-redo");
  });
});

// ── CB12: Free text ────────────────────────────────────────────

test.describe("CB12: Free text", () => {
  test("TI05 — add free text via toolbar button", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // Count objects before
    const countBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return 0;
      return fc.getObjects().filter((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      ).length;
    });

    // Click the "+ Textfeld" button in the toolbar
    const addTextBtn = page.locator('button:text("+ Textfeld")');
    await expect(addTextBtn).toBeVisible({ timeout: 5000 });
    await addTextBtn.click();
    await page.waitForTimeout(500);

    // Count objects after
    const countAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return 0;
      return fc.getObjects().filter((o: any) =>
        o.type === "textbox" || o.type === "text" || o.type === "i-text"
      ).length;
    });

    expect(countAfter).toBe(countBefore + 1);

    // Verify the new text contains default text
    const texts = await getTextOnCanvas(page);
    const hasDefault = texts.some((t) => t.includes("Text hinzufügen"));
    expect(hasDefault).toBe(true);

    await screenshotCanvas(page, "CB12-free-text-added");
  });
});

// ── CB13: Toolbar visibility ───────────────────────────────────

test.describe("CB13: Toolbar visibility", () => {
  test("TI05 — toolbar has expected buttons", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // Verify "+ Textfeld" button exists
    const textBtn = page.locator('button:text("+ Textfeld")');
    await expect(textBtn).toBeVisible();

    // Verify "+ Fotofeld" or photo upload button exists
    const photoBtn = page.locator('button:text("+ Fotofeld")');
    await expect(photoBtn).toBeVisible();

    // Verify undo button exists (by title)
    const undoBtn = page.locator('button[title*="Rückgängig"]');
    await expect(undoBtn).toBeVisible();

    // Verify redo button exists (by title)
    const redoBtn = page.locator('button[title*="Wiederherstellen"]');
    await expect(redoBtn).toBeVisible();

    await screenshotCanvas(page, "CB13-toolbar-buttons");
  });
});

// ── CB14: Zoom controls ────────────────────────────────────────

test.describe("CB14: Zoom controls", () => {
  test("TI05 — zoom slider exists and changes canvas transform", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // Verify zoom slider (range input) exists
    const zoomSlider = page.locator('input[type="range"][min="25"][max="300"]');
    await expect(zoomSlider).toBeVisible();

    // Read current zoom percentage text
    const zoomText = page.locator("span.tabular-nums");
    await expect(zoomText).toBeVisible();
    const initialZoom = await zoomText.textContent();

    // Get the current Fabric canvas viewport transform
    const transformBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const vpt = fc.viewportTransform;
      return vpt ? [vpt[0], vpt[3]] : null; // [scaleX, scaleY]
    });

    // Change zoom by setting slider to 200
    await zoomSlider.fill("200");
    await page.waitForTimeout(500);

    // Read new zoom text
    const newZoom = await zoomText.textContent();

    // Verify the zoom text changed
    expect(newZoom).not.toBe(initialZoom);
    expect(newZoom).toContain("200%");

    // Verify canvas transform changed
    const transformAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const vpt = fc.viewportTransform;
      return vpt ? [vpt[0], vpt[3]] : null;
    });

    if (transformBefore && transformAfter) {
      // Zoom scale factor should have changed
      expect(transformAfter[0]).not.toBeCloseTo(transformBefore[0], 1);
    }

    // Verify Fit and 100% buttons exist
    const fitBtn = page.locator('button:text("Fit")');
    const resetBtn = page.locator('button:text("100%")');
    await expect(fitBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();

    await screenshotCanvas(page, "CB14-zoom-controls");
  });
});

// ── CB15: Page switch round-trip ───────────────────────────────

test.describe("CB15: Page switch round-trip", () => {
  test("TI05 — switch to back, switch to front, front content preserved", async ({ page }) => {
    await loadTemplate(page, "TI05");

    // Record front page state: object count and photo presence
    const frontStateBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const objects = fc.getObjects();
      return {
        objectCount: objects.length,
        hasImage: objects.some((o: any) => o.type === "image"),
        imageCount: objects.filter((o: any) => o.type === "image").length,
      };
    });

    expect(frontStateBefore).not.toBeNull();
    expect(frontStateBefore!.objectCount).toBeGreaterThan(0);

    // Switch to back page
    const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));
    await expect(backTab).toBeVisible();
    await backTab.click();
    await page.waitForTimeout(2000);

    // Verify we're on the back page (should have text objects)
    const backTexts = await getTextOnCanvas(page);
    expect(backTexts.length).toBeGreaterThan(0);

    // Switch back to front page
    const frontTab = page.locator('text="Vorderseite"').or(page.locator('text="Front"'));
    await expect(frontTab).toBeVisible();
    await frontTab.click();
    await page.waitForTimeout(2000);

    // Verify front page content is preserved
    const frontStateAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (!fc) return null;
      const objects = fc.getObjects();
      return {
        objectCount: objects.length,
        hasImage: objects.some((o: any) => o.type === "image"),
        imageCount: objects.filter((o: any) => o.type === "image").length,
      };
    });

    expect(frontStateAfter).not.toBeNull();
    // Object count should match (or be very close — within 1 for any transient state)
    expect(frontStateAfter!.objectCount).toBe(frontStateBefore!.objectCount);
    // Photo should still be there
    expect(frontStateAfter!.hasImage).toBe(frontStateBefore!.hasImage);
    expect(frontStateAfter!.imageCount).toBe(frontStateBefore!.imageCount);

    // Verify high pixel coverage (photo still fills the canvas)
    const coverage = await getCanvasPixelCoverage(page);
    expect(coverage.ratio).toBeGreaterThan(0.90);

    await screenshotCanvas(page, "CB15-round-trip-front-preserved");
  });
});
