import { NextRequest, NextResponse } from "next/server";

// Stripe integration placeholder
// Wire in Stripe when ready: npm install stripe

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentMethod } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (paymentMethod === "credit") {
      // TODO: Call deduct_credit() Supabase function
      return NextResponse.json({
        success: true,
        method: "credit",
        message: "Credit deducted",
      });
    }

    // TODO: Create Stripe Checkout session
    return NextResponse.json({
      success: true,
      method: "stripe",
      message: "Stripe checkout placeholder — wire in when ready",
      checkoutUrl: null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
