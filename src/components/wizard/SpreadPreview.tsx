"use client";

import { useMemo } from "react";
import Image from "next/image";
import { getTemplateConfig } from "@/lib/editor/template-configs";
import type { TemplateElement } from "@/lib/editor/template-configs";
import type { WizardState } from "@/lib/editor/wizard-state";

interface SpreadPreviewProps {
  state: WizardState;
  /** Scale factor for the preview container (default 1 = 100% of parent width) */
  scale?: number;
}

function getFieldValue(state: WizardState, field: string): string {
  const val = state.textContent[field as keyof typeof state.textContent];
  return typeof val === "string" ? val : "";
}

function ElementPreview({ el, state }: { el: TemplateElement; state: WizardState }) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${(el.x / 1000) * 100}%`,
    top: `${(el.y / 1000) * 100}%`,
    width: `${(el.w / 1000) * 100}%`,
    height: `${(el.h / 1000) * 100}%`,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  if (el.type === "text") {
    const value = el.field ? getFieldValue(state, el.field) : (el.fixedContent ?? "");
    if (!value) return null;

    const globalFont = state.textContent.fontFamily;
    const font = el.fontFamily ?? globalFont;

    return (
      <div
        style={{
          ...style,
          display: "flex",
          flexDirection: "column",
          alignItems: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: `'${font}', serif`,
            fontSize: `${(el.fontSize ?? 9) * 0.8}pt`,
            fontWeight: el.fontWeight ?? "normal",
            fontStyle: el.fontStyle ?? "normal",
            fontVariant: el.fontVariant ?? "normal",
            textTransform: (el.textTransform ?? "none") as React.CSSProperties["textTransform"],
            textAlign: (el.textAlign ?? "center") as React.CSSProperties["textAlign"],
            letterSpacing: el.letterSpacing ?? "0",
            color: el.color ?? state.textContent.fontColor ?? "#1A1A1A",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            width: "100%",
          }}
        >
          {value}
        </div>
      </div>
    );
  }

  if (el.type === "image") {
    if (!state.photo.url) {
      return (
        <div
          style={{
            ...style,
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "10px",
          }}
        >
          Foto
        </div>
      );
    }

    const clipStyle: React.CSSProperties = {};
    if (el.imageClip === "ellipse") {
      clipStyle.clipPath = "ellipse(50% 50% at 50% 50%)";
      clipStyle.borderRadius = "50%";
    }
    if (el.imageClip === "rounded") {
      clipStyle.borderRadius = "8px";
    }
    if (el.imageBorder) {
      clipStyle.border = el.imageBorder;
    }

    // Apply crop if available
    const crop = state.photo.crop;
    if (el.useCrop !== false && crop && crop.width > 0 && crop.height > 0) {
      const sizeX = (1 / crop.width * 100);
      const sizeY = (1 / crop.height * 100);
      const posX = (crop.x / (1 - crop.width) * 100);
      const posY = (crop.y / (1 - crop.height) * 100);
      return (
        <div
          style={{
            ...style,
            ...clipStyle,
            backgroundImage: `url('${state.photo.url}')`,
            backgroundSize: `${sizeX}% ${sizeY}%`,
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      );
    }

    return (
      <div
        style={{
          ...style,
          ...clipStyle,
          backgroundImage: `url('${state.photo.url}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />
    );
  }

  if (el.type === "line") {
    return (
      <div
        style={{
          ...style,
          borderTop: el.lineStyle ?? "1px solid #ccc",
        }}
      />
    );
  }

  if (el.type === "ornament" && el.fixedAsset) {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={el.fixedAsset}
          alt=""
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: (el.imageFit ?? "contain") as React.CSSProperties["objectFit"],
          }}
        />
      </div>
    );
  }

  return null;
}

export default function SpreadPreview({ state, scale = 1 }: SpreadPreviewProps) {
  const config = useMemo(
    () => (state.templateId ? getTemplateConfig(state.templateId) : null),
    [state.templateId]
  );

  if (!config) {
    return <div className="text-center text-brand-gray text-sm">No template selected</div>;
  }

  const aspect = config.spreadWidthMm / config.spreadHeightMm;

  return (
    <div
      className="relative bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden mx-auto"
      style={{
        aspectRatio: `${aspect}`,
        width: `${100 * scale}%`,
        maxWidth: `${560 * scale}px`,
      }}
    >
      {config.elements.map((el) => (
        <ElementPreview key={el.id} el={el} state={state} />
      ))}
    </div>
  );
}
