import { test, expect } from "@playwright/test";

/**
 * E2E tests for responsive/polish (Batch 4):
 * - Single-column template grid on mobile
 * - i18n field labels (DE + EN)
 */

test.use({ navigationTimeout: 60000 });

async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →" }).click();
}

test.describe("Wizard Responsive — Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("1. Step 4 labels in German (locale=de)", async ({ page }) => {
    // Navigate to step 4
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);
    await page.getByTestId("TI05").click();
    await clickNext(page);
    await clickNext(page); // skip photo
    await page.waitForTimeout(500);

    // German section headers
    await expect(page.locator("button", { hasText: "Persönliche Angaben" })).toBeVisible();
    // German field labels inside the open section
    await expect(page.locator("label", { hasText: "Name" })).toBeVisible();
  });

  test("2. Step 4 labels in English (locale=en)", async ({ page }) => {
    await page.goto("/en/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);

    // English: click the Memorial Card button (sterbebild)
    // The card type buttons contain both label and description — click the button element
    await page.locator("button", { hasText: "Memorial Card" }).first().click();
    await page.waitForTimeout(500);
    await clickNext(page);
    await page.waitForTimeout(500);
    await page.getByTestId("TI05").click();
    await clickNext(page);
    await clickNext(page); // skip photo
    await page.waitForTimeout(500);

    await expect(page.locator("button", { hasText: "Personal Details" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Name" }).first()).toBeVisible();
  });
});

test.describe("Wizard Responsive — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("3. Mobile: template grid shows 1 column on small viewport", async ({ page }) => {
    // Navigate to step 2 (template selection)
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);
    await page.waitForTimeout(500);

    // The grid should be single-column on mobile (grid-cols-1)
    const grid = page.locator(".grid");
    await expect(grid).toBeVisible();
    // Template buttons should stack vertically — check that the first two have similar X positions
    const buttons = grid.locator("button");
    const count = await buttons.count();
    if (count >= 2) {
      const box1 = await buttons.nth(0).boundingBox();
      const box2 = await buttons.nth(1).boundingBox();
      if (box1 && box2) {
        // In single-column mode, both should be at similar X positions
        expect(Math.abs(box1.x - box2.x)).toBeLessThan(20);
        // And box2 should be below box1
        expect(box2.y).toBeGreaterThan(box1.y);
      }
    }
  });

  test("4. Mobile: font carousel hidden behind toggle", async ({ page }) => {
    // Navigate to step 4
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);
    await page.getByTestId("TI05").click();
    await clickNext(page);
    await clickNext(page); // skip photo
    await page.waitForTimeout(500);

    // The "Fonts" toggle should be visible on mobile
    const fontsToggle = page.locator("button", { hasText: "Fonts" });
    await expect(fontsToggle).toBeVisible();
    // Desktop carousel (hidden md:block) should not be visible on 390px
    const desktopCarousel = page.locator(".hidden.md\\:block");
    await expect(desktopCarousel.first()).not.toBeVisible();
    // Click to expand mobile carousel
    await fontsToggle.click();
    await page.waitForTimeout(200);
    // Category tabs should now be visible in the mobile container (md:hidden)
    const mobileCarousel = page.locator(".md\\:hidden").filter({ has: page.getByText("Serif ★") });
    await expect(mobileCarousel.first()).toBeVisible();
  });
});
