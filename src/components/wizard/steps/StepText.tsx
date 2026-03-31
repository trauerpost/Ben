"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useActiveField } from "@/components/wizard/ActiveFieldContext";
import {
  DIVIDER_SYMBOLS,
  DEFAULT_TEXT_CONTENT,
} from "@/lib/editor/wizard-state";
import { TEXT_TEMPLATES } from "@/lib/editor/text-templates";
import { getTemplateConfig } from "@/lib/editor/template-configs";
import type { WizardState, WizardAction, TextContent } from "@/lib/editor/wizard-state";

interface StepTextProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onFieldFocus?: (field: string | null) => void;
  validationAttempted?: boolean;
}

// String fields in TextContent that can be edited
type StringField = Extract<
  keyof TextContent,
  | "heading" | "name" | "dates" | "dividerSymbol" | "quote"
  | "fontFamily" | "fontColor"
  | "relationshipLabels" | "birthDate" | "deathDate"
  | "locationBirth" | "locationDeath" | "quoteAuthor" | "closingVerse"
>;

// Mapping from requiredFields names to their labels, placeholders, and input type
const FIELD_META: Record<string, {
  placeholder: string;
  type: "text" | "textarea";
  required?: boolean;
  sizeField?: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize";
  sizeRange?: [number, number];
}> = {
  heading:            { placeholder: "In liebevoller Erinnerung", type: "text", sizeField: "headingFontSize", sizeRange: [6, 24] },
  relationshipLabels: { placeholder: "Unsere liebe Mutter, Oma und Uroma", type: "text" },
  name:               { placeholder: "Maria Musterfrau", type: "text", required: true, sizeField: "nameFontSize", sizeRange: [10, 40] },
  birthDate:          { placeholder: "* 24. Juli 1952", type: "text" },
  deathDate:          { placeholder: "† 28. September 2020", type: "text" },
  locationBirth:      { placeholder: "in Starnberg", type: "text" },
  locationDeath:      { placeholder: "in Augsburg", type: "text" },
  dates:              { placeholder: "* 24. Juli 1952 — † 28. September 2020", type: "text", sizeField: "datesFontSize", sizeRange: [8, 24] },
  dividerSymbol:      { placeholder: "", type: "text" },
  quote:              { placeholder: "Das schönste Denkmal, das ein Mensch\nbekommen kann, steht in den Herzen\nder Mitmenschen.", type: "textarea", sizeField: "quoteFontSize", sizeRange: [6, 24] },
  quoteAuthor:        { placeholder: "(Albert Schweitzer)", type: "text" },
  closingVerse:       { placeholder: "Wir vermissen dich.", type: "text" },
};

// Section groupings for collapsible accordion
const SECTIONS = [
  {
    id: "personal",
    labelKey: "sections.personal",
    fields: ["heading", "relationshipLabels", "name"],
  },
  {
    id: "dates",
    labelKey: "sections.dates",
    fields: ["birthDate", "locationBirth", "deathDate", "locationDeath", "dates"],
  },
  {
    id: "text",
    labelKey: "sections.text",
    fields: ["quote", "quoteAuthor", "closingVerse"],
  },
  {
    id: "divider",
    labelKey: "sections.divider",
    fields: ["dividerSymbol"],
  },
];

