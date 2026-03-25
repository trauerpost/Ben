import { test, expect } from "@playwright/test";

test.describe("Admin — Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
  });

  test("admin sees invoices page", async ({ page }) => {
    await page.goto("/de/admin/invoices");
    await expect(page.getByText("Rechnungen")).toBeVisible();
  });

  test("invoices page shows table or empty state", async ({ page }) => {
    await page.goto("/de/admin/invoices");
    const table = page.locator("table");
    const emptyMsg = page.getByText("Keine Rechnungen");
    await expect(table.or(emptyMsg)).toBeVisible();
  });
});
