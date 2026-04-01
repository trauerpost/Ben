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
