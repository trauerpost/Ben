"use client";

import Image from "next/image";
import { CARD_CONFIGS, getCardDimensions } from "@/lib/editor/wizard-state";
import type { WizardState } from "@/lib/editor/wizard-state";

export type CardPanel = "front" | "back" | "inside-left" | "inside-right";

interface CardRendererProps {
  state: WizardState;
  panel: CardPanel;
  scale?: number;
}

function getPanelDimensions(state: WizardState): { widthMm: number; heightMm: number } {
  if (!state.cardType) return { widthMm: 140, heightMm: 105 };
  const config = CARD_CONFIGS[state.cardType];
  const format = state.cardFormat ?? config.availableFormats[0];

  if (format === "folded") {
    // Each panel is half the total width
    const full = config.formats[format];
    if (!full) return { widthMm: 185, heightMm: 115 };
    return { widthMm: full.widthMm / 2, heightMm: full.heightMm };
  }

  const dims = getCardDimensions(state);
  return dims ?? { widthMm: 140, heightMm: 105 };
}

function BackgroundLayer({ url }: { url: string | null }) {
  if (!url) {
    return <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />;
  }
  return (
    <Image
      src={url}
      alt="Background"
      fill
      className="object-cover"
      sizes="400px"
    />
  );
}

function PhotoLayer({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-brand-gray text-xs">
        Photo
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt="Photo"
      fill
      className="object-cover"
      sizes="200px"
    />
  );
}

function TextLayer({ state, maxFontSize }: { state: WizardState; maxFontSize?: number }) {
  const fontSize = maxFontSize ? Math.min(state.fontSize, maxFontSize) : state.fontSize;
  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <p
        className="whitespace-pre-wrap leading-relaxed w-full"
        style={{
          fontFamily: state.fontFamily,
          fontSize: `${fontSize}px`,
          color: state.fontColor,
          textAlign: state.textAlign,
        }}
      >
        {state.text || "Text"}
      </p>
    </div>
  );
}

function DecorationOverlay({ state }: { state: WizardState }) {
  const { borderUrl, cornerUrls, dividerUrls } = state.decorations;
  if (!borderUrl && cornerUrls.length === 0 && dividerUrls.length === 0) return null;

  return (
    <>
      {borderUrl && (
        <div className="absolute inset-0 pointer-events-none">
          <Image src={borderUrl} alt="" fill className="object-contain" sizes="400px" />
        </div>
      )}
      {cornerUrls.map((url, i) => (
        <div
          key={`corner-${i}`}
          className="absolute w-12 h-12 pointer-events-none"
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
 * Renders a single panel of a card at the correct aspect ratio.
 *
 * Panel layouts by card type:
 * - Erinnerungsbild (single): front = background + name/dates, back = photo + text
 * - Trauerkarte/Dankeskarte (single): front = background + title, back = text
 * - Trauerkarte/Dankeskarte (folded): front = background + title, inside-left = photo, inside-right = text, back = blank
 */
export default function CardRenderer({ state, panel, scale = 1 }: CardRendererProps) {
  const dims = getPanelDimensions(state);
  const aspectRatio = dims.widthMm / dims.heightMm;
  const isFolded = state.cardFormat === "folded";
  const isSterbebild = state.cardType === "sterbebild";

  function renderPanelContent(): React.ReactNode {
    if (isSterbebild) {
      // Erinnerungsbild: front = background + decorations, back = photo (left) + text (right)
      if (panel === "front") {
        return (
          <div className="relative w-full h-full">
            <BackgroundLayer url={state.backImageUrl} />
            <DecorationOverlay state={state} />
          </div>
        );
      }
      // back
      return (
        <div className="flex w-full h-full bg-white">
          <div className="w-1/2 relative border-r border-brand-border">
            <PhotoLayer url={state.photoUrl} />
          </div>
          <div className="w-1/2">
            <TextLayer state={state} maxFontSize={14} />
          </div>
        </div>
      );
    }

    // Trauerkarte / Dankeskarte
    if (panel === "front") {
      return (
        <div className="relative w-full h-full">
          <BackgroundLayer url={state.backImageUrl} />
          <DecorationOverlay state={state} />
        </div>
      );
    }

    if (isFolded) {
      if (panel === "inside-left") {
        return (
          <div className="relative w-full h-full bg-white">
            <PhotoLayer url={state.photoUrl} />
          </div>
        );
      }
      if (panel === "inside-right") {
        return (
          <div className="w-full h-full bg-white">
            <TextLayer state={state} maxFontSize={14} />
          </div>
        );
      }
      // back cover
      return <div className="w-full h-full bg-white" />;
    }

    // Single card back
    return (
      <div className="w-full h-full bg-white">
        <TextLayer state={state} />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-brand-border shadow-lg"
      style={{
        aspectRatio: `${aspectRatio}`,
        maxWidth: `${dims.widthMm * scale * 2}px`,
      }}
    >
      {renderPanelContent()}
    </div>
  );
}

/**
 * Returns the list of panels to render for a given wizard state.
 */
export function getPanelsForCard(state: WizardState): CardPanel[] {
  if (state.cardFormat === "folded") {
    return ["front", "inside-left", "inside-right", "back"];
  }
  return ["front", "back"];
}
