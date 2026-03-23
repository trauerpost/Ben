import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("displays login form", async ({ page }) => {
    await page.goto("/de/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Anmelden");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/de/login");
    await page.fill('input[type="email"]', "fake@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForTimeout(3000);
    const error = page.locator('[class*="bg-red"]');
    await expect(error).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/de/login");
    await page.fill('input[type="email"]', "test@trauerpost.com");
    await page.fill('input[type="password"]', "Test1234!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("English login page", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign in");
  });
});

test.describe("Dashboard (authenticated)", () => {
  test("shows dashboard after login", async ({ page }) => {
    // Login first
    await page.goto("/de/login");
    await page.fill('input[type="email"]', "test@trauerpost.com");
    await page.fill('input[type="password"]', "Test1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Should see dashboard content
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText("Credits remaining")).toBeVisible();
    await expect(page.getByText("100")).toBeVisible(); // 100 credits
  });
});

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Admin (authenticated)", () => {
  test("admin user can access admin panel", async ({ page }) => {
    // Login as admin
    await page.goto("/de/login");
    await page.fill('input[type="email"]', "test@trauerpost.com");
    await page.fill('input[type="password"]', "Test1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to admin
    await page.goto("/de/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
  });
});

test.describe("Admin (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/de/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
