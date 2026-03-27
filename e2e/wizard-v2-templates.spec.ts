import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E tests for v2 template engine (TI04-TI09) wizard flow.
 */

test.use({ navigationTimeout: 60000 });

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");

/** Click the wizard "Next →" button (not the Next.js dev tools button) */
async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →", exact: true }).click();
}

test.describe("V2 Template Wizard Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test("Step 1: select Erinnerungsbild card type", async ({ page }) => {
    await expect(page.getByText("Kartentyp wählen")).toBeVisible();
    await page.getByText("Erinnerungsbild").click();

    const nextBtn = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await expect(page.getByText("Step 2 of 8")).toBeVisible();
  });

  test("Step 2: v2 templates (TI04-TI09) are shown for sterbebild", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await expect(page.locator("h3", { hasText: "Nur Text" })).toBeVisible();
    await expect(page.getByText("Foto 50/50")).toBeVisible();
    await expect(page.getByText("L-Form")).toBeVisible();
    await expect(page.getByText("Drei-Zonen")).toBeVisible();
    await expect(page.getByText("Oval-Spiegel")).toBeVisible();
    await expect(page.getByText("Floral Symmetrisch")).toBeVisible();

    // Template thumbnail images should load
    const thumbnails = page.locator('img[src*="/test-pdfs/TI"]');
    await expect(thumbnails).toHaveCount(6);
  });

  test("Step 2: selecting TI05 enables next", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.getByText("Foto 50/50").click();

    const nextBtn = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtn).toBeEnabled();
  });

  test("TI04 (no photo) skips photo step", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.locator("h3", { hasText: "Nur Text" }).click();
    await clickNext(page);

    // Step 3: background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Should skip step 4 (photo) → step 5 (text)
    await expect(page.getByText("Step 5 of 8")).toBeVisible();
  });

  test("TI05 full flow: type → template → bg → photo → text → preview", async ({ page }) => {
    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Step 2: TI05
    await page.getByText("Foto 50/50").click();
    await clickNext(page);

    // Step 3: background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Step 4: photo
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible();

    // Upload photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);

    // Crop editor (canvas) should appear
    await expect(page.locator("canvas")).toBeVisible();

    // Zoom slider
    await expect(page.locator('input[type="range"]')).toBeVisible();

    // Step 5: text
    await clickNext(page);
    await expect(page.getByText("Step 5 of 8")).toBeVisible();

    // TI05 fields visible (use label locators to avoid multiple matches)
    await expect(page.locator("label", { hasText: "Heading" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Name/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Birth Date" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Death Date" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Quote$/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Quote Author" })).toBeVisible();

    // Fill name (required)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Brigitte");

    // Step 6: decorations
    await clickNext(page);
    await expect(page.getByText("Step 6 of 8")).toBeVisible();

    // Step 7: preview
    await clickNext(page);
    await expect(page.getByText("Step 7 of 8")).toBeVisible();

    // v2 spread preview text
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("TI07 shows location fields in StepText", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.getByText("Drei-Zonen").click();
    await clickNext(page);

    // Background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Photo (skip)
    await clickNext(page);

    // TI07 fields
    await expect(page.getByText("Birth Place")).toBeVisible();
    await expect(page.getByText("Death Place")).toBeVisible();
    await expect(page.getByText("Divider")).toBeVisible();
  });

  test("TI06 full flow: L-Form → photo → text → preview", async ({ page }) => {
    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Step 2: TI06
    await page.getByTestId("TI06").click();
    await clickNext(page);

    // Step 3: background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Step 4: photo upload
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toBeVisible();

    // Step 5: text
    await clickNext(page);
    await expect(page.getByText("Step 5 of 8")).toBeVisible();

    // TI06 required fields: name, birthDate, deathDate, quote
    await expect(page.locator("label", { hasText: /^Name/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Birth Date" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Death Date" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Quote$/ })).toBeVisible();

    // Fill name (required)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Thilde");

    // Step 6: decorations
    await clickNext(page);
    await expect(page.getByText("Step 6 of 8")).toBeVisible();

    // Step 7: preview
    await clickNext(page);
    await expect(page.getByText("Step 7 of 8")).toBeVisible();
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("TI09 full flow: Floral Symmetrisch → photo → text → preview", async ({ page }) => {
    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Step 2: TI09
    await page.getByTestId("TI09").click();
    await clickNext(page);

    // Step 3: background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Step 4: photo upload
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toBeVisible();

    // Step 5: text
    await clickNext(page);
    await expect(page.getByText("Step 5 of 8")).toBeVisible();

    // TI09 required fields: heading, name, birthDate, deathDate, closingVerse, quote
    await expect(page.locator("label", { hasText: "Heading" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Name/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Birth Date" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Death Date" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Closing Verse" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Quote$/ })).toBeVisible();

    // Fill name (required)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Renate");

    // Step 6: decorations
    await clickNext(page);
    await expect(page.getByText("Step 6 of 8")).toBeVisible();

    // Step 7: preview
    await clickNext(page);
    await expect(page.getByText("Step 7 of 8")).toBeVisible();
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("TI08 photo crop shows canvas", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.getByText("Oval-Spiegel").click();
    await clickNext(page);

    // Background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Photo step
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);

    await expect(page.locator("canvas")).toBeVisible();
  });
});
