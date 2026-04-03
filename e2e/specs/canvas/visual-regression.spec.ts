import { test, expect } from "@playwright/test";
import { BASELINE_TEMPLATES, loadTemplate, switchToPage, getCanvasLocator } from "../../helpers/visual-baseline";

test.describe("Canvas Builder V2 — Visual Regression", () => {
  for (const config of BASELINE_TEMPLATES) {
    for (const pageId of config.pages) {
      test(`${config.templateId} ${pageId} matches baseline`, async ({ page }) => {
        await loadTemplate(page, config.templateId);
        await switchToPage(page, pageId);

        const canvas = await getCanvasLocator(page);
        await expect(canvas).toHaveScreenshot(
          `${config.templateId}-${pageId}.png`,
          {
            maxDiffPixelRatio: 0.02, // Allow 2% pixel difference
            threshold: 0.3,          // Per-pixel color threshold
          }
        );
      });
    }
  }
});
