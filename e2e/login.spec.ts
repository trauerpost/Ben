import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("displays login form", async ({ page }) => {
    await page.goto("/de/login");
    await expect(page.locator("h1")).toContainText("Anmelden");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/de/login");
    await page.fill('input[type="email"]', "fake@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button:has-text("Sign in")');

    // Should show error message
    await page.waitForTimeout(3000);
    const error = page.locator('[class*="bg-red"]');
    await expect(error).toBeVisible();
  });

  test("English login page", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator("h1")).toContainText("Sign in");
  });
});

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/de/dashboard");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Admin (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/de/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
