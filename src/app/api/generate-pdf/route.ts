import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCardPDF } from "@/lib/editor/pdf-generator";
import type { WizardState } from "@/lib/editor/wizard-state";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const state = body.state as WizardState | undefined;

    if (!state?.cardType) {
      return NextResponse.json(
        { error: "Card type is required" },
        { status: 400 }
      );
    }

    if (!state.templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }
    if (!state.textContent?.name?.trim()) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generateCardPDF(state);

    // Upload to Supabase Storage
    const supabaseUrl = process.env.supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_Secret;

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: return PDF as direct download
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="trauerpost-${state.cardType}-${Date.now()}.pdf"`,
        },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const timestamp = Date.now();
    const filePath = `pdfs/${timestamp}-${state.cardType}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("card-pdfs")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[generate-pdf] Upload failed:", uploadError);
      // Fallback: return PDF as direct download
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="trauerpost-${state.cardType}-${timestamp}.pdf"`,
        },
      });
    }

    const { data: urlData } = supabase.storage
      .from("card-pdfs")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      pdfUrl: urlData.publicUrl,
      filename: `trauerpost-${state.cardType}-${timestamp}.pdf`,
    });
  } catch (error) {
    console.error("[generate-pdf] Error:", error);
    return NextResponse.json({
      error: "PDF generation failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
