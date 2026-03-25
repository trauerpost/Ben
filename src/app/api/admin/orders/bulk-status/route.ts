import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();

  // Admin auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminCheck } = await supabase
    .from("customers")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!adminCheck || adminCheck.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { order_ids, status } = body;

  // Validate
  if (!Array.isArray(order_ids) || order_ids.length === 0) {
    return NextResponse.json({ error: "order_ids must be a non-empty array" }, { status: 400 });
  }
  if (order_ids.length > 50) {
    return NextResponse.json({ error: "Maximum 50 orders per batch" }, { status: 400 });
  }
  const validStatuses = ["in_production", "ready_for_pickup", "shipped", "completed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Single DB update for all orders
  const updateData: Record<string, unknown> = { status };
  if (status === "shipped") updateData.shipped_at = new Date().toISOString();
  if (status === "ready_for_pickup") updateData.pickup_ready_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .in("id", order_ids)
    .select("id, customer_id, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    updated: data?.length ?? 0,
    status,
  });
}
