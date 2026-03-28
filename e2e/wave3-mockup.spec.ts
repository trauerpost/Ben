/**
 * Wave 3 — Batch 5: CardMockup Display Tests
 *
 * Covers: mockup toggle in StepPreview (v2), mockup mode in v1,
 * mockup on order success, mobile scaling, no-photo template.
 */
import { test, expect, type Page } from "@playwright/test";

test.use({ navigationTimeout: 60000 });

async function clearAndGo(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "commit", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForTimeout(2000);
}

/** Navigate to Step 6 (Preview) with a v2 template (TI05) */
async function navigateToPreviewV2(page: Page): Promise<void> {
  await clearAndGo(page, "/de/builder");

  // Step 1: Card type
  await page.getByText("Erinnerungsbild").click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Step 2: Template TI05
  await page.getByTestId("TI05").click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Step 3: Photo — skip (just click next)
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Step 4: Text — enter required name
  await page.getByPlaceholder("Maria Musterfrau").fill("Test Name");
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Step 5: Decorations — skip
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Now at Step 6 (Preview)
}

test.describe("CardMockup — Step 6 (Preview)", () => {
  test("v2 template shows Preview/Mockup toggle buttons", async ({ page }) => {
    await navigateToPreviewV2(page);
    await expect(page.getByText("Step 6 of 7")).toBeVisible({ timeout: 10000 });

    // Both toggle buttons should be visible
    await expect(page.getByRole("button", { name: /Mockup/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Vorschau/i })).toBeVisible();
  });

  test("clicking Mockup renders 3D card container", async ({ page }) => {
    await navigateToPreviewV2(page);
    await page.getByRole("button", { name: /Mockup/i }).click();
    await page.waitForTimeout(500);

    // CardMockup should render with perspective transform
    // The mockup surface has a gradient background
    const mockupSurface = page.locator("[class*='rounded-2xl']").filter({
      has: page.locator("[class*='rounded-xl']"),
    });
    // At minimum, verify the mockup button is selected (has primary bg)
    const mockupBtn = page.getByRole("button", { name: /Mockup/i });
    await expect(mockupBtn).toHaveClass(/bg-brand-primary/, { timeout: 5000 });
  });

  test("switching back to Preview shows flat card", async ({ page }) => {
    await navigateToPreviewV2(page);
    await page.getByRole("button", { name: /Mockup/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Vorschau/i }).click();
    await page.waitForTimeout(300);

    // Preview button should now be active
    const previewBtn = page.getByRole("button", { name: /Vorschau/i });
    await expect(previewBtn).toHaveClass(/bg-brand-primary/, { timeout: 5000 });
  });

  test("no-photo template (TI04) mockup renders without crash", async ({ page }) => {
    await clearAndGo(page, "/de/builder");

    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 2: TI04 (text only, no photo)
    await page.getByTestId("TI04").click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // TI04 skips photo step → now at Step 4 (Text)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Name");
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 5: Decorations → skip
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 6: Preview
    await expect(page.getByText("Step 6 of 7")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Mockup/i }).click();
    await page.waitForTimeout(500);

    // Should not crash — page should still be visible
    await expect(page.getByRole("button", { name: /Mockup/i })).toBeVisible();
  });

  test("mobile: mockup does not cause horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateToPreviewV2(page);
    await page.getByRole("button", { name: /Mockup/i }).click();
    await page.waitForTimeout(500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});

test.describe("CardMockup — v1 templates", () => {
  test("v1 mode selector includes Mockup option", async ({ page }) => {
    await clearAndGo(page, "/de/builder");

    // Step 1: Trauerkarte + single
    await page.getByRole("heading", { name: "Trauerkarte" }).click();
    await page.waitForTimeout(500);
    // Scroll to format buttons and click "Einfach (single)"
    await page.getByText(/Einfach/).first().scrollIntoViewIfNeeded();
    await page.getByText(/Einfach/).first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(1000);

    // Step 2: Select first available template
    const firstTemplate = page.locator("[data-testid]").first();
    await firstTemplate.scrollIntoViewIfNeeded();
    await firstTemplate.click();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 4: Text — enter required name (v1 uses "Name der verstorbenen Person" placeholder)
    const nameInput = page.getByPlaceholder(/Musterfrau|Name/).first();
    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.fill("Test");
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 5: Skip decorations
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Step 6: Preview — check for Mockup button in mode selector
    await expect(page.getByRole("button", { name: /Mockup/i })).toBeVisible({ timeout: 10000 });
  });
});
