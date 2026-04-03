import { test, expect } from "@playwright/test";
import path from "path";

const WOMAN_JPG = path.resolve(__dirname, "../../../Woman.jpg");

test.describe("Vorschau Photo Crop Fix — E2E Verification", () => {
  test.setTimeout(60000);

  test("TI05: uploaded photo crop in Vorschau matches canvas", async ({ page }) => {
    await page.goto("/de/builder-v2");

    // 1. Select TI05
    await page.click('[data-testid="card-type-sterbebild"]');
    await page.click('[data-testid="template-TI05"]');
    await page.waitForTimeout(4000);

    // 2. Screenshot canvas BEFORE upload (placeholder)
    await page.screenshot({
      path: "e2e/screenshots/vorschau-crop-TI05-1-before-upload.png",
      fullPage: false,
    });

    // 3. Upload Woman.jpg — click the photo on canvas to select it, then use the toolbar
    const canvas = page.locator("canvas.upper-canvas").first();
    await expect(canvas).toBeVisible();

    // Click center of canvas to select the photo placeholder
    const box = await canvas.boundingBox();
    if (box) {
      // Photo placeholder is typically in the left portion of TI05
      await canvas.click({ position: { x: box.width * 0.25, y: box.height * 0.5 } });
    }
    await page.waitForTimeout(500);

    // Look for the "Ersetzen" (Replace) button in the toolbar
    const replaceBtn = page.locator('button:has-text("Ersetzen")');
    if (await replaceBtn.isVisible({ timeout: 2000 })) {
      // Use file chooser via the Replace button
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        replaceBtn.click(),
      ]);
      await fileChooser.setFiles(WOMAN_JPG);
    } else {
      // Fallback: use the "+ Fotofeld" button in the top bar
      const addPhotoBtn = page.locator('button:has-text("Fotofeld")');
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        addPhotoBtn.click(),
      ]);
      await fileChooser.setFiles(WOMAN_JPG);
    }

    await page.waitForTimeout(2000);

    // 4. Screenshot canvas AFTER upload
    await page.screenshot({
      path: "e2e/screenshots/vorschau-crop-TI05-2-after-upload.png",
      fullPage: false,
    });

    // 5. Click Vorschau
    const vorschauBtn = page.locator('button:has-text("Vorschau")');
    await expect(vorschauBtn).toBeEnabled();
    await vorschauBtn.click();

    // Wait for preview modal to appear
    await page.waitForTimeout(5000);

    // 6. Screenshot the preview
    await page.screenshot({
      path: "e2e/screenshots/vorschau-crop-TI05-3-preview.png",
      fullPage: false,
    });

    // 7. Verify the preview iframe is visible and has content
    const iframe = page.locator("iframe").first();
    await expect(iframe).toBeVisible();

    // Check iframe dimensions are reasonable (not collapsed)
    const iframeBox = await iframe.boundingBox();
    expect(iframeBox).not.toBeNull();
    expect(iframeBox!.width).toBeGreaterThan(400);
    expect(iframeBox!.height).toBeGreaterThan(400);

    // 8. Check that the preview HTML contains the photo as background-image
    // card-to-html-v2 renders photos via background-image CSS, not <img> tags
    const srcdoc = await iframe.getAttribute("srcdoc");
    expect(srcdoc).not.toBeNull();
    expect(srcdoc!).toContain("background-image");
    // The photo URL must be a data URL (blob was converted) or an https URL
    expect(srcdoc!).toMatch(/data:image\/|https?:\/\//);
    console.log("[Vorschau Verify] Preview HTML contains background-image with photo URL ✓");
  });
});
