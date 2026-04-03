import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E tests for v2 template engine (TI04-TI09) wizard flow.
 *
 * Wizard steps (7 total):
 *   1=Kartentyp, 2=Vorlage, 3=Foto, 4=Text, 5=Dekoration, 6=Vorschau, 7=Bestellen
 *   Photo step (3) is skipped for text-only templates like TI04.
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

    // Step 2: template selection page
    await expect(page.getByText("Vorlage wählen")).toBeVisible();
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

    // Should skip step 3 (photo) → step 4 (text)
    await expect(page.getByText("Text eingeben")).toBeVisible();
  });

  test("TI05 full flow: type → template → photo → text → preview", async ({ page }) => {
    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Step 2: TI05
    await page.getByText("Foto 50/50").click();
    await clickNext(page);

    // Step 3: photo
    await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible();

    // Upload photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);

    // Crop editor (canvas) should appear
    await expect(page.locator("canvas")).toBeVisible();

    // Zoom slider
    await expect(page.locator('input[type="range"]').first()).toBeVisible();

    // Step 4: text
    await clickNext(page);
    await expect(page.getByText("Text eingeben")).toBeVisible();

    // TI05 fields visible (German labels)
    await expect(page.locator("label", { hasText: "Überschrift" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Name/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Geburtsdatum" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Sterbedatum" })).toBeVisible();
    await expect(page.locator("label", { hasText: /Spruch/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Autor" })).toBeVisible();

    // Fill name (required)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Brigitte");

    // Step 5: decorations
    await clickNext(page);
    await expect(page.getByRole("heading", { name: "Dekoration" })).toBeVisible();

    // Step 6: preview
    await clickNext(page);

    // v2 spread preview text
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("TI07 shows location fields in StepText", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.getByText("Drei-Zonen").click();
    await clickNext(page);

    // Step 3: photo (skip)
    await clickNext(page);

    // Step 4: text — TI07 fields (German labels)
    await expect(page.getByText("Geburtsort")).toBeVisible();
    await expect(page.getByText("Sterbeort")).toBeVisible();
    await expect(page.locator("label", { hasText: "Trennzeichen" })).toBeVisible();
  });

  test("TI06 full flow: L-Form → photo → text → preview", async ({ page }) => {
    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Step 2: TI06
    await page.getByTestId("TI06").click();
    await clickNext(page);

    // Step 3: photo upload
    await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toBeVisible();

    // Step 4: text
    await clickNext(page);
    await expect(page.getByText("Text eingeben")).toBeVisible();

    // TI06 required fields: name, birthDate, deathDate, quote (German labels)
    await expect(page.locator("label", { hasText: /^Name/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Geburtsdatum" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Sterbedatum" })).toBeVisible();
    await expect(page.locator("label", { hasText: /Spruch/ })).toBeVisible();

    // Fill name (required)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Thilde");

    // Step 5: decorations
    await clickNext(page);
    await expect(page.getByRole("heading", { name: "Dekoration" })).toBeVisible();

    // Step 6: preview
    await clickNext(page);
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("TI09 full flow: Floral Symmetrisch → photo → text → preview", async ({ page }) => {
    // Step 1
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Step 2: TI09
    await page.getByTestId("TI09").click();
    await clickNext(page);

    // Step 3: photo upload
    await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toBeVisible();

    // Step 4: text
    await clickNext(page);
    await expect(page.getByText("Text eingeben")).toBeVisible();

    // TI09 required fields: heading, name, birthDate, deathDate, closingVerse, quote (German)
    await expect(page.locator("label", { hasText: "Überschrift" })).toBeVisible();
    await expect(page.locator("label", { hasText: /^Name/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Geburtsdatum" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Sterbedatum" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Schlussvers" })).toBeVisible();
    await expect(page.locator("label", { hasText: /Spruch/ })).toBeVisible();

    // Fill name (required)
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Renate");

    // Step 5: decorations
    await clickNext(page);
    await expect(page.getByRole("heading", { name: "Dekoration" })).toBeVisible();

    // Step 6: preview
    await clickNext(page);
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("TI08 photo crop shows canvas", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.getByText("Oval-Spiegel").click();
    await clickNext(page);

    // Step 3: photo
    await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);

    await expect(page.locator("canvas")).toBeVisible();
  });
});
