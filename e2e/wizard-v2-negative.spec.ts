import { test, expect } from "@playwright/test";

/**
 * Negative / edge-case tests for the wizard flow.
 */

test.use({ navigationTimeout: 60000 });

/** Click the wizard "Next →" button */
async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →", exact: true }).click();
}

test.describe("Wizard Negative Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test("Empty name blocks next on step 5", async ({ page }) => {
    // Navigate to step 5: type → template → bg → photo → text
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Select TI05 (has photo)
    await page.getByText("Foto 50/50").click();
    await clickNext(page);

    // Step 3: background — just advance
    await page.waitForTimeout(500);
    await clickNext(page);

    // Step 4: photo — skip without uploading
    await clickNext(page);

    // Step 5: text — name is empty
    await expect(page.getByText("Step 5 of 8")).toBeVisible();

    // Next button should be disabled because name is empty
    const nextBtn = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtn).toBeDisabled();
  });

  test("No template selected blocks next on step 2", async ({ page }) => {
    // Select card type to get to step 2
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // On step 2 — don't click any template
    await expect(page.getByText("Step 2 of 8")).toBeVisible();

    // Next button should be disabled
    const nextBtn = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtn).toBeDisabled();
  });

  test("Back navigation from step 5 skips photo for TI04", async ({ page }) => {
    // Select TI04 (no photo)
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await page.locator("h3", { hasText: "Nur Text" }).click();
    await clickNext(page);

    // Step 3: background
    await page.waitForTimeout(500);
    await clickNext(page);

    // Should be on step 5 (skipped step 4)
    await expect(page.getByText("Step 5 of 8")).toBeVisible();

    // Fill name so we can verify step, then click Back
    await page.getByPlaceholder("Maria Musterfrau").fill("Test");

    // Click Back
    await page.getByRole("button", { name: "← Back" }).click();

    // Should land on step 3 (background), NOT step 4 (photo)
    await expect(page.getByText("Step 3 of 8")).toBeVisible();
  });

  test("Draft auto-save writes state to localStorage", async ({ page }) => {
    // Select card type and template
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    // Select TI05
    await page.getByText("Foto 50/50").click();
    await clickNext(page);

    // Background — advance
    await page.waitForTimeout(500);
    await clickNext(page);

    // Photo — skip
    await clickNext(page);

    // Step 5: fill name
    await expect(page.getByText("Step 5 of 8")).toBeVisible();
    await page.getByPlaceholder("Maria Musterfrau").fill("Persisted Name");

    // Wait for auto-save effect to fire
    await page.waitForTimeout(500);

    // Verify draft in localStorage has the correct state
    const draft = await page.evaluate(() => {
      const raw = localStorage.getItem("trauerpost_wizard_draft");
      if (!raw) return null;
      return JSON.parse(raw);
    });

    expect(draft).not.toBeNull();
    expect(draft.version).toBe(6);
    expect(draft.state.templateId).toBe("TI05");
    expect(draft.state.currentStep).toBe(5);
    expect(draft.state.textContent.name).toBe("Persisted Name");
  });

  test("Draft version mismatch clears draft and shows step 1", async ({ page }) => {
    // Set an old-version draft in localStorage
    await page.evaluate(() => {
      const oldDraft = {
        version: 1,
        state: {
          currentStep: 5,
          cardType: "sterbebild",
          cardFormat: "single",
          templateId: "TI05",
          photo: { url: null, crop: null },
          background: { type: "color", color: "#fff", imageUrl: null },
          textContent: { name: "Old Draft" },
          decorations: { ornaments: [] },
        },
      };
      localStorage.setItem("trauerpost_wizard_draft", JSON.stringify(oldDraft));
    });

    // Reload to trigger draft loading
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Should be on step 1 (draft discarded due to version mismatch)
    await expect(page.getByText("Step 1 of 8")).toBeVisible();
  });
});
