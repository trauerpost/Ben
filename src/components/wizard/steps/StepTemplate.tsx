"use client";

import { useTranslations } from "next-intl";
import { getTemplatesForCard } from "@/lib/editor/card-templates";
import type { CardTemplate } from "@/lib/editor/card-templates";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";

interface StepTemplateProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Renders a tiny wireframe preview of a template panel layout. */
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
      {frontPanel.slots.length === 0 && (
        <div className="flex items-center justify-center text-[8px] text-gray-300 bg-gray-50 rounded">
          {frontPanel.defaultBackground === "image" ? "Bild" : "Leer"}
        </div>
      )}
    </div>
  );
}

export default function StepTemplate({ state, dispatch }: StepTemplateProps) {
  const t = useTranslations("wizard.template");

  const templates =
    state.cardType && state.cardFormat
      ? getTemplatesForCard(state.cardType, state.cardFormat)
      : [];

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

      {templates.length === 0 ? (
        <p className="text-center text-brand-gray">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => {
            const isSelected = state.templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => dispatch({ type: "SET_TEMPLATE", templateId: tpl.id })}
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

                <TemplateWireframe template={tpl} />

                <h3 className="text-sm font-medium text-brand-dark mt-3">
                  {tpl.name}
                </h3>
                <p className="text-xs text-brand-gray mt-1 line-clamp-2">
                  {tpl.description}
                </p>
                <p className="text-xs text-brand-gray/60 mt-1">
                  {tpl.panels.length} {tpl.panels.length === 1 ? t("panel") : t("panels")}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
