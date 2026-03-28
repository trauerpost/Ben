"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FILTER_PRESETS,
  DEFAULT_ADJUSTMENTS,
  adjustmentsToCSSFilter,
} from "@/lib/editor/image-filters";
import type { ManualAdjustments } from "@/lib/editor/image-filters";

interface ImageEnhancerProps {
  photoUrl: string;
  currentFilter: string;
  currentFilterId: string;
  adjustments: ManualAdjustments | null;
  onFilterChange: (filter: string, filterId: string) => void;
  onAdjustmentsChange: (adj: ManualAdjustments) => void;
}

interface SliderConfig {
  key: keyof ManualAdjustments;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: "brightness", min: 0.5, max: 1.5, step: 0.01 },
  { key: "contrast", min: 0.5, max: 1.5, step: 0.01 },
  { key: "saturation", min: 0, max: 2, step: 0.01 },
  { key: "sharpness", min: 0, max: 100, step: 1 },
];

export default function ImageEnhancer({
  photoUrl,
  currentFilter,
  currentFilterId,
  adjustments,
  onFilterChange,
  onAdjustmentsChange,
}: ImageEnhancerProps): React.ReactElement {
  const t = useTranslations("wizard.photo");
  const adj = adjustments ?? DEFAULT_ADJUSTMENTS;

  const handlePresetClick = useCallback(
    (filter: string, filterId: string): void => {
      onFilterChange(filter, filterId);
      onAdjustmentsChange({ ...DEFAULT_ADJUSTMENTS });
    },
    [onFilterChange, onAdjustmentsChange],
  );

  const handleSliderChange = useCallback(
    (key: keyof ManualAdjustments, value: number): void => {
      const updated: ManualAdjustments = { ...adj, [key]: value };
      onAdjustmentsChange(updated);
      const cssFilter = adjustmentsToCSSFilter(updated);
      onFilterChange(cssFilter, "custom");
    },
    [adj, onFilterChange, onAdjustmentsChange],
  );

  const handleReset = useCallback((): void => {
    const originalPreset = FILTER_PRESETS[0];
    onFilterChange(originalPreset.filter, originalPreset.id);
    onAdjustmentsChange({ ...DEFAULT_ADJUSTMENTS });
  }, [onFilterChange, onAdjustmentsChange]);

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Presets — horizontal scroll */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          {t("presets")}
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset.filter, preset.id)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-lg p-1.5 transition-all ${
                currentFilterId === preset.id
                  ? "ring-2 ring-indigo-500 ring-offset-1"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt={t(`filters.${preset.id}`)}
                  className="h-full w-full object-cover"
                  style={{ filter: preset.filter }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {t(`filters.${preset.id}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Adjustments */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          {t("adjustments")}
        </h3>
        <div className="flex flex-col gap-4">
          {SLIDERS.map(({ key, min, max, step }) => (
            <div key={key} className="flex items-center gap-3">
              <label
                htmlFor={`slider-${key}`}
                className="w-24 shrink-0 text-sm text-gray-600"
              >
                {t(key)}
              </label>
              <input
                id={`slider-${key}`}
                type="range"
                min={min}
                max={max}
                step={step}
                value={adj[key]}
                onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-indigo-500"
              />
              <span className="w-12 shrink-0 text-right text-sm tabular-nums text-gray-500">
                {adj[key].toFixed(key === "sharpness" ? 0 : 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        type="button"
        onClick={handleReset}
        className="self-start rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
      >
        {t("resetFilter")}
      </button>
    </div>
  );
}
