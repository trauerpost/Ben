"use client";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  onReset: () => void;
}

export default function ZoomControls({
  zoom,
  onZoomChange,
  onFit,
  onReset,
}: ZoomControlsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <button
        onClick={onFit}
        className="px-2 py-1 rounded text-xs bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
        title="Passend"
      >
        Fit
      </button>
      <button
        onClick={onReset}
        className="px-2 py-1 rounded text-xs bg-brand-light-gray hover:bg-brand-border text-brand-dark transition-colors"
        title="100%"
      >
        100%
      </button>

      <input
        type="range"
        min={25}
        max={300}
        step={5}
        value={Math.round(zoom * 100)}
        onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
        className="w-24 h-1 accent-brand-primary cursor-pointer"
        title={`${Math.round(zoom * 100)}%`}
      />

      <span className="text-xs text-brand-gray min-w-[3rem] text-right tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
