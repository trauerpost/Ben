"use client";

import { useState } from "react";
import type { CardType, CardFormat } from "@/lib/editor/wizard-state";
import { CARD_CONFIGS } from "@/lib/editor/wizard-state";
import {
  getTemplateConfigsForCard,
  type TemplateConfig,
} from "@/lib/editor/template-configs";

interface TemplatePickerProps {
  onSelect: (
    cardType: CardType,
    cardFormat: CardFormat,
    templateId: string
  ) => void;
}

const CARD_TYPE_OPTIONS: { type: CardType; label: string; icon: string }[] = [
  { type: "sterbebild", label: "Erinnerungsbild", icon: "🕯️" },
  { type: "trauerkarte", label: "Trauerkarte", icon: "✉️" },
  { type: "dankkarte", label: "Dankeskarte", icon: "🙏" },
];

export default function TemplatePicker({
  onSelect,
}: TemplatePickerProps): React.ReactElement {
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [cardFormat, setCardFormat] = useState<CardFormat>("single");

  const config = cardType ? CARD_CONFIGS[cardType] : null;
  const showFormatToggle =
    config && config.availableFormats.length > 1;
  const templates: TemplateConfig[] = cardType
    ? getTemplateConfigsForCard(cardType, cardFormat)
    : [];

  function handleCardType(type: CardType): void {
    setCardType(type);
    const cfg = CARD_CONFIGS[type];
    // Auto-select single if only option
    if (cfg.availableFormats.length === 1) {
      setCardFormat(cfg.availableFormats[0]);
    } else {
      setCardFormat("single");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-brand-dark">Kartentyp wählen</h3>

      {/* Card type selector */}
      <div className="grid grid-cols-1 gap-2">
        {CARD_TYPE_OPTIONS.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleCardType(type)}
            data-testid={`card-type-${type}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
              cardType === type
                ? "border-brand-primary bg-brand-primary-light text-brand-dark font-medium"
                : "border-brand-border bg-white text-brand-gray hover:border-brand-gray hover:text-brand-dark"
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Format toggle (only for trauerkarte/dankkarte) */}
      {showFormatToggle && (
        <div className="flex gap-1 rounded-lg bg-brand-light-gray p-1">
          {config!.availableFormats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setCardFormat(fmt)}
              data-testid={`format-${fmt}`}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                cardFormat === fmt
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-gray hover:text-brand-dark"
              }`}
            >
              {fmt === "single" ? "Einfach" : "Gefaltet"}
            </button>
          ))}
        </div>
      )}

      {/* Template grid */}
      {templates.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-brand-dark pt-2">
            Vorlage wählen
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSelect(cardType!, cardFormat, tpl.id)}
                data-testid={`template-${tpl.id}`}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-brand-border bg-white hover:border-brand-primary hover:shadow-sm transition-all text-center"
              >
                {/* Thumbnail placeholder */}
                <div className="w-full aspect-[4/3] rounded bg-brand-light-gray flex items-center justify-center text-xs text-brand-gray">
                  {tpl.id}
                </div>
                <span className="text-[11px] text-brand-dark leading-tight">
                  {tpl.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
