import { test, expect } from "@playwright/test";

test.describe("Admin — Products", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test("admin products page shows Grabkreuzfoto", async ({ page }) => {
    await page.goto("/de/admin/products");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible();
  });

  test("products link in admin sidebar", async ({ page }) => {
    await page.goto("/de/admin");
    await expect(page.getByRole("link", { name: "Produkte" })).toBeVisible();
  });
});
