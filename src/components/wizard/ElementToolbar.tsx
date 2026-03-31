"use client";

import { useState, useRef, useEffect } from "react";
import { WIZARD_FONTS, FONT_COLORS } from "@/lib/editor/wizard-state";
import type { WizardAction, ElementOverride } from "@/lib/editor/wizard-state";

interface ElementToolbarProps {
  elementId: string;
  currentValues: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    textAlign: string;
  };
  elementRef: React.RefObject<HTMLElement | null>;
  dispatch: React.Dispatch<WizardAction>;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export default function ElementToolbar({
  elementId,
  currentValues,
  elementRef,
  dispatch,
  onDuplicate,
  onDelete,
}: ElementToolbarProps): React.ReactElement | null {
  const [showFontPicker, setShowFontPicker] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Position toolbar above the element
  useEffect(() => {
    const el = elementRef.current;
    const toolbar = toolbarRef.current;
    if (!el || !toolbar) return;

    const elRect = el.getBoundingClientRect();
    const parentRect = el.offsetParent?.getBoundingClientRect() ?? elRect;
    const toolbarWidth = toolbar.offsetWidth || 400;

    let top = elRect.top - parentRect.top - 44; // 44px above
    if (top < 0) top = elRect.bottom - parentRect.top + 4; // flip below

    let left = elRect.left - parentRect.left + (elRect.width - toolbarWidth) / 2;
    left = Math.max(0, Math.min(left, (parentRect.width || 560) - toolbarWidth));

    setPosition({ top, left });
  }, [elementRef, currentValues]);

  function setOverride(override: Partial<ElementOverride>): void {
    dispatch({ type: "SET_ELEMENT_OVERRIDE", elementId, override });
  }

  return (
    <div
      ref={toolbarRef}
      className="absolute z-30 bg-white rounded-lg shadow-xl border border-brand-border px-2 py-1.5 flex items-center gap-1.5 flex-wrap"
      style={{ top: `${position.top}px`, left: `${position.left}px`, pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Font family */}
      <div className="relative">
        <button
          onClick={() => setShowFontPicker(!showFontPicker)}
          className="px-1.5 py-0.5 rounded text-[10px] bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors max-w-[90px] truncate"
          title={currentValues.fontFamily}
        >
          {currentValues.fontFamily.split(" ")[0]}
        </button>
        {showFontPicker && (
          <div className="absolute top-full left-0 mt-1 w-44 max-h-40 overflow-y-auto bg-white border border-brand-border rounded-lg shadow-lg z-40">
            {WIZARD_FONTS.map((f) => (
              <button
                key={f}
                onClick={() => { setOverride({ fontFamily: f }); setShowFontPicker(false); }}
                className={`w-full text-left px-2 py-1 text-[10px] hover:bg-brand-light-gray transition-colors ${
                  f === currentValues.fontFamily ? "bg-brand-primary-light text-brand-primary font-medium" : "text-brand-dark"
                }`}
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-brand-border" />

      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setOverride({ fontSize: Math.max(8, currentValues.fontSize - 1) })}
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] bg-brand-light-gray hover:bg-brand-border text-brand-dark"
        >
          -
        </button>
        <span className="text-[10px] text-brand-gray min-w-[22px] text-center tabular-nums">
          {currentValues.fontSize}
        </span>
        <button
          onClick={() => setOverride({ fontSize: Math.min(72, currentValues.fontSize + 1) })}
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] bg-brand-light-gray hover:bg-brand-border text-brand-dark"
        >
          +
        </button>
      </div>

      <div className="w-px h-4 bg-brand-border" />

      {/* Colors */}
      <div className="flex items-center gap-0.5">
        {FONT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setOverride({ fontColor: c.value })}
            title={c.name}
            className={`w-4 h-4 rounded-full border transition-all ${
              currentValues.fontColor === c.value ? "border-brand-primary scale-110 ring-1 ring-brand-primary" : "border-brand-border"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      <div className="w-px h-4 bg-brand-border" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        {(["left", "center", "right"] as const).map((align) => (
          <button
            key={align}
            onClick={() => setOverride({ textAlign: align })}
            className={`w-5 h-5 rounded flex items-center justify-center text-[9px] transition-colors ${
              currentValues.textAlign === align ? "bg-brand-primary text-white" : "bg-brand-light-gray text-brand-gray"
            }`}
            title={align === "left" ? "Links" : align === "center" ? "Mitte" : "Rechts"}
          >
            {align === "left" ? "L" : align === "center" ? "M" : "R"}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-brand-border" />

      {/* Delete (hide) */}
      <button
        onClick={onDelete}
        className="w-5 h-5 rounded flex items-center justify-center text-brand-gray hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Ausblenden"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
