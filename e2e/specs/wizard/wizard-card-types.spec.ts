import { test, expect } from "@playwright/test";

test.describe("Card Type Selection (Step 1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test("shows 3 card types", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Kartentyp wählen/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Erinnerungsbild/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Trauerkarte/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Dankeskarte/i })).toBeVisible();
  });

  test("next button disabled until card type selected", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: "Next →" });
    await expect(nextBtn).toBeDisabled();
  });

  test("selecting Erinnerungsbild enables next — no format toggle", async ({ page }) => {
    await page.getByText("Erinnerungsbild").click();
    const nextBtn = page.getByRole("button", { name: "Next →" });
    await expect(nextBtn).toBeEnabled();
    // No format toggle for sterbebild (only single)
    await expect(page.getByText("Einfach (single)")).not.toBeVisible();
  });

  test("selecting Trauerkarte shows format toggle", async ({ page }) => {
    await page.getByText(/^Trauerkarte/).first().click();
    await expect(page.getByText("Einfach (single)")).toBeVisible();
    await expect(page.getByText("Gefaltet (folded)")).toBeVisible();
  });

  test("selecting Dankeskarte shows format toggle", async ({ page }) => {
    await page.getByText(/^Dankeskarte/).first().click();
    await expect(page.getByText("Einfach (single)")).toBeVisible();
    await expect(page.getByText("Gefaltet (folded)")).toBeVisible();
  });

  test("Erinnerungsbild wizard flow reaches preview", async ({ page }) => {
    // Step 1: Card Type
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text
    await page.locator("textarea").fill("In liebevoller Erinnerung");
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 5: Decorations — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 6: Preview — should show 2 panels (front + back)
    await expect(page.getByRole("heading", { name: "Preview Your Card" })).toBeVisible();
    await expect(page.getByText("Front")).toBeVisible();
    await expect(page.getByText("Back", { exact: true })).toBeVisible();
    // No 3D mode for single cards
    await expect(page.getByRole("button", { name: /3D/i })).not.toBeVisible();
  });

  test("Trauerkarte folded wizard flow reaches preview with 4 panels", async ({ page }) => {
    // Step 1: Card Type — select Trauerkarte + folded
    await page.getByText(/^Trauerkarte/).first().click();
    await page.getByText("Gefaltet (folded)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text
    await page.locator("textarea").fill("In stiller Trauer");
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 5: Decorations — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 6: Preview — should show 4 panels
    await expect(page.getByRole("heading", { name: "Preview Your Card" })).toBeVisible();
    await expect(page.getByText("Front")).toBeVisible();
    await expect(page.getByText("Inside Left")).toBeVisible();
    await expect(page.getByText("Inside Right")).toBeVisible();
    await expect(page.getByText("Back", { exact: true })).toBeVisible();
    // 3D mode available for folded
    await expect(page.getByRole("button", { name: /3D/i })).toBeVisible();
  });

  test("text templates appear for selected card type", async ({ page }) => {
    // Step 1: Select Erinnerungsbild
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Skip photo
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text — should show templates
    await expect(page.getByRole("button", { name: "Klassisch" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Schlicht" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mit Spruch" })).toBeVisible();

    // Click template — fills text
    await page.getByRole("button", { name: "Klassisch" }).click();
    const textarea = page.locator("textarea");
    await expect(textarea).not.toBeEmpty();
  });

  test("PDF download button visible on preview step", async ({ page }) => {
    // Navigate to preview
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →" }).click();
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.locator("textarea").fill("Test");
    await page.getByRole("button", { name: "Next →" }).click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Preview step — PDF button should be visible
    await expect(page.getByRole("button", { name: /PDF herunterladen/i })).toBeVisible();
  });

  test("order step requires login", async ({ page }) => {
    // Navigate to order step
    await page.getByText("Erinnerungsbild").click();
    await page.getByRole("button", { name: "Next →" }).click();
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.locator("textarea").fill("Test");
    await page.getByRole("button", { name: "Next →" }).click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Order step — should show login button (not logged in)
    await expect(page.getByRole("button", { name: /Jetzt anmelden/i })).toBeVisible({ timeout: 10000 });
  });
});
