import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqltlhfqhzcyqgryrkky.supabase.co";
const SERVICE_KEY = process.env.supabase_Secert || "";

// Cleanup helper — delete test user after each test
async function cleanupTestUser(email: string): Promise<void> {
  if (!SERVICE_KEY) return;
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { users } } = await sb.auth.admin.listUsers();
  const user = users?.find((u) => u.email === email);
  if (user) {
    await sb.from("customers").delete().eq("auth_user_id", user.id);
    await sb.auth.admin.deleteUser(user.id);
  }
}

test.describe("Registration Flow", () => {
  test("registration page loads with all form fields", async ({ page }) => {
    await page.goto("/de/register");
    await expect(page.locator("#register-name")).toBeVisible();
    await expect(page.locator("#register-name")).toBeVisible();
    await expect(page.locator("#register-email")).toBeVisible();
    await expect(page.locator("#register-password")).toBeVisible();
    await expect(page.locator("#register-password-confirm")).toBeVisible();
    await expect(page.getByRole("button", { name: /Registrieren/i })).toBeVisible();
  });

  test("register link on login page navigates to /register", async ({ page }) => {
    await page.goto("/de/login");
    await page.getByRole("link", { name: /Jetzt registrieren/i }).click();
    await page.waitForURL(/\/register/);
    await expect(page.locator("#register-name")).toBeVisible();
  });

  test("login link on register page navigates to /login", async ({ page }) => {
    await page.goto("/de/register");
    await page.getByRole("link", { name: /Jetzt anmelden/i }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Willkommen/i })).toBeVisible();
  });

  test("password mismatch shows client-side error", async ({ page }) => {
    await page.goto("/de/register");
    await page.locator("#register-name").fill("Test User");
    await page.locator("#register-email").fill("mismatch@test.de");
    await page.locator("#register-password").fill("password123");
    await page.locator("#register-password-confirm").fill("different456");
    await page.getByRole("button", { name: /Registrieren/i }).click();

    // Should show error without navigating away
    await expect(page.getByText(/stimmen nicht überein/i)).toBeVisible();
    // Still on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test("password too short is blocked by browser validation", async ({ page }) => {
    await page.goto("/de/register");
    await page.locator("#register-name").fill("Test User");
    await page.locator("#register-email").fill("short@test.de");
    await page.locator("#register-password").fill("12345");
    await page.locator("#register-password-confirm").fill("12345");
    await page.getByRole("button", { name: /Registrieren/i }).click();

    // Browser native minLength=6 blocks submit — still on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test("successful registration redirects to dashboard", async ({ page }) => {
    const testEmail = `e2e-reg-${Date.now()}@test-trauerpost.de`;

    try {
      await page.goto("/de/register");
      await page.locator("#register-name").fill("E2E Test User");
      await page.locator("#register-email").fill(testEmail);
      await page.locator("#register-password").fill("Test1234!");
      await page.locator("#register-password-confirm").fill("Test1234!");
      await page.getByRole("button", { name: /Registrieren/i }).click();

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 20000 });
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanupTestUser(testEmail);
    }
  });

  test("duplicate email shows error", async ({ page }) => {
    // test@trauerpost.com already exists (seed data)
    await page.goto("/de/register");
    await page.locator("#register-name").fill("Duplicate Test");
    await page.locator("#register-email").fill("test@trauerpost.com");
    await page.locator("#register-password").fill("Test1234!");
    await page.locator("#register-password-confirm").fill("Test1234!");
    await page.getByRole("button", { name: /Registrieren/i }).click();

    // Should show error
    await page.waitForURL(/\/register\?error/, { timeout: 15000 });
    await expect(page.getByText(/bereits registriert|already/i)).toBeVisible();
  });

  test("after registration can navigate to builder", async ({ page }) => {
    const testEmail = `e2e-builder-${Date.now()}@test-trauerpost.de`;

    try {
      await page.goto("/de/register");
      await page.locator("#register-name").fill("Builder Test");
      await page.locator("#register-email").fill(testEmail);
      await page.locator("#register-password").fill("Test1234!");
      await page.locator("#register-password-confirm").fill("Test1234!");
      await page.getByRole("button", { name: /Registrieren/i }).click();

      await page.waitForURL(/\/dashboard/, { timeout: 20000 });

      // Navigate to builder — should work (authenticated)
      await page.goto("/de/builder");
      await expect(page.getByRole("heading", { name: /Kartentyp/i })).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanupTestUser(testEmail);
    }
  });

  test("negative: empty name shows server error", async ({ page }) => {
    await page.goto("/de/register");
    // Remove required attribute to test server validation
    await page.locator("#register-name").evaluate((el) => el.removeAttribute("required"));
    await page.locator("#register-name").fill("");
    await page.locator("#register-email").fill("empty-name@test.de");
    await page.locator("#register-password").fill("Test1234!");
    await page.locator("#register-password-confirm").fill("Test1234!");
    await page.getByRole("button", { name: /Registrieren/i }).click();

    // Server should redirect with error
    await page.waitForURL(/\/register\?error=nameRequired/, { timeout: 15000 });
    await expect(page.getByText(/Name ist erforderlich/i)).toBeVisible();
  });
});
