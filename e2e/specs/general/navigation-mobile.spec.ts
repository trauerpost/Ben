import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation", () => {
  test.use({ ...({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }) });

  test("shows hamburger menu, not desktop nav", async ({ page }) => {
    await page.goto("/de");

    // Desktop nav should be hidden
    await expect(page.locator("nav.hidden.md\\:flex")).not.toBeVisible();

    // Hamburger button should be visible
    const hamburger = page.getByLabel("Toggle menu");
    await expect(hamburger).toBeVisible();
  });

  test("hamburger → tap Login → navigates to login page", async ({ page }) => {
    await page.goto("/de");

    // Open mobile menu
    await page.getByLabel("Toggle menu").click();

    // Mobile menu should be visible
    const mobileMenu = page.locator(".md\\:hidden.bg-white");
    await expect(mobileMenu).toBeVisible();

    // Tap login link in mobile menu
    await mobileMenu.getByText("Anmelden").click();

    // Should navigate to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("mobile menu closes after navigation", async ({ page }) => {
    await page.goto("/de");
    await page.getByLabel("Toggle menu").click();

    // Menu is open
    await expect(page.locator(".md\\:hidden.bg-white")).toBeVisible();

    // Navigate
    await page.locator(".md\\:hidden.bg-white").getByText("Anmelden").click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Hamburger menu should be closed on new page
    await expect(page.locator(".md\\:hidden.bg-white")).not.toBeVisible();
  });
});
