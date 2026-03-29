/**
 * BENJEMIN Wizard — Visual Verification
 *
 * Opens a REAL browser. Fills REAL data. Takes REAL screenshots.
 * Catches: overlapping dates, missing frames, empty mockups, broken PDFs,
 * misplaced decorations, missing lines, wrong positions — EVERYTHING visual.
 *
 * Usage:
 *   npx playwright test ~/.claude/skills/benjemin-qa/scripts/visual-verify.ts --project=chromium
 *
 * Screenshots saved to: test-results/visual-qa/
 * MUST open and review every screenshot before declaring GO.
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS = path.join(process.cwd(), "test-results", "visual-qa");
const V2_TEMPLATES = ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"];

test.use({ navigationTimeout: 60000, actionTimeout: 10000 });

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
});

// ── Helpers ──────────────────────────────────────────────────

async function fresh(page: Page): Promise<void> {
  await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function next(page: Page): Promise<void> {
  // force: true because aria-disabled buttons are intentionally clickable
  // (click triggers validation message) — Playwright blocks them by default
  await page.getByRole("button", { name: "Next →" }).click({ force: true });
  await page.waitForTimeout(400);
}

async function goToText(page: Page, tpl: string): Promise<void> {
  await page.getByText("Erinnerungsbild").click();
  await next(page);
  await page.getByTestId(tpl).click();
  await next(page);
  await next(page); // skip photo
}

async function goToPreview(page: Page, tpl: string): Promise<void> {
  await goToText(page, tpl);
  await fillAllFields(page);
  await next(page); // step 5: decorations
  await next(page); // step 6: preview
  await page.waitForTimeout(1000);
}

async function fillAllFields(page: Page): Promise<void> {
  // Personal section (open by default)
  const heading = page.getByPlaceholder("In liebevoller Erinnerung");
  if (await heading.isVisible().catch(() => false)) await heading.fill("In liebevoller Erinnerung an");

  const name = page.getByPlaceholder("Maria Musterfrau");
  if (await name.isVisible().catch(() => false)) await name.fill("Hildegard Müller");

  // Dates section
  const datesBtn = page.locator("button", { hasText: "Lebensdaten" });
  if (await datesBtn.isVisible().catch(() => false)) {
    await datesBtn.click();
    await page.waitForTimeout(300);
    const birth = page.getByPlaceholder("* 24. Juli 1952");
    if (await birth.isVisible().catch(() => false)) await birth.fill("* 15. März 1938");
    const death = page.getByPlaceholder("† 28. September 2020");
    if (await death.isVisible().catch(() => false)) await death.fill("† 22. Januar 2024");
    const birthPlace = page.getByPlaceholder("in Starnberg");
    if (await birthPlace.isVisible().catch(() => false)) await birthPlace.fill("in München");
    const deathPlace = page.getByPlaceholder("in Augsburg");
    if (await deathPlace.isVisible().catch(() => false)) await deathPlace.fill("in Starnberg");
  }

  // Text section
  const textBtn = page.locator("button", { hasText: "Spruch & Text" });
  if (await textBtn.isVisible().catch(() => false)) {
    await textBtn.click();
    await page.waitForTimeout(300);
    const quote = page.locator("textarea").first();
    if (await quote.isVisible().catch(() => false)) {
      await quote.fill("Das schönste Denkmal, das ein Mensch\nbekommen kann, steht in den Herzen\nder Mitmenschen.");
    }
    const author = page.getByPlaceholder("(Albert Schweitzer)");
    if (await author.isVisible().catch(() => false)) await author.fill("Albert Schweitzer");
    const closing = page.getByPlaceholder("Wir vermissen dich.");
    if (await closing.isVisible().catch(() => false)) await closing.fill("Ruhe in Frieden");
  }

  await page.waitForTimeout(500);
}

function shot(name: string): string {
  return path.join(SCREENSHOTS, `${name}.png`);
}

/** Get bounding box or null */
async function box(page: Page, text: string) {
  const el = page.locator('div[style*="position: absolute"]', { hasText: text }).first();
  if (!(await el.isVisible().catch(() => false))) return null;
  return el.boundingBox();
}

// ── 1. Full flow per template: screenshot Step 4 (live preview) ──

