import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Admin — Shipments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin sees open shipments list", async ({ page }) => {
    await page.goto("/de/admin/shipments");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Offene Sendungen")).toBeVisible({ timeout: 10000 });
  });

  test("overdue orders show red highlight", async ({ page }) => {
    await page.goto("/de/admin/shipments");
    await page.waitForLoadState("networkidle");
    const overdueRow = page.locator("tr.bg-red-50").first();
    const noShipments = page.getByText("Keine offenen Sendungen");
    await expect(overdueRow.or(noShipments)).toBeVisible({ timeout: 10000 });
  });
});
