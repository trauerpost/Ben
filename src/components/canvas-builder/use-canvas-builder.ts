"use client";

import { useState, useCallback, useRef, type RefObject } from "react";
import type { CardType, CardFormat, WizardState, TextContent } from "@/lib/editor/wizard-state";
import {
  getCanvasDimensions,
  type CanvasDimensions,
} from "@/lib/editor/canvas-dimensions";
import {
  templateToFabricConfigs,
  type FabricElementConfig,
} from "@/lib/editor/template-to-fabric";
import { getFabricCropOffset } from "@/lib/editor/image-fitter";
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
  getAllPagesData: () => Record<string, string>;
  getAllPageImages: () => Promise<Record<string, string>>;
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
  const [hasMultiplePages, setHasMultiplePages] = useState(false);

  const pagesDataRef = useRef<Record<string, string>>({});

  const allPages = getPageDefs(cardFormat);
  const pages = hasMultiplePages ? allPages : allPages.slice(0, 1);

  const loadTemplate = useCallback(
    async (ct: CardType, cf: CardFormat, tid: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const template = getTemplateConfig(tid);
      if (!template) {
        console.error(`[use-canvas-builder] Template not found: ${tid}`);
        return;
      }

      // Templates with front/back pages render each page as portrait (half spread width)
      const multiPage = template.elements.some(el => el.page && el.page !== "front");
      setHasMultiplePages(multiPage);
      const newDims = getCanvasDimensions(ct, cf, undefined, multiPage);
      canvas.resize(newDims.width, newDims.height);

      // Wait for fonts before measuring/rendering text
      await document.fonts.ready;

      // Build textContent from placeholder data so canvas shows real text, not [fieldName]
      const ph = template.placeholderData;
      const textContent: Partial<TextContent> = ph ? {
        heading: ph.heading ?? "",
        name: ph.name,
        birthDate: ph.birthDate,
        deathDate: ph.deathDate,
        quote: ph.quote ?? "",
        quoteAuthor: ph.quoteAuthor ?? "",
        relationshipLabels: ph.relationshipLabels ?? "",
        closingVerse: ph.closingVerse ?? "",
        locationBirth: ph.locationBirth ?? "",
        locationDeath: ph.locationDeath ?? "",
        dividerSymbol: ph.dividerSymbol ?? "",
      } : {};

      // Convert template elements to Fabric configs
      const allConfigs = templateToFabricConfigs(template, newDims, textContent);

      // Split elements by page (default to "front" if no page specified)
      const pageDefs = getPageDefs(cf);
      const firstPageId = pageDefs[0].id;
      const frontConfigs = allConfigs.filter(
        cfg => (cfg.options.data as Record<string, unknown>)?.page === firstPageId ||
               !(cfg.options.data as Record<string, unknown>)?.page
      );

      // Add front page elements to canvas
      for (const cfg of frontConfigs) {
        await addFabricObject(canvas, cfg);
      }

      // Pre-build other pages: create a temporary canvas for each, serialize to JSON
      for (const pageDef of pageDefs.slice(1)) {
        const pageConfigs = allConfigs.filter(
          cfg => (cfg.options.data as Record<string, unknown>)?.page === pageDef.id
        );
        if (pageConfigs.length > 0) {
          // Save current canvas, load page elements, serialize, restore
          const currentJSON = canvas.toJSON();
          await canvas.loadJSON(JSON.stringify({ version: "6.0.0", objects: [], background: "#ffffff" }));
          for (const cfg of pageConfigs) {
            await addFabricObject(canvas, cfg);
          }
          pagesDataRef.current[pageDef.id] = canvas.toJSON();
          // Restore front page
          await canvas.loadJSON(currentJSON);
        }
      }

      setCardType(ct);
      setCardFormat(cf);
      setTemplateId(tid);
      setDims(newDims);
      setIsTemplateLoaded(true);
      setActivePageId(firstPageId);

      // Deselect last added element so template loads with no selection borders
      const fabricCanvas = canvas.getCanvas();
      if (fabricCanvas) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
      }
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

  const getAllPagesData = useCallback((): Record<string, string> => {
    const canvas = canvasRef.current;
    if (canvas) {
      pagesDataRef.current[activePageId] = canvas.toJSON();
    }
    return { ...pagesDataRef.current };
  }, [canvasRef, activePageId]);

  const getAllPageImages = useCallback(async (): Promise<Record<string, string>> => {
    const canvas = canvasRef.current;
    if (!canvas) return {};

    // Save current page state
    pagesDataRef.current[activePageId] = canvas.toJSON();
    const originalPageId = activePageId;
    const images: Record<string, string> = {};

    for (const page of pages) {
      if (page.id === originalPageId) {
        // Current page — just capture it directly
        images[page.id] = canvas.toDataURL();
      } else {
        // Switch to this page, capture, switch back
        const pageJSON = pagesDataRef.current[page.id];
        if (pageJSON) {
          await canvas.loadJSON(pageJSON);
          images[page.id] = canvas.toDataURL();
        }
      }
    }

    // Restore original page
    if (pages.length > 1) {
      const origJSON = pagesDataRef.current[originalPageId];
      if (origJSON) {
        await canvas.loadJSON(origJSON);
      }
    }

    return images;
  }, [canvasRef, activePageId, pages]);

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

      // Check if template has multiple pages for perPage sizing
      const tmpl = getTemplateConfig(envelope.templateId);
      const hasPages = tmpl?.elements.some(el => el.page && el.page !== "front") ?? false;
      const newDims = getCanvasDimensions(envelope.cardType, envelope.cardFormat, undefined, hasPages);
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
    getAllPagesData,
    getAllPageImages,
    saveDraft,
    restoreDraft,
  };
}

