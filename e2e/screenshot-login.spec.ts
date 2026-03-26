import { test } from "@playwright/test";

test("screenshot desktop login page", async ({ page }) => {
  await page.goto("https://trauerpost.vercel.app/de/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/login-desktop.png", fullPage: true });
});

test("screenshot mobile login page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("https://trauerpost.vercel.app/de/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/login-mobile.png", fullPage: true });
});
