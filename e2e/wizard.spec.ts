import { test, expect } from "@playwright/test";

test.describe("Card Builder Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test("loads wizard with step 1 (size selector)", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Choose Card Size" })).toBeVisible();
    await expect(page.getByText("Postkarte (A6)")).toBeVisible();
  });

  test("step indicator shows 7 steps", async ({ page }) => {
    // Check step numbers 1-7 exist
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator(`text="${i}"`).first()).toBeVisible();
    }
  });

  test("next button is disabled until size is selected", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: "Next →" });
    await expect(nextBtn).toBeDisabled();
  });

  test("selecting postcard enables next button", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    const nextBtn = page.getByRole("button", { name: "Next →" });
    await expect(nextBtn).toBeEnabled();
  });

  test("step 1 → step 2: choose size then background", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    await expect(page.getByRole("heading", { name: "Choose Background" })).toBeVisible();
  });

  test("step 2 shows landscape images", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    // Wait for Loading... to disappear
    await expect(page.getByText("Loading...")).toBeHidden({ timeout: 15000 });
    const images = page.locator("button:has(img)");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test("step 2 has tag filter buttons", async ({ page }) => {
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    await expect(page.getByText("Loading...")).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
  });

  test("full wizard flow: size → background → photo → text", async ({ page }) => {
    // Step 1: Size
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background — wait for images, select first
    await expect(page.getByText("Loading...")).toBeHidden({ timeout: 15000 });
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible();
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await expect(page.getByRole("heading", { name: "Upload Photo" })).toBeVisible();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text
    await expect(page.getByRole("heading", { name: "Add Text" })).toBeVisible();
  });

  test("step 4: text input visible after navigation", async ({ page }) => {
    // Navigate through steps
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();
    const img = page.locator("button:has(img)").first();
    await expect(img).toBeVisible();
    await img.click();
    await page.getByRole("button", { name: "Next →" }).click();
    // Step 3: skip photo
    await page.getByRole("button", { name: "Next →" }).click();
    // Step 4: should see textarea
    await expect(page.locator("textarea")).toBeVisible({ timeout: 10000 });
  });

  test("full flow to step 6: preview with 3D mockup", async ({ page }) => {
    // Step 1: Size
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background — select first image
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible();
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text — type something
    await page.locator("textarea").fill("In loving memory");
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 5: Decorations — skip
    await expect(page.getByRole("heading", { name: /Decorations/i })).toBeVisible();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 6: Preview
    await expect(page.getByRole("heading", { name: "Preview Your Card" })).toBeVisible();

    // Verify 3 preview modes exist
    await expect(page.getByRole("button", { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Flip/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /3D/i })).toBeVisible();

    // Test flat mode — 3 panel labels visible
    await expect(page.getByText("Inside Left")).toBeVisible();
    await expect(page.getByText("Inside Right")).toBeVisible();

    // Test flip mode
    await page.getByRole("button", { name: /Flip/i }).click();
    await expect(page.getByText("Click the card to flip")).toBeVisible();

    // Test 3D mode
    await page.getByRole("button", { name: /3D/i }).click();
    // Verify slider exists
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    // Verify fold buttons exist
    // Verify fold preset buttons exist
    const openBtn = page.getByRole("button", { name: "Open", exact: true }).last();
    const closedBtn = page.getByRole("button", { name: "Closed", exact: true });
    await expect(openBtn).toBeVisible();
    await expect(closedBtn).toBeVisible();
    // Click "Closed" button and verify label changes
    await closedBtn.click();
    await expect(page.getByText("the back is visible")).toBeVisible();
    // Click "Open" button
    await openBtn.click();
    await expect(page.getByText("drag to fold the card")).toBeVisible();
  });

  test("step 2: show more backgrounds button", async ({ page }) => {
    // Step 1: Size
    await page.getByText("Postkarte (A6)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Should show only 5 images + 1 upload = 6 buttons with images initially
    const images = page.locator("button:has(img)");
    const initialCount = await images.count();
    expect(initialCount).toBe(5);

    // Should have "Show all" button
    const showAllBtn = page.getByRole("button", { name: /Show all/i });
    await expect(showAllBtn).toBeVisible();

    // Click show all
    await showAllBtn.click();

    // Now should show all 20
    const allImages = page.locator("button:has(img)");
    const expandedCount = await allImages.count();
    expect(expandedCount).toBe(20);
  });
});
