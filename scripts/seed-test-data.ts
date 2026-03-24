/**
 * seed-test-data.ts — Full lifecycle simulation + test data seeder
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts                  # seed data
 *   npx tsx scripts/seed-test-data.ts --cleanup        # remove seeded data
 *   npx tsx scripts/seed-test-data.ts --lifecycle-only # run lifecycle simulation without seeding
 *
 * What it does:
 *   1. Creates 5 test customers (mix of regular/one_time, various credit levels)
 *   2. Creates 20 orders across all statuses
 *   3. Creates 4 promo codes
 *   4. Creates credit transactions for regular customers
 *   5. Runs full lifecycle simulation: paid → in_production → shipped → completed
 *      via the real API routes (not direct DB inserts)
 *   6. Verifies DB state at each step
 *
 * All seeded records are tagged with notes='SEED_DATA' for easy cleanup.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqltlhfqhzcyqgryrkky.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Test Data Definitions ──

const TEST_CUSTOMERS = [
  { email: "maria.fischer@test.de", name: "Maria Fischer", company_name: "Bestattungen Fischer GmbH", customer_type: "regular" as const, credits_remaining: 45, phone: "+49 151 1234567" },
  { email: "thomas.mueller@test.de", name: "Thomas Müller", company_name: "Müller Trauerbegleitung", customer_type: "regular" as const, credits_remaining: 3, phone: "+49 151 2345678" },
  { email: "anna.schmidt@test.de", name: "Anna Schmidt", company_name: null, customer_type: "one_time" as const, credits_remaining: 0, phone: null },
  { email: "peter.weber@test.de", name: "Peter Weber", company_name: "Weber & Söhne Bestattungen", customer_type: "regular" as const, credits_remaining: 120, phone: "+49 151 3456789" },
  { email: "sophie.braun@test.de", name: "Sophie Braun", company_name: null, customer_type: "one_time" as const, credits_remaining: 0, phone: null },
];

const CARD_TYPES = ["sterbebild", "trauerkarte", "dankkarte"] as const;

const ORDER_TEMPLATES: Array<{
  status: string;
  card_type: (typeof CARD_TYPES)[number];
  quantity: number;
  price_cents: number;
  customer_idx: number;
  days_ago: number;
}> = [
  // New orders (paid) — 4
  { status: "paid", card_type: "sterbebild", quantity: 100, price_cents: 15000, customer_idx: 0, days_ago: 0 },
  { status: "paid", card_type: "trauerkarte", quantity: 50, price_cents: 8500, customer_idx: 1, days_ago: 0 },
  { status: "paid", card_type: "dankkarte", quantity: 80, price_cents: 12000, customer_idx: 3, days_ago: 1 },
  { status: "paid", card_type: "sterbebild", quantity: 30, price_cents: 5000, customer_idx: 2, days_ago: 0 },
  // In production — 3
  { status: "in_production", card_type: "sterbebild", quantity: 200, price_cents: 28000, customer_idx: 0, days_ago: 2 },
  { status: "in_production", card_type: "trauerkarte", quantity: 60, price_cents: 9500, customer_idx: 3, days_ago: 1 },
  { status: "in_production", card_type: "dankkarte", quantity: 40, price_cents: 6000, customer_idx: 1, days_ago: 3 },
  // Ready for pickup — 2
  { status: "ready_for_pickup", card_type: "sterbebild", quantity: 150, price_cents: 22000, customer_idx: 3, days_ago: 4 },
  { status: "ready_for_pickup", card_type: "trauerkarte", quantity: 70, price_cents: 11000, customer_idx: 0, days_ago: 3 },
  // Shipped — 3
  { status: "shipped", card_type: "dankkarte", quantity: 100, price_cents: 14000, customer_idx: 0, days_ago: 5 },
  { status: "shipped", card_type: "sterbebild", quantity: 50, price_cents: 8000, customer_idx: 1, days_ago: 6 },
  { status: "shipped", card_type: "trauerkarte", quantity: 120, price_cents: 18000, customer_idx: 3, days_ago: 4 },
  // Completed — 5
  { status: "completed", card_type: "sterbebild", quantity: 80, price_cents: 12500, customer_idx: 0, days_ago: 14 },
  { status: "completed", card_type: "trauerkarte", quantity: 60, price_cents: 9000, customer_idx: 1, days_ago: 10 },
  { status: "completed", card_type: "dankkarte", quantity: 40, price_cents: 6500, customer_idx: 2, days_ago: 20 },
  { status: "completed", card_type: "sterbebild", quantity: 200, price_cents: 30000, customer_idx: 3, days_ago: 25 },
  { status: "completed", card_type: "trauerkarte", quantity: 90, price_cents: 13500, customer_idx: 4, days_ago: 30 },
  // Cancelled — 2
  { status: "cancelled", card_type: "sterbebild", quantity: 50, price_cents: 7500, customer_idx: 4, days_ago: 8 },
  { status: "cancelled", card_type: "dankkarte", quantity: 30, price_cents: 4500, customer_idx: 2, days_ago: 12 },
  // Draft — 1
  { status: "draft", card_type: "sterbebild", quantity: 100, price_cents: 0, customer_idx: 0, days_ago: 0 },
];

const PROMO_CODES = [
  { code: "TRAUER10", discount_type: "percent" as const, discount_value: 10, max_uses: 100, current_uses: 23, is_active: true },
  { code: "NEUKUNDE20", discount_type: "percent" as const, discount_value: 20, max_uses: 50, current_uses: 8, is_active: true },
  { code: "SOMMER5", discount_type: "fixed" as const, discount_value: 500, max_uses: 30, current_uses: 30, is_active: false },
  { code: "VIP2026", discount_type: "percent" as const, discount_value: 15, max_uses: null, current_uses: 5, is_active: true },
];

// ── Helpers ──

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function log(icon: string, msg: string): void {
  console.log(`${icon} ${msg}`);
}

function pass(msg: string): void { log("PASS", msg); }
function fail(msg: string): void { log("FAIL", msg); }

// ── Cleanup ──

async function cleanup(): Promise<void> {
  log(">>", "Cleaning up seed data...");

  // Delete orders with SEED_DATA tag
  const { count: orderCount } = await sb.from("orders").delete({ count: "exact" }).eq("notes", "SEED_DATA");
  log("--", `Deleted ${orderCount ?? 0} seed orders`);

  // Delete credit transactions for seed customers
  const { data: seedCustomers } = await sb.from("customers").select("id").in("email", TEST_CUSTOMERS.map(c => c.email));
  if (seedCustomers && seedCustomers.length > 0) {
    const ids = seedCustomers.map(c => c.id);
    const { count: txCount } = await sb.from("credit_transactions").delete({ count: "exact" }).in("customer_id", ids);
    log("--", `Deleted ${txCount ?? 0} seed credit transactions`);
  }

  // Delete promo codes
  const { count: promoCount } = await sb.from("promo_codes").delete({ count: "exact" }).in("code", PROMO_CODES.map(p => p.code));
  log("--", `Deleted ${promoCount ?? 0} seed promo codes`);

  // Delete seed customers
  const { count: custCount } = await sb.from("customers").delete({ count: "exact" }).in("email", TEST_CUSTOMERS.map(c => c.email));
  log("--", `Deleted ${custCount ?? 0} seed customers`);

  pass("Cleanup complete");
}

// ── Seed ──

async function seed(): Promise<{ customerIds: string[]; orderIds: string[] }> {
  log(">>", "Seeding test data...");

  // 1. Create customers
  log("--", "Creating 5 test customers...");
  const { data: customers, error: custErr } = await sb
    .from("customers")
    .upsert(TEST_CUSTOMERS, { onConflict: "email" })
    .select("id, email, credits_remaining");

  if (custErr || !customers) {
    fail(`Customer creation failed: ${custErr?.message}`);
    process.exit(1);
  }
  pass(`Created ${customers.length} customers`);
  const customerIds = customers.map(c => c.id);

  // 2. Create orders
  log("--", "Creating 20 orders across all statuses...");
  const orderRows = ORDER_TEMPLATES.map(t => ({
    customer_id: customerIds[t.customer_idx],
    status: t.status,
    card_type: t.card_type,
    card_data: { test: true, template: "classic-rose" },
    quantity: t.quantity,
    price_cents: t.price_cents,
    notes: "SEED_DATA",
    created_at: daysAgo(t.days_ago),
    ...(t.status === "shipped" ? { shipped_at: daysAgo(Math.max(0, t.days_ago - 1)) } : {}),
    ...(t.status === "ready_for_pickup" ? { pickup_ready_at: daysAgo(Math.max(0, t.days_ago - 1)) } : {}),
  }));

  const { data: orders, error: orderErr } = await sb
    .from("orders")
    .insert(orderRows)
    .select("id, status");

  if (orderErr || !orders) {
    fail(`Order creation failed: ${orderErr?.message}`);
    process.exit(1);
  }
  pass(`Created ${orders.length} orders`);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  Object.entries(statusCounts).forEach(([status, count]) => {
    log("  ", `${status}: ${count}`);
  });

  // 3. Create promo codes
  log("--", "Creating 4 promo codes...");
  const { data: promos, error: promoErr } = await sb
    .from("promo_codes")
    .upsert(PROMO_CODES.map(p => ({
      ...p,
      customer_id: p.code === "VIP2026" ? customerIds[0] : null,
      expires_at: p.code === "SOMMER5" ? daysAgo(5) : null, // expired
    })), { onConflict: "code" })
    .select("id, code");

  if (promoErr) {
    fail(`Promo code creation failed: ${promoErr.message}`);
  } else {
    pass(`Created ${promos?.length ?? 0} promo codes`);
  }

  // 4. Create credit transactions for regular customers
  log("--", "Creating credit transactions...");
  const txRows = [
    { customer_id: customerIds[0], amount: 50, balance_after: 50, description: "Initial credit purchase" },
    { customer_id: customerIds[0], amount: -5, balance_after: 45, description: "Order #1234 — 100x Sterbebild" },
    { customer_id: customerIds[1], amount: 20, balance_after: 20, description: "Initial credit purchase" },
    { customer_id: customerIds[1], amount: -10, balance_after: 10, description: "Order #1235 — 50x Trauerkarte" },
    { customer_id: customerIds[1], amount: -7, balance_after: 3, description: "Order #1236 — 40x Dankkarte" },
    { customer_id: customerIds[3], amount: 200, balance_after: 200, description: "Bulk credit purchase" },
    { customer_id: customerIds[3], amount: -80, balance_after: 120, description: "Order #1237 — 200x Sterbebild" },
  ];

  const { error: txErr } = await sb.from("credit_transactions").insert(txRows);
  if (txErr) {
    fail(`Transaction creation failed: ${txErr.message}`);
  } else {
    pass(`Created ${txRows.length} credit transactions`);
  }

  return { customerIds, orderIds: orders.map(o => o.id) };
}

// ── Lifecycle Simulation ──

async function simulateLifecycle(appUrl: string): Promise<void> {
  log(">>", "Running full lifecycle simulation via API routes...");
  log("  ", `Target: ${appUrl}`);

  // Sign in as admin to get session cookies
  const authSb = createClient(SUPABASE_URL, "sb_publishable_fiXHDgT2GoRfApHnCMp5Mg_zfhvu-fZ");
  const { data: auth, error: authErr } = await authSb.auth.signInWithPassword({
    email: "test@trauerpost.com",
    password: "Test1234!",
  });
  if (authErr || !auth.session) {
    fail(`Admin login failed: ${authErr?.message}`);
    return;
  }

  // Build cookie string (Supabase SSR format)
  const session = auth.session;
  const sessionStr = JSON.stringify(session);
  const ref = "iqltlhfqhzcyqgryrkky";
  const key = `sb-${ref}-auth-token`;
  const encoded = encodeURIComponent(sessionStr);
  const chunkSize = 3180;
  const cookies: string[] = [];
  let remaining = encoded;
  let i = 0;
  while (remaining.length > 0) {
    let head = remaining.slice(0, chunkSize);
    const lastPct = head.lastIndexOf("%");
    if (lastPct > chunkSize - 3) head = head.slice(0, lastPct);
    const decoded = decodeURIComponent(head);
    cookies.push(`${key}.${i}=${decoded}`);
    remaining = remaining.slice(head.length);
    i++;
  }
  const cookieStr = cookies.join("; ");

  // Create a fresh order for lifecycle test
  log("--", "Step 1: Create order (status=paid)");
  const { data: order, error: createErr } = await sb.from("orders").insert({
    customer_id: null,
    guest_email: "lifecycle-test@example.com",
    guest_name: "Lifecycle Test",
    status: "paid",
    card_type: "sterbebild",
    card_data: { lifecycle: true },
    quantity: 25,
    price_cents: 3750,
    notes: "SEED_DATA",
  }).select().single();

  if (createErr || !order) {
    fail(`Order creation failed: ${createErr?.message}`);
    return;
  }
  pass(`Order created: ${order.id.slice(0, 8)} (status=paid)`);

  // Helper to call status API
  async function changeStatus(orderId: string, newStatus: string, expectCode: number): Promise<boolean> {
    const res = await fetch(`${appUrl}/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieStr },
      body: JSON.stringify({ status: newStatus }),
    });
    const body = await res.json();
    if (res.status !== expectCode) {
      fail(`Expected ${expectCode}, got ${res.status}: ${JSON.stringify(body)}`);
      return false;
    }
    return true;
  }

  // Helper to verify DB state
  async function verifyStatus(orderId: string, expected: string): Promise<boolean> {
    const { data } = await sb.from("orders").select("status, shipped_at, pickup_ready_at").eq("id", orderId).single();
    if (data?.status !== expected) {
      fail(`DB status mismatch: expected=${expected}, got=${data?.status}`);
      return false;
    }
    return true;
  }

  // Step 2: paid → in_production
  log("--", "Step 2: paid → in_production");
  if (await changeStatus(order.id, "in_production", 200)) {
    if (await verifyStatus(order.id, "in_production")) {
      pass("paid → in_production OK");
    }
  }

  // Step 3: in_production → shipped (should set shipped_at + send email)
  log("--", "Step 3: in_production → shipped");
  if (await changeStatus(order.id, "shipped", 200)) {
    const { data: shipped } = await sb.from("orders").select("status, shipped_at").eq("id", order.id).single();
    if (shipped?.status === "shipped" && shipped?.shipped_at) {
      pass(`in_production → shipped OK (shipped_at=${shipped.shipped_at})`);
    } else {
      fail(`shipped_at not set: ${JSON.stringify(shipped)}`);
    }
  }

  // Step 4: shipped → completed
  log("--", "Step 4: shipped → completed");
  if (await changeStatus(order.id, "completed", 200)) {
    if (await verifyStatus(order.id, "completed")) {
      pass("shipped → completed OK");
    }
  }

  // Step 5: Negative tests
  log("--", "Step 5: Negative tests");

  // 5a: Invalid status
  const res5a = await fetch(`${appUrl}/api/admin/orders/${order.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookieStr },
    body: JSON.stringify({ status: "bogus" }),
  });
  if (res5a.status === 400) {
    pass("Invalid status → 400 OK");
  } else {
    fail(`Invalid status: expected 400, got ${res5a.status}`);
  }

  // 5b: Non-existent order
  const res5b = await fetch(`${appUrl}/api/admin/orders/00000000-0000-0000-0000-000000000000/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookieStr },
    body: JSON.stringify({ status: "shipped" }),
  });
  if (res5b.status === 404) {
    pass("Non-existent order → 404 OK");
  } else {
    fail(`Non-existent order: expected 404, got ${res5b.status}`);
  }

  // 5c: No auth
  const res5c = await fetch(`${appUrl}/api/admin/orders/${order.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "shipped" }),
  });
  if (res5c.status === 401) {
    pass("No auth → 401 OK");
  } else {
    fail(`No auth: expected 401, got ${res5c.status}`);
  }

  // Step 6: Credits API lifecycle
  log("--", "Step 6: Credits API");

  // Create a test customer for credits
  const { data: creditCust } = await sb.from("customers").insert({
    email: "credits-lifecycle@test.de",
    name: "Credits Test",
    customer_type: "regular",
    credits_remaining: 0,
  }).select().single();

  if (creditCust) {
    // Add credits
    const addRes = await fetch(`${appUrl}/api/admin/customers/${creditCust.id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieStr },
      body: JSON.stringify({ amount: 25, description: "Lifecycle test credit" }),
    });
    const addBody = await addRes.json();
    if (addRes.status === 200 && addBody.new_balance === 25) {
      pass(`Credits added: new_balance=25`);
    } else {
      fail(`Credits add failed: ${JSON.stringify(addBody)}`);
    }

    // Verify transaction
    const { data: txs } = await sb.from("credit_transactions").select("*").eq("customer_id", creditCust.id);
    if (txs && txs.length === 1 && txs[0].amount === 25 && txs[0].balance_after === 25) {
      pass("Credit transaction recorded correctly");
    } else {
      fail(`Transaction mismatch: ${JSON.stringify(txs)}`);
    }

    // Negative: zero amount
    const zeroRes = await fetch(`${appUrl}/api/admin/customers/${creditCust.id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieStr },
      body: JSON.stringify({ amount: 0, description: "should fail" }),
    });
    if (zeroRes.status === 400) {
      pass("Zero credits → 400 OK");
    } else {
      fail(`Zero credits: expected 400, got ${zeroRes.status}`);
    }

    // Cleanup lifecycle customer
    await sb.from("credit_transactions").delete().eq("customer_id", creditCust.id);
    await sb.from("customers").delete().eq("id", creditCust.id);
  }

  log(">>", "Lifecycle simulation complete!");
}

// ── Dashboard Verification ──

async function verifyDashboard(): Promise<void> {
  log(">>", "Verifying dashboard data...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // KPI 1: New orders today
  const { count: newToday } = await sb.from("orders").select("id", { count: "exact", head: true })
    .eq("status", "paid").gte("created_at", today.toISOString());
  log("  ", `New Orders Today: ${newToday}`);

  // KPI 2: Pending printing
  const { count: printing } = await sb.from("orders").select("id", { count: "exact", head: true })
    .eq("status", "in_production");
  log("  ", `Pending Printing: ${printing}`);

  // KPI 3: Ready to ship
  const { count: readyShip } = await sb.from("orders").select("id", { count: "exact", head: true })
    .in("status", ["ready_for_pickup", "shipped"]);
  log("  ", `Ready to Ship: ${readyShip}`);

  // KPI 4: Revenue this month
  const { data: revOrders } = await sb.from("orders").select("price_cents")
    .gte("created_at", firstOfMonth.toISOString()).not("price_cents", "is", null);
  const revenue = (revOrders ?? []).reduce((sum, o) => sum + (o.price_cents ?? 0), 0);
  log("  ", `Revenue This Month: €${(revenue / 100).toFixed(2)}`);

  // KPI 5: Low credit alerts
  const { count: lowCredit } = await sb.from("customers").select("id", { count: "exact", head: true })
    .eq("customer_type", "regular").lt("credits_remaining", 5);
  log("  ", `Low Credit Alerts: ${lowCredit}`);

  // Total counts
  const { count: totalOrders } = await sb.from("orders").select("id", { count: "exact", head: true });
  const { count: totalCustomers } = await sb.from("customers").select("id", { count: "exact", head: true });
  const { count: totalPromos } = await sb.from("promo_codes").select("id", { count: "exact", head: true });
  log("  ", `Total Orders: ${totalOrders}`);
  log("  ", `Total Customers: ${totalCustomers}`);
  log("  ", `Total Promo Codes: ${totalPromos}`);

  pass("Dashboard verification complete");
}

// ── Main ──

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isCleanup = args.includes("--cleanup");
  const isLifecycleOnly = args.includes("--lifecycle-only");

  console.log("=".repeat(60));
  console.log("  Trauerpost — Test Data Seeder & Lifecycle Simulator");
  console.log("=".repeat(60));
  console.log();

  if (isCleanup) {
    await cleanup();
    return;
  }

  if (isLifecycleOnly) {
    await simulateLifecycle(APP_URL);
    return;
  }

  // Full run: cleanup → seed → lifecycle → verify
  await cleanup();
  console.log();
  await seed();
  console.log();
  await simulateLifecycle(APP_URL);
  console.log();
  await verifyDashboard();

  console.log();
  console.log("=".repeat(60));
  console.log("  Done! Open http://localhost:3000/de/admin to see the dashboard");
  console.log("  Run with --cleanup to remove seed data");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
