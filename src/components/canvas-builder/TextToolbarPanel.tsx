"use client";

import { useState } from "react";
import * as fabric from "fabric";
import { WIZARD_FONTS, FONT_COLORS } from "@/lib/editor/wizard-state";

interface TextToolbarPanelProps {
  object: fabric.Textbox;
  onChange: () => void;
  onDelete: () => void;
}

export default function TextToolbarPanel({
  object,
  onChange,
  onDelete,
}: TextToolbarPanelProps): React.ReactElement {
  const [showFontPicker, setShowFontPicker] = useState(false);

  const fontSize = object.fontSize ?? 12;
  const fontFamily = object.fontFamily ?? "Playfair Display";
  const textAlign = (object.textAlign ?? "center") as string;

  function changeFontSize(delta: number): void {
    const next = Math.min(72, Math.max(8, fontSize + delta));
    object.set("fontSize", next);
    onChange();
  }

  function changeFontFamily(family: string): void {
    object.set("fontFamily", family);
    setShowFontPicker(false);
    onChange();
  }

  function changeColor(color: string): void {
    object.set("fill", color);
    onChange();
  }

  function changeAlign(align: string): void {
    object.set("textAlign", align);
    onChange();
  }

  return (
    <div className="flex items-center gap-2 flex-wrap relative">
      {/* Font family */}
      <div className="relative">
        <button
          onClick={() => setShowFontPicker(!showFontPicker)}
          className="px-2 py-1 rounded text-xs bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors max-w-[120px] truncate"
          title={fontFamily}
        >
          {fontFamily}
        </button>
        {showFontPicker && (
          <div className="absolute top-full left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-white border border-brand-border rounded-lg shadow-lg z-40">
            {WIZARD_FONTS.map((f) => (
              <button
                key={f}
                onClick={() => changeFontFamily(f)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-brand-light-gray transition-colors ${
                  f === fontFamily ? "bg-brand-primary-light text-brand-primary font-medium" : "text-brand-dark"
                }`}
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-brand-border" />

      {/* Font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => changeFontSize(-1)}
          className="w-6 h-6 rounded flex items-center justify-center text-sm bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
        >
          &minus;
        </button>
        <span className="text-xs text-brand-gray min-w-[2rem] text-center tabular-nums">
          {fontSize}pt
        </span>
        <button
          onClick={() => changeFontSize(1)}
          className="w-6 h-6 rounded flex items-center justify-center text-sm bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
        >
          +
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-brand-border" />

      {/* Color swatches */}
      <div className="flex items-center gap-1">
        {FONT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => changeColor(c.value)}
            title={c.name}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              (object.fill as string) === c.value
                ? "border-brand-primary scale-110"
                : "border-brand-border hover:border-brand-gray"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-brand-border" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        {(["left", "center", "right"] as const).map((align) => (
          <button
            key={align}
            onClick={() => changeAlign(align)}
            className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-colors ${
              textAlign === align
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
            title={align === "left" ? "Links" : align === "center" ? "Zentriert" : "Rechts"}
          >
            {align === "left" ? "≡←" : align === "center" ? "≡↔" : "≡→"}
          </button>
        ))}
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
