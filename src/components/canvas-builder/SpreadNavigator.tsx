"use client";

export interface SpreadPage {
  id: string;
  label: string;
  thumbnail?: string;
  isSpread?: boolean;
  canvasPageId?: string;    // actual canvas page to load (if different from id)
  thumbnailCrop?: "left" | "right";  // crop thumbnail to show only half
}

interface SpreadNavigatorProps {
  pages: SpreadPage[];
  activePageId: string;
  onPageSelect: (pageId: string) => void;
}

export default function SpreadNavigator({
  pages,
  activePageId,
  onPageSelect,
}: SpreadNavigatorProps): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 overflow-x-auto sm:overflow-x-visible scroll-smooth snap-x snap-mandatory">
      {pages.map((page) => {
        const isActive = page.id === activePageId;
        const thumbWidth = "w-16";
        const thumbHeight = "h-12";
        return (
          <button
            key={page.id}
            onClick={() => onPageSelect(page.id)}
            className={`flex-shrink-0 snap-start flex flex-col items-center gap-1 transition-all ${
              isActive ? "scale-105" : "opacity-60 hover:opacity-90"
            }`}
            title={page.label}
          >
            {/* Thumbnail or placeholder */}
            <div
              className={`${thumbWidth} ${thumbHeight} rounded border-2 overflow-hidden bg-white flex items-center justify-center ${
                isActive
                  ? "border-brand-primary shadow-md"
                  : "border-brand-border hover:border-brand-gray"
              }`}
            >
              {page.thumbnail ? (
                <div className="w-full h-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.thumbnail}
                    alt={page.label}
                    className="h-full w-full object-cover"
                    style={
                      page.thumbnailCrop === "right"
                        ? { objectPosition: "right center" }
                        : page.thumbnailCrop === "left"
                        ? { objectPosition: "left center" }
                        : undefined
                    }
                  />
                </div>
              ) : (
                <span className="text-[8px] text-brand-gray">{page.label}</span>
              )}
            </div>

            {/* Label */}
            <span
              className={`text-[10px] leading-tight ${
                isActive ? "text-brand-primary font-medium" : "text-brand-gray"
              }`}
            >
              {page.label}
            </span>

            {/* Active indicator */}
            {isActive && (
              <div className="w-8 h-0.5 bg-brand-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
