import { test, expect } from "@playwright/test";

test.describe("Login — Mobile Safari (iPhone 14)", () => {
  test.use({ ...({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }) });

  test("login form is fully visible without scrolling", async ({ page }) => {
    await page.goto("/de/login");

    // Brand panel should be hidden on mobile
    const brandPanel = page.locator("section > div").first();
    // The left panel has hidden lg:flex — should not be visible
    await expect(page.locator(".hidden.lg\\:flex")).not.toBeVisible();

    // Form elements must be visible
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  });

  test("submit button is not cut off by iOS viewport", async ({ page }) => {
    await page.goto("/de/login");
    const submitButton = page.getByRole("button", { name: "Anmelden" });
    await expect(submitButton).toBeVisible();

    // Button should be within viewport (not below the fold)
    const box = await submitButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(844); // iPhone 14 height
  });

  test("successful mobile login redirects to dashboard", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should redirect to dashboard — NOT back to login
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("session persists after page reload on mobile", async ({ page }) => {
    // Login first
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Reload the page
    await page.reload();

    // Should still be on dashboard, not redirected to login
    await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("shows error on invalid credentials (mobile)", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("fake@test.com");
    await page.locator("#login-password").fill("wrongpassword");
    await page.getByRole("button", { name: "Anmelden" }).click();

    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Login — Small Mobile (iPhone SE)", () => {
  test.use({ ...({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }) });

  test("login form fits on small screen", async ({ page }) => {
    await page.goto("/de/login");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();

    // Button within viewport
    const box = await page.getByRole("button", { name: "Anmelden" }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(667);
  });
});

test.describe("Login — Android (Pixel 5)", () => {
  test.use({ ...({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true }) });

  test("login works on Android viewport", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });
});
