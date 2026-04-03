import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../../helpers/login";

test.describe("Admin Nav Link", () => {
  test("admin user sees Admin + Dashboard links in header", async ({ page }) => {
    await loginAsAdmin(page);
    // Reload to ensure server-rendered header picks up auth cookies
    await page.reload({ waitUntil: "networkidle" });

    const adminLink = page.getByRole("link", { name: "Admin" });
    await expect(adminLink).toBeVisible({ timeout: 10000 });

    const dashboardLink = page.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toBeVisible();

    await adminLink.click();
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    expect(page.url()).toContain("/admin");
  });

  test("unauthenticated user sees Anmelden only", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("link", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).not.toBeVisible();
  });
});
