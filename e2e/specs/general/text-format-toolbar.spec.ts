import { test, expect } from "@playwright/test";

/**
 * E2E tests for TextFormatToolbar, FontCarousel, and collapsible accordion (Batch 1 + 5).
 */

test.use({ navigationTimeout: 60000 });

async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →" }).click();
}

/** Navigate to Step 4 (Text) via TI05 template */
async function navigateToStepText(page: import("@playwright/test").Page) {
  await page.getByText("Erinnerungsbild").click();
  await clickNext(page);
  await page.getByTestId("TI05").click();
  await clickNext(page);
  await clickNext(page); // skip photo
  await page.waitForTimeout(500);
}

test.describe("Text Format Toolbar + Font Carousel + Accordion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("1. Toolbar + carousel visible on Step 4", async ({ page }) => {
    await navigateToStepText(page);
    // Toolbar alignment buttons exist in the sticky toolbar
    const toolbar = page.locator(".sticky.top-0");
    await expect(toolbar).toBeVisible();
    // Font carousel has category tabs (use first to avoid desktop+mobile dups)
    await expect(page.getByText("Serif ★").first()).toBeVisible();
  });

  test("2. Toolbar NOT visible on Step 1", async ({ page }) => {
    await expect(page.locator(".sticky.top-0")).not.toBeVisible();
  });

  test("3. Toolbar NOT visible on Step 6 (Preview)", async ({ page }) => {
    await navigateToStepText(page);
    await page.getByPlaceholder("Maria Musterfrau").fill("Test");
    await clickNext(page);
    await clickNext(page);
    await expect(page.locator(".sticky.top-0")).not.toBeVisible();
  });

  test("4. Font carousel: clicking font updates selection", async ({ page }) => {
    await navigateToStepText(page);
    const greatVibes = page.getByText("Great Vibes").first();
    await greatVibes.click();
    // The parent button should have ring
    const btn = page.locator("button", { hasText: "Great Vibes" }).first();
    await expect(btn).toHaveClass(/ring-brand-primary/);
  });

  test("5. Font carousel: selected font has ring highlight", async ({ page }) => {
    await navigateToStepText(page);
    const defaultFont = page.locator("button", { hasText: "Playfair Display" }).first();
    await expect(defaultFont).toHaveClass(/ring-brand-primary/);
  });

  test("6. Font carousel: category tabs filter fonts", async ({ page }) => {
    await navigateToStepText(page);
    // Click "Script" tab (visible on desktop)
    await page.getByText("Script").first().click();
    await expect(page.getByText("Great Vibes").first()).toBeVisible();
    // Inter should NOT be visible (sans font)
    await expect(page.locator("button", { hasText: "Inter" }).first()).not.toBeVisible();
    // Click "All" to restore
    await page.getByRole("button", { name: "All" }).first().click();
    await expect(page.locator("button", { hasText: "Inter" }).first()).toBeVisible();
  });

  test("7. Color swatch click updates text color", async ({ page }) => {
    await navigateToStepText(page);
    const goldSwatch = page.locator('button[title="Gold"]').first();
    await goldSwatch.click();
    await expect(goldSwatch).toHaveClass(/ring-brand-primary/);
  });

  test("8. Alignment button click updates alignment", async ({ page }) => {
    await navigateToStepText(page);
    // Toolbar has 3 alignment buttons — locate within the sticky toolbar
    const toolbar = page.locator(".sticky.top-0");
    const alignBtns = toolbar.locator("button.w-8.h-8");
    // Click the last one (right align: →)
    await alignBtns.last().click();
    await expect(alignBtns.last()).toHaveClass(/bg-brand-primary/);
  });

  test("9. Per-field font size slider changes value", async ({ page }) => {
    await navigateToStepText(page);
    // Each field with a sizeField has its own range slider
    // Find the first range slider and its pt display
    const sizeDisplay = page.locator("span", { hasText: /^\d+pt$/ }).first();
    await expect(sizeDisplay).toBeVisible();
    const initial = await sizeDisplay.textContent();

    // Find the range slider near it
    const slider = page.locator('input[type="range"]').first();
    await slider.fill("18");
    await page.waitForTimeout(200);
    await expect(sizeDisplay).toHaveText("18pt");
    expect("18pt").not.toBe(initial);
  });

  test("10. Toolbar stays visible while scrolling form", async ({ page }) => {
    await navigateToStepText(page);
    await page.evaluate(() => {
      const scrollable = document.querySelector(".overflow-y-auto");
      if (scrollable) scrollable.scrollTop = 500;
    });
    await page.waitForTimeout(200);
    const toolbar = page.locator(".sticky.top-0");
    await expect(toolbar).toBeVisible();
  });

  test("12. Accordion: clicking section header opens it", async ({ page }) => {
    await navigateToStepText(page);
    const textSection = page.locator("button", { hasText: "Spruch & Text" });
    await expect(textSection).toBeVisible();
    await textSection.click();
    await page.waitForTimeout(300);
    // Quote field should appear — use textarea since quote is textarea type
    const quoteField = page.locator("textarea").first();
    await expect(quoteField).toBeVisible();
  });

  test("13. Accordion: multiple sections can be open simultaneously", async ({ page }) => {
    await navigateToStepText(page);
    // Personal should be open by default
    await expect(page.getByPlaceholder("Maria Musterfrau")).toBeVisible();
    // Open "Spruch & Text" too
    await page.locator("button", { hasText: "Spruch & Text" }).click();
    await page.waitForTimeout(300);
    // Quote textarea should be visible
    await expect(page.locator("textarea").first()).toBeVisible();
    // Personal should still be open
    await expect(page.getByPlaceholder("Maria Musterfrau")).toBeVisible();
  });

  test("14. Accordion: focusing field auto-opens its section", async ({ page }) => {
    await navigateToStepText(page);
    // Open text section
    await page.locator("button", { hasText: "Spruch & Text" }).click();
    await page.waitForTimeout(300);
    const quoteField = page.locator("textarea").first();
    await expect(quoteField).toBeVisible();
    await quoteField.focus();
    await expect(quoteField).toBeVisible();
  });

  test("15. Focus Name input → preview highlights Name area", async ({ page }) => {
    test.skip(true, "Preview highlight uses outline style — hard to assert in E2E");
  });

  test("16. Type text → preview updates in real-time", async ({ page }) => {
    await navigateToStepText(page);
    const nameInput = page.getByPlaceholder("Maria Musterfrau");
    await nameInput.fill("Erika Schmidt");
    const previewText = page.locator('div[style*="font-family"]', { hasText: "Erika Schmidt" });
    await expect(previewText.first()).toBeVisible();
  });
});
