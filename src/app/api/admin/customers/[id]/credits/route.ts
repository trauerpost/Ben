import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
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

  const { data: adminCheck } = await supabase
    .from("customers")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!adminCheck || adminCheck.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate body
  let body: { amount?: number; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, description } = body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number" },
      { status: 400 }
    );
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  // Check customer exists
  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("id, credits_remaining")
    .eq("id", id)
    .single();

  if (fetchError || !customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  const newBalance = customer.credits_remaining + amount;

  // Update credits
  const { error: updateError } = await supabase
    .from("customers")
    .update({ credits_remaining: newBalance })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 }
    );
  }

  // Create credit transaction record
  const { error: txError } = await supabase
    .from("credit_transactions")
    .insert({
      customer_id: id,
      amount,
      balance_after: newBalance,
      description: description.trim(),
    });

  if (txError) {
    return NextResponse.json(
      { error: "Credits updated but transaction log failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, new_balance: newBalance });
}