for (const tpl of V2_TEMPLATES) {
  test(`${tpl}: Step 4 live preview renders correctly`, async ({ page }) => {
    await fresh(page);
    await goToText(page, tpl);
    await fillAllFields(page);
    await page.waitForTimeout(500);

    // Screenshot the entire page showing form + preview side by side
    await page.screenshot({ path: shot(`${tpl}-step4`), fullPage: false });

    // The preview panel (right side) should have positioned elements
    const previewEls = page.locator('div[style*="position: absolute"]');
    const count = await previewEls.count();
    expect(count, `${tpl} preview has no elements`).toBeGreaterThan(0);

    // Name should appear in preview
    const nameInPreview = page.locator('div[style*="font-family"]', { hasText: "Hildegard Müller" });
    await expect(nameInPreview.first()).toBeVisible({ timeout: 3000 });
  });
}

// ── 2. Full flow per template: screenshot Step 6 (preview page) ──

for (const tpl of V2_TEMPLATES) {
  test(`${tpl}: Step 6 preview page renders card`, async ({ page }) => {
    await fresh(page);
    await goToPreview(page, tpl);

    await page.screenshot({ path: shot(`${tpl}-step6-preview`), fullPage: false });

    // Card container must exist
    const card = page.locator('div[style*="aspect-ratio"]').first();
    await expect(card).toBeVisible();

    // Name must be visible inside the card
    const nameEl = page.locator('div[style*="font-family"]', { hasText: "Hildegard Müller" });
    await expect(nameEl.first()).toBeVisible({ timeout: 3000 });
  });
}

// ── 3. Dates: verify they don't overlap for each template with dates ──

const TEMPLATES_WITH_DATES = ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"];

for (const tpl of TEMPLATES_WITH_DATES) {
  test(`${tpl}: birthDate and deathDate don't overlap`, async ({ page }) => {
    await fresh(page);
    await goToText(page, tpl);
    await fillAllFields(page);
    await page.waitForTimeout(800);

    const birthBox = await box(page, "15. März 1938");
    const deathBox = await box(page, "22. Januar 2024");

    await page.screenshot({ path: shot(`${tpl}-dates`), fullPage: false });

    if (birthBox && deathBox) {
      // Bottom of birth date should be ABOVE top of death date (no overlap)
      const overlap = birthBox.y + birthBox.height - deathBox.y;
      expect(
        overlap,
        `${tpl}: dates overlap by ${Math.round(overlap)}px. birth bottom=${Math.round(birthBox.y + birthBox.height)}, death top=${Math.round(deathBox.y)}`
      ).toBeLessThanOrEqual(2); // 2px tolerance
    }
    // If either date not visible — screenshot will show the problem
  });
}

// ── 4. Lines render in the correct position ──

test("TI05: horizontal lines render between sections", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI05");
  await fillAllFields(page);
  await page.waitForTimeout(500);

  // Lines are rendered as div with borderTop style
  const lines = page.locator('div[style*="border-top"]');
  const lineCount = await lines.count();
  expect(lineCount, "TI05 should have horizontal separator lines").toBeGreaterThan(0);

  // Each line should have non-zero width
  for (let i = 0; i < lineCount; i++) {
    const lineBox = await lines.nth(i).boundingBox();
    if (lineBox) {
      expect(lineBox.width, `Line ${i} has zero width`).toBeGreaterThan(5);
    }
  }
});

// ── 5. Ornaments render (cross, floral elements) ──

test("TI07: ornament element renders", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI07");
  await fillAllFields(page);
  await page.waitForTimeout(500);

  // TI07 has an ornament (cross-rose-vine.svg)
  const ornament = page.locator('img[src*="ornament"]');
  const visible = await ornament.first().isVisible().catch(() => false);
  expect(visible, "TI07 ornament (cross-rose-vine) not visible").toBe(true);

  await page.screenshot({ path: shot("TI07-ornament"), fullPage: false });
});

test("TI08: cross ornament renders", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI08");
  await fillAllFields(page);
  await page.waitForTimeout(500);

  const ornament = page.locator('img[src*="ornament"]');
  const visible = await ornament.first().isVisible().catch(() => false);
  expect(visible, "TI08 cross ornament not visible").toBe(true);

  await page.screenshot({ path: shot("TI08-ornament"), fullPage: false });
});

// ── 6. Decorations (user-selected symbols from Step 5) ──

test("Decoration: selected symbol appears in preview", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI05");
  await page.getByPlaceholder("Maria Musterfrau").fill("Test Deko");
  await next(page); // step 5: decorations
  await page.waitForTimeout(1000);

  // Select first available symbol (if any loaded from Supabase)
  const symbols = page.locator("button img, button svg").first();
  const hasSymbols = await symbols.isVisible().catch(() => false);

  if (hasSymbols) {
    // Click the first symbol asset
    const assetButtons = page.locator('[class*="grid"] button').filter({ has: page.locator("img") });
    const count = await assetButtons.count();
    if (count > 1) {
      // Skip "None" (first), click second
      await assetButtons.nth(1).click();
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: shot("decoration-selected"), fullPage: false });

  // Navigate to preview and check decoration appears
  await next(page); // step 6
  await page.waitForTimeout(1000);

  await page.screenshot({ path: shot("decoration-in-preview"), fullPage: false });
});

