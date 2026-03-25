import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Admin — Promo Codes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin sees promo codes page", async ({ page }) => {
    await page.goto("/de/admin/promo-codes");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Gutscheincodes" })).toBeVisible({ timeout: 10000 });
  });

  test("admin can open create code modal", async ({ page }) => {
    await page.goto("/de/admin/promo-codes");
    await page.waitForLoadState("networkidle");
    await page.getByText("Code erstellen").click();
    await expect(page.locator("input[type=text]")).toBeVisible();
  });

  test("duplicate code shows error (negative test)", async ({ page }) => {
    const uniqueCode = `DUP${Date.now().toString(36).toUpperCase()}`;
    await page.goto("/de/admin/promo-codes");
    await page.waitForLoadState("networkidle");
    // Create first code
    await page.getByText("Code erstellen").click();
    await page.locator("input[type=text]").fill(uniqueCode);
    await page.locator("input[type=number]").first().fill("10");
    await page.getByRole("button", { name: "Erstellen" }).click();
    // Wait for modal to close (the fixed overlay disappears)
    await expect(page.locator(".fixed.inset-0")).not.toBeVisible({ timeout: 10000 });
    // Try same code again
    await page.getByText("Code erstellen").click();
    await page.locator("input[type=text]").fill(uniqueCode);
    await page.locator("input[type=number]").first().fill("10");
    await page.getByRole("button", { name: "Erstellen" }).click();
    // Should show error about duplicate
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });
});
