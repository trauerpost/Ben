"use client";

import { useState } from "react";
import { generatePDF, downloadPDF } from "@/lib/editor/pdf-generator";

interface CardPreviewProps {
  svgString: string;
}

export default function CardPreview({ svgString }: CardPreviewProps) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    if (!svgString || generating) return;
    setGenerating(true);
    try {
      const blob = await generatePDF(svgString);
      downloadPDF(blob, "trauerpost-card.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-brand-border">
        <div
          className="w-[624px] h-[444px] max-w-full"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={generating || !svgString}
        className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? "Generating PDF..." : "Download PDF"}
      </button>
    </div>
  );
}
