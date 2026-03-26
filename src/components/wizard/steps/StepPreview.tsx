"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CardRenderer, { getPanelsForCard } from "../CardRenderer";
import type { CardPanel } from "../CardRenderer";
import type { WizardState } from "@/lib/editor/wizard-state";

interface StepPreviewProps {
  state: WizardState;
}

type PreviewMode = "flat" | "flip" | "3d";

const PANEL_LABELS: Record<CardPanel, string> = {
  front: "Front",
  back: "Back",
  "inside-left": "Inside Left",
  "inside-right": "Inside Right",
};

export default function StepPreview({ state }: StepPreviewProps) {
  const t = useTranslations("wizard.preview");
  const [mode, setMode] = useState<PreviewMode>("flat");
  const [flipped, setFlipped] = useState(false);
  const [foldAngle, setFoldAngle] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const panels = getPanelsForCard(state);
  const isFolded = state.cardFormat === "folded";

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
        // Direct PDF download (fallback when storage upload failed)
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
        // JSON response with pdfUrl
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

  const modes: { key: PreviewMode; label: string; icon: string }[] = [
    { key: "flat", label: "Overview", icon: "▦" },
    { key: "flip", label: "Flip", icon: "↻" },
    ...(isFolded ? [{ key: "3d" as PreviewMode, label: "3D", icon: "◆" }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Preview Your Card
      </h2>
      <p className="text-brand-gray text-center mb-8">
        Review your card before ordering.
      </p>

      {/* Mode selector */}
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

      {/* Flat preview — all panels side by side */}
      {mode === "flat" && (
        <div className={`grid gap-6 ${
          panels.length === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" :
          panels.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" :
          "grid-cols-1"
        }`}>
          {panels.map((panel) => (
            <div key={panel} className="text-center">
              <p className="text-sm text-brand-gray mb-3 font-medium">
                {PANEL_LABELS[panel]}
              </p>
              <CardRenderer state={state} panel={panel} scale={1} />
            </div>
          ))}
        </div>
      )}

      {/* Flip preview — front/back flip */}
      {mode === "flip" && (
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
                <CardRenderer state={state} panel="front" />
              </div>

              {/* Back face */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <CardRenderer
                  state={state}
                  panel={isFolded ? "inside-left" : "back"}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-brand-gray animate-pulse">
            Click the card to flip
          </p>
        </div>
      )}

      {/* 3D folding card — only for folded cards */}
      {mode === "3d" && isFolded && (
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
              {/* Right panel (inside right - text) — base */}
              <div
                className="relative w-56 overflow-hidden border border-brand-border bg-white shadow-xl rounded-r-xl"
                style={{
                  aspectRatio: "185/115",
                  transformStyle: "preserve-3d",
                  transform: "translateX(14rem)",
                }}
              >
                <CardRenderer state={state} panel="inside-right" />
              </div>

              {/* Left panel (inside left - photo) — folds */}
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
                  <CardRenderer state={state} panel="inside-left" />
                </div>

                {/* Back of left panel (cover image) */}
                <div
                  className="absolute inset-0 rounded-r-xl overflow-hidden border border-brand-border shadow-xl"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CardRenderer state={state} panel="front" />
                </div>
              </div>
            </div>
          </div>

          {/* Fold slider */}
          <div className="w-80 text-center">
            <label className="text-sm text-brand-gray block mb-3">
              {foldAngle < 30
                ? "Open — drag to fold the card"
                : foldAngle < 120
                  ? "Folding..."
                  : foldAngle < 160
                    ? "Almost closed"
                    : "Closed — the front is visible"}
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
              { label: "45°", angle: 45 },
              { label: "90°", angle: 90 },
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

      {/* PDF Download button */}
      <div className="flex flex-col items-center gap-3 mt-10">
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="px-8 py-3 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pdfLoading ? t("downloading") : t("downloadPdf")}
        </button>
        {pdfError && (
          <p className="text-sm text-red-600">{pdfError}</p>
        )}
      </div>
    </div>
  );
}
