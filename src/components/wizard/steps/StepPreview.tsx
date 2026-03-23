"use client";

import { useState } from "react";
import Image from "next/image";
import type { WizardState } from "@/lib/editor/wizard-state";

interface StepPreviewProps {
  state: WizardState;
}

type PreviewMode = "flat" | "flip" | "3d";

export default function StepPreview({ state }: StepPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("flat");
  const [flipped, setFlipped] = useState(false);

  const modes: { key: PreviewMode; label: string }[] = [
    { key: "flat", label: "Overview" },
    { key: "flip", label: "Flip" },
    { key: "3d", label: "3D" },
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
            onClick={() => { setMode(m.key); setFlipped(false); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === m.key
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Flat preview */}
      {mode === "flat" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Back */}
          <div className="text-center">
            <p className="text-sm text-brand-gray mb-3">Back</p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border shadow-lg bg-brand-light-gray">
              {state.backImageUrl ? (
                <Image src={state.backImageUrl} alt="Back" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-gray text-sm">No image</div>
              )}
            </div>
          </div>

          {/* Inside Left — Photo */}
          <div className="text-center">
            <p className="text-sm text-brand-gray mb-3">Inside Left</p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border shadow-lg bg-white">
              {state.photoUrl ? (
                <Image src={state.photoUrl} alt="Photo" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-gray text-sm">No photo</div>
              )}
            </div>
          </div>

          {/* Inside Right — Text */}
          <div className="text-center">
            <p className="text-sm text-brand-gray mb-3">Inside Right</p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border shadow-lg bg-white p-6 flex items-center justify-center">
              <p
                className="whitespace-pre-wrap leading-relaxed w-full"
                style={{
                  fontFamily: state.fontFamily,
                  fontSize: `${Math.min(state.fontSize, 14)}px`,
                  color: state.fontColor,
                  textAlign: state.textAlign,
                }}
              >
                {state.text || "No text"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flip preview */}
      {mode === "flip" && (
        <div className="flex flex-col items-center gap-6">
          <div
            className="relative w-72 h-96 cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front face (back of card) */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden shadow-xl border border-brand-border"
                style={{ backfaceVisibility: "hidden" }}
              >
                {state.backImageUrl ? (
                  <Image src={state.backImageUrl} alt="Back" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-light-gray flex items-center justify-center text-brand-gray">Back</div>
                )}
              </div>

              {/* Rear face (inside) */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden shadow-xl border border-brand-border bg-white"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex h-full">
                  {/* Left — photo */}
                  <div className="w-1/2 border-r border-brand-border relative">
                    {state.photoUrl ? (
                      <Image src={state.photoUrl} alt="Photo" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-gray text-xs">Photo</div>
                    )}
                  </div>
                  {/* Right — text */}
                  <div className="w-1/2 p-4 flex items-center justify-center">
                    <p
                      className="whitespace-pre-wrap leading-relaxed w-full text-xs"
                      style={{
                        fontFamily: state.fontFamily,
                        color: state.fontColor,
                        textAlign: state.textAlign,
                      }}
                    >
                      {state.text || "Text"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-brand-gray">Click the card to flip it</p>
        </div>
      )}

      {/* 3D preview placeholder */}
      {mode === "3d" && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-80 h-96 rounded-xl bg-brand-light-gray border border-brand-border flex items-center justify-center">
            <div className="text-center text-brand-gray">
              <p className="text-lg mb-2">3D Preview</p>
              <p className="text-sm">Coming soon — interactive 3D card mockup</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