export default function StepText({ state, dispatch, onFieldFocus, validationAttempted }: StepTextProps) {
  const t = useTranslations("wizard.text");
  const [showConfirm, setShowConfirm] = useState<Partial<TextContent> | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(["personal"]));

  const tc = state.textContent;
  const templates = state.cardType ? TEXT_TEMPLATES[state.cardType] : [];
  const { activeField: contextActiveField, syncSource } = useActiveField();

  // Scroll to field when clicked on preview (syncSource === "preview")
  useEffect(() => {
    if (syncSource !== "preview" || !contextActiveField) return;
    const el = document.querySelector(`[data-field="${contextActiveField}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  }, [contextActiveField, syncSource]);

  // Determine which fields to show
  const isV2 = state.templateId?.startsWith("TI") ?? false;
  const templateConfig = state.templateId ? getTemplateConfig(state.templateId) : null;

  const visibleFields = useMemo(() => {
    if (!isV2 || !templateConfig) {
      return ["heading", "name", "dates", "dividerSymbol", "quote"];
    }
    return templateConfig.requiredFields;
  }, [isV2, templateConfig]);

  // Filter sections to only those with visible fields
  const activeSections = useMemo(() => {
    return SECTIONS
      .map(s => ({
        ...s,
        fields: s.fields.filter(f => visibleFields.includes(f)),
      }))
      .filter(s => s.fields.length > 0);
  }, [visibleFields]);

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleFieldFocus(fieldName: string) {
    onFieldFocus?.(fieldName);
    // Auto-open the section containing this field
    const section = activeSections.find(s => s.fields.includes(fieldName));
    if (section && !openSections.has(section.id)) {
      setOpenSections(prev => new Set(prev).add(section.id));
    }
  }

  function applyTextTemplate(partial: Partial<TextContent>) {
    if (tc.name.trim().length > 0 || tc.heading.trim().length > 0) {
      setShowConfirm(partial);
    } else {
      doApply(partial);
    }
  }

  function doApply(partial: Partial<TextContent>) {
    const merged = { ...DEFAULT_TEXT_CONTENT, ...partial };
    for (const key of ["heading", "name", "dates", "dividerSymbol", "quote", "fontFamily", "fontColor"] as const) {
      if (merged[key] !== undefined) {
        dispatch({ type: "SET_TEXT_STRING", field: key, value: merged[key] });
      }
    }
    setShowConfirm(null);
  }

  function setString(field: StringField, value: string) {
    dispatch({ type: "SET_TEXT_STRING", field, value });
  }

  function setFontSize(field: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize", value: number) {
    dispatch({ type: "SET_TEXT_NUMBER", field, value });
  }

  /** Check if a section has any non-empty values */
  function sectionHasContent(section: typeof activeSections[number]): boolean {
    return section.fields.some(f => {
      const val = tc[f as keyof TextContent];
      return typeof val === "string" && val.trim().length > 0;
    });
  }

  function renderField(fieldName: string) {
    // Special case: divider symbol picker
    if (fieldName === "dividerSymbol") {
      return (
        <div key="dividerSymbol">
          <label className="block text-sm font-medium text-brand-dark mb-2">
            {t("divider")}
          </label>
          <div className="flex flex-wrap gap-2">
            {DIVIDER_SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => setString("dividerSymbol", sym)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors min-w-[48px] ${
                  tc.dividerSymbol === sym
                    ? "bg-brand-primary text-white"
                    : "bg-brand-light-gray text-brand-dark hover:bg-brand-border"
                }`}
              >
                {sym || "None"}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const meta = FIELD_META[fieldName];
    if (!meta) return null;

    const value = tc[fieldName as keyof TextContent] as string;
    const isInvalid = meta.required && validationAttempted && !value?.trim();

    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          {t(`fields.${fieldName}` as Parameters<typeof t>[0])}
          {meta.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {meta.type === "textarea" ? (
          <textarea
            data-field={fieldName}
            value={value ?? ""}
            onChange={(e) => setString(fieldName as StringField, e.target.value)}
            onFocus={() => handleFieldFocus(fieldName)}
            onBlur={() => onFieldFocus?.(null)}
            rows={4}
            placeholder={meta.placeholder}
            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none ${
              isInvalid ? "border-red-400 focus:ring-red-200" : "border-brand-border"
            }`}
          />
        ) : (
          <input
            data-field={fieldName}
            type="text"
            value={value ?? ""}
            onChange={(e) => setString(fieldName as StringField, e.target.value)}
            onFocus={() => handleFieldFocus(fieldName)}
            onBlur={() => onFieldFocus?.(null)}
            placeholder={meta.placeholder}
            className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${
              isInvalid ? "border-red-400 focus:ring-red-200" : "border-brand-border"
            }`}
          />
        )}
        {isInvalid && (
          <p className="text-xs text-red-500 mt-1">{t("fields.nameRequired")}</p>
        )}
        {meta.sizeField && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-brand-gray">
              {tc[meta.sizeField as keyof TextContent] as number}pt
            </span>
            <input
              type="range"
              min={meta.sizeRange?.[0] ?? 8}
              max={meta.sizeRange?.[1] ?? 24}
              value={tc[meta.sizeField as keyof TextContent] as number}
              onChange={(e) => setFontSize(meta.sizeField!, parseInt(e.target.value))}
              className="flex-1 accent-brand-primary"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-10">
        {t("subtitle")}
      </p>

      <div className="space-y-2">
        {/* Text template selector (v1 only) */}
        {!isV2 && templates.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-dark mb-2">
              {t("templateTitle")}
            </label>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => applyTextTemplate(tpl.textContent)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-white hover:bg-brand-light-gray transition-colors text-brand-dark"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
            {showConfirm && (
              <div className="mt-2 p-3 rounded-lg border border-amber-300 bg-amber-50">
                <p className="text-sm text-amber-800 mb-2">{t("templateConfirm")}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => doApply(showConfirm)}
                    className="px-3 py-1 rounded text-sm bg-brand-primary text-white"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="px-3 py-1 rounded text-sm bg-brand-light-gray text-brand-gray"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible accordion sections */}
        {activeSections.map(section => {
          const isOpen = openSections.has(section.id);
          const hasContent = sectionHasContent(section);
          return (
            <div key={section.id} className="border border-brand-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-brand-dark hover:bg-brand-light-gray transition-colors"
              >
                <span className="flex items-center gap-2">
                  {t(section.labelKey as Parameters<typeof t>[0])}
                  {!isOpen && hasContent && (
                    <span className="w-2 h-2 rounded-full bg-brand-primary" />
                  )}
                </span>
                <span className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  &#9660;
                </span>
              </button>
              <div
                className={`transition-all duration-200 overflow-hidden ${
                  isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-4 pb-4 space-y-4">
                  {section.fields.map(renderField)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
