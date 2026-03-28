import { test, expect } from "@playwright/test";

/**
 * E2E tests for wizard navigation UX fixes (Batch 2):
 * - Bottom nav padding
 * - Mobile step indicator shows active step name
 * - Compact step counter on mobile ("4/7") vs desktop ("Step 4 of 7")
 */

test.use({ navigationTimeout: 60000 });

async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →" }).click();
}

test.describe("Wizard Navigation UX", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("1. Step content has bottom padding so nav doesn't cover fields", async ({ page }) => {
    // The step content div should have pb-20
    const stepContent = page.locator(".overflow-y-auto.pb-20");
    await expect(stepContent).toBeVisible();
  });

  test("2. Desktop: step counter shows 'Step X of 7' format", async ({ page }) => {
    const counter = page.locator("span.text-brand-gray", { hasText: /Step.*of/ });
    await expect(counter).toBeVisible();
    await expect(counter).toContainText("Step");
    await expect(counter).toContainText("of");
  });

  test("3. Step indicator shows current step name", async ({ page }) => {
    // On step 1, "Kartentyp" should be visible as the active step label
    await expect(page.locator("span.text-brand-primary", { hasText: "Kartentyp" })).toBeVisible();
  });
});

test.describe("Wizard Navigation UX — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("4. Mobile: step indicator shows current step name", async ({ page }) => {
    // Active step name should be visible even on mobile
    await expect(page.locator("span.text-brand-primary", { hasText: "Kartentyp" })).toBeVisible();
  });

  test("5. Mobile: step counter shows compact format with slash", async ({ page }) => {
    // On mobile, "Step" and "of" are hidden via md:inline, slash shown via md:hidden
    // The visible text should contain a slash separator
    const nav = page.locator(".sticky.bottom-0");
    const counter = nav.locator("span.text-sm.text-brand-gray").first();
    await expect(counter).toBeVisible();
    // The slash element should be visible on mobile
    const slash = counter.locator("span.md\\:hidden");
    await expect(slash).toBeVisible();
    await expect(slash).toHaveText("/");
  });
});
