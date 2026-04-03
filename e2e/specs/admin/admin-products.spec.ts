import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../../helpers/login";

test.describe("Admin — Products", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin products page shows Grabkreuzfoto", async ({ page }) => {
    await page.goto("/de/admin/products");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible({ timeout: 10000 });
  });

  test("products link in admin sidebar", async ({ page }) => {
    await page.goto("/de/admin");
    await page.waitForLoadState("networkidle");
    // Check sidebar link specifically (not the nav link)
    await expect(page.getByRole("complementary").getByRole("link", { name: "Produkte" })).toBeVisible({ timeout: 10000 });
  });
});
