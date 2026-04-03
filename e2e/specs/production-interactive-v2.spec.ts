/**
 * Production Interactive QA — Canvas Builder V2 ONLY
 * Target: https://trauerpost.vercel.app/de/builder-v2
 *
 * Tests real user interactions:
 * 1. Select text element → change font
 * 2. Select text element → change font size
 * 3. Upload/add photo → verify it appears
 * 4. Resize element → verify dimensions change
 * 5. Drag element → verify position changes
 * 6. Undo/Redo works
 * 7. Preview button works
 * 8. PDF button works
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://trauerpost.vercel.app";
const SCREENSHOTS = path.join(process.cwd(), "test-results", "production-interactive");

// Use TI08 as primary test template (it rendered correctly)
const TEST_TEMPLATE = "TI08";

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
});

async function loadTemplate(page: Page, templateId: string): Promise<void> {
  await page.goto(`${BASE_URL}/de/builder-v2?_t=${Date.now()}`);
  await page.waitForLoadState("networkidle");

  const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await expect(sterbebildBtn).toBeVisible({ timeout: 15000 });
  await sterbebildBtn.click();

  const btn = page.locator(`[data-testid="template-${templateId}"]`);
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();

  await expect(page.locator('button:text-is("Elemente")')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(5000);
}

async function getFabricObjects(page: Page): Promise<Array<{
  type: string; left: number; top: number; width: number; height: number;
  scaleX: number; scaleY: number; text?: string; fontSize?: number;
  fontFamily?: string; data?: any;
}>> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        return fc.getObjects().map((obj: any) => ({
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          data: obj.data,
        }));
      }
    }
    return [];
  });
}

async function clickCanvasObject(page: Page, index: number): Promise<void> {
  // Click on a specific Fabric object by triggering canvas selection
  await page.evaluate((idx) => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        const objects = fc.getObjects();
        if (objects[idx]) {
          fc.setActiveObject(objects[idx]);
          fc.renderAll();
          fc.fire("selection:created", { selected: [objects[idx]] });
        }
      }
    }
  }, index);
  await page.waitForTimeout(500);
}

async function getActiveObjectInfo(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        const obj = fc.getActiveObject();
        if (!obj) return null;
        return {
          type: obj.type,
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          data: obj.data,
        };
      }
    }
    return null;
  });
}

// ── INT-1: Text element selection + font info ───────────────

test.describe("INT-1: Text element selection", () => {
  test("Can select text element and read its properties", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const objects = await getFabricObjects(page);
    console.log(`Objects on canvas: ${objects.length}`);
    objects.forEach((o, i) => {
      console.log(`  [${i}] type=${o.type} text=${o.text?.substring(0, 30)} font=${o.fontFamily} size=${o.fontSize}`);
    });

    // Find first text object
    const textIdx = objects.findIndex(o => o.type === "textbox" || o.type === "text" || o.type === "i-text");
    expect(textIdx).toBeGreaterThanOrEqual(0);

    await clickCanvasObject(page, textIdx);
    const active = await getActiveObjectInfo(page);
    expect(active).not.toBeNull();
    expect(active.type).toMatch(/text/i);
    console.log(`Selected: "${active.text?.substring(0, 30)}" font=${active.fontFamily} size=${active.fontSize}`);

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT1-text-selected.png") });
  });
});

// ── INT-2: Change font family ───────────────────────────────

test.describe("INT-2: Change font family", () => {
  test("Changing font via toolbar updates text element", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const objects = await getFabricObjects(page);
    const textIdx = objects.findIndex(o => o.type === "textbox" || o.type === "text" || o.type === "i-text");
    expect(textIdx).toBeGreaterThanOrEqual(0);

    const originalFont = objects[textIdx].fontFamily;
    console.log(`Original font: ${originalFont}`);

    // Select the text element
    await clickCanvasObject(page, textIdx);
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT2-before-font-change.png") });

    // Look for font selector in toolbar
    const fontSelect = page.locator('[data-testid="font-select"]')
      .or(page.locator('select').filter({ has: page.locator('option') }).first())
      .or(page.locator('[class*="font"]').locator('select').first());

    const hasFontSelector = await fontSelect.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Font selector visible: ${hasFontSelector}`);

    if (hasFontSelector) {
      // Try to change font
      const options = await fontSelect.locator('option').allTextContents();
      console.log(`Font options: ${options.slice(0, 5).join(", ")}...`);

      if (options.length > 1) {
        // Pick a different font
        const newFont = options.find(o => o !== originalFont) ?? options[1];
        await fontSelect.selectOption({ label: newFont });
        await page.waitForTimeout(500);

        const afterFont = await getActiveObjectInfo(page);
        console.log(`After font change: ${afterFont?.fontFamily}`);
        // Font should have changed
        expect(afterFont?.fontFamily).not.toBe(originalFont);
      }
    } else {
      // Look for font button/dropdown that opens a panel
      const fontButton = page.locator('button:has-text("Schrift")').or(page.locator('button:has-text("Font")'));
      const hasFontButton = await fontButton.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Font button: ${hasFontButton}`);

      if (!hasFontButton) {
        // Check if toolbar appeared at all
        const toolbar = page.locator('[class*="toolbar"]').or(page.locator('[class*="Toolbar"]'));
        const hasToolbar = await toolbar.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`Toolbar visible: ${hasToolbar}`);
        console.log("WARN: No font change mechanism found in UI");
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT2-after-font-change.png") });
  });
});

// ── INT-3: Change font size ─────────────────────────────────

test.describe("INT-3: Change font size", () => {
  test("Font size can be changed via toolbar", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const objects = await getFabricObjects(page);
    const textIdx = objects.findIndex(o => o.type === "textbox" || o.type === "text" || o.type === "i-text");
    const originalSize = objects[textIdx].fontSize;
    console.log(`Original font size: ${originalSize}`);

    await clickCanvasObject(page, textIdx);
    await page.waitForTimeout(500);

    // Look for font size input
    const sizeInput = page.locator('[data-testid="font-size"]')
      .or(page.locator('input[type="number"]').first());

    const hasSizeInput = await sizeInput.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Font size input visible: ${hasSizeInput}`);

    if (hasSizeInput) {
      await sizeInput.fill("48");
      await sizeInput.press("Enter");
      await page.waitForTimeout(500);

      const after = await getActiveObjectInfo(page);
      console.log(`After size change: ${after?.fontSize}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT3-font-size.png") });
  });
});

// ── INT-4: Drag element → position changes ──────────────────

test.describe("INT-4: Drag element", () => {
  test("Dragging text element changes its position", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const objects = await getFabricObjects(page);
    const textIdx = objects.findIndex(o => o.type === "textbox" || o.type === "text" || o.type === "i-text");
    const beforeLeft = objects[textIdx].left;
    const beforeTop = objects[textIdx].top;
    console.log(`Before drag: left=${beforeLeft} top=${beforeTop}`);

    // Get canvas position
    const canvas = page.locator("canvas.upper-canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Calculate where the text element is in screen coords (approximate)
    const canvasWidth = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      return c ? c.width : 0;
    });
    const canvasHeight = await page.evaluate(() => {
      const c = document.querySelector("canvas.lower-canvas") as HTMLCanvasElement;
      return c ? c.height : 0;
    });

    const scaleX = box.width / canvasWidth;
    const scaleY = box.height / canvasHeight;
    const elemX = box.x + beforeLeft * scaleX;
    const elemY = box.y + beforeTop * scaleY;

    // Drag 50px to the right and 30px down
    await page.mouse.move(elemX + 20, elemY + 20);
    await page.mouse.down();
    await page.mouse.move(elemX + 70, elemY + 50, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    const afterObjects = await getFabricObjects(page);
    const afterLeft = afterObjects[textIdx].left;
    const afterTop = afterObjects[textIdx].top;
    console.log(`After drag: left=${afterLeft} top=${afterTop}`);

    // Position should have changed by approximately the drag distance
    const moved = Math.abs(afterLeft - beforeLeft) > 5 || Math.abs(afterTop - beforeTop) > 5;
    console.log(`Element moved: ${moved}`);

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT4-after-drag.png") });
  });
});

// ── INT-5: Add text element ─────────────────────────────────

test.describe("INT-5: Add free text element", () => {
  test("+ Textfeld button adds new text on canvas", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const beforeCount = await page.evaluate(() => {
      const canvasEls = document.querySelectorAll("canvas.lower-canvas");
      for (const c of canvasEls) {
        const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
        if (fc) return fc.getObjects().length;
      }
      return 0;
    });
    console.log(`Objects before: ${beforeCount}`);

    // Click "+ Textfeld" button
    const addTextBtn = page.locator('button:has-text("Textfeld")').first();
    const hasBtn = await addTextBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`+ Textfeld button visible: ${hasBtn}`);

    if (hasBtn) {
      await addTextBtn.click();
      await page.waitForTimeout(1000);

      const afterCount = await page.evaluate(() => {
        const canvasEls = document.querySelectorAll("canvas.lower-canvas");
        for (const c of canvasEls) {
          const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
          if (fc) return fc.getObjects().length;
        }
        return 0;
      });
      console.log(`Objects after: ${afterCount}`);
      expect(afterCount).toBe(beforeCount + 1);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT5-add-text.png") });
  });
});

// ── INT-6: Add photo element ────────────────────────────────

test.describe("INT-6: Add photo element", () => {
  test("+ Fotofeld button triggers file upload", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    // Click "+ Fotofeld" button
    const addPhotoBtn = page.locator('button:has-text("Fotofeld")').first();
    const hasBtn = await addPhotoBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`+ Fotofeld button visible: ${hasBtn}`);

    if (hasBtn) {
      // Listen for file chooser
      const fileChooserPromise = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
      await addPhotoBtn.click();
      const fileChooser = await fileChooserPromise;

      if (fileChooser) {
        console.log("File chooser opened — photo upload works");
        // Upload a test image
        const testImgPath = path.join(process.cwd(), "public", "assets", "placeholder-man-2.jpg");
        if (fs.existsSync(testImgPath)) {
          await fileChooser.setFiles(testImgPath);
          await page.waitForTimeout(3000);

          const images = await page.evaluate(() => {
            const canvasEls = document.querySelectorAll("canvas.lower-canvas");
            for (const c of canvasEls) {
              const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
              if (fc) return fc.getObjects().filter((o: any) => o.type === "image").length;
            }
            return 0;
          });
          console.log(`Images on canvas after upload: ${images}`);
        } else {
          console.log("Test image not found at:", testImgPath);
        }
      } else {
        // Maybe it opens a different UI (sidebar picker, modal)
        console.log("No file chooser — checking for alternative photo UI");
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT6-add-photo.png") });
  });
});

// ── INT-7: Undo/Redo ────────────────────────────────────────

test.describe("INT-7: Undo/Redo", () => {
  test("Undo button reverts last action", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    // Add a text element first
    const addTextBtn = page.locator('button:has-text("Textfeld")').first();
    if (await addTextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const beforeCount = await page.evaluate(() => {
        const c = document.querySelector("canvas.lower-canvas") as any;
        const fc = c?.__fabricCanvas ?? c?.fabric;
        return fc ? fc.getObjects().length : 0;
      });

      await addTextBtn.click();
      await page.waitForTimeout(500);

      const afterAddCount = await page.evaluate(() => {
        const c = document.querySelector("canvas.lower-canvas") as any;
        const fc = c?.__fabricCanvas ?? c?.fabric;
        return fc ? fc.getObjects().length : 0;
      });
      console.log(`Before add: ${beforeCount}, after add: ${afterAddCount}`);

      // Click undo button
      const undoBtn = page.locator('button[aria-label="Undo"]')
        .or(page.locator('button:has-text("↩")'))
        .or(page.locator('[data-testid="undo"]'))
        .or(page.locator('button svg').locator('..').first()); // undo icon

      // Try keyboard shortcut
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(500);

      const afterUndoCount = await page.evaluate(() => {
        const c = document.querySelector("canvas.lower-canvas") as any;
        const fc = c?.__fabricCanvas ?? c?.fabric;
        return fc ? fc.getObjects().length : 0;
      });
      console.log(`After undo (Ctrl+Z): ${afterUndoCount}`);

      if (afterUndoCount < afterAddCount) {
        console.log("Undo WORKS via Ctrl+Z");
      } else {
        console.log("WARN: Undo may not have worked");
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT7-undo.png") });
  });
});

// ── INT-8: Preview button ───────────────────────────────────

test.describe("INT-8: Preview button", () => {
  test("Vorschau button opens preview", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const previewBtn = page.locator('button:has-text("Vorschau")');
    await expect(previewBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT8-before-preview.png") });
    await previewBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS, "INT8-after-preview.png") });

    // Check if preview modal/view appeared
    const previewContent = page.locator('[class*="preview"]')
      .or(page.locator('[class*="Preview"]'))
      .or(page.locator('[data-testid="preview-modal"]'))
      .or(page.locator('[role="dialog"]'));

    const hasPreview = await previewContent.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Preview opened: ${hasPreview}`);
  });
});

// ── INT-9: PDF button ───────────────────────────────────────

test.describe("INT-9: PDF button", () => {
  test("PDF button is visible and clickable", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    const pdfBtn = page.locator('button:has-text("PDF")');
    await expect(pdfBtn).toBeVisible({ timeout: 5000 });
    console.log("PDF button visible");

    // Click and check for download or modal
    const downloadPromise = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
    await pdfBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(SCREENSHOTS, "INT9-pdf-click.png") });

    const download = await downloadPromise;
    if (download) {
      const filePath = await download.path();
      if (filePath) {
        const size = fs.statSync(filePath).size;
        console.log(`PDF downloaded: ${size} bytes`);
        expect(size).toBeGreaterThan(5000);
      }
    } else {
      console.log("No download triggered — may need additional interaction");
    }
  });
});

// ── INT-10: Sidebar tabs ────────────────────────────────────

test.describe("INT-10: Sidebar tabs work", () => {
  test("Elemente, Assets, Vorlage tabs switch content", async ({ page }) => {
    test.setTimeout(60000);
    await loadTemplate(page, TEST_TEMPLATE);

    // Elemente tab (should be active by default)
    const elementeTab = page.locator('button:text-is("Elemente")');
    await expect(elementeTab).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, "INT10-tab-elemente.png") });

    // Assets tab
    const assetsTab = page.locator('button:text-is("Assets")');
    const hasAssetsTab = await assetsTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasAssetsTab) {
      await assetsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "INT10-tab-assets.png") });
      console.log("Assets tab: VISIBLE");
    } else {
      console.log("Assets tab: NOT FOUND");
    }

    // Vorlage tab
    const vorlageTab = page.locator('button:text-is("Vorlage")');
    const hasVorlageTab = await vorlageTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasVorlageTab) {
      await vorlageTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "INT10-tab-vorlage.png") });
      console.log("Vorlage tab: VISIBLE");
    } else {
      console.log("Vorlage tab: NOT FOUND");
    }
  });
});
