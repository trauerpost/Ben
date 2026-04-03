/**
 * Toolbar Debug Test — Does mouse-clicking a text element on canvas
 * actually select it and show the ContextualToolbar?
 *
 * Tests on PRODUCTION: https://trauerpost.vercel.app/de/builder-v2
 * Template: TI08
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://trauerpost.vercel.app";
const SCREENSHOTS = path.join(process.cwd(), "test-results", "toolbar-debug");

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

  // Wait for canvas to fully render
  await expect(page.locator('button:text-is("Elemente")')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(5000);
}

/** Get Fabric canvas reference and all objects with their screen positions */
async function getCanvasInfo(page: Page): Promise<{
  objects: Array<{
    index: number;
    type: string;
    text?: string;
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
}> {
  return await page.evaluate(() => {
    const canvasEls = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvasEls) {
      const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
      if (fc) {
        const objs = fc.getObjects().map((obj: any, i: number) => ({
          index: i,
          type: obj.type,
          text: obj.text,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX ?? 1,
          scaleY: obj.scaleY ?? 1,
        }));
        return {
          objects: objs,
          canvasWidth: fc.width,
          canvasHeight: fc.height,
        };
      }
    }
    return { objects: [], canvasWidth: 0, canvasHeight: 0 };
  });
}

/** Check if getActiveObject() returns something */
async function getActiveObject(page: Page): Promise<any> {
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
          left: obj.left,
          top: obj.top,
          fontFamily: obj.fontFamily,
          fontSize: obj.fontSize,
        };
      }
    }
    return null;
  });
}

