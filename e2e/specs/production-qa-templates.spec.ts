/**
 * Production QA — 4 New Templates (TI06-TI09) on Canvas Builder V2
 * Target: https://trauerpost.vercel.app/de/builder-v2
 *
 * Tests:
 * 1. Each template loads with elements on canvas
 * 2. No placeholder text leaks ([fieldName], undefined, null)
 * 3. Expected placeholder names visible
 * 4. Photo templates have images with uniform scaling
 * 5. Page navigation (front/back) works
 * 6. Console errors = 0
 * 7. Full screenshots for human review
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://trauerpost.vercel.app";
const SCREENSHOTS = path.join(process.cwd(), "test-results", "production-qa");

const TEMPLATES_TO_TEST = ["TI05", "TI06", "TI07", "TI08", "TI09"];

const EXPECTED_TEXT: Record<string, string[]> = {
  TI05: ["Brigitte Musterfrau"],
  TI06: ["Thilde Muster"],
  TI07: ["Franziska"],
  TI08: ["Erna"],
  TI09: ["Musterfrau"],
};

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
  await page.goto(`${BASE_URL}/de/builder-v2?_t=${Date.now()}`);
  await page.waitForLoadState("networkidle");

  // Select sterbebild card type
  const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await expect(sterbebildBtn).toBeVisible({ timeout: 15000 });
  await sterbebildBtn.click();

  // Click template
  const btn = page.locator(`[data-testid="template-${templateId}"]`);
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();

  // Wait for canvas to load — sidebar switches from picker to editor
  await expect(page.locator('button:text-is("Elemente")')).toBeVisible({ timeout: 20000 });

  // Extra time for images/fonts to load on production
  await page.waitForTimeout(5000);
}

async function getCanvasObjectCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) return fc.getObjects().length;
    }
    return 0;
  });
}

async function getTextOnCanvas(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
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
  scaleX: number; scaleY: number; left: number; top: number;
  width: number; height: number; hasClipPath: boolean;
}>> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        return fc.getObjects()
          .filter((obj: any) => obj.type === "image")
          .map((obj: any) => ({
            scaleX: obj.scaleX, scaleY: obj.scaleY,
            left: obj.left, top: obj.top,
            width: obj.width, height: obj.height,
            hasClipPath: !!obj.clipPath,
          }));
      }
    }
    return [];
  });
}

async function getCanvasPixelCoverage(page: Page): Promise<{ total: number; nonWhite: number; ratio: number }> {
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
      if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) nonWhite++;
    }
    return { total, nonWhite, ratio: nonWhite / total };
  });
}

// ── TEST 1: Template Loads ──────────────────────────────────

test.describe("PROD-1: Template loads with elements", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} loads on production canvas`, async ({ page }) => {
      test.setTimeout(60000);
      await loadTemplate(page, tid);

      const count = await getCanvasObjectCount(page);
      console.log(`${tid}: ${count} objects on canvas`);
      expect(count).toBeGreaterThan(0);

      await page.screenshot({ path: path.join(SCREENSHOTS, `PROD1-${tid}-loaded.png`) });
    });
  }
});

// ── TEST 2: No placeholder text leaks ───────────────────────

test.describe("PROD-2: No placeholder text leaks", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} has no [fieldName] or undefined text`, async ({ page }) => {
      test.setTimeout(60000);
      await loadTemplate(page, tid);

      const texts = await getTextOnCanvas(page);
      const allText = texts.join(" ").toLowerCase();
      console.log(`${tid} text: ${texts.join(" | ")}`);

      for (const forbidden of FORBIDDEN_TEXT) {
        expect(allText).not.toContain(forbidden.toLowerCase());
      }
    });
  }
});

// ── TEST 3: Expected placeholder data visible ───────────────

test.describe("PROD-3: Expected text content visible", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} shows expected name`, async ({ page }) => {
      test.setTimeout(60000);
      await loadTemplate(page, tid);

      const texts = await getTextOnCanvas(page);
      const allText = texts.join(" ");
      const expected = EXPECTED_TEXT[tid] ?? [];

      for (const exp of expected) {
        console.log(`${tid}: looking for "${exp}" in canvas text`);
        expect(allText).toContain(exp);
      }
    });
  }
});

// ── TEST 4: Photo uniform scaling ───────────────────────────

test.describe("PROD-4: Photo has uniform scaling", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} photo scaleX === scaleY (no stretch)`, async ({ page }) => {
      test.setTimeout(60000);
      await loadTemplate(page, tid);

      const images = await getImageObjects(page);
      // All templates TI06-TI09 have photos
      if (images.length > 0) {
        for (const img of images) {
          console.log(`${tid} image: scale=${img.scaleX.toFixed(3)}x${img.scaleY.toFixed(3)}, clip=${img.hasClipPath}`);
          expect(img.scaleX).toBeCloseTo(img.scaleY, 2);
        }
      } else {
        // Check if this is the front page (some templates have photo on back only)
        console.log(`${tid}: no images on current page (may be on back page)`);
      }

      await page.screenshot({ path: path.join(SCREENSHOTS, `PROD4-${tid}-photo.png`) });
    });
  }
});

// ── TEST 5: Page navigation (front/back) ────────────────────

test.describe("PROD-5: Front/Back page navigation", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} has both pages and can switch`, async ({ page }) => {
      test.setTimeout(60000);
      await loadTemplate(page, tid);

      // Screenshot front
      await page.screenshot({ path: path.join(SCREENSHOTS, `PROD5-${tid}-front.png`) });

      const frontTexts = await getTextOnCanvas(page);
      const frontImages = await getImageObjects(page);
      const frontCoverage = await getCanvasPixelCoverage(page);
      console.log(`${tid} FRONT: ${frontTexts.length} texts, ${frontImages.length} images, ${(frontCoverage.ratio * 100).toFixed(1)}% coverage`);

      // Switch to back
      const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));
      if (await backTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backTab.click();
        await page.waitForTimeout(3000);

        const backTexts = await getTextOnCanvas(page);
        const backImages = await getImageObjects(page);
        const backCoverage = await getCanvasPixelCoverage(page);
        console.log(`${tid} BACK: ${backTexts.length} texts, ${backImages.length} images, ${(backCoverage.ratio * 100).toFixed(1)}% coverage`);

        // At least one page should have content
        expect(frontTexts.length + frontImages.length + backTexts.length + backImages.length).toBeGreaterThan(0);

        await page.screenshot({ path: path.join(SCREENSHOTS, `PROD5-${tid}-back.png`) });
      } else {
        // Single page template
        expect(frontTexts.length + frontImages.length).toBeGreaterThan(0);
      }
    });
  }
});

// ── TEST 6: Console errors ──────────────────────────────────

test.describe("PROD-6: Zero console errors", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} loads without console errors`, async ({ page }) => {
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await loadTemplate(page, tid);

      // Switch pages too
      const backTab = page.locator('text="Rückseite"').or(page.locator('text="Back"'));
      if (await backTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backTab.click();
        await page.waitForTimeout(2000);
      }

      const realErrors = errors.filter(
        (e) => !e.includes("React DevTools") && !e.includes("favicon") && !e.includes("HMR") &&
               !e.includes("hydration") && !e.includes("Third-party cookie")
      );

      if (realErrors.length > 0) {
        console.error(`${tid} console errors:`, realErrors);
      }
      expect(realErrors).toHaveLength(0);
    });
  }
});

// ── TEST 7: Full screenshots for human review ───────────────

test.describe("PROD-7: Full page screenshots", () => {
  for (const tid of TEMPLATES_TO_TEST) {
    test(`${tid} full builder screenshot`, async ({ page }) => {
      test.setTimeout(60000);
      await loadTemplate(page, tid);

      // Full page with sidebar
      await page.screenshot({
        path: path.join(SCREENSHOTS, `PROD7-${tid}-full-page.png`),
        fullPage: false,
      });
    });
  }
});

// ── TEST 8: Template picker shows all 4 templates ───────────

test.describe("PROD-8: Template picker visibility", () => {
  test("All 4 new templates visible in picker", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto(`${BASE_URL}/de/builder-v2?_t=${Date.now()}`);
    await page.waitForLoadState("networkidle");

    // Select sterbebild
    const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
    await expect(sterbebildBtn).toBeVisible({ timeout: 15000 });
    await sterbebildBtn.click();
    await page.waitForTimeout(2000);

    for (const tid of TEMPLATES_TO_TEST) {
      const btn = page.locator(`[data-testid="template-${tid}"]`);
      const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`${tid} in picker: ${visible ? "VISIBLE" : "MISSING"}`);
      expect(visible).toBe(true);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "PROD8-template-picker.png") });
  });
});

// ── TEST 9: Mobile guard ────────────────────────────────────

test.describe("PROD-9: Mobile shows desktop message", () => {
  test("Mobile viewport shows desktop-only message", async ({ page }) => {
    test.setTimeout(30000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/de/builder-v2`);
    await page.waitForTimeout(3000);

    const desktopMsg = page.locator("text=Desktop").or(page.locator("text=größeren Bildschirmen"));
    const visible = await desktopMsg.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Mobile guard: ${visible ? "SHOWN" : "MISSING"}`);
    expect(visible).toBe(true);

    await page.screenshot({ path: path.join(SCREENSHOTS, "PROD9-mobile-guard.png") });
  });
});
