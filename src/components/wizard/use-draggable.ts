"use client";

import { useState, useRef, useCallback, type RefObject } from "react";

interface UseDraggableOptions {
  elementId: string;
  initialPos: { x: number; y: number }; // 0-1000 normalized
  containerRef: RefObject<HTMLElement | null>;
  zoom: number;
  disabled: boolean; // true on mobile
  onDragEnd: (x: number, y: number) => void;
}

interface DragHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

interface UseDraggableReturn {
  dragHandlers: DragHandlers;
  isDragging: boolean;
  dragStyle: React.CSSProperties;
}

const DEAD_ZONE = 3; // px — prevents accidental drag on click

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function useDraggable({
  elementId,
  initialPos,
  containerRef,
  zoom,
  disabled,
  onDragEnd,
}: UseDraggableOptions): UseDraggableReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });

  const startRef = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        x: initialPos.x,
        y: initialPos.y,
      };
      hasMoved.current = false;
    },
    [disabled, initialPos.x, initialPos.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || disabled) return;

      const dxPx = e.clientX - startRef.current.clientX;
      const dyPx = e.clientY - startRef.current.clientY;

      // Dead zone — don't start drag until moved enough
      if (!hasMoved.current) {
        if (Math.abs(dxPx) < DEAD_ZONE && Math.abs(dyPx) < DEAD_ZONE) return;
        hasMoved.current = true;
        setIsDragging(true);
      }

      // Convert pixel delta to normalized 0-1000 delta, accounting for zoom
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const dxNorm = (dxPx / (containerRect.width * zoom)) * 1000;
      const dyNorm = (dyPx / (containerRect.height * zoom)) * 1000;

      setDragOffset({ dx: dxNorm, dy: dyNorm });
    },
    [disabled, containerRef, zoom]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (hasMoved.current && startRef.current) {
        const container = containerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const dxPx = e.clientX - startRef.current.clientX;
          const dyPx = e.clientY - startRef.current.clientY;
          const dxNorm = (dxPx / (containerRect.width * zoom)) * 1000;
          const dyNorm = (dyPx / (containerRect.height * zoom)) * 1000;

          const finalX = clamp(Math.round(startRef.current.x + dxNorm), 0, 1000);
          const finalY = clamp(Math.round(startRef.current.y + dyNorm), 0, 1000);
          onDragEnd(finalX, finalY);
        }
      }

      startRef.current = null;
      hasMoved.current = false;
      setIsDragging(false);
      setDragOffset({ dx: 0, dy: 0 });
    },
    [containerRef, zoom, onDragEnd]
  );

  // During drag, apply CSS transform for smooth visual feedback
  const dragStyle: React.CSSProperties = isDragging
    ? {
        transform: `translate(${(dragOffset.dx / 1000) * 100}%, ${(dragOffset.dy / 1000) * 100}%)`,
        zIndex: 100,
        cursor: "grabbing",
        opacity: 0.9,
      }
    : { cursor: disabled ? "default" : "grab" };

  return {
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    isDragging,
    dragStyle,
  };
}
