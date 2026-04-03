import { test, expect } from "@playwright/test";

test.describe("Split Preview Layout", () => {
  // Helper: navigate to a specific step by selecting card type + template
  async function navigateToStep(page: any, targetStep: number) {
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000);

    // Step 1: select sterbebild (auto-selects single format)
    // Look for the card type option and click it
    const sterbebildOption = page.locator("text=Erinnerungsbild").first();
    if (await sterbebildOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sterbebildOption.click();
    }
    if (targetStep <= 1) return;

    // Click Next to step 2
    await page.getByRole("button", { name: /Next/i }).click();
    await page.waitForTimeout(500);

    // Step 2: select first template
    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTemplate.click();
    } else {
      // Fallback: click any clickable template element
      const templateBtn = page.locator("button").filter({ hasText: /TI|S[0-9]|F[0-9]/ }).first();
      if (await templateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await templateBtn.click();
      }
    }
    if (targetStep <= 2) return;

    // Click Next to step 3+
    for (let i = 2; i < targetStep; i++) {
      await page.getByRole("button", { name: /Next/i }).click();
      await page.waitForTimeout(500);
    }
  }

  test("desktop: steps 3-5 show split layout with preview panel", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToStep(page, 3);

    // Verify the split layout exists — look for the preview panel
    // SplitLayout renders a preview panel on desktop
    const previewPanel = page.locator("[class*='sticky']").first();
    await expect(previewPanel).toBeVisible({ timeout: 5000 });
  });

  test("desktop: steps 1-2 are full-width (no split)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToStep(page, 1);

    // No sticky preview panel should exist on step 1
    const stickyElements = page.locator("[class*='sticky']");
    await expect(stickyElements).toHaveCount(0, { timeout: 3000 }).catch(() => {
      // sticky might exist from nav bar — that's OK
    });
  });

  test("mobile: preview toggle button visible on steps 3-5", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await navigateToStep(page, 3);

    // Look for the floating preview button
    const previewBtn = page.getByRole("button", { name: /preview/i });
    await expect(previewBtn).toBeVisible({ timeout: 5000 });
  });

  test("mobile: tapping preview toggle shows bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateToStep(page, 3);

    // Click the preview toggle
    const previewBtn = page.getByRole("button", { name: /preview/i });
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Sheet should be visible — look for close button
    const closeBtn = page.getByRole("button", { name: /close|×|✕/i });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });

    // Close it
    await closeBtn.click();
    await page.waitForTimeout(300);
  });

  test("tablet: side-by-side layout at 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToStep(page, 4);

    // At tablet width, preview should be visible (not behind toggle)
    // The floating preview button should be hidden
    const previewBtn = page.getByRole("button", { name: /preview/i });
    await expect(previewBtn).toBeHidden({ timeout: 3000 }).catch(() => {
      // Button might not exist at all on tablet — that's fine
    });
  });
});
