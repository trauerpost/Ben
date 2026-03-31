"use client";

import React, { useMemo, useState, useEffect, useRef, useLayoutEffect, type RefObject } from "react";
import { useActiveField } from "./ActiveFieldContext";
import { getTemplateConfig } from "@/lib/editor/template-configs";
import type { TemplateElement } from "@/lib/editor/template-configs";
import type { WizardState, TextContent, WizardAction } from "@/lib/editor/wizard-state";
import InteractiveElement from "./InteractiveElement";

interface SpreadPreviewProps {
  state: WizardState;
  /** Scale factor for the preview container (default 1 = 100% of parent width) */
  scale?: number;
  /** When true, elements are clickable/selectable (Batches 3-6 features) */
  interactive?: boolean;
  dispatch?: React.Dispatch<import("@/lib/editor/wizard-state").WizardAction>;
}

function getFieldValue(state: WizardState, field: string): string {
  const val = state.textContent[field as keyof typeof state.textContent];
  return typeof val === "string" ? val : "";
}

/** Map element field name to the user's font size override from textContent */
function getUserFontSize(tc: TextContent, field: string | undefined): number | null {
  if (!field) return null;
  const map: Record<string, keyof TextContent> = {
    heading: "headingFontSize",
    name: "nameFontSize",
    dates: "datesFontSize",
    birthDate: "datesFontSize",
    deathDate: "datesFontSize",
    quote: "quoteFontSize",
    quoteAuthor: "quoteAuthorFontSize",
    closingVerse: "closingVerseFontSize",
    locationBirth: "locationFontSize",
    locationDeath: "locationFontSize",
  };
  const sizeField = map[field];
  if (!sizeField) return null;
  const val = tc[sizeField];
  return typeof val === "number" ? val : null;
}

