import { NextRequest, NextResponse } from "next/server";
import { sendOrderEmails } from "@/lib/email/send-order-email";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { to, customerName, orderId, cardType, quantity, pdfBase64 } = await request.json();

    if (!to || !orderId) {
      return NextResponse.json(
        { error: "Recipient email and order ID are required" },
        { status: 400 }
      );
    }

    const pdfBuffer = pdfBase64 ? Buffer.from(pdfBase64, "base64") : null;

    await sendOrderEmails({
      customerEmail: to,
      customerName: customerName ?? "",
      orderId,
      cardType: cardType ?? "Karte",
      quantity: quantity ?? 1,
      pdfBuffer,
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
