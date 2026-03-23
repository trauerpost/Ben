import { test, expect } from "@playwright/test";

test.describe("Card Builder Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test("loads wizard with step 1 (size selector)", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Choose Card Size" })).toBeVisible();
    await expect(page.getByText("Postkarte (A6)")).toBeVisible();
  });

  test("step indicator shows 7 steps", async ({ page }) => {
    // Check step numbers 1-7 exist
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator(`text="${i}"`).first()).toBeVisible();
    }
  });

  test("next button is disabled until size is selected", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: "Next →" });
    await expect(nextBtn).toBeDisabled();
  });

  test("selecting postcard enables next button", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    const nextBtn = page.getByRole("button", { name: "Next →" });
    await expect(nextBtn).toBeEnabled();
  });

  test("step 1 → step 2: choose size then background", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    await expect(page.getByRole("heading", { name: "Choose Background" })).toBeVisible();
  });

  test("step 2 shows landscape images", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.waitForTimeout(3000);
    const images = page.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test("step 2 has tag filter buttons", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
  });

  test("full wizard flow: size → background → photo → text", async ({ page }) => {
    // Step 1: Size
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background — select first image
    await page.waitForTimeout(3000);
    const firstImage = page.locator("button:has(img)").first();
    if (await firstImage.isVisible()) {
      await firstImage.click();
      await page.getByRole("button", { name: "Next →" }).click();

      // Step 3: Photo — skip
      await expect(page.getByRole("heading", { name: "Upload Photo" })).toBeVisible();
      await page.getByRole("button", { name: "Next →" }).click();

      // Step 4: Text
      await expect(page.getByRole("heading", { name: "Add Text" })).toBeVisible();
    }
  });

  test("step 4: text input visible after navigation", async ({ page }) => {
    // Navigate through steps
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    await page.waitForTimeout(3000);
    const img = page.locator("button:has(img)").first();
    if (await img.isVisible()) {
      await img.click();
      await page.getByRole("button", { name: "Next →" }).click();
      // Step 3: skip photo
      await page.getByRole("button", { name: "Next →" }).click();
      // Step 4: should see textarea
      await expect(page.locator("textarea")).toBeVisible({ timeout: 10000 });
    }
  });
});
