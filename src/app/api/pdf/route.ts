import { NextRequest, NextResponse } from "next/server";
import { generateCardPDF } from "@/lib/editor/pdf-generator";
import type { WizardState } from "@/lib/editor/wizard-state";

/**
 * Server-side PDF generation endpoint.
 * Uses Puppeteer + renderSpreadHTML for accurate text rendering.
 * Required for bifold cards where inner pages render at 70mm width.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const state = body.state as WizardState | undefined;

    if (!state?.templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    // Extract origin for resolving relative asset URLs
    const origin = request.headers.get("x-forwarded-proto") && request.headers.get("x-forwarded-host")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : request.headers.get("origin")
      ?? new URL(request.url).origin;

    console.log(`[pdf-api] Generating PDF for template: ${state.templateId}, text.name: "${state.textContent?.name}", text.heading: "${state.textContent?.heading}"`);

    const pdfBuffer = await generateCardPDF(state, { baseUrl: origin });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="karte-${state.templateId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[pdf-api] Error:", error);
    return NextResponse.json({
      error: "PDF generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
