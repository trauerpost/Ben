import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

const VALID_STATUSES: OrderStatus[] = [
  "in_production",
  "ready_for_pickup",
  "shipped",
  "completed",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();

  // Admin auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer || customer.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate body
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newStatus = body.status as OrderStatus;
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Check order exists
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, customer_id, guest_email")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Build update payload
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "shipped") {
    updateData.shipped_at = new Date().toISOString();
  }
  if (newStatus === "ready_for_pickup") {
    updateData.pickup_ready_at = new Date().toISOString();
  }

  // Update order
  const { error: updateError } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }

  // Send email notification for shipped / ready_for_pickup
  let emailSent = false;
  if (newStatus === "shipped" || newStatus === "ready_for_pickup") {
    // Resolve customer email
    let email: string | null = order.guest_email;
    if (!email && order.customer_id) {
      const { data: cust } = await supabase
        .from("customers")
        .select("email")
        .eq("id", order.customer_id)
        .single();
      email = cust?.email ?? null;
    }

    if (email) {
      const subject =
        newStatus === "shipped"
          ? "Ihre Karten wurden verschickt"
          : "Ihre Karten sind zur Abholung bereit";

      try {
        const baseUrl = request.nextUrl.origin;
        await fetch(`${baseUrl}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, subject, orderId: id }),
        });
        emailSent = true;
      } catch {
        // Email failure is non-blocking
      }
    }
  }

  if (
    (newStatus === "shipped" || newStatus === "ready_for_pickup") &&
    !emailSent
  ) {
    return NextResponse.json({
      success: true,
      emailSent: false,
      warning: "Status updated but email failed",
    });
  }

  return NextResponse.json({ success: true, emailSent });
}
