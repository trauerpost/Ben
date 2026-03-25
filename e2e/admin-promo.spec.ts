import { test, expect } from "@playwright/test";

test.describe("Admin — Promo Codes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test("admin sees promo codes page", async ({ page }) => {
    await page.goto("/de/admin/promo-codes");
    await expect(page.getByText("Gutscheincodes")).toBeVisible();
  });

  test("admin can open create code modal", async ({ page }) => {
    await page.goto("/de/admin/promo-codes");
    await page.getByText("Code erstellen").click();
    await expect(page.locator("input[type=text]")).toBeVisible();
  });

  test("duplicate code shows error (negative test)", async ({ page }) => {
    await page.goto("/de/admin/promo-codes");
    // Create first code
    await page.getByText("Code erstellen").click();
    await page.locator("input[type=text]").fill("TESTDUP");
    await page.locator("input[type=number]").first().fill("10");
    await page.getByRole("button", { name: "Erstellen" }).click();
    // Wait for modal to close and reopen
    await page.waitForTimeout(1000);
    // Try same code again
    await page.getByText("Code erstellen").click();
    await page.locator("input[type=text]").fill("TESTDUP");
    await page.locator("input[type=number]").first().fill("10");
    await page.getByRole("button", { name: "Erstellen" }).click();
    // Should show error about duplicate
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });
});
