import { test, expect } from "@playwright/test";

test.describe("Card Builder Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000);
  });

  test("loads wizard at step 1", async ({ page }) => {
    await expect(page.getByText("Step 1 of 7")).toBeVisible();
  });

  test("step indicator shows 7 steps", async ({ page }) => {
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator(`text="${i}"`).first()).toBeVisible();
    }
  });

  test("next button disabled until card type selected", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: /Next/i });
    await expect(nextBtn).toBeDisabled();
  });
});
