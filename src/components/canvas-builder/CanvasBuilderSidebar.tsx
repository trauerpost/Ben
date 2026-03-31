"use client";

import { useState } from "react";
import type { CardType, CardFormat } from "@/lib/editor/wizard-state";
import TemplatePicker from "./TemplatePicker";
import AddElementPanel from "./AddElementPanel";
import AssetBrowser from "@/components/editor/AssetBrowser";
import type { Asset } from "@/lib/supabase/types";

type Tab = "elements" | "assets" | "template";

interface CanvasBuilderSidebarProps {
  isTemplateLoaded: boolean;
  templateId: string | null;
  onTemplateSelect: (
    cardType: CardType,
    cardFormat: CardFormat,
    templateId: string
  ) => void;
  onAddText: () => void;
  onAddPhoto: (url: string) => void;
  onAssetSelect: (asset: Asset) => void;
  onChangeTemplate: () => void;
}

export default function CanvasBuilderSidebar({
  isTemplateLoaded,
  templateId,
  onTemplateSelect,
  onAddText,
  onAddPhoto,
  onAssetSelect,
  onChangeTemplate,
}: CanvasBuilderSidebarProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("elements");

  // Before template selected → show picker
  if (!isTemplateLoaded) {
    return (
      <div className="w-60 border-r border-brand-border bg-white flex flex-col h-full overflow-y-auto">
        <TemplatePicker onSelect={onTemplateSelect} />
      </div>
    );
  }

  return (
    <div className="w-60 border-r border-brand-border bg-white flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-brand-border shrink-0">
        {(["elements", "assets", "template"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2.5 text-xs transition-colors ${
              activeTab === tab
                ? "text-brand-primary border-b-2 border-brand-primary font-medium"
                : "text-brand-gray hover:text-brand-dark"
            }`}
          >
            {tab === "elements"
              ? "Elemente"
              : tab === "assets"
                ? "Assets"
                : "Vorlage"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "elements" && (
          <AddElementPanel onAddText={onAddText} onAddPhoto={onAddPhoto} />
        )}
        {activeTab === "assets" && (
          <AssetBrowser onSelect={onAssetSelect} />
        )}
        {activeTab === "template" && (
          <div className="p-4 space-y-4">
            <div className="text-sm text-brand-dark">
              <span className="font-medium">Vorlage:</span>{" "}
              <span className="text-brand-gray">{templateId}</span>
            </div>
            <button
              onClick={onChangeTemplate}
              className="w-full px-3 py-2 rounded-lg text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Vorlage wechseln
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
