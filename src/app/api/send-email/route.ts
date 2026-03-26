import { NextRequest, NextResponse } from "next/server";
import { sendOrderEmails } from "@/lib/email/send-order-email";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { to, customerName, orderId, cardType, quantity, pdfUrl } = await request.json();

    if (!to || !orderId) {
      return NextResponse.json(
        { error: "Recipient email and order ID are required" },
        { status: 400 }
      );
    }

    await sendOrderEmails({
      customerEmail: to,
      customerName: customerName ?? "",
      orderId,
      cardType: cardType ?? "Karte",
      quantity: quantity ?? 1,
      pdfUrl: pdfUrl ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-email] Error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
