import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Admin — Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("customer list has clickable names", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.waitForLoadState("networkidle");
    const link = page.locator("table a").first();
    await expect(link).toBeVisible({ timeout: 10000 });
  });

  test("click customer name → detail page", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.waitForLoadState("networkidle");
    const link = page.locator("table a").first();
    await link.click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await expect(page.getByText("Guthaben")).toBeVisible({ timeout: 10000 });
  });

  test("add credits modal opens", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.waitForLoadState("networkidle");
    await page.locator("table a").first().click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await page.getByText("Guthaben aufladen").click();
    await expect(page.locator("input[type=number]")).toBeVisible();
  });

  test("adding 0 credits fails (negative test)", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.waitForLoadState("networkidle");
    await page.locator("table a").first().click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await page.getByText("Guthaben aufladen").click();
    const numInput = page.locator("input[type=number]");
    await numInput.fill("0");
    await numInput.evaluate((el: HTMLInputElement) => { el.value = "0"; el.removeAttribute("min"); });
    await page.locator("textarea").fill("test");
    await page.getByRole("button", { name: "Guthaben aufladen" }).last().click();
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });
});
