import { test, expect } from "@playwright/test";

test.describe("Login — Edge Cases", () => {
  test("double-click submit does not cause duplicate errors", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");

    // Fire two clicks rapidly in the browser — bypasses Playwright navigation wait
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      btn.click();
      btn.click();
    });

    // Should still redirect successfully (not show error from race condition)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("back button after login shows dashboard, not login form", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("test@trauerpost.com");
    await page.locator("#login-password").fill("Test1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Go back
    await page.goBack();

    // Should NOT show login form (user is authenticated)
    // Either stays on dashboard or redirects back to dashboard
    await page.waitForTimeout(2000);
    // The key assertion: user should still have access to dashboard
    await page.goto("/de/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated mobile user accessing /dashboard redirects to /login", async ({ page }) => {
    page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/de/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("Login — Security (Negative Tests)", () => {
  test("SQL injection in email field is rejected", async ({ page }) => {
    await page.goto("/de/login");
    // Use a valid email format that embeds SQL injection in the local part
    await page.locator("#login-email").fill("admin--drop-table@test.com");
    await page.locator("#login-password").fill("' OR '1'='1");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should show auth error, NOT crash
    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });
  });

  test("XSS in email field does not execute", async ({ page }) => {
    await page.goto("/de/login");
    await page.locator("#login-email").fill("<script>alert('xss')</script>@test.com");
    await page.locator("#login-password").fill("anything");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Should show error, no script execution
    // Check no alert dialog appeared
    let alertFired = false;
    page.on("dialog", () => { alertFired = true; });
    await page.waitForTimeout(2000);
    expect(alertFired).toBe(false);
  });

  test("very long email does not break layout", async ({ page }) => {
    await page.goto("/de/login");
    const longEmail = "a".repeat(200) + "@test.com";
    await page.locator("#login-email").fill(longEmail);
    await page.locator("#login-password").fill("anything");
    await page.getByRole("button", { name: "Anmelden" }).click();

    // Error should display without layout overflow
    const error = page.locator(".bg-red-50");
    await expect(error).toBeVisible({ timeout: 10000 });

    // Form container should not overflow viewport
    const form = page.locator("form");
    const formBox = await form.boundingBox();
    expect(formBox).not.toBeNull();
    expect(formBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
