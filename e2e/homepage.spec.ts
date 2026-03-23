import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("redirects root to a locale page", async ({ page }) => {
    await page.goto("/");
    // Should redirect to /de or /en based on browser locale
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
    // URL should contain a locale prefix
    expect(page.url()).toMatch(/\/(de|en)/);
  });

  test("displays hero headline in German", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Erinnerungen bewahren");
  });

  test("displays hero headline in English", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Preserving memories");
  });

  test("displays CTA button", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByRole("link", { name: "Jetzt gestalten" }).first()).toBeVisible();
  });

  test("displays 3-step how-it-works section", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByText("So einfach")).toBeVisible();
    await expect(page.getByText("Vorlage wählen")).toBeVisible();
    await expect(page.getByText("Individuell gestalten")).toBeVisible();
  });

  test("displays product categories", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByText("Unsere Produkte")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sterbebilder" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trauerkarten" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dankkarten" })).toBeVisible();
  });

  test("displays background images section", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByText("Wunderschöne Hintergründe")).toBeVisible();
  });

  test("displays green CTA banner", async ({ page }) => {
    await page.goto("/de");
    await expect(page.getByText("Bereit, Ihre Karte zu gestalten?")).toBeVisible();
  });
});
