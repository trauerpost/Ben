import { test, expect } from "@playwright/test";

test.describe("Navigation & Header", () => {
  test("header shows site name", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header").getByText("Trauerpost")).toBeVisible();
  });

  test("header has navigation links in German", async ({ page }) => {
    await page.goto("/de");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Vorlagen" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Gestalten" })).toBeVisible();
  });

  test("header has login button", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("header").getByRole("link", { name: "Anmelden" })).toBeVisible();
  });

  test("footer is visible with links", async ({ page }) => {
    await page.goto("/de");
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer.getByText("Trauerpost").first()).toBeVisible();
  });

  test("navigate to builder page", async ({ page }) => {
    await page.goto("/de");
    await page.locator("header").getByRole("link", { name: "Gestalten" }).click();
    await expect(page).toHaveURL(/\/de\/builder/);
  });

  test("navigate to login page", async ({ page }) => {
    await page.goto("/de");
    await page.locator("header").getByRole("link", { name: "Anmelden" }).click();
    await expect(page).toHaveURL(/\/de\/login/);
  });
});

test.describe("Language Switching", () => {
  test("switch from German to English", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Erinnerungen bewahren");
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.waitForURL(/\/en/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Preserving memories");
  });

  test("switch from English to German", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "DE", exact: true }).click();
    await page.waitForURL(/\/de/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Erinnerungen bewahren");
  });

  test("English nav shows English labels", async ({ page }) => {
    await page.goto("/en");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Templates" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});
