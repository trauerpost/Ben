"use client";

import { FONT_COLORS } from "@/lib/editor/wizard-state";
import type { WizardState, WizardAction, TextContent } from "@/lib/editor/wizard-state";

interface TextFormatToolbarProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  activeField: string | null;
}

/** Map field names to their size fields and display labels */
const SIZE_FIELD_MAP: Record<string, {
  sizeField: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize";
  label: string;
  min: number;
  max: number;
}> = {
  heading:      { sizeField: "headingFontSize", label: "Heading", min: 6, max: 24 },
  name:         { sizeField: "nameFontSize", label: "Name", min: 10, max: 40 },
  dates:        { sizeField: "datesFontSize", label: "Dates", min: 8, max: 24 },
  birthDate:    { sizeField: "datesFontSize", label: "Birth", min: 8, max: 24 },
  deathDate:    { sizeField: "datesFontSize", label: "Death", min: 8, max: 24 },
  quote:        { sizeField: "quoteFontSize", label: "Quote", min: 6, max: 24 },
  quoteAuthor:  { sizeField: "quoteAuthorFontSize", label: "Author", min: 6, max: 20 },
  closingVerse: { sizeField: "closingVerseFontSize", label: "Closing", min: 6, max: 20 },
  locationBirth:  { sizeField: "locationFontSize", label: "Place", min: 6, max: 20 },
  locationDeath:  { sizeField: "locationFontSize", label: "Place", min: 6, max: 20 },
};

export default function TextFormatToolbar({ state, dispatch, activeField }: TextFormatToolbarProps): React.ReactElement {
  const tc = state.textContent;
  const sizeMeta = activeField ? SIZE_FIELD_MAP[activeField] : null;
  const currentSize = sizeMeta ? (tc[sizeMeta.sizeField as keyof TextContent] as number) : null;

  function changeSize(delta: number): void {
    if (!sizeMeta || currentSize === null) return;
    const next = Math.min(sizeMeta.max, Math.max(sizeMeta.min, currentSize + delta));
    dispatch({ type: "SET_TEXT_NUMBER", field: sizeMeta.sizeField, value: next });
  }

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-brand-border shadow-sm px-4 py-2 flex items-center gap-3 flex-wrap">
      {/* Size control */}
      <div className="flex items-center gap-1.5 min-w-0">
        {sizeMeta && currentSize !== null ? (
          <>
            <span className="text-xs text-brand-gray truncate">
              <span className="hidden md:inline">{sizeMeta.label} — </span>
              {currentSize}pt
            </span>
            <button
              onClick={() => changeSize(-1)}
              className="w-6 h-6 rounded flex items-center justify-center text-sm bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
            >
              &minus;
            </button>
            <button
              onClick={() => changeSize(1)}
              className="w-6 h-6 rounded flex items-center justify-center text-sm bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
            >
              +
            </button>
          </>
        ) : (
          <span className="text-xs text-brand-gray">&mdash;</span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-brand-border" />

      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        {FONT_COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => dispatch({ type: "SET_TEXT_STRING", field: "fontColor", value: c.value })}
            title={c.name}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              tc.fontColor === c.value
                ? "border-brand-primary scale-110 ring-2 ring-brand-primary"
                : "border-brand-border hover:border-brand-gray"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-brand-border" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        {(["left", "center", "right"] as const).map(align => (
          <button
            key={align}
            onClick={() => dispatch({ type: "SET_TEXT_ALIGN", align })}
            className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
              tc.textAlign === align
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {align === "left" ? "\u2190" : align === "center" ? "\u2194" : "\u2192"}
          </button>
        ))}
      </div>
    </div>
  );
}
