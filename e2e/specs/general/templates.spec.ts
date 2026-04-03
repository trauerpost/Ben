import { test, expect } from "@playwright/test";

test.describe("Templates Page", () => {
  test("displays templates page title", async ({ page }) => {
    await page.goto("/de/templates", { timeout: 60000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vorlagen");
  });

  test("displays category filter buttons", async ({ page }) => {
    await page.goto("/de/templates", { timeout: 60000 });
    await expect(page.getByRole("button", { name: "Alle" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sterbebilder" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trauerkarten" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dankkarten" })).toBeVisible();
  });

  test("English templates page", async ({ page }) => {
    await page.goto("/en/templates", { timeout: 60000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Templates");
  });
});
