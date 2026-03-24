import { test, expect } from "@playwright/test";

test.describe("Login Page — German", () => {
  test("displays login form correctly", async ({ page }) => {
    await page.goto("/de/login");
    // Brand name as h1
    await expect(page.locator("h1")).toContainText("Trauerpost");
    // Welcome title — in the right panel form area
    await expect(page.getByText("Willkommen zurück")).toBeVisible();
    // Form inputs
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    // Submit button with German text
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
    // Forgot password link
    await expect(page.getByText("Passwort vergessen?")).toBeVisible();
    // Register link
    await expect(page.getByText("Noch kein Konto?")).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("fake@test.com");
    await page.locator("#login-password").fill("wrongpassword");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Wait for error message
    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });
    // Error should contain Supabase auth error
    await expect(error).not.toBeEmpty();
  });

  test("shows loading state during submit", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("fake@test.com");
    await page.locator("#login-password").fill("wrongpassword");

    // Click and immediately check for loading text
    await page.getByRole("button", { name: "Anmelden" }).click();
    // Button should show loading text
    await expect(page.getByRole("button", { name: "Wird angemeldet..." })).toBeVisible();
    // Button should be disabled during loading
    await expect(page.getByRole("button", { name: "Wird angemeldet..." })).toBeDisabled();
  });

  test("requires email and password (HTML validation)", async ({ page }) => {
    await page.goto("/de/login");
    // Both inputs have required attribute
    await expect(page.locator("#login-email")).toHaveAttribute("required", "");
    await expect(page.locator("#login-password")).toHaveAttribute("required", "");
    // Email input has type=email for browser validation
    await expect(page.locator("#login-email")).toHaveAttribute("type", "email");
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });
});

test.describe("Login Page — English", () => {
  test("displays English login form", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Forgot password?")).toBeVisible();
  });

  test("successful English login", async ({ page }) => {
    await page.goto("/en/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });
});

test.describe("Dashboard (authenticated)", () => {
  test("shows dashboard with user data after login", async ({ page }) => {
    // Login first
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Should see dashboard content
    await expect(page.getByText("Dashboard")).toBeVisible();
  });
});

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/de/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("Admin (authenticated)", () => {
  test("admin user can access admin panel", async ({ page }) => {
    // Login as admin
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Navigate to admin
    await page.goto("/de/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/de/admin");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});
