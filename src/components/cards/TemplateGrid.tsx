"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import TemplateCard from "./TemplateCard";
import type { CardTemplate, CardType } from "@/lib/supabase/types";

interface TemplateGridProps {
  templates: CardTemplate[];
}

const categories: Array<CardType | "all"> = [
  "all",
  "sterbebild",
  "trauerkarte",
  "dankkarte",
];

export default function TemplateGrid({ templates }: TemplateGridProps) {
  const t = useTranslations("templates");
  const [activeCategory, setActiveCategory] = useState<CardType | "all">("all");

  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter((tpl) => tpl.category === activeCategory);

  return (
    <div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === cat
                ? "bg-brand-primary text-white"
                : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
            }`}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-brand-gray py-12">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
