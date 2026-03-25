import { test, expect } from "@playwright/test";

test.describe("Admin — Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
  });

  test("customer list has clickable names", async ({ page }) => {
    await page.goto("/de/admin/customers");
    const link = page.locator("table a").first();
    await expect(link).toBeVisible();
  });

  test("click customer name → detail page", async ({ page }) => {
    await page.goto("/de/admin/customers");
    const link = page.locator("table a").first();
    await link.click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    // Should show credits section
    await expect(page.getByText("Guthaben")).toBeVisible();
  });

  test("add credits modal opens", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.locator("table a").first().click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await page.getByText("Guthaben aufladen").click();
    await expect(page.locator("input[type=number]")).toBeVisible();
  });

  test("adding 0 credits fails (negative test)", async ({ page }) => {
    await page.goto("/de/admin/customers");
    await page.locator("table a").first().click();
    await page.waitForURL(/\/admin\/customers\//, { timeout: 10000 });
    await page.getByText("Guthaben aufladen").click();
    // Bypass HTML min=1 validation by setting value via JS
    const numInput = page.locator("input[type=number]");
    await numInput.fill("0");
    await numInput.evaluate((el: HTMLInputElement) => { el.value = "0"; el.removeAttribute("min"); });
    await page.locator("textarea").fill("test");
    await page.getByRole("button", { name: "Guthaben aufladen" }).last().click();
    // Should show error from server-side validation
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });
});
