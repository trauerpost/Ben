"use client";

import SpreadPreview from "./SpreadPreview";
import CardRenderer from "./CardRenderer";
import type { WizardState } from "@/lib/editor/wizard-state";

interface CardMockupProps {
  state: WizardState;
  style?: "table" | "envelope" | "flat";
}

const surfaceStyles: Record<string, React.CSSProperties> = {
  table: {
    background: "linear-gradient(135deg, #f5f0eb 0%, #e8e2dc 100%)",
  },
  envelope: {
    background: "linear-gradient(135deg, #f5f0eb 0%, #e8e2dc 100%)",
  },
  flat: {
    background: "#fafafa",
  },
};

const cardTransforms: Record<string, React.CSSProperties> = {
  table: {
    transform: "perspective(1200px) rotateY(-5deg) rotateX(3deg)",
    boxShadow:
      "10px 15px 30px rgba(0, 0, 0, 0.15), 2px 3px 8px rgba(0, 0, 0, 0.1)",
  },
  envelope: {
    transform: "perspective(1200px) rotateY(-3deg) rotateX(2deg)",
    boxShadow:
      "8px 12px 25px rgba(0, 0, 0, 0.12), 2px 3px 6px rgba(0, 0, 0, 0.08)",
  },
  flat: {
    transform: "none",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05)",
  },
};

export default function CardMockup({
  state,
  style = "table",
}: CardMockupProps): React.ReactElement {
  const isV2 = state.templateId?.startsWith("TI") ?? false;

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-xl p-6 sm:p-10 md:p-14"
      style={surfaceStyles[style]}
    >
      {/* Surface texture overlay */}
      {style !== "flat" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='%23c0b8af' opacity='0.3'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}
        />
      )}

      {/* Envelope behind the card */}
      {style === "envelope" && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm sm:bottom-6"
          style={{
            width: "85%",
            maxWidth: "340px",
            height: "60%",
            background: "linear-gradient(180deg, #e8e0d4 0%, #d9cfc2 100%)",
            boxShadow:
              "0 6px 18px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
            transform: "perspective(1200px) rotateY(-3deg) rotateX(2deg)",
            zIndex: 0,
          }}
        >
          {/* Envelope flap */}
          <div
            className="absolute top-0 left-0 w-full"
            style={{
              height: "40%",
              background: "linear-gradient(180deg, #d9cfc2 0%, #cec3b5 100%)",
              clipPath: "polygon(0 0, 50% 60%, 100% 0)",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          />
        </div>
      )}

      {/* Card with 3D transform */}
      <div
        className="relative z-10 w-full max-w-[280px] transition-transform duration-300 sm:max-w-[320px] md:max-w-[380px]"
        style={{
          ...cardTransforms[style],
          transformStyle: "preserve-3d",
        }}
      >
        <div className="overflow-hidden rounded-sm bg-white">
          {isV2 ? (
            <SpreadPreview state={state} />
          ) : (
            <CardRenderer
              templateId={state.templateId ?? ""}
              panelId="front"
              state={state}
            />
          )}
        </div>
      </div>
    </div>
  );
}
