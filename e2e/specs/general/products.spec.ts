import { test, expect } from "@playwright/test";

test.describe("Products Catalog", () => {
  test("products page shows Grabkreuzfoto", async ({ page }) => {
    await page.goto("/de/products");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible();
  });

  test("product detail shows size + material options", async ({ page }) => {
    await page.goto("/de/products/grabkreuzfoto");
    await expect(page.getByText("Grabkreuzfoto")).toBeVisible();
    await expect(page.getByText("8x10 cm")).toBeVisible();
    await expect(page.getByText("Kunststoff")).toBeVisible();
  });

  test("photo upload field visible for cross_photo product", async ({ page }) => {
    await page.goto("/de/products/grabkreuzfoto");
    await expect(page.locator("input[type=file]")).toBeVisible();
  });

  test("unauthenticated user clicking order → redirect to login with return URL", async ({ page }) => {
    await page.goto("/de/products/grabkreuzfoto");
    await page.getByText("Anmelden zum Bestellen").click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("redirect");
    expect(page.url()).toContain("products");
  });

  test("products link visible in main nav", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("link", { name: "Produkte" })).toBeVisible();
  });
});
