import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/de/login");
  await page.locator("#login-email").fill("jess@trauerpost.com");
  await page.locator("#login-password").fill("SoundGarden!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  // Ensure the page is fully loaded with auth state
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
}

export async function loginAsUser(page: Page): Promise<void> {
  await page.goto("/de/login");
  await page.locator("#login-email").fill("test@trauerpost.com");
  await page.locator("#login-password").fill("Test1234!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
}
