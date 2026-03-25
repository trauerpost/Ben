import { test, expect } from "@playwright/test";

test.describe("Admin — Shipments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("jess@trauerpost.com");
    await page.locator("#login-password").fill("SoundGarden!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
  });

  test("admin sees open shipments list", async ({ page }) => {
    await page.goto("/de/admin/shipments");
    await expect(page.getByText("Offene Sendungen")).toBeVisible();
  });

  test("overdue orders show red highlight", async ({ page }) => {
    await page.goto("/de/admin/shipments");
    // If there are orders older than 3 days, they should have red background
    const overdueRow = page.locator("tr.bg-red-50").first();
    const noShipments = page.getByText("Keine offenen Sendungen");
    // Either we have overdue rows or no shipments at all
    await expect(overdueRow.or(noShipments)).toBeVisible({ timeout: 5000 });
  });
});
