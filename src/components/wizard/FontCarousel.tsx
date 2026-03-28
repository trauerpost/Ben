"use client";

import { useState, useEffect, useRef } from "react";

interface FontCarouselProps {
  fonts: readonly string[];
  selected: string;
  onSelect: (font: string) => void;
}

const FONT_CATEGORIES: Record<string, readonly string[]> = {
  serif: [
    "Playfair Display", "Cormorant Garamond", "Libre Baskerville", "Lora", "EB Garamond",
    "Source Serif Pro", "Cormorant SC", "EB Garamond SC", "Cormorant Infant", "Crimson Pro",
  ],
  script: ["Great Vibes", "Dancing Script", "Tangerine", "Pinyon Script", "Alex Brush"],
  sans: ["Inter", "Montserrat", "Raleway", "Open Sans", "Fira Sans"],
};

type Category = "all" | "serif" | "script" | "sans";

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All",
  serif: "Serif \u2605",
  script: "Script",
  sans: "Sans",
};

export default function FontCarousel({ fonts, selected, onSelect }: FontCarouselProps): React.ReactElement {
  const [category, setCategory] = useState<Category>("all");
  const [showMobile, setShowMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Preload all fonts on mount
  useEffect(() => {
    const fontUrl = fonts.map(f =>
      `family=${encodeURIComponent(f)}:wght@400`
    ).join("&");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fontUrl}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [fonts]);

  const filtered = category === "all"
    ? fonts
    : fonts.filter(f => FONT_CATEGORIES[category]?.includes(f));

  function handleSelect(font: string): void {
    onSelect(font);
    // Auto-close on mobile after selection
    setShowMobile(false);
  }

  const carousel = (
    <div className="space-y-2">
      {/* Category tabs */}
      <div className="flex gap-1">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollbarWidth: "thin" }}
      >
        {filtered.map(font => (
          <button
            key={font}
            onClick={() => handleSelect(font)}
            className={`shrink-0 px-4 py-2 md:px-4 md:py-2 px-3 py-1.5 rounded-lg transition-all text-left ${
              selected === font
                ? "ring-2 ring-brand-primary ring-offset-1 bg-brand-primary/5"
                : "bg-brand-light-gray hover:bg-brand-border"
            }`}
            style={{ fontFamily: `'${font}', serif` }}
          >
            <span className="block text-base md:text-base text-xs leading-tight">Aa</span>
            <span className="block text-xs md:text-xs text-[10px] text-brand-gray whitespace-nowrap mt-0.5">
              {font}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block border-b border-brand-border bg-white px-4 py-2">
        {carousel}
      </div>

      {/* Mobile: toggle button + expandable */}
      <div className="md:hidden border-b border-brand-border bg-white px-3 py-1.5">
        <button
          onClick={() => setShowMobile(!showMobile)}
          className="text-xs font-medium text-brand-primary flex items-center gap-1"
        >
          <span>Fonts</span>
          <span className={`transition-transform ${showMobile ? "rotate-180" : ""}`}>&#9660;</span>
        </button>
        {showMobile && (
          <div className="mt-2 pb-1">
            {carousel}
          </div>
        )}
      </div>
    </>
  );
}
