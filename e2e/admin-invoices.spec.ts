import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Admin — Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin sees invoices page", async ({ page }) => {
    await page.goto("/de/admin/invoices");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Rechnungen")).toBeVisible({ timeout: 10000 });
  });

  test("invoices page shows table or empty state", async ({ page }) => {
    await page.goto("/de/admin/invoices");
    await page.waitForLoadState("networkidle");
    const table = page.locator("table");
    const emptyMsg = page.getByText("Keine Rechnungen");
    await expect(table.or(emptyMsg)).toBeVisible({ timeout: 10000 });
  });
});
