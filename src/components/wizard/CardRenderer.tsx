"use client";

import Image from "next/image";
import { getCardDimensions, CARD_CONFIGS } from "@/lib/editor/wizard-state";
import type { WizardState } from "@/lib/editor/wizard-state";
import { getTemplateById } from "@/lib/editor/card-templates";
import type { PanelTemplate, TemplateSlot } from "@/lib/editor/card-templates";
import TextBlockRenderer from "./TextBlockRenderer";

interface CardRendererProps {
  templateId: string;
  panelId: string;
  state: WizardState;
  scale?: number;
}

function getPanelDimensions(state: WizardState): { widthMm: number; heightMm: number } {
  if (!state.cardType) return { widthMm: 140, heightMm: 105 };
  const config = CARD_CONFIGS[state.cardType];
  const format = state.cardFormat ?? config.availableFormats[0];

  if (format === "folded") {
    const full = config.formats[format];
    if (!full) return { widthMm: 185, heightMm: 115 };
    return { widthMm: full.widthMm / 2, heightMm: full.heightMm };
  }

  const dims = getCardDimensions(state);
  return dims ?? { widthMm: 140, heightMm: 105 };
}

function PhotoSlot({ url, placeholder }: { url: string | null; placeholder: string }) {
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
        {placeholder}
      </div>
    );
  }
  return (
    <div className="relative w-full h-full">
      <Image
        src={url}
        alt="Foto"
        fill
        className="object-cover"
        sizes="300px"
      />
    </div>
  );
}

function DecorationSlot({ url, placeholder }: { url: string | null; placeholder: string }) {
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-xs">
        {placeholder}
      </div>
    );
  }
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src={url}
        alt="Dekoration"
        fill
        className="object-contain"
        sizes="200px"
      />
    </div>
  );
}

function renderSlot(slot: TemplateSlot, state: WizardState): React.ReactNode {
  switch (slot.type) {
    case "photo":
      return <PhotoSlot url={state.photo.url} placeholder={slot.placeholder} />;
    case "text":
      return (
        <TextBlockRenderer
          textContent={state.textContent}
          fields={slot.textFields ?? []}
        />
      );
    case "decoration":
      return <DecorationSlot url={state.decoration.assetUrl} placeholder={slot.placeholder} />;
    default:
      return null;
  }
}

function BorderOverlay({ state }: { state: WizardState }) {
  if (!state.border.url && state.corners.urls.length === 0) return null;

  return (
    <>
      {state.border.url && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <Image src={state.border.url} alt="" fill className="object-contain" sizes="400px" />
        </div>
      )}
      {state.corners.urls.map((url, i) => (
        <div
          key={`corner-${i}`}
          className="absolute w-12 h-12 pointer-events-none z-10"
          style={{
            top: i < 2 ? 0 : undefined,
            bottom: i >= 2 ? 0 : undefined,
            left: i % 2 === 0 ? 0 : undefined,
            right: i % 2 === 1 ? 0 : undefined,
            transform: `rotate(${i * 90}deg)`,
          }}
        >
          <Image src={url} alt="" fill className="object-contain" sizes="48px" />
        </div>
      ))}
    </>
  );
}

/**
 * Renders a single panel of a card using CSS Grid based on a template definition.
 */
export default function CardRenderer({ templateId, panelId, state, scale = 1 }: CardRendererProps) {
  const template = getTemplateById(templateId);
  if (!template) {
    return <div className="text-red-500 text-sm p-4">Template &quot;{templateId}&quot; not found</div>;
  }

  const panel = template.panels.find((p) => p.panelId === panelId);
  if (!panel) {
    return <div className="text-red-500 text-sm p-4">Panel &quot;{panelId}&quot; not found</div>;
  }

  const dims = getPanelDimensions(state);
  const aspectRatio = dims.widthMm / dims.heightMm;

  // Background style
  const hasBackgroundImage = state.background.type === "image" && state.background.imageUrl;
  const backgroundColor = state.background.type === "color" ? state.background.color : undefined;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-brand-border shadow-lg"
      style={{
        aspectRatio: `${aspectRatio}`,
        maxWidth: `${dims.widthMm * scale * 2}px`,
        backgroundColor: backgroundColor,
      }}
    >
      {/* Background image layer */}
      {hasBackgroundImage && state.background.imageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={state.background.imageUrl}
            alt="Hintergrund"
            fill
            className="object-cover"
            sizes="400px"
          />
        </div>
      )}

      {/* Grid content layer */}
      <div
        className="relative w-full h-full z-[1]"
        style={{
          display: "grid",
          gridTemplateRows: panel.gridTemplateRows,
          gridTemplateColumns: panel.gridTemplateColumns,
        }}
      >
        {panel.slots.map((slot) => (
          <div
            key={slot.id}
            className="relative overflow-hidden"
            style={{ gridArea: slot.gridArea }}
          >
            {renderSlot(slot, state)}
          </div>
        ))}
      </div>

      {/* Border & corner overlays */}
      <BorderOverlay state={state} />
    </div>
  );
}

/**
 * Returns the panel IDs for a given template.
 */
export function getPanelsForTemplate(templateId: string): string[] {
  const template = getTemplateById(templateId);
  if (!template) return [];
  return template.panels.map((p) => p.panelId);
}
