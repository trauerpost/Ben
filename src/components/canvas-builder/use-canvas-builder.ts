"use client";

import { useState, useCallback, useRef, type RefObject } from "react";
import type { CardType, CardFormat, WizardState } from "@/lib/editor/wizard-state";
import {
  getCanvasDimensions,
  type CanvasDimensions,
} from "@/lib/editor/canvas-dimensions";
import {
  templateToFabricConfigs,
  type FabricElementConfig,
} from "@/lib/editor/template-to-fabric";
import { fabricToWizardState } from "@/lib/editor/fabric-to-wizard-state";
import { getTemplateConfig } from "@/lib/editor/template-configs";
import type { FabricCanvasHandle } from "./FabricCanvas";
import type { SpreadPage } from "./SpreadNavigator";

const STORAGE_KEY = "trauerpost_canvas_builder_draft";
const DRAFT_VERSION = 1;

interface DraftEnvelope {
  version: number;
  cardType: CardType;
  cardFormat: CardFormat;
  templateId: string;
  activePageId: string;
  pagesData: Record<string, string>;
}

function getPageDefs(
  cardFormat: CardFormat | null
): SpreadPage[] {
  if (cardFormat === "folded") {
    return [
      { id: "front-left", label: "Außen links" },
      { id: "front-right", label: "Außen rechts" },
      { id: "inside-left", label: "Innen links" },
      { id: "inside-right", label: "Innen rechts" },
    ];
  }
  return [
    { id: "front", label: "Vorderseite" },
    { id: "back", label: "Rückseite" },
  ];
}

export interface UseCanvasBuilderReturn {
  cardType: CardType | null;
  cardFormat: CardFormat | null;
  templateId: string | null;
  isTemplateLoaded: boolean;
  activePageId: string;
  zoom: number;
  pages: SpreadPage[];
  dims: CanvasDimensions | null;
  loadTemplate: (
    cardType: CardType,
    cardFormat: CardFormat,
    templateId: string
  ) => Promise<void>;
  switchPage: (pageId: string) => Promise<void>;
  setZoom: (zoom: number) => void;
  handleZoomFit: (containerWidth: number, containerHeight: number) => void;
  handleZoomReset: () => void;
  exportToWizardState: () => WizardState | null;
  saveDraft: () => void;
  restoreDraft: () => boolean;
}

export function useCanvasBuilder(
  canvasRef: RefObject<FabricCanvasHandle | null>
): UseCanvasBuilderReturn {
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [cardFormat, setCardFormat] = useState<CardFormat | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  const [activePageId, setActivePageId] = useState("front");
  const [zoom, setZoom] = useState(1);
  const [dims, setDims] = useState<CanvasDimensions | null>(null);

  const pagesDataRef = useRef<Record<string, string>>({});

  const pages = getPageDefs(cardFormat);

  const loadTemplate = useCallback(
    async (ct: CardType, cf: CardFormat, tid: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const template = getTemplateConfig(tid);
      if (!template) {
        console.error(`[use-canvas-builder] Template not found: ${tid}`);
        return;
      }

      const newDims = getCanvasDimensions(ct, cf);
      canvas.resize(newDims.width, newDims.height);

      // Convert template elements to Fabric configs
      const configs = templateToFabricConfigs(template, newDims);

      // Add each element to canvas
      for (const cfg of configs) {
        addFabricObject(canvas, cfg);
      }

      setCardType(ct);
      setCardFormat(cf);
      setTemplateId(tid);
      setDims(newDims);
      setIsTemplateLoaded(true);

      // Set initial page
      const pageDefs = getPageDefs(cf);
      setActivePageId(pageDefs[0].id);
      pagesDataRef.current = {};
    },
    [canvasRef]
  );

  const switchPage = useCallback(
    async (pageId: string) => {
      const canvas = canvasRef.current;
      if (!canvas || pageId === activePageId) return;

      // Serialize current page
      pagesDataRef.current[activePageId] = canvas.toJSON();

      // Load target page (or blank)
      const targetJSON = pagesDataRef.current[pageId];
      if (targetJSON) {
        await canvas.loadJSON(targetJSON);
      } else {
        // First time visiting this page — blank canvas
        await canvas.loadJSON(
          JSON.stringify({
            version: "6.0.0",
            objects: [],
            background: "#ffffff",
          })
        );
      }

      setActivePageId(pageId);
    },
    [canvasRef, activePageId]
  );

  const handleZoomFit = useCallback(
    (containerWidth: number, containerHeight: number) => {
      if (!dims) return;
      const scaleX = containerWidth / dims.width;
      const scaleY = containerHeight / dims.height;
      setZoom(Math.min(scaleX, scaleY, 1) * 0.95); // 95% to leave margin
    },
    [dims]
  );

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  const exportToWizardState = useCallback((): WizardState | null => {
    const canvas = canvasRef.current;
    if (!canvas || !cardType || !cardFormat || !templateId || !dims) return null;

    // Save current page first
    pagesDataRef.current[activePageId] = canvas.toJSON();

    // Use front page for export (primary content)
    const frontPageId = pages[0].id;
    const frontJSON = pagesDataRef.current[frontPageId];
    if (!frontJSON) return null;

    return fabricToWizardState(
      JSON.parse(frontJSON),
      dims,
      cardType,
      cardFormat,
      templateId
    );
  }, [canvasRef, cardType, cardFormat, templateId, dims, activePageId, pages]);

  const saveDraft = useCallback(() => {
    if (!cardType || !cardFormat || !templateId) return;
    const canvas = canvasRef.current;
    if (canvas) {
      pagesDataRef.current[activePageId] = canvas.toJSON();
    }
    try {
      const envelope: DraftEnvelope = {
        version: DRAFT_VERSION,
        cardType,
        cardFormat,
        templateId,
        activePageId,
        pagesData: pagesDataRef.current,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      /* ignore */
    }
  }, [canvasRef, cardType, cardFormat, templateId, activePageId]);

  const restoreDraft = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      const envelope = JSON.parse(saved) as DraftEnvelope;
      if (envelope.version !== DRAFT_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      const canvas = canvasRef.current;
      if (!canvas) return false;

      const newDims = getCanvasDimensions(envelope.cardType, envelope.cardFormat);
      canvas.resize(newDims.width, newDims.height);

      // Load the active page
      const pageJSON = envelope.pagesData[envelope.activePageId];
      if (pageJSON) {
        canvas.loadJSON(pageJSON);
      }

      setCardType(envelope.cardType);
      setCardFormat(envelope.cardFormat);
      setTemplateId(envelope.templateId);
      setDims(newDims);
      setActivePageId(envelope.activePageId);
      pagesDataRef.current = envelope.pagesData;
      setIsTemplateLoaded(true);

      return true;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }, [canvasRef]);

  return {
    cardType,
    cardFormat,
    templateId,
    isTemplateLoaded,
    activePageId,
    zoom,
    pages,
    dims,
    loadTemplate,
    switchPage,
    setZoom,
    handleZoomFit,
    handleZoomReset,
    exportToWizardState,
    saveDraft,
    restoreDraft,
  };
}

/** Create Fabric objects from config and add to canvas */
function addFabricObject(
  canvas: FabricCanvasHandle,
  config: FabricElementConfig
): void {
  switch (config.fabricType) {
    case "textbox":
      canvas.addText(
        (config.options.text as string) || "",
        config.options
      );
      break;
    case "rect":
      canvas.addRect(config.options);
      break;
    case "line":
    case "image":
      // Lines and ornament images added as rects for now (placeholder)
      canvas.addRect({
        ...config.options,
        fill: "transparent",
      });
      break;
  }
}
