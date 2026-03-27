"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getTemplatesForCard } from "@/lib/editor/card-templates";
import type { CardTemplate } from "@/lib/editor/card-templates";
import { getTemplateConfigsForCard, type TemplateConfig } from "@/lib/editor/template-configs";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";

interface StepTemplateProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Wireframe for v1 CSS Grid templates */
function TemplateWireframe({ template }: { template: CardTemplate }) {
  const frontPanel = template.panels.find((p) => p.panelId === "front");
  if (!frontPanel) return null;

  return (
    <div
      className="w-full aspect-[4/3] bg-white border border-brand-border rounded-lg overflow-hidden"
      style={{
        display: "grid",
        gridTemplateRows: frontPanel.gridTemplateRows,
        gridTemplateColumns: frontPanel.gridTemplateColumns,
        gap: "2px",
        padding: "4px",
      }}
    >
      {frontPanel.slots.map((slot) => (
        <div
          key={slot.id}
          className={`rounded text-[8px] flex items-center justify-center ${
            slot.type === "photo"
              ? "bg-blue-100 text-blue-400"
              : slot.type === "text"
                ? "bg-amber-50 text-amber-400"
                : "bg-purple-50 text-purple-400"
          }`}
          style={{ gridArea: slot.gridArea }}
        >
          {slot.type === "photo" ? "Foto" : slot.type === "text" ? "Text" : "Deko"}
        </div>
      ))}
    </div>
  );
}

/** Use real reference images as thumbnails where available */
const THUMBNAIL_MAP: Record<string, string> = {
  TI05: "/test-pdfs/TI05-ref.jpg",
  TI06: "/test-pdfs/TI06-ref.jpg",
  TI07: "/test-pdfs/TI07-ref.jpg",
  TI08: "/test-pdfs/TI08-ref.jpg",
};

/** Preview image for v2 spread templates */
function SpreadThumbnail({ config }: { config: TemplateConfig }) {
  const aspect = config.spreadWidthMm / config.spreadHeightMm;

  return (
    <div
      className="w-full bg-white border border-brand-border rounded-lg overflow-hidden"
      style={{ aspectRatio: `${aspect}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={THUMBNAIL_MAP[config.id] ?? `/test-pdfs/${config.id}.png`}
        alt={config.name}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// Unified template item for display
interface TemplateItem {
  id: string;
  name: string;
  description: string;
  panelCount: string;
  source: "v1" | "v2";
  v1?: CardTemplate;
  v2?: TemplateConfig;
}

export default function StepTemplate({ state, dispatch }: StepTemplateProps) {
  const t = useTranslations("wizard.template");

  const items = useMemo<TemplateItem[]>(() => {
    if (!state.cardType || !state.cardFormat) return [];

    const result: TemplateItem[] = [];

    // v2 spread templates
    const v2Configs = getTemplateConfigsForCard(state.cardType, state.cardFormat);
    for (const cfg of v2Configs) {
      result.push({
        id: cfg.id,
        name: cfg.name,
        description: cfg.description,
        panelCount: cfg.requiresPhoto ? "Foto" : "Nur Text",
        source: "v2",
        v2: cfg,
      });
    }

    // v1 grid templates — only for card types that don't have v2 replacements
    // sterbebild has TI04-TI09, so skip v1 for sterbebild
    if (v2Configs.length === 0) {
      const v1Templates = getTemplatesForCard(state.cardType, state.cardFormat);
      for (const tpl of v1Templates) {
        result.push({
          id: tpl.id,
          name: tpl.name,
          description: tpl.description,
          panelCount: `${tpl.panels.length} ${tpl.panels.length === 1 ? t("panel") : t("panels")}`,
          source: "v1",
          v1: tpl,
        });
      }
    }

    return result;
  }, [state.cardType, state.cardFormat, t]);

  if (!state.cardType || !state.cardFormat) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-brand-gray">{t("noCardType")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-12">
        {t("subtitle")}
      </p>

      {items.length === 0 ? (
        <p className="text-center text-brand-gray">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const isSelected = state.templateId === item.id;
            return (
              <button
                key={item.id}
                data-testid={item.id}
                onClick={() => dispatch({ type: "SET_TEMPLATE", templateId: item.id })}
                className={`relative p-4 rounded-2xl border-2 transition-all hover:shadow-lg text-left ${
                  isSelected
                    ? "border-brand-primary bg-brand-primary-light shadow-md"
                    : "border-brand-border bg-white hover:border-brand-gray"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                    <span className="text-white text-sm">&#10003;</span>
                  </div>
                )}

                {item.source === "v2" && item.v2 ? (
                  <SpreadThumbnail config={item.v2} />
                ) : item.v1 ? (
                  <TemplateWireframe template={item.v1} />
                ) : null}

                <h3 className="text-sm font-medium text-brand-dark mt-3">
                  {item.name}
                </h3>
                <p className="text-xs text-brand-gray mt-1 line-clamp-2">
                  {item.description}
                </p>
                <p className="text-xs text-brand-gray/60 mt-1">
                  {item.panelCount}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
