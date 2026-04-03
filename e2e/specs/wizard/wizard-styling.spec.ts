import { test, expect } from "@playwright/test";

/**
 * E2E tests for font family, font color, text alignment, and font size
 * controls in the wizard StepText (step 5).
 */

test.use({ navigationTimeout: 60000 });

async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →", exact: true }).click();
}

/** Navigate from step 1 to step 5 (StepText) using TI05 template */
async function navigateToStepText(page: import("@playwright/test").Page) {
  // Step 1: select card type
  await page.getByText("Erinnerungsbild").click();
  await clickNext(page);

  // Step 2: select TI05 template
  await page.getByTestId("TI05").click();
  await clickNext(page);

  // Step 3: background — just skip
  await page.waitForTimeout(500);
  await clickNext(page);

  // Step 4: photo — skip
  await clickNext(page);

  // Now on step 5
  await expect(page.getByText("Step 5 of 8")).toBeVisible();
}

test.describe("Wizard Styling Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("font family change updates preview", async ({ page }) => {
    await navigateToStepText(page);

    // Find the font selector section by its label
    await expect(page.locator("label", { hasText: "Schriftart" })).toBeVisible();

    // Click "Great Vibes" font button
    const greatVibesBtn = page.locator("button", { hasText: "Great Vibes" });
    await greatVibesBtn.click();

    // Verify the font button has active styling (bg-brand-primary → white text)
    await expect(greatVibesBtn).toHaveClass(/bg-brand-primary/);

    // Fill required name field so Next is enabled
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Name");

    // Navigate to step 7 (preview): step 5 → step 6 → step 7
    await clickNext(page); // step 6: decorations
    await clickNext(page); // step 7: preview

    await expect(page.getByText("Step 7 of 8")).toBeVisible();

    // Verify a Google Fonts link tag with the selected font is present
    const fontLink = page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
    await expect(fontLink).toHaveAttribute("href", /Great(%20|\+)Vibes/);
  });

  test("font color change applies", async ({ page }) => {
    await navigateToStepText(page);

    // Find color section
    await expect(page.locator("label", { hasText: "Farbe" })).toBeVisible();

    // Click the "Gold" color swatch
    const goldSwatch = page.locator('button[title="Gold"]');
    await goldSwatch.click();

    // Verify gold swatch has selected state (scale-110)
    await expect(goldSwatch).toHaveClass(/scale-110/);

    // Fill in name so text appears in preview
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Name");

    // Navigate to step 7 (preview)
    await clickNext(page); // step 6
    await clickNext(page); // step 7

    await expect(page.getByText("Step 7 of 8")).toBeVisible();

    // Check that some text element in the preview has the gold color (#8B7D3C)
    const goldText = page.locator('div[style*="color"]', { hasText: "Test Name" });
    await expect(goldText.first()).toHaveCSS("color", "rgb(139, 125, 60)");
  });

  test("text alignment changes", async ({ page }) => {
    await navigateToStepText(page);

    // Find alignment section
    await expect(page.locator("label", { hasText: "Ausrichtung" })).toBeVisible();

    // The alignment buttons are in a flex container after the "Ausrichtung" label
    // Use the label's parent to scope within the alignment section
    const alignLabel = page.locator("label", { hasText: "Ausrichtung" });
    const alignSection = alignLabel.locator(".."); // parent div
    const alignButtons = alignSection.locator("button");
    // Buttons render: ← (left=0), ↔ (center=1), → (right=2)
    const leftBtn = alignButtons.nth(0);
    const centerBtn = alignButtons.nth(1);
    const rightBtn = alignButtons.nth(2);

    // Click right align
    await rightBtn.click();
    await expect(rightBtn).toHaveClass(/bg-brand-primary/);

    // Click left align
    await leftBtn.click();
    await expect(leftBtn).toHaveClass(/bg-brand-primary/);
    // Right should no longer be active
    await expect(rightBtn).not.toHaveClass(/bg-brand-primary/);

    // Click center
    await centerBtn.click();
    await expect(centerBtn).toHaveClass(/bg-brand-primary/);
    await expect(leftBtn).not.toHaveClass(/bg-brand-primary/);
  });

  test("font size slider changes displayed value", async ({ page }) => {
    await navigateToStepText(page);

    // Find the name field's font size slider (name has sizeField: "nameFontSize", range [10, 40])
    const nameLabel = page.locator("label", { hasText: /^Name/ });
    await expect(nameLabel).toBeVisible();

    // The size display and slider are in a sibling div after the input
    // Structure: parent div > label + input + div(size container with "Xpt" + range)
    const nameFieldContainer = nameLabel.locator("..");
    const sizeDisplay = nameFieldContainer.locator("span", { hasText: /\d+pt/ });
    const slider = nameFieldContainer.locator('input[type="range"]');

    // Read initial value
    const initialText = await sizeDisplay.textContent();
    expect(initialText).toMatch(/\d+pt/);
    const initialVal = parseInt(initialText!);

    // Change slider to a different value (set to max of range)
    await slider.fill("30");

    // Verify displayed value updated
    await expect(sizeDisplay).toHaveText("30pt");
    expect(30).not.toBe(initialVal);
  });

  test("font family persists to preview with correct computed style", async ({ page }) => {
    await navigateToStepText(page);

    // Select "Cormorant Garamond" font
    const cormorantBtn = page.locator("button", { hasText: "Cormorant Garamond" });
    await cormorantBtn.click();
    await expect(cormorantBtn).toHaveClass(/bg-brand-primary/);

    // Fill name so it appears in preview
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Name");

    // Navigate to step 7 (preview)
    await clickNext(page); // step 6
    await clickNext(page); // step 7

    await expect(page.getByText("Step 7 of 8")).toBeVisible();

    // Wait for Google Fonts to load
    const fontLink = page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
    await expect(fontLink).toHaveAttribute("href", /Cormorant(%20|\+)Garamond/);

    // Find the name text in SpreadPreview and check computed fontFamily
    const nameInPreview = page.locator('div[style*="font-family"]', { hasText: "Test Name" });
    await expect(nameInPreview.first()).toBeVisible();

    const fontFamily = await nameInPreview.first().evaluate(
      (el) => window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain("Cormorant Garamond");
  });
});
