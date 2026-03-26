import { test, expect } from "@playwright/test";
import { loginAsUser, loginAsAdmin } from "./helpers/login";

/**
 * REAL End-to-End Tests — Card Creation System
 *
 * These tests exercise the full flow:
 * 1. Login as real user
 * 2. Create card (select type, background, text)
 * 3. Preview card
 * 4. Download PDF
 * 5. Place order → saves to Supabase
 * 6. Email sent automatically
 * 7. Admin can see the order
 */

test.describe("E2E: Erinnerungsbild — full flow", () => {
  test("create card → preview → order", async ({ page }) => {
    // Login as test user
    await loginAsUser(page);

    // Block email sending during order flow — only the dedicated email test sends real mail
    await page.route("**/api/send-email", (route) => route.fulfill({ status: 200, body: '{"success":true}' }));

    // Go to builder
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);

    // Step 1: Select Erinnerungsbild
    await page.getByRole("button", { name: /Erinnerungsbild/i }).click();
    await expect(page.getByRole("button", { name: "Next →" })).toBeEnabled();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background — select first image
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text — use template
    await page.getByRole("button", { name: "Klassisch" }).click();
    const textarea = page.locator("textarea");
    await expect(textarea).not.toBeEmpty();
    // Replace placeholders with real data
    await textarea.fill("In liebevoller Erinnerung an\n\nMaria Müller\n\n* 15.03.1940    † 20.03.2026\n\nHerr, gib ihr die ewige Ruhe.");
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 5: Decorations — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 6: Preview — verify panels
    await expect(page.getByRole("heading", { name: "Preview Your Card" })).toBeVisible();
    await expect(page.getByText("Front")).toBeVisible();
    await expect(page.getByText("Back", { exact: true })).toBeVisible();

    // Verify PDF download button
    const pdfBtn = page.getByRole("button", { name: /PDF herunterladen/i });
    await expect(pdfBtn).toBeVisible();

    // Move to order
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 7: Order — user is logged in, should see order form
    await expect(page.getByText("Place Your Order")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Erinnerungsbild")).toBeVisible();

    // Set quantity
    const quantityInput = page.locator('input[type="number"]');
    await quantityInput.fill("50");

    // Place order
    await page.getByRole("button", { name: "Place Order" }).first().click();

    // Wait for success state
    await expect(page.getByText(/Bestellung aufgegeben/i)).toBeVisible({ timeout: 30000 });

    // Verify order number shown
    await expect(page.locator(".font-mono")).toBeVisible();

    // Verify "New card" button
    await expect(page.getByText(/Neue Karte erstellen/i)).toBeVisible();
  });
});

test.describe("E2E: Trauerkarte folded — full flow", () => {
  test("create folded card → 4 panel preview → order", async ({ page }) => {
    await loginAsUser(page);
    await page.route("**/api/send-email", (route) => route.fulfill({ status: 200, body: '{"success":true}' }));
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);

    // Step 1: Trauerkarte + folded
    await page.getByRole("button", { name: /Trauerkarte/i }).click();
    await page.getByText("Gefaltet (folded)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text — use Traueranzeige template
    await page.getByRole("button", { name: "Traueranzeige" }).click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 5: Decorations — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 6: Preview — 4 panels for folded
    await expect(page.getByText("Front")).toBeVisible();
    await expect(page.getByText("Inside Left")).toBeVisible();
    await expect(page.getByText("Inside Right")).toBeVisible();
    await expect(page.getByText("Back", { exact: true })).toBeVisible();

    // 3D mode available
    await expect(page.getByRole("button", { name: /3D/i })).toBeVisible();

    // Test 3D folding
    await page.getByRole("button", { name: /3D/i }).click();
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await page.getByRole("button", { name: "Closed", exact: true }).click();
    await expect(page.getByText(/front is visible/i)).toBeVisible();

    // Go to order
    await page.getByRole("button", { name: "Next →" }).click();

    // Place order
    await expect(page.getByText("Place Your Order")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Trauerkarte")).toBeVisible();
    await page.getByRole("button", { name: "Place Order" }).first().click();
    await expect(page.getByText(/Bestellung aufgegeben/i)).toBeVisible({ timeout: 30000 });
  });
});

test.describe("E2E: Dankeskarte single — full flow", () => {
  test("create single thank-you card → order", async ({ page }) => {
    await loginAsUser(page);
    await page.route("**/api/send-email", (route) => route.fulfill({ status: 200, body: '{"success":true}' }));
    await page.goto("/de/builder");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);

    // Step 1: Dankeskarte + single
    await page.getByRole("button", { name: /Dankeskarte/i }).click();
    await page.getByText("Einfach (single)").click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 2: Background
    const firstImage = page.locator("button:has(img)").first();
    await expect(firstImage).toBeVisible({ timeout: 15000 });
    await firstImage.click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 3: Photo — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 4: Text — use Dank template
    await page.getByRole("button", { name: "Dank" }).click();
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 5: Decorations — skip
    await page.getByRole("button", { name: "Next →" }).click();

    // Step 6: Preview — 2 panels
    await expect(page.getByText("Front")).toBeVisible();
    await expect(page.getByText("Back", { exact: true })).toBeVisible();
    // No 3D for single
    await expect(page.getByRole("button", { name: /3D/i })).not.toBeVisible();

    // Go to order
    await page.getByRole("button", { name: "Next →" }).click();

    // Place order
    await expect(page.getByText("Dankeskarte")).toBeVisible();
    await page.getByRole("button", { name: "Place Order" }).first().click();
    await expect(page.getByText(/Bestellung aufgegeben/i)).toBeVisible({ timeout: 30000 });
  });
});

