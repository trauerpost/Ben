import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import type { SizeOption, MaterialOption } from "@/lib/supabase/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();

  // Auth check — must be logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { product_id, size_id, material_id, quantity, photo_url } = body;

  // Validate required fields
  if (!product_id || !size_id || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch product from DB
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .eq("is_active", true)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Server-side price calculation — never trust client
  const sizeOptions = product.size_options as SizeOption[];
  const materialOptions = product.material_options as MaterialOption[];

  const selectedSize = sizeOptions.find((s) => s.id === size_id);
  if (!selectedSize) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

  let materialSurcharge = 0;
  if (material_id) {
    const selectedMaterial = materialOptions.find((m) => m.id === material_id);
    if (!selectedMaterial) {
      return NextResponse.json({ error: "Invalid material" }, { status: 400 });
    }
    materialSurcharge = selectedMaterial.price_cents;
  }

  // Photo required check
  if (product.requires_photo && !photo_url) {
    return NextResponse.json({ error: "Photo is required for this product" }, { status: 400 });
  }

  const price_cents = (selectedSize.price_cents + materialSurcharge) * quantity;

  // Find customer
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customer?.id ?? null,
      product_id: product.id,
      status: "paid",
      card_type: null,
      card_data: {
        product_name: product.name,
        size: size_id,
        material: material_id,
        photo_url: photo_url ?? null,
      },
      quantity,
      price_cents,
      currency: product.currency,
      payment_method: customer ? "credit" : "stripe",
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  return NextResponse.json({ order_id: order.id, price_cents }, { status: 201 });
}