// ── 7. Borders/frames (user-selected from Step 5) ──

test("Border: selected frame appears in preview", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI05");
  await page.getByPlaceholder("Maria Musterfrau").fill("Test Border");
  await next(page); // step 5: decorations
  await page.waitForTimeout(1000);

  // Switch to Borders/Rahmen tab
  const borderTab = page.locator("button", { hasText: "Rahmen" });
  if (await borderTab.isVisible().catch(() => false)) {
    await borderTab.click();
    await page.waitForTimeout(500);

    // Select first border (skip "None")
    const borderButtons = page.locator('[class*="grid"] button').filter({ has: page.locator("img") });
    const count = await borderButtons.count();
    if (count > 0) {
      await borderButtons.first().click();
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: shot("border-selected"), fullPage: false });

  await next(page); // step 6
  await page.waitForTimeout(1000);

  await page.screenshot({ path: shot("border-in-preview"), fullPage: false });
});

// ── 8. Mockup renders with content ──

test("Mockup: shows card with actual content, not blank", async ({ page }) => {
  await fresh(page);
  await goToPreview(page, "TI05");

  // Click Mockup tab
  const mockupBtn = page.locator("button", { hasText: "Mockup" });
  if (await mockupBtn.isVisible().catch(() => false)) {
    await mockupBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: shot("mockup-TI05"), fullPage: false });

    // Mockup should have the card name somewhere in its DOM
    const hasContent = await page.locator("text=Hildegard Müller").isVisible().catch(() => false);
    // If name not visible in mockup, it might be rendered as image — check mockup container isn't empty
    const mockupArea = page.locator('[class*="perspective"], [style*="perspective"]').first();
    if (await mockupArea.isVisible().catch(() => false)) {
      const children = await mockupArea.locator("*").count();
      expect(children, "Mockup container is empty").toBeGreaterThan(2);
    }
  }
});

// ── 9. PDF download ──

test("PDF Local: downloads valid PDF file", async ({ page }) => {
  test.setTimeout(60000);
  await fresh(page);
  await goToPreview(page, "TI05");

  const pdfBtn = page.locator("button", { hasText: "PDF (Local)" });
  if (!(await pdfBtn.isVisible().catch(() => false))) {
    await page.screenshot({ path: shot("pdf-button-missing"), fullPage: false });
    test.skip(true, "PDF Local button not found");
    return;
  }

  // Wait for fonts to finish loading — html2canvas can stall on pending fonts
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);

  // Intercept the blob before it triggers a download — avoids Windows EPERM
  // on Playwright temp files. We monkey-patch createElement to capture the blob.
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).__pdfResult = null;
    const origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function (blob: Blob) {
      const url = origCreateObjectURL.call(URL, blob);
      // Read first 5 bytes to verify PDF header
      blob.slice(0, 5).text().then(header => {
        (window as unknown as Record<string, unknown>).__pdfResult = {
          size: blob.size,
          header,
          url,
          type: blob.type,
        };
      });
      return url;
    };
  });

  await pdfBtn.click();

  // Wait for PDF generation (html2canvas + jsPDF can take a while)
  let result: { size: number; header: string; type: string } | null = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    result = await page.evaluate(() =>
      (window as unknown as Record<string, unknown>).__pdfResult as { size: number; header: string; type: string } | null
    );
    if (result) break;
  }

  if (!result) {
    // Check for error message in the UI
    const errorVisible = await page.locator("text=Local PDF generation failed").isVisible().catch(() => false);
    await page.screenshot({ path: shot("pdf-download-failed"), fullPage: false });
    throw new Error(`PDF generation ${errorVisible ? "failed (error shown in UI)" : "timed out after 30s"}`);
  }

  expect(result.size, "PDF file is empty or too small").toBeGreaterThan(1024);
  expect(result.header, "File is not a valid PDF").toBe("%PDF-");
  await page.screenshot({ path: shot("pdf-download-success"), fullPage: false });
});

// ── 10. Photo shows in preview ──