/** Create Fabric objects from config and add to canvas */
async function addFabricObject(
  canvas: FabricCanvasHandle,
  config: FabricElementConfig
): Promise<void> {
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
    case "image": {
      const src = config.meta?.placeholderSrc ?? config.meta?.fixedAsset;
      if (src) {
        try {
          const fabricCanvas = canvas.getCanvas();
          if (!fabricCanvas) break;
          const { FabricImage } = await import("fabric");
          const img = await FabricImage.fromURL(src, { crossOrigin: "anonymous" });
          const targetW = config.options.width as number;
          const targetH = config.options.height as number;
          const imgW = img.width ?? 1;
          const imgH = img.height ?? 1;
          const slotLeft = config.options.left as number;
          const slotTop = config.options.top as number;

          // Ornaments use contain-fit (no crop), photos use cover-crop with face bias
          const isOrnament = !!config.meta?.fixedAsset && !config.meta?.placeholderSrc;
          let scale: number;
          let imgLeft: number;
          let imgTop: number;

          if (isOrnament) {
            // Contain: fit entirely inside slot, center
            scale = Math.min(targetW / imgW, targetH / imgH);
            imgLeft = slotLeft + (targetW - imgW * scale) / 2;
            imgTop = slotTop + (targetH - imgH * scale) / 2;
          } else {
            // Cover crop with face bias
            scale = Math.max(targetW / imgW, targetH / imgH);
            const { offsetX, offsetY } = getFabricCropOffset(imgW, imgH, targetW, targetH);
            imgLeft = slotLeft - offsetX;
            imgTop = slotTop - offsetY;
          }

          img.set({
            left: imgLeft,
            top: imgTop,
            scaleX: scale,
            scaleY: scale,
            data: { ...(config.options.data as Record<string, unknown>), slotWidth: targetW, slotHeight: targetH, slotLeft, slotTop },
          });

          // Apply clipping — always clip photos to their slot bounds
          const imageClip = config.meta?.imageClip;
          if (!imageClip && !isOrnament) {
            // Default: rectangular clip to slot
            const { Rect } = await import("fabric");
            img.clipPath = new Rect({
              width: targetW,
              height: targetH,
              left: slotLeft,
              top: slotTop,
              absolutePositioned: true,
            });
          } else if (imageClip === "ellipse") {
            const { Ellipse } = await import("fabric");
            img.clipPath = new Ellipse({
              rx: targetW / 2,
              ry: targetH / 2,
              left: slotLeft + targetW / 2,
              top: slotTop + targetH / 2,
              originX: "center",
              originY: "center",
              absolutePositioned: true,
            });
          } else if (imageClip === "rounded") {
            const { Rect } = await import("fabric");
            img.clipPath = new Rect({
              width: targetW,
              height: targetH,
              rx: 8,
              ry: 8,
              left: slotLeft,
              top: slotTop,
              absolutePositioned: true,
            });
          }

          fabricCanvas.add(img);
        } catch (err) {
          console.warn("[addFabricObject] Failed to load image:", src, err);
          canvas.addRect({ ...config.options, fill: "#f0ebe6", stroke: "#ccc", strokeWidth: 1 });
        }
      } else {
        canvas.addRect({ ...config.options, fill: "transparent" });
      }
      break;
    }
    case "line":
      canvas.addLine(config.options);
      break;
  }
}
