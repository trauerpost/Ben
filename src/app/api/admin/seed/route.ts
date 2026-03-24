import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Dev-only: blocked in production
const IS_DEV = process.env.NODE_ENV !== "production";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const TEST_CUSTOMERS = [
  { email: "maria.fischer@test.de", name: "Maria Fischer", company_name: "Bestattungen Fischer GmbH", customer_type: "regular" as const, credits_remaining: 45, phone: "+49 151 1234567" },
  { email: "thomas.mueller@test.de", name: "Thomas Müller", company_name: "Müller Trauerbegleitung", customer_type: "regular" as const, credits_remaining: 3, phone: "+49 151 2345678" },
  { email: "anna.schmidt@test.de", name: "Anna Schmidt", company_name: null, customer_type: "one_time" as const, credits_remaining: 0, phone: null },
  { email: "peter.weber@test.de", name: "Peter Weber", company_name: "Weber & Söhne Bestattungen", customer_type: "regular" as const, credits_remaining: 120, phone: "+49 151 3456789" },
  { email: "sophie.braun@test.de", name: "Sophie Braun", company_name: null, customer_type: "one_time" as const, credits_remaining: 0, phone: null },
];

const CARD_TYPES = ["sterbebild", "trauerkarte", "dankkarte"] as const;

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Seed is disabled in production" }, { status: 403 });
  }

  // Admin auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: customer } = await supabase.from("customers").select("role").eq("auth_user_id", user.id).single();
  if (!customer || customer.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action ?? "seed";

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SERVICE_KEY
  );

  if (action === "cleanup") {
    // Delete seed data
    await sb.from("orders").delete().eq("notes", "SEED_DATA");
    const { data: seedCusts } = await sb.from("customers").select("id").in("email", TEST_CUSTOMERS.map(c => c.email));
    if (seedCusts && seedCusts.length > 0) {
      const ids = seedCusts.map(c => c.id);
      await sb.from("credit_transactions").delete().in("customer_id", ids);
    }
    await sb.from("promo_codes").delete().in("code", ["TRAUER10", "NEUKUNDE20", "SOMMER5", "VIP2026"]);
    await sb.from("customers").delete().in("email", TEST_CUSTOMERS.map(c => c.email));

    return NextResponse.json({ success: true, action: "cleanup" });
  }

  // Seed action
  // 1. Cleanup first
  await sb.from("orders").delete().eq("notes", "SEED_DATA");
  const { data: existingCusts } = await sb.from("customers").select("id").in("email", TEST_CUSTOMERS.map(c => c.email));
  if (existingCusts && existingCusts.length > 0) {
    await sb.from("credit_transactions").delete().in("customer_id", existingCusts.map(c => c.id));
  }
  await sb.from("promo_codes").delete().in("code", ["TRAUER10", "NEUKUNDE20", "SOMMER5", "VIP2026"]);
  await sb.from("customers").delete().in("email", TEST_CUSTOMERS.map(c => c.email));

  // 2. Create customers
  const { data: customers, error: custErr } = await sb
    .from("customers")
    .insert(TEST_CUSTOMERS)
    .select("id, email");

  if (custErr || !customers) {
    return NextResponse.json({ error: `Customer creation failed: ${custErr?.message}` }, { status: 500 });
  }
  const customerIds = customers.map(c => c.id);

  // 3. Create orders
  const orderTemplates: Array<{ status: string; card_type: (typeof CARD_TYPES)[number]; quantity: number; price_cents: number; cidx: number; days: number }> = [
    { status: "paid", card_type: "sterbebild", quantity: 100, price_cents: 15000, cidx: 0, days: 0 },
    { status: "paid", card_type: "trauerkarte", quantity: 50, price_cents: 8500, cidx: 1, days: 0 },
    { status: "paid", card_type: "dankkarte", quantity: 80, price_cents: 12000, cidx: 3, days: 1 },
    { status: "paid", card_type: "sterbebild", quantity: 30, price_cents: 5000, cidx: 2, days: 0 },
    { status: "in_production", card_type: "sterbebild", quantity: 200, price_cents: 28000, cidx: 0, days: 2 },
    { status: "in_production", card_type: "trauerkarte", quantity: 60, price_cents: 9500, cidx: 3, days: 1 },
    { status: "in_production", card_type: "dankkarte", quantity: 40, price_cents: 6000, cidx: 1, days: 3 },
    { status: "ready_for_pickup", card_type: "sterbebild", quantity: 150, price_cents: 22000, cidx: 3, days: 4 },
    { status: "ready_for_pickup", card_type: "trauerkarte", quantity: 70, price_cents: 11000, cidx: 0, days: 3 },
    { status: "shipped", card_type: "dankkarte", quantity: 100, price_cents: 14000, cidx: 0, days: 5 },
    { status: "shipped", card_type: "sterbebild", quantity: 50, price_cents: 8000, cidx: 1, days: 6 },
    { status: "shipped", card_type: "trauerkarte", quantity: 120, price_cents: 18000, cidx: 3, days: 4 },
    { status: "completed", card_type: "sterbebild", quantity: 80, price_cents: 12500, cidx: 0, days: 14 },
    { status: "completed", card_type: "trauerkarte", quantity: 60, price_cents: 9000, cidx: 1, days: 10 },
    { status: "completed", card_type: "dankkarte", quantity: 40, price_cents: 6500, cidx: 2, days: 20 },
    { status: "completed", card_type: "sterbebild", quantity: 200, price_cents: 30000, cidx: 3, days: 25 },
    { status: "completed", card_type: "trauerkarte", quantity: 90, price_cents: 13500, cidx: 4, days: 30 },
    { status: "cancelled", card_type: "sterbebild", quantity: 50, price_cents: 7500, cidx: 4, days: 8 },
    { status: "cancelled", card_type: "dankkarte", quantity: 30, price_cents: 4500, cidx: 2, days: 12 },
    { status: "draft", card_type: "sterbebild", quantity: 100, price_cents: 0, cidx: 0, days: 0 },
  ];

  const orderRows = orderTemplates.map(t => ({
    customer_id: customerIds[t.cidx],
    status: t.status,
    card_type: t.card_type,
    card_data: { test: true },
    quantity: t.quantity,
    price_cents: t.price_cents,
    notes: "SEED_DATA",
    created_at: daysAgo(t.days),
    ...(t.status === "shipped" ? { shipped_at: daysAgo(Math.max(0, t.days - 1)) } : {}),
    ...(t.status === "ready_for_pickup" ? { pickup_ready_at: daysAgo(Math.max(0, t.days - 1)) } : {}),
  }));

  const { data: orders, error: orderErr } = await sb.from("orders").insert(orderRows).select("id, status");
  if (orderErr) {
    return NextResponse.json({ error: `Order creation failed: ${orderErr.message}` }, { status: 500 });
  }

  // 4. Promo codes
  await sb.from("promo_codes").insert([
    { code: "TRAUER10", discount_type: "percent", discount_value: 10, max_uses: 100, current_uses: 23, is_active: true },
    { code: "NEUKUNDE20", discount_type: "percent", discount_value: 20, max_uses: 50, current_uses: 8, is_active: true },
    { code: "SOMMER5", discount_type: "fixed", discount_value: 500, max_uses: 30, current_uses: 30, is_active: false, expires_at: daysAgo(5) },
    { code: "VIP2026", discount_type: "percent", discount_value: 15, max_uses: null, current_uses: 5, is_active: true, customer_id: customerIds[0] },
  ]);

  // 5. Credit transactions
  await sb.from("credit_transactions").insert([
    { customer_id: customerIds[0], amount: 50, balance_after: 50, description: "Initial credit purchase" },
    { customer_id: customerIds[0], amount: -5, balance_after: 45, description: "Order — 100x Sterbebild" },
    { customer_id: customerIds[1], amount: 20, balance_after: 20, description: "Initial credit purchase" },
    { customer_id: customerIds[1], amount: -10, balance_after: 10, description: "Order — 50x Trauerkarte" },
    { customer_id: customerIds[1], amount: -7, balance_after: 3, description: "Order — 40x Dankkarte" },
    { customer_id: customerIds[3], amount: 200, balance_after: 200, description: "Bulk credit purchase" },
    { customer_id: customerIds[3], amount: -80, balance_after: 120, description: "Order — 200x Sterbebild" },
  ]);

  // Summary
  const statusCounts: Record<string, number> = {};
  (orders ?? []).forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return NextResponse.json({
    success: true,
    action: "seed",
    summary: {
      customers: customers.length,
      orders: orders?.length ?? 0,
      ordersByStatus: statusCounts,
      promoCodes: 4,
      creditTransactions: 7,
    },
  });
}
