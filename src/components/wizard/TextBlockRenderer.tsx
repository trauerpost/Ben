"use client";

import { FONT_SIZE_UNIT } from "@/lib/editor/wizard-state";
import type { TextContent } from "@/lib/editor/wizard-state";

interface TextBlockRendererProps {
  textContent: TextContent;
  fields: string[];
  maxFontSize?: number;
}

function clampFont(size: number, max?: number): number {
  return max ? Math.min(size, max) : size;
}

export default function TextBlockRenderer({ textContent, fields, maxFontSize }: TextBlockRendererProps) {
  const {
    heading, headingFontSize,
    name, nameFontSize,
    dates, datesFontSize,
    dividerSymbol,
    quote, quoteFontSize,
    fontFamily, fontColor, textAlign,
  } = textContent;

  const baseStyle = {
    fontFamily,
    color: fontColor,
    textAlign,
  } as const;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-4 gap-1"
      style={baseStyle}
    >
      {fields.includes("heading") && heading && (
        <p
          className="leading-snug"
          style={{ fontSize: `${clampFont(headingFontSize, maxFontSize)}${FONT_SIZE_UNIT}` }}
        >
          {heading}
        </p>
      )}

      {fields.includes("name") && name && (
        <p
          className="font-semibold leading-tight"
          style={{ fontSize: `${clampFont(nameFontSize, maxFontSize)}${FONT_SIZE_UNIT}` }}
        >
          {name}
        </p>
      )}

      {fields.includes("dates") && dates && (
        <p
          className="leading-snug"
          style={{ fontSize: `${clampFont(datesFontSize, maxFontSize)}${FONT_SIZE_UNIT}` }}
        >
          {dates}
        </p>
      )}

      {fields.includes("dividerSymbol") && dividerSymbol && (
        <p className="text-center leading-relaxed" style={{ fontSize: `${clampFont(datesFontSize, maxFontSize)}${FONT_SIZE_UNIT}` }}>
          {dividerSymbol}
        </p>
      )}

      {fields.includes("quote") && quote && (
        <p
          className="whitespace-pre-wrap leading-relaxed"
          style={{ fontSize: `${clampFont(quoteFontSize, maxFontSize)}${FONT_SIZE_UNIT}` }}
        >
          {quote}
        </p>
      )}
    </div>
  );
}
