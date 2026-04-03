import { test, expect } from "@playwright/test";

/**
 * E2E tests for PDF generation error paths in the download flow.
 * Tests intercept /api/generate-pdf to simulate errors and verify UI feedback.
 */

test.use({ navigationTimeout: 60000 });

/** Click the wizard "Next →" button */
async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →", exact: true }).click();
}

/** Navigate through wizard to Step 7 (Preview) using TI04 (no photo needed) */
async function navigateToPreview(page: import("@playwright/test").Page) {
  await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
  await page.waitForSelector("body", { timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForSelector("body", { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Step 1: Select Erinnerungsbild
  await page.getByText("Erinnerungsbild").click();
  await clickNext(page);

  // Step 2: Select TI04 (Nur Text — no photo needed)
  await page.locator("h3", { hasText: "Nur Text" }).click();
  await clickNext(page);

  // Step 3: Background — just proceed
  await page.waitForTimeout(500);
  await clickNext(page);

  // Step 4 is skipped (TI04 has no photo) → lands on Step 5: Text
  await expect(page.getByText("Step 5 of 8")).toBeVisible({ timeout: 10000 });

  // Fill required name field
  await page.getByPlaceholder("Maria Musterfrau").fill("Test Person");

  // Step 5 → Step 6: Decorations
  await clickNext(page);
  await expect(page.getByText("Step 6 of 8")).toBeVisible({ timeout: 10000 });

  // Step 6 → Step 7: Preview
  await clickNext(page);
  await expect(page.getByText("Step 7 of 8")).toBeVisible({ timeout: 10000 });
}

test.describe("PDF Download Error Paths", () => {
  test("API returns 400 (missing cardType) — error message shown", async ({ page }) => {
    await navigateToPreview(page);

    // Intercept the PDF API call and return 400
    await page.route("**/api/generate-pdf", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Card type is required" }),
      })
    );

    // Click the PDF download button
    await page.getByRole("button", { name: /PDF herunterladen/i }).click();

    // Verify error message appears (German: "PDF-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut.")
    await expect(page.getByText("PDF-Erstellung fehlgeschlagen")).toBeVisible({ timeout: 10000 });
  });

  test("API returns 500 (server error) — error message shown", async ({ page }) => {
    await navigateToPreview(page);

    // Intercept the PDF API call and return 500
    await page.route("**/api/generate-pdf", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "PDF-Erstellung fehlgeschlagen" }),
      })
    );

    await page.getByRole("button", { name: /PDF herunterladen/i }).click();

    await expect(page.getByText("PDF-Erstellung fehlgeschlagen")).toBeVisible({ timeout: 10000 });
  });

  test("Network timeout (request aborted) — error message shown", async ({ page }) => {
    await navigateToPreview(page);

    // Intercept and abort the request to simulate network failure
    await page.route("**/api/generate-pdf", (route) => route.abort());

    await page.getByRole("button", { name: /PDF herunterladen/i }).click();

    await expect(page.getByText("PDF-Erstellung fehlgeschlagen")).toBeVisible({ timeout: 10000 });
  });

  test("Happy path — PDF download initiates", async ({ page }) => {
    await navigateToPreview(page);

    // Do NOT intercept — let the real API handle it.
    // Listen for the response to verify it returns PDF or JSON with pdfUrl.
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/generate-pdf") && resp.status() === 200,
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: /PDF herunterladen/i }).click();

    const response = await responsePromise;
    const contentType = response.headers()["content-type"] || "";

    // The API returns either direct PDF or JSON with pdfUrl (Supabase path)
    const isDirectPdf = contentType.includes("application/pdf");
    const isJsonWithUrl =
      contentType.includes("application/json") &&
      (await response.json().then((d) => !!d.pdfUrl).catch(() => false));

    expect(isDirectPdf || isJsonWithUrl).toBe(true);

    // No error message should be visible
    await expect(page.getByText("PDF-Erstellung fehlgeschlagen")).not.toBeVisible();
  });

  test("API returns JSON with pdfUrl (Supabase path) — opens new tab", async ({ page }) => {
    await navigateToPreview(page);

    // Intercept and return JSON with a pdfUrl
    await page.route("**/api/generate-pdf", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          pdfUrl: "https://example.com/test.pdf",
        }),
      })
    );

    // Track window.open calls
    const openCalls: string[] = [];
    await page.exposeFunction("__captureOpen", (url: string) => {
      openCalls.push(url);
    });
    await page.evaluate(() => {
      window.open = (url?: string | URL) => {
        // @ts-ignore — injected by Playwright
        window.__captureOpen(String(url ?? ""));
        return null;
      };
    });

    await page.getByRole("button", { name: /PDF herunterladen/i }).click();

    // Wait for the fetch + window.open to complete
    await page.waitForTimeout(3000);

    // Verify window.open was called with the pdfUrl
    expect(openCalls).toContain("https://example.com/test.pdf");

    // No error message should be visible
    await expect(page.getByText("PDF-Erstellung fehlgeschlagen")).not.toBeVisible();
  });
});
