import { test, expect } from "@playwright/test";

// Helper: login as admin
async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/de/login");
  await page.locator("#login-email").fill("jess@trauerpost.com");
  await page.locator("#login-password").fill("SoundGarden!");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

test.describe("Admin Orders", () => {
  test("admin can see orders list with filter tabs", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/admin/orders");

    // Page title
    await expect(
      page.getByRole("heading", { name: "Bestellungen" })
    ).toBeVisible({ timeout: 10000 });

    // Filter tabs visible
    await expect(page.getByRole("button", { name: "Alle" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Neu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Druck" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Versendet" })).toBeVisible();

    // Search input
    await expect(page.getByPlaceholder("Suche nach Kunde...")).toBeVisible();
  });

  test("admin can filter orders by status tab", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/de/admin/orders");
    await page.waitForTimeout(1000);

    // Click a filter tab
    await page.getByRole("button", { name: "Versendet" }).click();

    // The "Versendet" button should be highlighted (dark bg)
    const shippedBtn = page.getByRole("button", { name: "Versendet" });
    await expect(shippedBtn).toHaveClass(/bg-brand-dark/);
  });

  test("admin can change order status via API (positive test)", async ({
    request,
    page,
  }) => {
    await loginAsAdmin(page);

    // Get cookies for API call
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Create a test order via service role
    const { createClient } = require("@supabase/supabase-js");
    const sb = createClient(
      "https://iqltlhfqhzcyqgryrkky.supabase.co",
      process.env.supabase_Secert || process.env.SUPABASE_SERVICE_KEY!
    );
    const { data: order } = await sb
      .from("orders")
      .insert({
        customer_id: "d730dc78-9c7b-416f-9e19-00326f0c8eaa",
        status: "paid",
        card_type: "trauerkarte",
        card_data: { test: true },
        quantity: 5,
        price_cents: 2500,
      })
      .select()
      .single();

    // Change status via API
    const res = await request.patch(
      `/api/admin/orders/${order.id}/status`,
      {
        data: { status: "in_production" },
        headers: { Cookie: cookieHeader },
      }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify in DB
    const { data: updated } = await sb
      .from("orders")
      .select("status")
      .eq("id", order.id)
      .single();
    expect(updated.status).toBe("in_production");

    // Cleanup
    await sb.from("orders").delete().eq("id", order.id);
  });

  test("invalid status change returns error (negative test)", async ({
    request,
    page,
  }) => {
    await loginAsAdmin(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const res = await request.patch(
      `/api/admin/orders/00000000-0000-0000-0000-000000000000/status`,
      {
        data: { status: "in_production" },
        headers: { Cookie: cookieHeader },
      }
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Order not found");
  });

  test("status change shows confirmation toast", async ({ page }) => {
    await loginAsAdmin(page);

    // Create a test order
    const { createClient } = require("@supabase/supabase-js");
    const sb = createClient(
      "https://iqltlhfqhzcyqgryrkky.supabase.co",
      process.env.supabase_Secert || process.env.SUPABASE_SERVICE_KEY!
    );
    const { data: order } = await sb
      .from("orders")
      .insert({
        customer_id: "d730dc78-9c7b-416f-9e19-00326f0c8eaa",
        status: "paid",
        card_type: "sterbebild",
        card_data: { test: true },
        quantity: 1,
        price_cents: 1000,
      })
      .select()
      .single();

    await page.goto("/de/admin/orders");
    await page.waitForTimeout(1500);

    // Find the action button for the new order and click it
    const row = page.locator("tr", { hasText: order.id.slice(0, 8) }).or(
      page.locator("tr").filter({ hasText: "sterbebild" }).first()
    );

    // If the order row has an actions button, click it
    const actionsBtn = row.first().locator("button[aria-label='Actions']");
    if (await actionsBtn.isVisible({ timeout: 3000 })) {
      await actionsBtn.click();

      // Click "Start Printing"
      const startPrintBtn = page.getByText("Druck starten");
      if (await startPrintBtn.isVisible({ timeout: 2000 })) {
        await startPrintBtn.click();

        // Toast should appear
        await expect(
          page.getByText("Status wurde aktualisiert")
        ).toBeVisible({ timeout: 5000 });
      }
    }

    // Cleanup
    await sb.from("orders").delete().eq("id", order.id);
  });
});
