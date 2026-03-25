import { test, expect } from "@playwright/test";

test.describe("Admin Nav Link", () => {
  test("admin user sees Admin + Dashboard links in header", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // After login redirect, reload to ensure server-rendered header picks up auth cookies
    await page.reload({ waitUntil: "networkidle" });

    const adminLink = page.getByRole("link", { name: "Admin" });
    await expect(adminLink).toBeVisible();

    const dashboardLink = page.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toBeVisible();

    // Click Admin → goes to admin dashboard
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
