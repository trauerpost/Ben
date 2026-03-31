"use client";

import { useRef } from "react";
import * as fabric from "fabric";

interface PhotoToolbarPanelProps {
  object: fabric.FabricObject;
  canvas: fabric.Canvas;
  onChange: () => void;
  onDelete: () => void;
}

export default function PhotoToolbarPanel({
  object,
  canvas,
  onChange,
  onDelete,
}: PhotoToolbarPanelProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleReplace(): void {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Datei zu groß. Maximal 10MB.");
      return;
    }
    const url = URL.createObjectURL(file);

    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });

      // Match position/size of current object
      img.set({
        left: object.left,
        top: object.top,
        scaleX: (object.width! * (object.scaleX ?? 1)) / (img.width ?? 1),
        scaleY: (object.height! * (object.scaleY ?? 1)) / (img.height ?? 1),
        data: (object as unknown as { data?: unknown }).data,
      });

      canvas.remove(object);
      canvas.add(img);
      canvas.setActiveObject(img);
      onChange();
    } catch (err) {
      console.error("[PhotoToolbar] Failed to load image:", err);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFitMode(mode: "fill" | "contain"): void {
    if (object instanceof fabric.FabricImage) {
      // For fill: scale to cover; for contain: scale to fit
      const parent = object.getBoundingRect();
      const imgW = object.width ?? 1;
      const imgH = object.height ?? 1;

      if (mode === "fill") {
        const scale = Math.max(parent.width / imgW, parent.height / imgH);
        object.set({ scaleX: scale, scaleY: scale });
      } else {
        const scale = Math.min(parent.width / imgW, parent.height / imgH);
        object.set({ scaleX: scale, scaleY: scale });
      }
      onChange();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Replace */}
      <button
        onClick={handleReplace}
        className="px-2 py-1 rounded text-xs bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
      >
        Ersetzen
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Divider */}
      <div className="w-px h-5 bg-brand-border" />

      {/* Fit mode */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleFitMode("fill")}
          className="px-2 py-1 rounded text-xs bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
          title="Füllen"
        >
          Fill
        </button>
        <button
          onClick={() => handleFitMode("contain")}
          className="px-2 py-1 rounded text-xs bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
          title="Einpassen"
        >
          Fit
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-brand-border" />

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-7 h-7 rounded flex items-center justify-center text-brand-gray hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Löschen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
