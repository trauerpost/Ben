import { test, expect } from "@playwright/test";
import path from "path";

test.use({ navigationTimeout: 60000 });

const TEST_PHOTO = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "ornaments",
  "cross-with-roses.png"
);

async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →", exact: true }).click();
}

/** Navigate from step 1 to step 3 (background) via Erinnerungsbild + TI05 */
async function goToStep3(page: import("@playwright/test").Page) {
  // Step 1: Card type
  await page.getByText("Erinnerungsbild").click();
  await clickNext(page);

  // Step 2: Template — select TI05 (Foto 50/50)
  await page.getByTestId("TI05").click();
  await clickNext(page);

  // Now on step 3
  await expect(page.getByText("Step 3 of 8")).toBeVisible();
}

/** Navigate from step 1 all the way to step 6 (decorations) */
async function goToStep6(page: import("@playwright/test").Page) {
  await goToStep3(page);

  // Step 3: Background — default color White is already selected, just proceed
  await clickNext(page);

  // Step 4: Photo — upload a file so we can proceed
  await expect(page.getByText("Step 4 of 8")).toBeVisible();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(TEST_PHOTO);
  await page.waitForTimeout(1500);
  await clickNext(page);

  // Step 5: Text — fill required name field
  await expect(page.getByText("Step 5 of 8")).toBeVisible();
  await page.getByPlaceholder("Maria Musterfrau").fill("Test Person");
  await clickNext(page);

  // Now on step 6
  await expect(page.getByText("Step 6 of 8")).toBeVisible();
}

test.describe("Step 3: Background Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test("default background is color mode with white selected", async ({
    page,
  }) => {
    await goToStep3(page);

    // "Farbe" button should have active styling (bg-brand-primary text-white)
    const farbeBtn = page.getByRole("button", { name: "Farbe" });
    await expect(farbeBtn).toBeVisible();
    await expect(farbeBtn).toHaveClass(/bg-brand-primary/);

    // White swatch should be selected (has scale-110 in class)
    const whiteSwatch = page.locator('button[title="White"]');
    await expect(whiteSwatch).toBeVisible();
    await expect(whiteSwatch).toHaveClass(/scale-110/);
  });

  test("switch to image mode shows gallery", async ({ page }) => {
    await goToStep3(page);

    // Click "Bild" to switch to image mode
    const bildBtn = page.getByRole("button", { name: "Bild" });
    await bildBtn.click();

    // Bild button should now be active
    await expect(bildBtn).toHaveClass(/bg-brand-primary/);

    // Image gallery should appear — at least 1 image button
    const imageButtons = page.locator("button:has(img)");
    await expect(imageButtons.first()).toBeVisible({ timeout: 10000 });
    const count = await imageButtons.count();
    expect(count).toBeGreaterThan(0);

    // Tag filter "All" button should be visible
    await expect(
      page.getByRole("button", { name: "All", exact: true })
    ).toBeVisible();
  });

  test("select a color swatch", async ({ page }) => {
    await goToStep3(page);

    // Click the Cream swatch
    const creamSwatch = page.locator('button[title="Cream"]');
    await creamSwatch.click();

    // Cream should now have selected styling
    await expect(creamSwatch).toHaveClass(/scale-110/);

    // White should lose selected styling
    const whiteSwatch = page.locator('button[title="White"]');
    await expect(whiteSwatch).not.toHaveClass(/scale-110/);
  });

  test("color mode allows proceeding to next step", async ({ page }) => {
    await goToStep3(page);

    // Select a color (Light Blue)
    await page.locator('button[title="Light Blue"]').click();

    // Next should be enabled and move to step 4
    await clickNext(page);
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
  });
});

test.describe("Step 6: Decorations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test("decoration step shows Symbole and Rahmen tabs", async ({ page }) => {
    await goToStep6(page);

    await expect(
      page.getByRole("button", { name: "Symbole" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Rahmen" })
    ).toBeVisible();
  });

  test("Keine (none) option exists", async ({ page }) => {
    await goToStep6(page);

    // Wait for loading to finish — either assets load or empty state appears
    await expect(
      page.getByText("Dekorationen werden geladen...")
    ).toBeHidden({ timeout: 15000 });

    // If assets loaded, "Keine" button should be visible
    // If empty state, the empty message is shown instead
    const keineBtn = page.getByText("Keine", { exact: true });
    const emptyMsg = page.getByText(
      "Keine Dekorationen in dieser Kategorie verfügbar."
    );

    const keineVisible = await keineBtn.isVisible().catch(() => false);
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    // One of the two must be true
    expect(keineVisible || emptyVisible).toBe(true);
  });

  test("tab switching works", async ({ page }) => {
    await goToStep6(page);

    const symboleTab = page.getByRole("button", { name: "Symbole" });
    const rahmenTab = page.getByRole("button", { name: "Rahmen" });

    // Symbole should be active by default
    await expect(symboleTab).toHaveClass(/bg-brand-primary/);

    // Switch to Rahmen
    await rahmenTab.click();
    await expect(rahmenTab).toHaveClass(/bg-brand-primary/);
    await expect(symboleTab).not.toHaveClass(/bg-brand-primary/);

    // Switch back to Symbole
    await symboleTab.click();
    await expect(symboleTab).toHaveClass(/bg-brand-primary/);
    await expect(rahmenTab).not.toHaveClass(/bg-brand-primary/);
  });

  test("skip decorations proceeds to preview (step 7)", async ({ page }) => {
    await goToStep6(page);

    // Wait for loading to finish
    await expect(
      page.getByText("Dekorationen werden geladen...")
    ).toBeHidden({ timeout: 15000 });

    // Don't select anything — just proceed
    await clickNext(page);
    await expect(page.getByText("Step 7 of 8")).toBeVisible();
  });
});