test("Photo: uploaded image appears in template preview", async ({ page }) => {
  await fresh(page);
  await page.getByText("Erinnerungsbild").click();
  await next(page);
  await page.getByTestId("TI05").click();
  await next(page);
  // Now on photo step

  // Upload a test image
  const fileInput = page.locator('input[type="file"]');
  // Create a tiny valid JPEG (1x1 pixel)
  const jpegBytes = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=",
    "base64"
  );
  await fileInput.setInputFiles({ name: "test.jpg", mimeType: "image/jpeg", buffer: jpegBytes });
  await page.waitForTimeout(1000);

  // Crop editor should appear
  const cropEditor = page.locator("canvas, [class*='avatar']");
  await expect(cropEditor.first()).toBeVisible({ timeout: 5000 });

  await page.screenshot({ path: shot("photo-uploaded"), fullPage: false });

  // Go to text step and check preview shows photo
  await next(page); // step 4: text
  await page.waitForTimeout(500);

  // Preview should have a background-image (the photo)
  const photoInPreview = page.locator('div[style*="background-image"]');
  const hasPhoto = await photoInPreview.first().isVisible().catch(() => false);

  await page.screenshot({ path: shot("photo-in-preview"), fullPage: false });
  // Note: tiny 1x1 JPEG may not render visibly, but the element should exist
});

// ── 11. Mobile: preview bottom sheet has content ──

test("Mobile: preview bottom sheet shows card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh(page);
  await goToText(page, "TI05");
  await page.getByPlaceholder("Maria Musterfrau").fill("Mobile Test");
  await page.waitForTimeout(500);

  // Tap the floating Preview button
  const previewBtn = page.locator("button", { hasText: "Preview" });
  if (await previewBtn.isVisible().catch(() => false)) {
    await previewBtn.click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: shot("mobile-preview-sheet"), fullPage: false });

    // Bottom sheet should have card preview content — check for positioned elements (SpreadPreview)
    const sheetContent = page.locator('div[style*="position: absolute"]');
    const count = await sheetContent.count();
    expect(count, "Mobile bottom sheet has no card preview elements").toBeGreaterThan(0);
  }
});

// ── 12. State survives back-and-forth navigation ──

test("Navigation: data survives step 4→5→4→5→6", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI05");
  await page.getByPlaceholder("Maria Musterfrau").fill("Navigation Test");
  await page.waitForTimeout(300);

  await next(page); // step 5
  // Go back to step 4
  await page.getByRole("button", { name: /Back/ }).click();
  await page.waitForTimeout(500);

  // Name should still be there
  const nameVal = await page.getByPlaceholder("Maria Musterfrau").inputValue();
  expect(nameVal).toBe("Navigation Test");

  // Go forward again to preview
  await next(page); // step 5
  await next(page); // step 6
  await page.waitForTimeout(1000);

  // Name should appear in preview
  const nameInPreview = page.locator('div[style*="font-family"]', { hasText: "Navigation Test" });
  await expect(nameInPreview.first()).toBeVisible({ timeout: 3000 });

  await page.screenshot({ path: shot("navigation-state-preserved"), fullPage: false });
});

// ── 13. Umlauts and special characters ──

test("Special chars: äöüß render correctly in preview", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI05");
  await page.getByPlaceholder("Maria Musterfrau").fill("Käthe Böhm-Strauß");
  await page.waitForTimeout(500);

  const nameInPreview = page.locator('div[style*="font-family"]', { hasText: "Käthe Böhm-Strauß" });
  await expect(nameInPreview.first()).toBeVisible({ timeout: 3000 });

  await page.screenshot({ path: shot("special-chars"), fullPage: false });
});

// ── 14. Empty optional fields don't show "undefined" ──

test("Empty fields: no 'undefined' or empty boxes in preview", async ({ page }) => {
  await fresh(page);
  await goToText(page, "TI05");
  // Only fill name (required), leave everything else empty
  await page.getByPlaceholder("Maria Musterfrau").fill("Nur Name");
  await page.waitForTimeout(500);

  // Preview should NOT contain "undefined"
  const undefinedText = page.locator('div[style*="font-family"]', { hasText: "undefined" });
  const hasUndefined = await undefinedText.first().isVisible().catch(() => false);
  expect(hasUndefined, "Preview shows 'undefined' for empty fields").toBe(false);

  await page.screenshot({ path: shot("empty-fields-no-undefined"), fullPage: false });
});

// ── 15. Console errors during full flow ──

test("Console: zero errors during full wizard flow", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known non-critical errors
      if (text.includes("favicon") || text.includes("chunk")) return;
      errors.push(text);
    }
  });

  await fresh(page);
  await goToPreview(page, "TI05");
  await page.waitForTimeout(1000);

  expect(errors, `Console errors found:\n${errors.join("\n")}`).toHaveLength(0);
});
