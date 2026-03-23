import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("POST /api/generate-pdf returns success", async ({ request }) => {
    const response = await request.post("/api/generate-pdf", {
      data: { svgString: "<svg></svg>", filename: "test.pdf" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test("POST /api/generate-pdf returns error without SVG", async ({ request }) => {
    const response = await request.post("/api/generate-pdf", {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("POST /api/checkout returns success", async ({ request }) => {
    const response = await request.post("/api/checkout", {
      data: { orderId: "test-123", paymentMethod: "stripe" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test("POST /api/checkout returns error without orderId", async ({ request }) => {
    const response = await request.post("/api/checkout", {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("POST /api/send-email returns success", async ({ request }) => {
    const response = await request.post("/api/send-email", {
      data: { to: "test@example.com", subject: "Test", orderId: "test-123" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test("POST /api/send-email returns error without required fields", async ({ request }) => {
    const response = await request.post("/api/send-email", {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
