"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import CardRenderer, { getPanelsForTemplate } from "../CardRenderer";
import SpreadPreview from "../SpreadPreview";
import CardMockup from "../CardMockup";
import type { WizardState } from "@/lib/editor/wizard-state";
import { getCardDimensions } from "@/lib/editor/wizard-state";

interface StepPreviewProps {
  state: WizardState;
}

type PreviewMode = "flat" | "flip" | "3d" | "mockup";

const PANEL_LABELS: Record<string, string> = {
  front: "Front",
  back: "Back",
  "inside-left": "Inside Left",
  "inside-right": "Inside Right",
};

export default function StepPreview({ state }: StepPreviewProps) {
  const t = useTranslations("wizard.preview");
  const [mode, setMode] = useState<PreviewMode>("flat");
  const [showMockup, setShowMockup] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [foldAngle, setFoldAngle] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const templateId = state.templateId ?? "";
  const isV2 = templateId.startsWith("TI");
  const panels = isV2 ? [] : getPanelsForTemplate(templateId);
  const isFolded = state.cardFormat === "folded";

  async function handleClientPdf(): Promise<void> {
    if (!previewRef.current) return;
    const dims = getCardDimensions(state);
    if (!dims) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const { generateClientPDF } = await import("@/lib/editor/client-pdf-generator");
      const blob = await generateClientPDF(previewRef.current, dims.widthMm, dims.heightMm);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trauerpost-${state.cardType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setPdfError("Local PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleDownloadPdf(): Promise<void> {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trauerpost-${state.cardType}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        if (data.pdfUrl) {
          window.open(data.pdfUrl, "_blank");
        }
      }
    } catch {
      setPdfError(t("downloadError"));
    } finally {
      setPdfLoading(false);
    }
  }

  if (!templateId) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-brand-gray">{t("noTemplate")}</p>
      </div>
    );
  }

  const modes: { key: PreviewMode; label: string; icon: string }[] = [
    { key: "flat", label: "Overview", icon: "\u25A6" },
    { key: "flip", label: "Flip", icon: "\u21BB" },
    ...(isFolded ? [{ key: "3d" as PreviewMode, label: "3D", icon: "\u25C6" }] : []),
    { key: "mockup", label: t("mockup"), icon: "\u25A3" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-8">
        {t("subtitle")}
      </p>

      {/* v2 Spread preview — single page templates */}
      {isV2 && (
        <div className="flex flex-col items-center gap-6 mb-10">
          {/* Toggle between Preview and Mockup */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowMockup(false)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                !showMockup
                  ? "bg-brand-primary text-white"
                  : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
              }`}
            >
              {t("title")}
            </button>
            <button
              onClick={() => setShowMockup(true)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                showMockup
                  ? "bg-brand-primary text-white"
                  : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
              }`}
            >
              {t("mockup")}
            </button>
          </div>

          {showMockup ? (
            <CardMockup state={state} style="table" />
          ) : (
            <>
              <div ref={previewRef}>
                <SpreadPreview state={state} />
              </div>
              <p className="text-xs text-brand-gray">
                Live preview — the PDF will have higher quality fonts and images.
              </p>
            </>
          )}
        </div>
      )}

      {/* Mode selector (v1 only) */}
      {!isV2 && (
        <div className="flex justify-center gap-2 mb-10">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setFlipped(false);
                setFoldAngle(0);
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                mode === m.key
                  ? "bg-brand-primary text-white"
                  : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
              }`}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Flat preview — all panels side by side */}
      {!isV2 && mode === "flat" && (
        <div ref={previewRef} className={`grid gap-6 ${
          panels.length === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" :
          panels.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" :
          "grid-cols-1"
        }`}>
          {panels.map((panelId) => (
            <div key={panelId} className="text-center">
              <p className="text-sm text-brand-gray mb-3 font-medium">
                {PANEL_LABELS[panelId] ?? panelId}
              </p>
              <CardRenderer templateId={templateId} panelId={panelId} state={state} scale={1} />
            </div>
          ))}
        </div>
      )}

      {/* Flip preview — front/back flip (v1 only) */}
      {!isV2 && mode === "flip" && (
        <div className="flex flex-col items-center gap-6">
          <div
            className="relative w-72 cursor-pointer"
            style={{
              perspective: "1200px",
              aspectRatio: state.cardType === "sterbebild" ? "140/105" : "185/115",
            }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-700 ease-in-out"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front face */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardRenderer templateId={templateId} panelId="front" state={state} />
              </div>

              {/* Back face */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <CardRenderer
                  templateId={templateId}
                  panelId={isFolded ? "inside-left" : "back"}
                  state={state}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-brand-gray animate-pulse">
            Click the card to flip
          </p>
        </div>
      )}

      {/* 3D folding card — only for folded v1 cards */}
      {!isV2 && mode === "3d" && isFolded && (
        <div className="flex flex-col items-center gap-8">
          <div
            className="relative"
            style={{
              perspective: "1500px",
              perspectiveOrigin: "50% 40%",
            }}
          >
            <div
              className="relative"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateX(15deg) rotateY(-20deg)",
              }}
            >
              {/* Right panel (inside right - text) -- base */}
              <div
                className="relative w-56 overflow-hidden border border-brand-border bg-white shadow-xl rounded-r-xl"
                style={{
                  aspectRatio: "185/115",
                  transformStyle: "preserve-3d",
                  transform: "translateX(14rem)",
                }}
              >
                <CardRenderer templateId={templateId} panelId="inside-right" state={state} />
              </div>

              {/* Left panel (inside left - photo) -- folds */}
              <div
                className="absolute top-0 left-0 w-56 origin-right"
                style={{
                  aspectRatio: "185/115",
                  transformStyle: "preserve-3d",
                  transform: `translateX(0) rotateY(${-foldAngle}deg)`,
                  transition: "transform 0.1s ease-out",
                }}
              >
                {/* Front of left panel (photo) */}
                <div
                  className="absolute inset-0 rounded-l-xl overflow-hidden border border-brand-border bg-white shadow-xl"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <CardRenderer templateId={templateId} panelId="inside-left" state={state} />
                </div>

                {/* Back of left panel (cover image) */}
                <div
                  className="absolute inset-0 rounded-r-xl overflow-hidden border border-brand-border shadow-xl"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CardRenderer templateId={templateId} panelId="front" state={state} />
                </div>
              </div>
            </div>
          </div>

          {/* Fold slider */}
          <div className="w-80 text-center">
            <label className="text-sm text-brand-gray block mb-3">
              {foldAngle < 30
                ? "Open \u2014 drag to fold the card"
                : foldAngle < 120
                  ? "Folding..."
                  : foldAngle < 160
                    ? "Almost closed"
                    : "Closed \u2014 the front is visible"}
            </label>
            <input
              type="range"
              min={0}
              max={180}
              value={foldAngle}
              onChange={(e) => setFoldAngle(Number(e.target.value))}
              className="w-full accent-brand-primary cursor-pointer"
            />
            <div className="flex justify-between text-xs text-brand-gray mt-1">
              <span>Open</span>
              <span>Closed</span>
            </div>
          </div>

          {/* Quick angle buttons */}
          <div className="flex gap-3">
            {[
              { label: "Open", angle: 0 },
              { label: "45\u00B0", angle: 45 },
              { label: "90\u00B0", angle: 90 },
              { label: "Closed", angle: 180 },
            ].map((preset) => (
              <button
                key={preset.angle}
                onClick={() => setFoldAngle(preset.angle)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  Math.abs(foldAngle - preset.angle) < 10
                    ? "bg-brand-primary text-white"
                    : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mockup mode (v1 only) */}
      {!isV2 && mode === "mockup" && (
        <div className="flex flex-col items-center">
          <CardMockup state={state} style="table" />
        </div>
      )}

      {/* PDF Download buttons */}
      <div className="flex flex-col items-center gap-3 mt-10">
        <div className="flex gap-3">
          <button
            onClick={handleClientPdf}
            disabled={pdfLoading}
            className="px-6 py-3 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? t("downloading") : "PDF (Local)"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="px-6 py-3 rounded-xl bg-brand-dark text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? t("downloading") : t("downloadPdf")}
          </button>
        </div>
        {pdfLoading && (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-brand-primary border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600">Generating PDF...</span>
          </div>
        )}
        {pdfError && (
          <div className="bg-red-50 border border-red-200 rounded p-4 max-w-md">
            <p className="text-red-700 font-medium">PDF generation failed</p>
            <p className="text-red-600 text-sm mt-1">{pdfError}</p>
            <button onClick={handleClientPdf} className="mt-2 text-sm underline text-brand-primary">
              Try local download instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
