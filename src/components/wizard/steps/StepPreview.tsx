"use client";

import { useState } from "react";
import Image from "next/image";
import type { WizardState } from "@/lib/editor/wizard-state";

interface StepPreviewProps {
  state: WizardState;
}

type PreviewMode = "flat" | "flip" | "3d";

function CardBack({ backImageUrl }: { backImageUrl: string | null }) {
  return backImageUrl ? (
    <Image src={backImageUrl} alt="Back" fill className="object-cover" sizes="300px" />
  ) : (
    <div className="w-full h-full bg-brand-light-gray flex items-center justify-center text-brand-gray text-sm">
      No image
    </div>
  );
}

function CardInsideLeft({ photoUrl }: { photoUrl: string | null }) {
  return photoUrl ? (
    <Image src={photoUrl} alt="Photo" fill className="object-cover" sizes="150px" />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-brand-gray text-xs">
      Photo
    </div>
  );
}

function CardInsideRight({ state }: { state: WizardState }) {
  return (
    <div className="w-full h-full p-4 flex items-center justify-center bg-white">
      <p
        className="whitespace-pre-wrap leading-relaxed w-full"
        style={{
          fontFamily: state.fontFamily,
          fontSize: `${Math.min(state.fontSize, 12)}px`,
          color: state.fontColor,
          textAlign: state.textAlign,
        }}
      >
        {state.text || "Text"}
      </p>
    </div>
  );
}

export default function StepPreview({ state }: StepPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("flat");
  const [flipped, setFlipped] = useState(false);
  const [foldAngle, setFoldAngle] = useState(0);

  const modes: { key: PreviewMode; label: string; icon: string }[] = [
    { key: "flat", label: "Overview", icon: "▦" },
    { key: "flip", label: "Flip", icon: "↻" },
    { key: "3d", label: "3D", icon: "◆" },
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

      {/* Flat preview */}
      {mode === "flat" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-brand-gray mb-3 font-medium">Back</p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border shadow-lg bg-brand-light-gray">
              <CardBack backImageUrl={state.backImageUrl} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-gray mb-3 font-medium">Inside Left</p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border shadow-lg bg-white">
              <CardInsideLeft photoUrl={state.photoUrl} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-brand-gray mb-3 font-medium">Inside Right</p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border shadow-lg bg-white">
              <CardInsideRight state={state} />
            </div>
          </div>
        </div>
      )}

      {/* Flip preview */}
      {mode === "flip" && (
        <div className="flex flex-col items-center gap-6">
          <div
            className="relative w-72 h-96 cursor-pointer"
            style={{ perspective: "1200px" }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-700 ease-in-out"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front face (back of card) */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-brand-border"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardBack backImageUrl={state.backImageUrl} />
              </div>

              {/* Rear face (inside) */}
              <div
                className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-brand-border bg-white"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex h-full">
                  <div className="w-1/2 border-r border-brand-border relative">
                    <CardInsideLeft photoUrl={state.photoUrl} />
                  </div>
                  <div className="w-1/2">
                    <CardInsideRight state={state} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-brand-gray animate-pulse">
            Click the card to flip
          </p>
        </div>
      )}

      {/* 3D folding card mockup */}
      {mode === "3d" && (
        <div className="flex flex-col items-center gap-8">
          {/* 3D Scene */}
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
              {/* Right panel (inside right - text) — base, lies flat */}
              <div
                className="relative w-56 h-72 rounded-r-xl overflow-hidden border border-brand-border bg-white shadow-xl"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "translateX(14rem)",
                }}
              >
                <CardInsideRight state={state} />
              </div>

              {/* Left panel (inside left - photo) — folds from the left edge */}
              <div
                className="absolute top-0 left-0 w-56 h-72 origin-right"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translateX(0) rotateY(${-foldAngle}deg)`,
                  transition: "transform 0.1s ease-out",
                }}
              >
                {/* Front of left panel (photo - visible when open) */}
                <div
                  className="absolute inset-0 rounded-l-xl overflow-hidden border border-brand-border bg-white shadow-xl"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <CardInsideLeft photoUrl={state.photoUrl} />
                </div>

                {/* Back of left panel (back image - visible when folded) */}
                <div
                  className="absolute inset-0 rounded-r-xl overflow-hidden border border-brand-border shadow-xl"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CardBack backImageUrl={state.backImageUrl} />
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
                    : "Closed — the back is visible"}
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
    </div>
  );
}
