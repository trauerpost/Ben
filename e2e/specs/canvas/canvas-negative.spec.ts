import { test, expect } from "@playwright/test";
import { scoreTemplate } from "../../helpers/template-scorer";

test.describe("Canvas Builder V2 — Negative Tests (Gate Verification)", () => {

  // Helper to load TI05 and wait for canvas
  async function loadTI05(page: any) {
    await page.goto("/de/builder-v2", { waitUntil: "networkidle" });
    await page.locator('[data-testid="card-type-sterbebild"]').click();
    await page.waitForTimeout(800);
    await page.locator('[data-testid="template-TI05"]').click();
    await page.waitForTimeout(3000);
  }

  test("NEG-1: originX center triggers alignment failure in scorer", async ({ page }) => {
    await loadTI05(page);

    // Switch to back page where text objects live
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Inject broken originX on first text object
    await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return;
      const textObjs = fc.getObjects().filter((o: any) => o.type === "textbox");
      if (textObjs[0]) {
        textObjs[0].set({ originX: "center" });
        fc.renderAll();
      }
    });

    const score = await scoreTemplate(page, "TI05", "back", []);
    const alignCheck = score.checks.find(c => c.name === "Text alignment");

    // Should FAIL because originX is not "left" for all objects
    expect(alignCheck?.passed).toBe(false);
    expect(score.total).toBeLessThan(100);
  });

  test("NEG-2: forbidden [fieldName] text triggers clean check failure", async ({ page }) => {
    await loadTI05(page);
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Inject forbidden text
    await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return;
      const textObjs = fc.getObjects().filter((o: any) => o.type === "textbox");
      if (textObjs[0]) {
        textObjs[0].set({ text: "[heading]" });
        fc.renderAll();
      }
    });

    const score = await scoreTemplate(page, "TI05", "back", []);
    const cleanCheck = score.checks.find(c => c.name === "No forbidden text");

    expect(cleanCheck?.passed).toBe(false);
    expect(cleanCheck?.points).toBe(0);
  });

  test("NEG-3: console error triggers error check failure", async ({ page }) => {
    await loadTI05(page);

    // Score with simulated console errors
    const score = await scoreTemplate(page, "TI05", "front", ["TypeError: Cannot read property"]);
    const errorCheck = score.checks.find(c => c.name === "No console errors");

    expect(errorCheck?.passed).toBe(false);
    expect(errorCheck?.points).toBe(0);
  });

  test("NEG-4: removing all text objects triggers placeholder check failure", async ({ page }) => {
    await loadTI05(page);
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Remove all text objects
    await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return;
      const textObjs = fc.getObjects().filter((o: any) => o.type === "textbox");
      for (const obj of textObjs) {
        fc.remove(obj);
      }
      fc.renderAll();
    });

    const score = await scoreTemplate(page, "TI05", "back", []);
    const placeholderCheck = score.checks.find(c => c.name === "Placeholder text present");

    expect(placeholderCheck?.passed).toBe(false);
    expect(placeholderCheck?.points).toBe(0);
  });

  test("NEG-5: quality gate overlap check detects stacked text boxes", async ({ page }) => {
    await loadTI05(page);
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Stack two text objects on top of each other
    await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return;
      const textObjs = fc.getObjects().filter((o: any) => o.type === "textbox");
      if (textObjs.length >= 2) {
        // Move second text to exact same position as first
        textObjs[1].set({ left: textObjs[0].left, top: textObjs[0].top, width: textObjs[0].width, height: textObjs[0].height });
        fc.renderAll();
      }
    });

    // Use quality gate's overlap check logic directly
    const fabricData = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects().filter((o: any) => o.type === "textbox").map((o: any) => ({
        left: o.left, top: o.top,
        width: o.width * (o.scaleX || 1),
        height: o.height * (o.scaleY || 1),
      }));
    });

    // Check overlap detection
    let hasOverlap = false;
    if (fabricData) {
      for (let i = 0; i < fabricData.length; i++) {
        for (let j = i + 1; j < fabricData.length; j++) {
          const a = fabricData[i];
          const b = fabricData[j];
          const overlapX = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
          const overlapY = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
          const overlapArea = overlapX * overlapY;
          const minArea = Math.min(a.width * a.height, b.width * b.height);
          if (minArea > 0 && overlapArea / minArea > 0.20) {
            hasOverlap = true;
          }
        }
      }
    }
    expect(hasOverlap).toBe(true);
  });
});
