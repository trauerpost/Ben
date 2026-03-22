import { NextRequest, NextResponse } from "next/server";

// Email transport placeholder
// Wire in Resend/SendGrid when ready: npm install resend

export async function POST(request: NextRequest) {
  try {
    const { to, subject, orderId, pdfUrl } = await request.json();

    if (!to || !orderId) {
      return NextResponse.json(
        { error: "Recipient email and order ID are required" },
        { status: 400 }
      );
    }

    // TODO: Send email with PDF attachment + invoice
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} | Order: ${orderId} | PDF: ${pdfUrl}`);

    return NextResponse.json({
      success: true,
      message: "Email placeholder — wire in transport when ready",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
