import { test, expect } from '@playwright/test';

test('TI05 back side - cropped canvas screenshot and measurements', async ({ page }) => {
  // 1. Go to builder-v2
  await page.goto('http://localhost:3000/de/builder-v2', { waitUntil: 'networkidle' });

  // 2. Click card type sterbebild
  await page.locator('[data-testid="card-type-sterbebild"]').click();

  // 3. Wait 800ms
  await page.waitForTimeout(800);

  // 4. Click template TI05
  await page.locator('[data-testid="template-TI05"]').click();

  // 5. Wait 3s for template to load
  await page.waitForTimeout(3000);

  // 6. Click "Rückseite" button
  await page.getByRole('button', { name: 'Rückseite' }).click();

  // 7. Wait 2s
  await page.waitForTimeout(2000);

  // 8. Take cropped screenshot of canvas.upper-canvas
  const canvas = page.locator('canvas.upper-canvas');
  await expect(canvas).toBeVisible({ timeout: 5000 });

  const boundingBox = await canvas.boundingBox();
  console.log('=== CANVAS BOUNDING BOX (relative to page) ===');
  console.log(`  x: ${boundingBox!.x}`);
  console.log(`  y: ${boundingBox!.y}`);
  console.log(`  width: ${boundingBox!.width}`);
  console.log(`  height: ${boundingBox!.height}`);

  await canvas.screenshot({ path: 'e2e/screenshots/ti05-back-canvas-only.png' });
  console.log('Screenshot saved to e2e/screenshots/ti05-back-canvas-only.png');

  // 9. Get canvas element dimensions (CSS and internal)
  const canvasDimensions = await page.evaluate(() => {
    const c = document.querySelector('canvas.upper-canvas') as HTMLCanvasElement;
    if (!c) return null;
    return {
      cssWidth: c.style.width,
      cssHeight: c.style.height,
      internalWidth: c.width,
      internalHeight: c.height,
      offsetWidth: c.offsetWidth,
      offsetHeight: c.offsetHeight,
    };
  });
  console.log('=== CANVAS DIMENSIONS ===');
  console.log(JSON.stringify(canvasDimensions, null, 2));

  // 10. Get first fabric object's top position
  const fabricData = await page.evaluate(() => {
    const canvasEl = document.querySelector('canvas.lower-canvas') as any;
    // fabric stores the instance on the canvas element or as a global
    let fabricCanvas = (window as any).__fabricCanvas
      || (canvasEl as any)?.__fabricCanvas
      || (canvasEl as any)?.fabric;

    // Try finding it via fabric.Canvas instances
    if (!fabricCanvas && (window as any).fabric) {
      const instances = (window as any).fabric.Canvas.__instances
        || (window as any).fabric.Canvas.instances;
      if (instances && instances.length > 0) {
        fabricCanvas = instances[0];
      }
    }

    if (!fabricCanvas) {
      // Last resort: check all canvas elements
      const allCanvases = document.querySelectorAll('canvas');
      for (const c of allCanvases) {
        if ((c as any).__fabricCanvas) {
          fabricCanvas = (c as any).__fabricCanvas;
          break;
        }
        if ((c as any).fabric) {
          fabricCanvas = (c as any).fabric;
          break;
        }
      }
    }

    if (!fabricCanvas) {
      return { error: 'No fabric canvas found', checked: ['window.__fabricCanvas', 'canvas.__fabricCanvas', 'canvas.fabric', 'fabric.Canvas.__instances'] };
    }

    const objects = fabricCanvas.getObjects ? fabricCanvas.getObjects() : fabricCanvas._objects || [];
    if (objects.length === 0) {
      return { error: 'No objects on canvas', objectCount: 0 };
    }

    const first = objects[0];
    return {
      objectCount: objects.length,
      firstObject: {
        type: first.type,
        top: first.top,
        left: first.left,
        width: first.width,
        height: first.height,
        scaleX: first.scaleX,
        scaleY: first.scaleY,
        text: first.text || first.textLines?.[0] || undefined,
      },
      allObjectTypes: objects.map((o: any) => ({ type: o.type, top: o.top, left: o.left })),
    };
  });
  console.log('=== FABRIC CANVAS DATA ===');
  console.log(JSON.stringify(fabricData, null, 2));
});
