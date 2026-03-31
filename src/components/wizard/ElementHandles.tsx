"use client";

import { useRef, useCallback } from "react";

interface ElementHandlesProps {
  elementId: string;
  currentSize: { w: number; h: number }; // 0-1000
  containerRef: React.RefObject<HTMLElement | null>;
  zoom: number;
  onResizeEnd: (w: number, h: number) => void;
}

type HandlePosition = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const MIN_SIZE = 50; // minimum 50 in normalized units

function clampSize(val: number): number {
  return Math.max(MIN_SIZE, Math.min(1000, Math.round(val)));
}

export default function ElementHandles({
  elementId,
  currentSize,
  containerRef,
  zoom,
  onResizeEnd,
}: ElementHandlesProps): React.ReactElement {
  const startRef = useRef<{
    clientX: number;
    clientY: number;
    w: number;
    h: number;
    handle: HandlePosition;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle: HandlePosition) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        w: currentSize.w,
        h: currentSize.h,
        handle,
      };
    },
    [currentSize.w, currentSize.h]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const container = containerRef.current;
      if (!container) { startRef.current = null; return; }

      const rect = container.getBoundingClientRect();
      const dxPx = e.clientX - startRef.current.clientX;
      const dyPx = e.clientY - startRef.current.clientY;
      const dxNorm = (dxPx / (rect.width * zoom)) * 1000;
      const dyNorm = (dyPx / (rect.height * zoom)) * 1000;

      let newW = startRef.current.w;
      let newH = startRef.current.h;
      const h = startRef.current.handle;

      // Apply delta based on which handle was dragged
      if (h.includes("e")) newW += dxNorm;
      if (h.includes("w")) newW -= dxNorm;
      if (h.includes("s")) newH += dyNorm;
      if (h.includes("n")) newH -= dyNorm;

      // Shift key = lock aspect ratio
      if (e.shiftKey && startRef.current.w > 0 && startRef.current.h > 0) {
        const ratio = startRef.current.w / startRef.current.h;
        if (h.includes("e") || h.includes("w")) {
          newH = newW / ratio;
        } else {
          newW = newH * ratio;
        }
      }

      onResizeEnd(clampSize(newW), clampSize(newH));
      startRef.current = null;
    },
    [containerRef, zoom, onResizeEnd]
  );

  const handleStyle = (pos: HandlePosition): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: "8px",
      height: "8px",
      backgroundColor: "#0ea5e9",
      border: "1px solid white",
      borderRadius: "1px",
      zIndex: 20,
      touchAction: "none",
    };

    const cursors: Record<HandlePosition, string> = {
      nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
      n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
    };
    base.cursor = cursors[pos];

    // Positioning
    if (pos.includes("n")) base.top = "-4px";
    if (pos.includes("s")) base.bottom = "-4px";
    if (pos.includes("w")) base.left = "-4px";
    if (pos.includes("e")) base.right = "-4px";
    if (pos === "n" || pos === "s") { base.left = "50%"; base.transform = "translateX(-50%)"; base.width = "12px"; base.height = "6px"; }
    if (pos === "e" || pos === "w") { base.top = "50%"; base.transform = "translateY(-50%)"; base.width = "6px"; base.height = "12px"; }

    return base;
  };

  const handles: HandlePosition[] = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];

  return (
    <>
      {handles.map((pos) => (
        <div
          key={pos}
          style={handleStyle(pos)}
          onPointerDown={(e) => handlePointerDown(e, pos)}
          onPointerUp={handlePointerUp}
        />
      ))}
    </>
  );
}
