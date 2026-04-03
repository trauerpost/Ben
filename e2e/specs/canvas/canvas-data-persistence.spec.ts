import { test, expect } from "@playwright/test";

test.describe("Canvas Builder V2 — Data Persistence", () => {

  async function loadTI05(page: any) {
    await page.goto("/de/builder-v2", { waitUntil: "networkidle" });
    await page.locator('[data-testid="card-type-sterbebild"]').click();
    await page.waitForTimeout(800);
    await page.locator('[data-testid="template-TI05"]').click();
    await page.waitForTimeout(3000);
  }

  test("data.field survives toJSON → loadFromJSON round-trip", async ({ page }) => {
    await loadTI05(page);
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Get original data properties
    const before = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects().map((o: any) => ({
        type: o.type,
        dataField: o.data?.field,
        dataTemplateId: o.data?.templateElementId,
      }));
    });

    expect(before).not.toBeNull();
    expect(before.length).toBeGreaterThan(0);

    // Serialize and deserialize
    await page.evaluate(async () => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return;
      const json = JSON.stringify(fc.toJSON());
      await fc.loadFromJSON(json);
      fc.renderAll();
    });

    // Verify data properties survived
    const after = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects().map((o: any) => ({
        type: o.type,
        dataField: o.data?.field,
        dataTemplateId: o.data?.templateElementId,
      }));
    });

    expect(after).toEqual(before);
  });

  test("data.field survives page switch (front → back → front)", async ({ page }) => {
    await loadTI05(page);

    // Get front page data
    const frontBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects().map((o: any) => ({
        type: o.type,
        dataField: o.data?.field,
      }));
    });

    // Switch to back
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Switch back to front
    await page.locator('button:has-text("Vorderseite")').click();
    await page.waitForTimeout(2000);

    // Verify front page data preserved
    const frontAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects().map((o: any) => ({
        type: o.type,
        dataField: o.data?.field,
      }));
    });

    expect(frontAfter).toEqual(frontBefore);
  });

  test("object count preserved after page switch", async ({ page }) => {
    await loadTI05(page);

    // Count front page objects
    const frontCount = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      return c?.__fabricCanvas?.getObjects().length ?? 0;
    });
    expect(frontCount).toBeGreaterThan(0);

    // Switch to back
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Count back page objects
    const backCount = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      return c?.__fabricCanvas?.getObjects().length ?? 0;
    });
    expect(backCount).toBeGreaterThan(0);

    // Switch back to front
    await page.locator('button:has-text("Vorderseite")').click();
    await page.waitForTimeout(2000);

    // Front count should be the same
    const frontCountAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      return c?.__fabricCanvas?.getObjects().length ?? 0;
    });
    expect(frontCountAfter).toBe(frontCount);
  });

  test("text content preserved after page switch", async ({ page }) => {
    await loadTI05(page);
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Get text before
    const textBefore = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects()
        .filter((o: any) => o.type === "textbox")
        .map((o: any) => o.text);
    });

    // Switch to front and back
    await page.locator('button:has-text("Vorderseite")').click();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Rückseite")').click();
    await page.waitForTimeout(2000);

    // Get text after
    const textAfter = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as any;
      const fc = c?.__fabricCanvas;
      if (!fc) return null;
      return fc.getObjects()
        .filter((o: any) => o.type === "textbox")
        .map((o: any) => o.text);
    });

    expect(textAfter).toEqual(textBefore);
  });
});
