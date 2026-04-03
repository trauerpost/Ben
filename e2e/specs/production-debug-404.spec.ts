/**
 * Debug script: Capture ALL console errors and network 404s for each template.
 *
 * Run:
 *   npx playwright test e2e/debug-404.ts --config=playwright.production.config.ts --project=chromium
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "https://trauerpost.vercel.app";
const TEMPLATES = ["TI05", "TI06", "TI07", "TI08", "TI09"];

for (const tid of TEMPLATES) {
  test(`${tid} — capture all console errors and network 404s`, async ({ page }) => {
    test.setTimeout(90000);

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const network404s: string[] = [];
    const networkFailed: string[] = [];
    const allConsole: string[] = [];

    // Capture ALL console messages
    page.on("console", (msg) => {
      const text = msg.text();
      const type = msg.type();
      allConsole.push(`[${type}] ${text}`);
      if (type === "error") {
        consoleErrors.push(text);
      } else if (type === "warning") {
        consoleWarnings.push(text);
      }
    });

    // Capture JS page errors (uncaught exceptions)
    page.on("pageerror", (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    // Capture ALL network responses, flag 404s and other failures
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      if (status === 404) {
        network404s.push(`404: ${url}`);
      } else if (status >= 400) {
        networkFailed.push(`${status}: ${url}`);
      }
    });

    // Capture failed requests (network errors, aborted, etc.)
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      networkFailed.push(`FAILED (${failure?.errorText ?? "unknown"}): ${request.url()}`);
    });

    // Navigate to builder
    await page.goto(`${BASE_URL}/de/builder-v2?_t=${Date.now()}`);
    await page.waitForLoadState("networkidle");

    // Select Sterbebild card type
    const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
    await expect(sterbebildBtn).toBeVisible({ timeout: 15000 });
    await sterbebildBtn.click();

    // Select template
    const templateBtn = page.locator(`[data-testid="template-${tid}"]`);
    await expect(templateBtn).toBeVisible({ timeout: 10000 });
    await templateBtn.click();

    // Wait for canvas to load fully
    await expect(
      page.locator('button:text-is("Elemente"), button:text-is("Elements")')
    ).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(8000); // Extra time for all images to load

    // --- Report ---
    console.log(`\n${"=".repeat(60)}`);
    console.log(`TEMPLATE: ${tid}`);
    console.log(`${"=".repeat(60)}`);

    if (network404s.length) {
      console.log(`\n--- NETWORK 404s (${network404s.length}) ---`);
      for (const e of network404s) console.log(`  ${e}`);
    } else {
      console.log(`\n--- NETWORK 404s: NONE ---`);
    }

    if (networkFailed.length) {
      console.log(`\n--- OTHER NETWORK FAILURES (${networkFailed.length}) ---`);
      for (const e of networkFailed) console.log(`  ${e}`);
    }

    if (consoleErrors.length) {
      console.log(`\n--- CONSOLE ERRORS (${consoleErrors.length}) ---`);
      for (const e of consoleErrors) console.log(`  ${e}`);
    } else {
      console.log(`\n--- CONSOLE ERRORS: NONE ---`);
    }

    if (consoleWarnings.length) {
      console.log(`\n--- CONSOLE WARNINGS (${consoleWarnings.length}) ---`);
      for (const e of consoleWarnings) console.log(`  ${e}`);
    }

    console.log(`\n--- ALL CONSOLE (${allConsole.length} messages) ---`);
    for (const e of allConsole) console.log(`  ${e}`);

    // Fail the test if there are 404s or errors (excluding known noise)
    const real404s = network404s.filter(
      (u) => !u.includes("favicon") && !u.includes("_next/static") === false
    );
    // Just report everything, don't fail -- this is a debug script
    console.log(`\nSUMMARY: ${network404s.length} 404s, ${consoleErrors.length} errors, ${consoleWarnings.length} warnings`);
  });
}
