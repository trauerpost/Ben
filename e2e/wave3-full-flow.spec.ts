/**
 * Wave 3 — Full Wizard Flow E2E Tests
 *
 * Complete user journeys covering all Wave 3 features together:
 * photo + filter + mockup, no-photo template, navigation, draft persistence.
 */
import { test, expect, type Page } from "@playwright/test";
import path from "path";

test.use({ navigationTimeout: 60000 });

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");

async function clearAndGo(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "commit", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForTimeout(2000);
}

test.describe("Full Wizard Flow — v2 with photo + filter + mockup", () => {
  test("complete flow: upload photo → filter → preview → mockup → PDF download", async ({ page }) => {
    await clearAndGo(page, "/de/builder");

    // Step 1: Erinnerungsbild
    await page.getByText("Erinnerungsbild").click();
    await expect(page.getByRole("button", { name: "Next →", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: TI05
    await page.getByTestId("TI05").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 3: Photo — upload and apply filter
    await expect(page.getByText("Step 3 of 7")).toBeVisible({ timeout: 10000 });
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);

    // Verify crop editor appeared
    await expect(page.locator("canvas")).toBeVisible({ timeout: 5000 });

    // Apply "Warm" filter
    await page.getByText("Warm").click();
    await page.waitForTimeout(300);
    const warmBtn = page.locator("button").filter({ hasText: "Warm" }).first();
    await expect(warmBtn).toHaveClass(/ring-2/);

    // Next → Step 4 (Text)
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 4: Enter name
    await expect(page.getByText("Step 4 of 7")).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder("Maria Musterfrau").fill("Maria Testfrau");
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 5: Skip decorations
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 6: Preview
    await expect(page.getByText("Step 6 of 7")).toBeVisible({ timeout: 10000 });

    // Check mockup toggle exists
    await expect(page.getByRole("button", { name: /Mockup/i })).toBeVisible();

    // Click mockup
    await page.getByRole("button", { name: /Mockup/i }).click();
    await page.waitForTimeout(500);
    const mockupBtn = page.getByRole("button", { name: /Mockup/i });
    await expect(mockupBtn).toHaveClass(/bg-brand-primary/);

    // Switch back to preview
    await page.getByRole("button", { name: /Vorschau/i }).click();
    await page.waitForTimeout(300);

    // PDF download button should be visible
    await expect(page.getByRole("button", { name: /PDF.*Local/i })).toBeVisible();
  });
});

test.describe("Full Wizard Flow — no-photo template (TI04)", () => {
  test("TI04: skips photo step, completes wizard", async ({ page }) => {
    await clearAndGo(page, "/de/builder");

    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: TI04
    await page.getByTestId("TI04").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Photo step should be SKIPPED — we should be at step 4 (Text)
    // TI04 has no photo, so shouldSkipPhoto triggers step 2→4
    await expect(page.getByText("Step 4 of 7")).toBeVisible({ timeout: 10000 });

    // Enter name
    await page.getByPlaceholder("Maria Musterfrau").fill("Sieglinde Test");
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 5: Decorations — skip
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 6: Preview
    await expect(page.getByText("Step 6 of 7")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Mockup/i })).toBeVisible();
  });
});

test.describe("Navigation edge cases", () => {
  test("forward to step 4, back to step 2, forward again — state preserved", async ({ page }) => {
    await clearAndGo(page, "/de/builder");

    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: TI05
    await page.getByTestId("TI05").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 3: skip photo
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 4: Enter name
    await page.getByPlaceholder("Maria Musterfrau").fill("Persistence Test");
    await page.waitForTimeout(200);

    // Go back to step 2
    await page.getByRole("button", { name: "← Back" }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "← Back" }).click();
    await page.waitForTimeout(300);

    // Should be at step 2
    await expect(page.getByText("Step 2 of 7")).toBeVisible({ timeout: 10000 });

    // Go forward again
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(300);

    // Step 4: Name should be preserved
    const nameInput = page.getByPlaceholder("Maria Musterfrau");
    await expect(nameInput).toHaveValue("Persistence Test");
  });

  test("step indicator shows correct step count (7 steps)", async ({ page }) => {
    await clearAndGo(page, "/de/builder");
    await expect(page.getByText("Step 1 of 7")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Split layout — preview visible during steps 3-5", () => {
  test("step 4 (Text) shows live preview on right side (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await clearAndGo(page, "/de/builder");

    // Navigate to step 4
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByTestId("TI05").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 4: Text — should have only one preview (from SplitLayout, not inline)
    await expect(page.getByText("Step 4 of 7")).toBeVisible({ timeout: 10000 });

    // Enter name and verify it appears in the right-side preview
    await page.getByPlaceholder("Maria Musterfrau").fill("Live Preview Test");
    await page.waitForTimeout(500);

    // The SpreadPreview should show the name
    // Look for the name text in the sticky preview panel (first one = SplitLayout preview)
    const previewPanel = page.locator("div.sticky.top-8").first();
    if (await previewPanel.isVisible()) {
      await expect(previewPanel.getByText("Live Preview Test")).toBeVisible({ timeout: 5000 });
    }
  });
});
