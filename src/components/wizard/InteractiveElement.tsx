"use client";

import React, { useRef, useLayoutEffect, useState, useEffect, useCallback } from "react";
import type { TemplateElement } from "@/lib/editor/template-configs";
import type { WizardState, WizardAction, TextContent } from "@/lib/editor/wizard-state";
import { getMergedElement } from "@/lib/editor/wizard-state";
import InlineTextEditor from "./InlineTextEditor";
import { useDraggable } from "./use-draggable";
import ElementHandles from "./ElementHandles";
import ElementToolbar from "./ElementToolbar";

interface InteractiveElementProps {
  el: TemplateElement;
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  isSelected: boolean;
  onSelect: () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
  zoom?: number;
  isMobile?: boolean;
}

function getFieldValue(state: WizardState, field: string): string {
  const val = state.textContent[field as keyof typeof state.textContent];
  return typeof val === "string" ? val : "";
}

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

export default function InteractiveElement({
  el,
  state,
  dispatch,
  isSelected,
  onSelect,
  containerRef: parentContainerRef,
  zoom = 1,
  isMobile = false,
}: InteractiveElementProps): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isEditing, setIsEditing] = useState(false);

  // Get merged values FIRST (override > template > global) — needed by drag hook
  const merged = getMergedElement(
    el,
    state.elementOverrides,
    {
      fontFamily: state.textContent.fontFamily,
      fontColor: state.textContent.fontColor,
      textAlign: state.textContent.textAlign,
    }
  );

  const handleCommitEdit = useCallback((text: string) => {
    if (el.field) {
      // el.field is always a valid SET_TEXT_STRING field name from template config
      dispatch({ type: "SET_TEXT_STRING", field: el.field as "name", value: text });
    }
    setIsEditing(false);
  }, [dispatch, el.field]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Drag hook
  const fallbackRef = useRef<HTMLElement>(null);
  const dragContainerRef = parentContainerRef ?? fallbackRef;

  const handleDragEnd = useCallback(
    (x: number, y: number) => {
      dispatch({ type: "SET_ELEMENT_POSITION", elementId: el.id, x, y });
    },
    [dispatch, el.id]
  );

  const { dragHandlers, isDragging, dragStyle } = useDraggable({
    elementId: el.id,
    initialPos: { x: merged.x, y: merged.y },
    containerRef: dragContainerRef,
    zoom,
    disabled: isMobile || isEditing,
    onDragEnd: handleDragEnd,
  });

  const handleResizeEnd = useCallback(
    (w: number, h: number) => {
      dispatch({ type: "SET_ELEMENT_SIZE", elementId: el.id, w, h });
    },
    [dispatch, el.id]
  );

  // Position from overrides or template
  const posStyle: React.CSSProperties = {
    position: "absolute",
    left: `${(merged.x / 1000) * 100}%`,
    top: `${(merged.y / 1000) * 100}%`,
    width: `${(merged.w / 1000) * 100}%`,
    height: `${(merged.h / 1000) * 100}%`,
    boxSizing: "border-box",
    overflow: "hidden",
    cursor: "pointer",
    // Selection UI
    ...(isSelected ? {
      outline: "2px solid #0ea5e9",
      outlineOffset: "1px",
      borderRadius: "2px",
    } : {}),
  };

  // ResizeObserver to track container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function handleClick(e: React.MouseEvent): void {
    e.stopPropagation();
    onSelect();
  }

  function handleDoubleClick(e: React.MouseEvent): void {
    e.stopPropagation();
    if (el.type === "text" && el.field) {
      onSelect(); // ensure selected
      setIsEditing(true);
    }
  }

  // Compute text values for ALL element types (hooks must be unconditional)
  const textValue = el.type === "text" ? (el.field ? getFieldValue(state, el.field) : (el.fixedContent ?? "")) : "";
  const userSize = el.type === "text" ? getUserFontSize(state.textContent, el.field) : null;
  const effectiveFontSize = userSize ?? merged.fontSize;
  const minFontSize = el.minFontSize ?? 10;

  // Auto-shrink (runs for all types but only acts on text)
  useLayoutEffect(() => {
    if (el.type !== "text") return;
    const container = containerRef.current;
    const textDiv = textRef.current;
    if (!container || !textDiv) return;

    textDiv.style.fontSize = `${effectiveFontSize}pt`;
    container.style.overflow = "visible";

    let size = effectiveFontSize;
    while (container.scrollHeight > container.clientHeight && size > minFontSize) {
      size -= 0.5;
      textDiv.style.fontSize = `${size}pt`;
    }

    container.style.overflow = "hidden";
  }, [el.type, textValue, effectiveFontSize, minFontSize, containerSize.w, containerSize.h]);

  if (el.type === "text") {
    if (!textValue && !isSelected) return null;

    const textStyle: React.CSSProperties = {
      fontFamily: `'${merged.fontFamily}', serif`,
      fontSize: `${effectiveFontSize}pt`,
      fontWeight: el.fontWeight ?? "normal",
      fontStyle: el.fontStyle ?? "normal",
      fontVariant: el.fontVariant ?? "normal",
      textTransform: (el.textTransform ?? "none") as React.CSSProperties["textTransform"],
      textAlign: merged.textAlign as React.CSSProperties["textAlign"],
      letterSpacing: el.letterSpacing ?? "0",
      color: merged.fontColor,
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      width: "100%",
    };

    return (
      <div
        ref={containerRef}
        data-field={el.field}
        data-element-id={el.id}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        {...(isSelected && !isEditing ? dragHandlers : {})}
        style={{
          ...posStyle,
          ...(isSelected && !isEditing ? dragStyle : {}),
          display: "flex",
          flexDirection: "column",
          alignItems: merged.textAlign === "left" ? "flex-start" : merged.textAlign === "right" ? "flex-end" : "center",
          justifyContent: "center",
          overflow: (isEditing || isSelected) ? "visible" : "hidden",
          touchAction: isSelected ? "none" : "auto",
        }}
      >
        {isEditing ? (
          <InlineTextEditor
            value={textValue || ""}
            style={textStyle}
            onCommit={handleCommitEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          <div ref={textRef} style={textStyle}>
            {textValue || (isSelected ? `[${el.field ?? el.id}]` : "")}
          </div>
        )}

        {isSelected && !isEditing && !isDragging && !isMobile && (
          <ElementHandles
            elementId={el.id}
            currentSize={{ w: merged.w, h: merged.h }}
            containerRef={dragContainerRef}
            zoom={zoom}
            onResizeEnd={handleResizeEnd}
          />
        )}

        {isSelected && !isEditing && !isDragging && el.type === "text" && (
          <ElementToolbar
            elementId={el.id}
            currentValues={{
              fontFamily: merged.fontFamily,
              fontSize: merged.fontSize,
              fontColor: merged.fontColor,
              textAlign: merged.textAlign,
            }}
            elementRef={containerRef}
            dispatch={dispatch}
            onDelete={() => dispatch({ type: "SET_ELEMENT_OVERRIDE", elementId: el.id, override: { hidden: true } })}
          />
        )}
      </div>
    );
  }

  if (el.type === "image") {
    const photoSrc = state.photo.sharpenedUrl ?? state.photo.url;

    const clipStyle: React.CSSProperties = {};
    if (el.imageClip === "ellipse") {
      clipStyle.clipPath = "ellipse(50% 50% at 50% 50%)";
      clipStyle.borderRadius = "50%";
    }
    if (el.imageClip === "rounded") clipStyle.borderRadius = "8px";
    if (el.imageBorder) clipStyle.border = el.imageBorder;

    if (!photoSrc) {
      return (
        <div
          data-element-id={el.id}
          onClick={handleClick}
          {...(isSelected ? dragHandlers : {})}
          style={{
            ...posStyle,
            ...clipStyle,
            ...(isSelected ? dragStyle : {}),
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "10px",
            touchAction: isSelected ? "none" : "auto",
          }}
        >
          Foto
          {isSelected && !isDragging && !isMobile && (
            <ElementHandles elementId={el.id} currentSize={{ w: merged.w, h: merged.h }} containerRef={dragContainerRef} zoom={zoom} onResizeEnd={handleResizeEnd} />
          )}
        </div>
      );
    }

    const crop = state.photo.crop;
    const bgStyle: React.CSSProperties = (el.useCrop !== false && crop && crop.width > 0 && crop.width < 1 && crop.height > 0 && crop.height < 1)
      ? {
          backgroundImage: `url('${photoSrc}')`,
          backgroundSize: `${(1 / crop.width * 100)}% ${(1 / crop.height * 100)}%`,
          backgroundPosition: `${(crop.x / (1 - crop.width) * 100)}% ${(crop.y / (1 - crop.height) * 100)}%`,
          backgroundRepeat: "no-repeat",
        }
      : {
          backgroundImage: `url('${photoSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        };

    return (
      <div
        data-element-id={el.id}
        onClick={handleClick}
        {...(isSelected ? dragHandlers : {})}
        style={{
          ...posStyle,
          ...clipStyle,
          ...bgStyle,
          ...(isSelected ? dragStyle : {}),
          filter: state.photo.filter !== "none" ? state.photo.filter : undefined,
          touchAction: isSelected ? "none" : "auto",
        }}
      >
        {isSelected && !isDragging && !isMobile && (
          <ElementHandles elementId={el.id} currentSize={{ w: merged.w, h: merged.h }} containerRef={dragContainerRef} zoom={zoom} onResizeEnd={handleResizeEnd} />
        )}
      </div>
    );
  }

  if (el.type === "line") {
    return (
      <div
        data-element-id={el.id}
        onClick={handleClick}
        {...(isSelected ? dragHandlers : {})}
        style={{ ...posStyle, ...(isSelected ? dragStyle : {}), borderTop: el.lineStyle ?? "1px solid #ccc", touchAction: isSelected ? "none" : "auto" }}
      >
        {isSelected && !isDragging && !isMobile && (
          <ElementHandles elementId={el.id} currentSize={{ w: merged.w, h: merged.h }} containerRef={dragContainerRef} zoom={zoom} onResizeEnd={handleResizeEnd} />
        )}
      </div>
    );
  }

  if (el.type === "ornament" && el.fixedAsset) {
    return (
      <div
        data-element-id={el.id}
        onClick={handleClick}
        {...(isSelected ? dragHandlers : {})}
        style={{ ...posStyle, ...(isSelected ? dragStyle : {}), display: "flex", alignItems: "center", justifyContent: "center", touchAction: isSelected ? "none" : "auto" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={el.fixedAsset}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: (el.imageFit ?? "contain") as React.CSSProperties["objectFit"] }}
        />
        {isSelected && !isDragging && !isMobile && (
          <ElementHandles elementId={el.id} currentSize={{ w: merged.w, h: merged.h }} containerRef={dragContainerRef} zoom={zoom} onResizeEnd={handleResizeEnd} />
        )}
      </div>
    );
  }

  return null;
}