/** Build Google Fonts URL for all fonts used */
function buildFontUrl(fonts: string[]): string {
  const unique = [...new Set(fonts)];
  const families = unique.map(f => `family=${encodeURIComponent(f)}:wght@300;400;700`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

const ElementPreview = React.memo(function ElementPreview({ el, state, activeField, changedField }: {
  el: TemplateElement;
  state: WizardState;
  activeField: string | null;
  changedField: string | null;
}) {
  const isActive = el.field !== undefined && activeField === el.field;
  const isChanged = el.field !== undefined && changedField === el.field;

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${(el.x / 1000) * 100}%`,
    top: `${(el.y / 1000) * 100}%`,
    width: `${(el.w / 1000) * 100}%`,
    height: `${(el.h / 1000) * 100}%`,
    boxSizing: "border-box",
    overflow: "hidden",
    ...(isActive ? {
      outline: "2px solid var(--color-brand-primary, #6B8E23)",
      outlineOffset: "1px",
      borderRadius: "4px",
      opacity: 1,
    } : {}),
    ...(isChanged ? {
      backgroundColor: "rgba(107, 142, 35, 0.05)",
      transition: "background-color 0.3s",
    } : {}),
  };

  if (el.type === "text") {
    const value = el.field ? getFieldValue(state, el.field) : (el.fixedContent ?? "");
    if (!value) return null;

    const globalFont = state.textContent.fontFamily;
    const font = el.fontFamily ?? globalFont;

    // Use user's font size if available, otherwise template default
    const userSize = getUserFontSize(state.textContent, el.field);
    const templateSize = el.fontSize ?? 9;
    const fontSize = userSize ?? templateSize;
    const minFontSize = el.minFontSize ?? 10;

    // Auto-shrink: refs for DOM measurement
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      const container = containerRef.current;
      const textDiv = textRef.current;
      if (!container || !textDiv) return;

      // Reset to base size
      textDiv.style.fontSize = `${fontSize}pt`;

      // Temporarily allow overflow so scrollHeight is accurate
      container.style.overflow = "visible";

      // Shrink until fits (same algorithm as card-to-html-v2.ts:276-296)
      let size = fontSize;
      while (container.scrollHeight > container.clientHeight && size > minFontSize) {
        size -= 0.5;
        textDiv.style.fontSize = `${size}pt`;
      }

      // Restore overflow hidden
      container.style.overflow = "hidden";
    }, [value, fontSize, minFontSize]);

    return (
      <div
        ref={containerRef}
        style={{
          ...style,
          display: "flex",
          flexDirection: "column",
          alignItems: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          ref={textRef}
          style={{
            fontFamily: `'${font}', serif`,
            fontSize: `${fontSize}pt`,
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
    const photoSrc = state.photo.sharpenedUrl ?? state.photo.url;
    if (!photoSrc) {
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

    // Apply crop if available (guard against division by zero)
    const crop = state.photo.crop;
    if (el.useCrop !== false && crop && crop.width > 0 && crop.width < 1 && crop.height > 0 && crop.height < 1) {
      const sizeX = (1 / crop.width * 100);
      const sizeY = (1 / crop.height * 100);
      const posX = (crop.x / (1 - crop.width) * 100);
      const posY = (crop.y / (1 - crop.height) * 100);
      return (
        <div
          style={{
            ...style,
            ...clipStyle,
            backgroundImage: `url('${photoSrc}')`,
            backgroundSize: `${sizeX}% ${sizeY}%`,
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundRepeat: "no-repeat",
            filter: state.photo.filter !== "none" ? state.photo.filter : undefined,
          }}
        />
      );
    }

    return (
      <div
        style={{
          ...style,
          ...clipStyle,
          backgroundImage: `url('${photoSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          filter: state.photo.filter !== "none" ? state.photo.filter : undefined,
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
});

export default function SpreadPreview({ state, scale = 1, interactive = false, dispatch }: SpreadPreviewProps) {
  const { activeField, selectedElementId, setActiveField, setSelectedElementId } = useActiveField();
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [changedField, setChangedField] = useState<string | null>(null);
  const prevText = useRef({ ...state.textContent });

  // Pulse animation on text change
  useEffect(() => {
    if (!activeField) return;
    const curr = state.textContent[activeField as keyof typeof state.textContent];
    const prev = prevText.current[activeField as keyof typeof prevText.current];
    if (curr !== prev) {
      setChangedField(activeField);
      const timer = setTimeout(() => setChangedField(null), 300);
      prevText.current = { ...state.textContent };
      return () => clearTimeout(timer);
    }
  }, [state.textContent, activeField]);

  const config = useMemo(
    () => (state.templateId ? getTemplateConfig(state.templateId) : null),
    [state.templateId]
  );

  if (!config) {
    return <div className="text-center text-brand-gray text-sm">No template selected</div>;
  }

  // Collect all fonts used (global + per-element overrides)
  const fontsUsed = useMemo(() => {
    const fonts: string[] = [state.textContent.fontFamily];
    for (const el of config.elements) {
      if (el.fontFamily) fonts.push(el.fontFamily);
    }
    return [...new Set(fonts)];
  }, [state.textContent.fontFamily, config.elements]);

  const aspect = config.spreadWidthMm / config.spreadHeightMm;

  const [fontsReady, setFontsReady] = useState(false);
  const fontUrl = buildFontUrl(fontsUsed);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.appendChild(link);
    setFontsReady(false);
    document.fonts.ready.then(() => setFontsReady(true));
    return () => { document.head.removeChild(link); };
  }, [fontUrl]);

  return (
    <>
      <div
        ref={cardContainerRef}
        className="relative bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden mx-auto"
        style={{
          aspectRatio: `${aspect}`,
          width: `${100 * scale}%`,
          maxWidth: `${560 * scale}px`,
          opacity: fontsReady ? 1 : 0.5,
          transition: "opacity 0.3s",
        }}
        onClick={interactive ? () => setSelectedElementId(null) : undefined}
      >
        {config.elements
          .filter((el) => !state.elementOverrides[el.id]?.hidden)
          .map((el) =>
            interactive && dispatch ? (
              <InteractiveElement
                key={el.id}
                el={el}
                state={state}
                dispatch={dispatch}
                isSelected={selectedElementId === el.id}
                containerRef={cardContainerRef}
                zoom={scale}
                isMobile={isMobile}
                onSelect={() => {
                  setActiveField(el.field ?? null, "preview");
                  setSelectedElementId(el.id);
                }}
              />
            ) : (
              <ElementPreview key={el.id} el={el} state={state} activeField={activeField} changedField={changedField} />
            )
          )}

        {/* Render user decoration (from Step 6) if present */}
        {state.decoration.assetUrl && (
          <div
            style={{
              position: "absolute",
              bottom: "3%",
              right: "3%",
              width: "15%",
              height: "15%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.decoration.assetUrl}
              alt=""
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Border/frame overlay */}
        {state.border.url && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.border.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        )}
      </div>
    </>
  );
}