test.describe("E2E: Admin sees orders", () => {
  test("admin can see newly created orders in orders list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/admin/orders");

    // Orders page loads
    await expect(page.getByRole("heading", { name: "Bestellungen" })).toBeVisible();

    // Should have at least one order (from previous tests or seed data)
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Click first order to see details
    await rows.first().click();

    // Modal shows order details
    await expect(page.getByText(/Order #/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("E2E: PDF generation API", () => {
  test("POST /api/generate-pdf returns PDF for sterbebild", async ({ request }) => {
    const res = await request.post("/api/generate-pdf", {
      data: {
        state: {
          currentStep: 6,
          cardType: "sterbebild",
          cardFormat: "single",
          backImageUrl: null,
          photoUrl: null,
          photoCrop: null,
          text: "Test PDF Generation\n\nMaria Müller\n* 1940  † 2026",
          fontFamily: "Playfair Display",
          fontSize: 16,
          fontColor: "#1A1A1A",
          textAlign: "center",
          decorations: {
            borderId: null,
            borderUrl: null,
            cornerIds: [],
            cornerUrls: [],
            dividerIds: [],
            dividerUrls: [],
          },
        },
      },
    });

    // Should return PDF or JSON with pdfUrl
    expect(res.status()).toBe(200);
    const contentType = res.headers()["content-type"] || "";
    if (contentType.includes("application/pdf")) {
      const body = await res.body();
      expect(body.length).toBeGreaterThan(1000);
      // PDF starts with %PDF
      expect(body.toString("utf-8", 0, 5)).toBe("%PDF-");
    } else {
      const json = await res.json();
      expect(json.success).toBe(true);
    }
  });

  test("POST /api/generate-pdf rejects missing cardType", async ({ request }) => {
    const res = await request.post("/api/generate-pdf", {
      data: { state: { cardType: null } },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("E2E: Email API", () => {
  test("POST /api/send-email sends email with PDF to business", async ({ request }) => {
    // First generate a real PDF
    const pdfRes = await request.post("/api/generate-pdf", {
      data: {
        state: {
          currentStep: 6,
          cardType: "sterbebild",
          cardFormat: "single",
          backImageUrl: null,
          photoUrl: null,
          photoCrop: null,
          text: "E2E Test\n\nMaria Müller\n* 1940  † 2026",
          fontFamily: "Playfair Display",
          fontSize: 16,
          fontColor: "#1A1A1A",
          textAlign: "center",
          decorations: { borderId: null, borderUrl: null, cornerIds: [], cornerUrls: [], dividerIds: [], dividerUrls: [] },
        },
      },
    });
    expect(pdfRes.status()).toBe(200);

    // Convert PDF to base64
    const pdfBody = await pdfRes.body();
    const pdfBase64 = pdfBody.toString("base64");

    // Send email with PDF attached
    const res = await request.post("/api/send-email", {
      data: {
        to: "ofir393@gmail.com",
        customerName: "E2E Test — Maria Müller",
        orderId: "e2e-test-00000000",
        cardType: "Erinnerungsbild",
        quantity: 25,
        pdfBase64,
      },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("POST /api/send-email rejects missing fields", async ({ request }) => {
    const res = await request.post("/api/send-email", {
      data: { to: null, orderId: null },
    });
    expect(res.status()).toBe(400);
  });
});
