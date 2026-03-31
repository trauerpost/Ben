"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";
import * as fabric from "fabric";
import TextToolbarPanel from "./TextToolbarPanel";
import PhotoToolbarPanel from "./PhotoToolbarPanel";

interface ContextualToolbarProps {
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  getCanvas: () => fabric.Canvas | null;
  zoom: number;
  onHistorySave?: () => void;
}

interface ToolbarPosition {
  top: number;
  left: number;
  visible: boolean;
  objectType: "text" | "image" | null;
}

export default function ContextualToolbar({
  canvasContainerRef,
  getCanvas,
  zoom,
  onHistorySave,
}: ContextualToolbarProps): React.ReactElement | null {
  const [position, setPosition] = useState<ToolbarPosition>({
    top: 0,
    left: 0,
    visible: false,
    objectType: null,
  });
  const [, forceUpdate] = useState(0);

  const updatePosition = useCallback(() => {
    const canvas = getCanvas();
    const container = canvasContainerRef.current;
    if (!canvas || !container) {
      setPosition((p) => ({ ...p, visible: false }));
      return;
    }

    const active = canvas.getActiveObject();
    if (!active) {
      setPosition((p) => ({ ...p, visible: false }));
      return;
    }

    const rect = active.getBoundingRect();
    const containerRect = container.getBoundingClientRect();

    // Determine object type
    let objectType: "text" | "image" | null = null;
    if (active instanceof fabric.Textbox || active instanceof fabric.IText) {
      objectType = "text";
    } else if (
      active instanceof fabric.FabricImage ||
      (active as unknown as { data?: Record<string, unknown> }).data?.isImagePlaceholder
    ) {
      objectType = "image";
    }

    // Position toolbar above the object, centered
    const objCenterX = rect.left * zoom + (rect.width * zoom) / 2;
    const toolbarWidth = 400;
    let left = objCenterX - toolbarWidth / 2;
    // Clamp to container bounds
    left = Math.max(0, Math.min(left, containerRect.width - toolbarWidth));

    let top = rect.top * zoom - 52; // 52px above object
    // If too close to top, position below
    if (top < 0) {
      top = (rect.top + rect.height) * zoom + 8;
    }

    setPosition({ top, left, visible: true, objectType });
  }, [getCanvas, canvasContainerRef, zoom]);

  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const handleSelection = () => {
      updatePosition();
      forceUpdate((n) => n + 1);
    };
    const handleClear = () => {
      setPosition((p) => ({ ...p, visible: false }));
    };
    const handleModified = () => {
      updatePosition();
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleClear);
    canvas.on("object:modified", handleModified);
    canvas.on("object:scaling", handleModified);
    canvas.on("object:moving", handleModified);

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleClear);
      canvas.off("object:modified", handleModified);
      canvas.off("object:scaling", handleModified);
      canvas.off("object:moving", handleModified);
    };
  }, [getCanvas, updatePosition]);

  if (!position.visible || !position.objectType) return null;

  const canvas = getCanvas();
  const active = canvas?.getActiveObject();
  if (!active || !canvas) return null;

  const handleChange = () => {
    canvas.renderAll();
    onHistorySave?.();
    forceUpdate((n) => n + 1);
  };

  const handleDelete = () => {
    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.renderAll();
    onHistorySave?.();
  };

  return (
    <div
      className="absolute z-30 bg-white rounded-lg shadow-xl border border-brand-border px-3 py-2 flex items-center gap-2 transition-all"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: "auto",
      }}
    >
      {position.objectType === "text" ? (
        <TextToolbarPanel
          object={active as fabric.Textbox}
          onChange={handleChange}
          onDelete={handleDelete}
        />
      ) : (
        <PhotoToolbarPanel
          object={active}
          canvas={canvas}
          onChange={handleChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