test.describe("Toolbar Debug — Mouse Click Selection", () => {
  test("Click 'Erna Musterfrau' text on TI08 canvas and check toolbar", async ({ page }) => {
    test.setTimeout(90000);
    await loadTemplate(page, "TI08");

    // Step 1: Get all canvas objects and find "Erna" text
    const info = await getCanvasInfo(page);
    console.log(`\n=== CANVAS INFO ===`);
    console.log(`Canvas size: ${info.canvasWidth} x ${info.canvasHeight}`);
    console.log(`Objects: ${info.objects.length}`);
    info.objects.forEach((o) => {
      const label = o.text ? `"${o.text.substring(0, 40)}"` : `(${o.type})`;
      console.log(`  [${o.index}] type=${o.type} pos=(${Math.round(o.left)},${Math.round(o.top)}) size=${Math.round(o.width)}x${Math.round(o.height)} scale=${o.scaleX.toFixed(2)}x${o.scaleY.toFixed(2)} ${label}`);
    });

    // Find the "Erna Musterfrau" text object (or first text object with "Erna")
    const ernaObj = info.objects.find(
      (o) => (o.type === "textbox" || o.type === "i-text" || o.type === "text") && o.text?.includes("Erna")
    );

    if (!ernaObj) {
      // Fallback: first text object
      const firstText = info.objects.find(
        (o) => o.type === "textbox" || o.type === "i-text" || o.type === "text"
      );
      console.log(`\nWARN: No "Erna" text found. Using first text object: ${firstText?.text?.substring(0, 30)}`);
      if (!firstText) {
        console.log("FATAL: No text objects on canvas at all!");
        await page.screenshot({ path: path.join(SCREENSHOTS, "no-text-objects.png") });
        expect(firstText).not.toBeNull();
        return;
      }
    }

    const targetObj = ernaObj ?? info.objects.find(
      (o) => o.type === "textbox" || o.type === "i-text" || o.type === "text"
    )!;

    console.log(`\n=== TARGET OBJECT ===`);
    console.log(`Text: "${targetObj.text?.substring(0, 50)}"`);
    console.log(`Canvas coords: left=${targetObj.left}, top=${targetObj.top}`);
    console.log(`Size: ${targetObj.width}x${targetObj.height}, scale: ${targetObj.scaleX}x${targetObj.scaleY}`);

    // Step 2: Get the upper-canvas bounding box to calculate screen coordinates
    const upperCanvas = page.locator("canvas.upper-canvas");
    const box = await upperCanvas.boundingBox();
    expect(box).not.toBeNull();
    console.log(`\n=== CANVAS SCREEN POSITION ===`);
    console.log(`Canvas bounding box: x=${box!.x}, y=${box!.y}, w=${box!.width}, h=${box!.height}`);

    // Calculate scale from canvas logical coords to screen coords
    const scaleToScreen = box!.width / info.canvasWidth;
    console.log(`Scale factor (screen/canvas): ${scaleToScreen.toFixed(4)}`);

    // Calculate center of the target object in screen coordinates
    const objCenterCanvasX = targetObj.left + (targetObj.width * targetObj.scaleX) / 2;
    const objCenterCanvasY = targetObj.top + (targetObj.height * targetObj.scaleY) / 2;
    const clickX = box!.x + objCenterCanvasX * scaleToScreen;
    const clickY = box!.y + objCenterCanvasY * scaleToScreen;

    console.log(`\n=== CLICK COORDINATES ===`);
    console.log(`Object center (canvas): ${objCenterCanvasX.toFixed(1)}, ${objCenterCanvasY.toFixed(1)}`);
    console.log(`Click point (screen): ${clickX.toFixed(1)}, ${clickY.toFixed(1)}`);

    // Step 3: Screenshot BEFORE clicking
    const activeBefore = await getActiveObject(page);
    console.log(`\n=== BEFORE CLICK ===`);
    console.log(`Active object before: ${activeBefore ? JSON.stringify(activeBefore) : "null"}`);

    // Check toolbar BEFORE
    const toolbarBefore = await page.locator("div.absolute.z-30").count();
    console.log(`Toolbar div.absolute.z-30 count before: ${toolbarBefore}`);

    await page.screenshot({ path: path.join(SCREENSHOTS, "01-before-click.png"), fullPage: false });

    // Step 4: Click on the text element using mouse coordinates
    console.log(`\n=== CLICKING at (${clickX.toFixed(0)}, ${clickY.toFixed(0)}) ===`);
    await page.mouse.click(clickX, clickY);

    // Step 5: Wait 2 seconds
    await page.waitForTimeout(2000);

    // Step 6: Screenshot AFTER clicking
    await page.screenshot({ path: path.join(SCREENSHOTS, "02-after-click.png"), fullPage: false });

    // Step 7: Check if object got selected
    const activeAfter = await getActiveObject(page);
    console.log(`\n=== AFTER CLICK ===`);
    console.log(`Active object after: ${activeAfter ? JSON.stringify(activeAfter) : "null"}`);

    // Step 8: Check if toolbar appeared
    const toolbarAfter = await page.locator("div.absolute.z-30").count();
    console.log(`Toolbar div.absolute.z-30 count after: ${toolbarAfter}`);

    // Also check broader toolbar selectors
    const toolbarVisibleByClass = await page.evaluate(() => {
      const els = document.querySelectorAll("div.absolute.z-30");
      return Array.from(els).map((el) => ({
        visible: (el as HTMLElement).offsetParent !== null,
        classes: el.className,
        innerHTML: el.innerHTML.substring(0, 200),
        style: (el as HTMLElement).style.cssText,
      }));
    });
    console.log(`Toolbar elements found:`, JSON.stringify(toolbarVisibleByClass, null, 2));

    // Also check for ANY toolbar-like element that may have appeared
    const allAbsoluteZElements = await page.evaluate(() => {
      const els = document.querySelectorAll('[class*="z-30"], [class*="z-40"], [class*="z-50"]');
      return Array.from(els).map((el) => ({
        tag: el.tagName,
        classes: el.className.substring(0, 100),
        visible: (el as HTMLElement).offsetParent !== null,
        rect: el.getBoundingClientRect(),
      }));
    });
    console.log(`\nAll high z-index elements:`, JSON.stringify(allAbsoluteZElements, null, 2));

    // Step 9: Try programmatic selection for comparison
    console.log(`\n=== PROGRAMMATIC SELECTION (for comparison) ===`);
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
    }, targetObj.index);

    await page.waitForTimeout(1000);

    const activeProgram = await getActiveObject(page);
    console.log(`Active after programmatic select: ${activeProgram ? JSON.stringify(activeProgram) : "null"}`);

    const toolbarAfterProgram = await page.locator("div.absolute.z-30").count();
    console.log(`Toolbar count after programmatic select: ${toolbarAfterProgram}`);

    await page.screenshot({ path: path.join(SCREENSHOTS, "03-after-programmatic-select.png"), fullPage: false });

    // Step 10: Deep React state inspection
    console.log(`\n=== DEEP REACT INSPECTION ===`);
    const deepInfo = await page.evaluate(() => {
      // Check if ContextualToolbar component is even mounted
      const allDivs = document.querySelectorAll("div");
      let toolbarLikeDivs = 0;
      let absoluteDivs = 0;
      for (const d of allDivs) {
        if (d.className.includes("z-30")) toolbarLikeDivs++;
        if (d.className.includes("absolute") && d.className.includes("z-")) absoluteDivs++;
      }

      // Check the canvas container ref — is canvasContainerRef.current valid?
      const canvasContainer = document.querySelector(".flex-1.overflow-auto.flex.items-center.justify-center.p-8.relative");

      // Check canvas events — listen for next selection event
      const canvasEls = document.querySelectorAll("canvas.lower-canvas");
      let eventListenerCount = 0;
      let fabricVersion = "unknown";
      let canvasEventNames: string[] = [];
      for (const c of canvasEls) {
        const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
        if (fc) {
          fabricVersion = (window as any).fabric?.version ?? "not on window";
          // Check if canvas has event listeners
          const events = fc.__eventListeners ?? fc._events ?? {};
          canvasEventNames = Object.keys(events);
          for (const key of canvasEventNames) {
            const handlers = events[key];
            if (Array.isArray(handlers)) eventListenerCount += handlers.length;
          }
        }
      }

      return {
        toolbarLikeDivs,
        absoluteDivs,
        canvasContainerFound: !!canvasContainer,
        canvasContainerClasses: canvasContainer?.className ?? "NOT FOUND",
        fabricVersion,
        canvasEventNames,
        eventListenerCount,
        documentReadyState: document.readyState,
        bodyChildCount: document.body.children.length,
      };
    });
    console.log(`Deep info:`, JSON.stringify(deepInfo, null, 2));

    // Step 11: Check if the React component tree has the ContextualToolbar
    // by looking for its unique class pattern in the rendered HTML
    const htmlSnippet = await page.evaluate(() => {
      const container = document.querySelector(".flex-1.overflow-auto.flex.items-center.justify-center.p-8.relative");
      if (!container) return "CONTAINER NOT FOUND";
      return container.innerHTML.substring(0, 2000);
    });
    console.log(`\nCanvas container innerHTML (first 2000 chars):\n${htmlSnippet}`);

    // Step 12: Force a React re-render by dispatching a custom event
    console.log(`\n=== FORCE RE-RENDER TEST ===`);
    await page.evaluate(() => {
      const canvasEls = document.querySelectorAll("canvas.lower-canvas");
      for (const c of canvasEls) {
        const fc = (c as any).__fabricCanvas ?? (c as any).fabric;
        if (fc) {
          // Clear and re-select to trigger fresh selection:created
          const active = fc.getActiveObject();
          fc.discardActiveObject();
          fc.renderAll();
          if (active) {
            setTimeout(() => {
              fc.setActiveObject(active);
              fc.renderAll();
              fc.fire("selection:created", { selected: [active] });
            }, 100);
          }
        }
      }
    });
    await page.waitForTimeout(1500);

    const toolbarAfterForceRerender = await page.locator("div.absolute.z-30").count();
    console.log(`Toolbar count after force re-render: ${toolbarAfterForceRerender}`);
    await page.screenshot({ path: path.join(SCREENSHOTS, "04-after-force-rerender.png"), fullPage: false });

    // ── FINAL REPORT ──
    console.log(`\n${"=".repeat(60)}`);
    console.log(`REPORT: Font Toolbar Debug`);
    console.log(`${"=".repeat(60)}`);
    console.log(`1. Object selected via MOUSE CLICK: ${activeAfter !== null ? "YES" : "NO"}`);
    console.log(`2. Toolbar appeared via MOUSE CLICK: ${toolbarAfter > 0 ? "YES" : "NO"}`);
    console.log(`3. Object selected via PROGRAMMATIC: ${activeProgram !== null ? "YES" : "NO"}`);
    console.log(`4. Toolbar appeared via PROGRAMMATIC: ${toolbarAfterProgram > 0 ? "YES" : "NO"}`);
    console.log(`${"=".repeat(60)}`);

    // The test should not hard-fail — we want the diagnostic output
    // But log clear pass/fail
    if (activeAfter !== null && toolbarAfter > 0) {
      console.log("RESULT: Mouse click selection WORKS — toolbar appears in real browser");
    } else if (activeAfter !== null && toolbarAfter === 0) {
      console.log("RESULT: Mouse click SELECTS object but toolbar DOM element NOT found");
    } else if (activeAfter === null && activeProgram !== null) {
      console.log("RESULT: Mouse click FAILS to select, but programmatic works — likely a Playwright/event issue");
    } else {
      console.log("RESULT: Both mouse and programmatic selection FAILED — deeper issue");
    }
  });
});
