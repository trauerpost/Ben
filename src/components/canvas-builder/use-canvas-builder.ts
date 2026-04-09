"use client";

import { useState, useCallback, useRef, useEffect, type RefObject } from "react";
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
  cardFormat: CardFormat | null,
  hasOuterPages: boolean = false,
  hasBackPage: boolean = true
): SpreadPage[] {
  if (hasOuterPages) {
    const pages: SpreadPage[] = [
      { id: "outside-left", label: "Außen links", canvasPageId: "outside-spread", thumbnailCrop: "left" },
      { id: "outside-right", label: "Außen rechts", canvasPageId: "outside-spread", thumbnailCrop: "right" },
      { id: "front", label: "Innen links" },
    ];
    if (hasBackPage) {
      pages.push({ id: "back", label: "Innen rechts" });
    }
    return pages;
  }
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
  thumbnails: Record<string, string>;
  updateActiveThumbnail: () => void;
  coverMode: "full-wrap" | "left-only";
  applyCoverMode: (mode: "full-wrap" | "left-only") => void;
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
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const thumbnailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pagesHistoryRef = useRef<Record<string, { stack: string[]; index: number }>>({});
  const isSwitchingRef = useRef(false);
  const activePageIdRef = useRef(activePageId);
  activePageIdRef.current = activePageId;
  const [coverMode, setCoverMode] = useState<"full-wrap" | "left-only">("full-wrap");

  const hasOuterPages = (() => {
    if (!templateId) return false;
    const tpl = getTemplateConfig(templateId);
    return tpl?.elements.some(el => el.page === "outside-spread") ?? false;
  })();
  const hasBackPage = (() => {
    if (!templateId) return true;
    const tpl = getTemplateConfig(templateId);
    return tpl?.elements.some(el => el.page === "back") ?? false;
  })();
  const allPages = getPageDefs(cardFormat, hasOuterPages, hasBackPage);
  const pages = (hasMultiplePages || hasOuterPages) ? allPages : allPages.slice(0, 1);

  const updateActiveThumbnail = useCallback(() => {
    if (isSwitchingRef.current) return; // Skip during page switch to avoid stale closure overwrites
    if (thumbnailTimerRef.current) clearTimeout(thumbnailTimerRef.current);
    thumbnailTimerRef.current = setTimeout(() => {
      if (isSwitchingRef.current) return; // Re-check after debounce delay
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Use ref to get current activePageId (avoids stale closure)
      const currentPageId = activePageIdRef.current;
      // Store thumbnail under the canvas page ID (e.g. "outside-spread"), not the display ID
      const activePage = pages.find(p => p.id === currentPageId);
      const canvasId = activePage?.canvasPageId ?? currentPageId;
      setThumbnails(prev => ({ ...prev, [canvasId]: canvas.toDataURL() }));
    }, 500);
  }, [canvasRef, pages]);

  // Cleanup thumbnail timer on unmount
  useEffect(() => {
    return () => {
      if (thumbnailTimerRef.current) clearTimeout(thumbnailTimerRef.current);
    };
  }, []);

  const applyCoverMode = useCallback((mode: "full-wrap" | "left-only") => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const coverObj = canvas.getObjects().find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => o.data?.templateElementId === "cover-photo"
    );
    if (!coverObj) return;

    const canvasW = canvas.getWidth();
    if (mode === "full-wrap") {
      coverObj.set({
        left: 0,
        scaleX: canvasW / (coverObj.width ?? canvasW),
        scaleY: canvas.getHeight() / (coverObj.height ?? canvas.getHeight()),
      });
    } else {
      // Left-only: cover spans left half
      coverObj.set({
        left: 0,
        scaleX: (canvasW / 2) / (coverObj.width ?? canvasW),
        scaleY: canvas.getHeight() / (coverObj.height ?? canvas.getHeight()),
      });
    }
    canvas.renderAll();
    setCoverMode(mode);
  }, [canvasRef]);

  const loadTemplate = useCallback(
    async (ct: CardType, cf: CardFormat, tid: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const template = getTemplateConfig(tid);
      if (!template) {
        console.error(`[use-canvas-builder] Template not found: ${tid}`);
        return;
      }

      // Detect outer pages and multi-page templates
      const hasOuter = template.elements.some(el => el.page === "outside-spread");
      const hasBack = template.elements.some(el => el.page === "back");
      const multiPage = template.elements.some(el => el.page && el.page !== "front");
      setHasMultiplePages(multiPage);

      // Determine which page to display first and its dimensions
      const pageDefs = getPageDefs(cf, hasOuter, hasBack);
      const firstPageDef = pageDefs[0];
      const firstPageId = firstPageDef.id;
      const firstCanvasId = firstPageDef.canvasPageId ?? firstPageId;
      const firstIsSpread = firstPageDef.isSpread ?? firstCanvasId.includes("spread");

      // Canvas dimensions: spread pages get full width, inner pages get half width
      const newDims = getCanvasDimensions(ct, cf, undefined, !firstIsSpread);
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

      // Build configs PER PAGE with correct dimensions.
      // Outside-spread uses full width (827px), inner pages use half width (413px).
      // Elements' grid coordinates (0-1000) are relative to each page's canvas, NOT the full spread.

      // First page configs (using newDims = dims for firstCanvasId)
      const firstPageTemplate = {
        ...template,
        elements: template.elements.filter(el => {
          const page = el.page ?? "front";
          if (firstCanvasId === "outside-spread") return page === "outside-spread";
          return page === firstCanvasId || !el.page;
        }),
      };
      const frontConfigs = templateToFabricConfigs(firstPageTemplate, newDims, textContent);

      // Add first page elements to canvas
      for (const cfg of frontConfigs) {
        await addFabricObject(canvas, cfg);
      }

      // Pre-build other pages: each with its own dimensions for correct coordinate mapping
      const builtCanvasIds = new Set<string>([firstCanvasId]);
      for (const pageDef of pageDefs) {
        const pageCanvasId = pageDef.canvasPageId ?? pageDef.id;
        if (builtCanvasIds.has(pageCanvasId)) continue;
        builtCanvasIds.add(pageCanvasId);

        // Filter template elements for this page
        const pageElements = template.elements.filter(el => {
          const page = el.page ?? "front";
          if (pageCanvasId === "front") return page === "front" || !el.page;
          return page === pageCanvasId;
        });

        if (pageElements.length > 0) {
          // Calculate dimensions for this specific page (spread vs inner)
          const pageIsSpread = pageDef.isSpread ?? pageCanvasId.includes("spread");
          const pageDims = getCanvasDimensions(ct, cf, undefined, !pageIsSpread);

          // Build configs with THIS PAGE's dimensions (critical: 413px for inner, 827px for spread)
          const pageTemplate = { ...template, elements: pageElements };
          const pageConfigs = templateToFabricConfigs(pageTemplate, pageDims, textContent);

          // Save current canvas, resize to target page dims, render, serialize, restore
          const currentJSON = canvas.toJSON();
          canvas.resize(pageDims.width, pageDims.height);
          await canvas.loadJSON(JSON.stringify({ version: "6.0.0", objects: [], background: "#ffffff" }));
          for (const cfg of pageConfigs) {
            await addFabricObject(canvas, cfg);
          }
          pagesDataRef.current[pageCanvasId] = canvas.toJSON();

          // Restore first page: resize back and reload
          canvas.resize(newDims.width, newDims.height);
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

      // Bring overlays (fold line, grid, etc.) to front after all elements loaded
      canvas.bringOverlaysToFront();
    },
    [canvasRef]
  );

  const switchPage = useCallback(
    async (pageId: string) => {
      const canvas = canvasRef.current;
      if (!canvas || pageId === activePageId) return;

      isSwitchingRef.current = true; // Guard ON — prevent thumbnail updates during switch

      const targetPage = pages.find(p => p.id === pageId);
      const targetCanvasId = targetPage?.canvasPageId ?? pageId;
      const currentPage = pages.find(p => p.id === activePageId);
      const currentCanvasId = currentPage?.canvasPageId ?? activePageId;

      // If switching between pages that share the same canvas (e.g. outside-left <-> outside-right),
      // just update the highlighted thumbnail — no canvas reload needed
      if (targetCanvasId === currentCanvasId) {
        setActivePageId(pageId);
        return;
      }

      // Snapshot outgoing page thumbnail (store under canvas ID)
      const outgoingThumbnail = canvas.toDataURL();
      setThumbnails(prev => ({ ...prev, [currentCanvasId]: outgoingThumbnail }));

      // Save current page's undo history (keyed by canvas ID)
      const currentHistory = canvas.getHistory();
      pagesHistoryRef.current[currentCanvasId] = currentHistory;

      // Serialize current page (keyed by canvas ID)
      pagesDataRef.current[currentCanvasId] = canvas.toJSON();

      // Determine if target page is a spread (full width) or inner page (half width)
      const targetIsSpread = targetPage?.isSpread ?? (targetCanvasId.includes("spread"));
      const targetDims = getCanvasDimensions(cardType!, cardFormat!, undefined, !targetIsSpread);

      // Resize canvas to target dimensions
      canvas.resize(targetDims.width, targetDims.height);

      // Load target page (or blank)
      const targetJSON = pagesDataRef.current[targetCanvasId];
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

      // Restore target page's undo history (or start fresh)
      const targetHistory = pagesHistoryRef.current[targetCanvasId];
      if (targetHistory) {
        canvas.setHistory(targetHistory.stack, targetHistory.index);
      } else {
        canvas.setHistory([], -1);
      }

      setActivePageId(pageId);
      setDims(targetDims);

      // Wait for React to process state update before allowing thumbnail updates
      setTimeout(() => { isSwitchingRef.current = false; }, 100);
    },
    [canvasRef, activePageId, pages, cardType, cardFormat]
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

    // Save current page first (under canvas ID)
    const activeCanvasId = pages.find(p => p.id === activePageId)?.canvasPageId ?? activePageId;
    pagesDataRef.current[activeCanvasId] = canvas.toJSON();

    // Use front page for export (primary content)
    const frontPage = pages[0];
    const frontCanvasId = frontPage.canvasPageId ?? frontPage.id;
    const frontJSON = pagesDataRef.current[frontCanvasId];
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
      const activePage = pages.find(p => p.id === activePageId);
      const canvasId = activePage?.canvasPageId ?? activePageId;
      pagesDataRef.current[canvasId] = canvas.toJSON();
    }
    return { ...pagesDataRef.current };
  }, [canvasRef, activePageId, pages]);

  const getAllPageImages = useCallback(async (): Promise<Record<string, string>> => {
    const canvas = canvasRef.current;
    if (!canvas || !cardType || !cardFormat) return {};

    // Save current page state under canvas ID
    const activeCanvasId = pages.find(p => p.id === activePageId)?.canvasPageId ?? activePageId;
    pagesDataRef.current[activeCanvasId] = canvas.toJSON();
    const images: Record<string, string> = {};
    const capturedCanvasIds = new Set<string>();

    for (const page of pages) {
      const canvasId = page.canvasPageId ?? page.id;
      // Skip if we already captured this canvas (shared by multiple display pages)
      if (capturedCanvasIds.has(canvasId)) continue;
      capturedCanvasIds.add(canvasId);

      if (canvasId === activeCanvasId) {
        // Current page — just capture it directly
        images[canvasId] = canvas.toDataURL();
      } else {
        // Resize canvas to this page's dimensions, load, capture
        const pageJSON = pagesDataRef.current[canvasId];
        if (pageJSON) {
          const pageIsSpread = page.isSpread ?? canvasId.includes("spread");
          const pageDims = getCanvasDimensions(cardType, cardFormat, undefined, !pageIsSpread);
          canvas.resize(pageDims.width, pageDims.height);
          await canvas.loadJSON(pageJSON);
          images[canvasId] = canvas.toDataURL();
        }
      }
    }

    // Restore original page dimensions and content
    if (pages.length > 1) {
      const origIsSpread = activeCanvasId.includes("spread");
      const origDims = getCanvasDimensions(cardType, cardFormat, undefined, !origIsSpread);
      canvas.resize(origDims.width, origDims.height);
      const origJSON = pagesDataRef.current[activeCanvasId];
      if (origJSON) {
        await canvas.loadJSON(origJSON);
      }
    }

    return images;
  }, [canvasRef, activePageId, pages, cardType, cardFormat]);

  const saveDraft = useCallback(() => {
    if (!cardType || !cardFormat || !templateId) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasId = pages.find(p => p.id === activePageId)?.canvasPageId ?? activePageId;
      pagesDataRef.current[canvasId] = canvas.toJSON();
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
  }, [canvasRef, cardType, cardFormat, templateId, activePageId, pages]);

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

      // Determine correct dimensions for the active page
      const tmpl = getTemplateConfig(envelope.templateId);
      const hasOuter = tmpl?.elements.some(el => el.page === "outside-spread") ?? false;
      const hasBack = tmpl?.elements.some(el => el.page === "back") ?? false;
      const restoredPages = getPageDefs(envelope.cardFormat, hasOuter, hasBack);
      const activePage = restoredPages.find(p => p.id === envelope.activePageId);
      const activeIsSpread = activePage?.isSpread ?? false;
      const newDims = getCanvasDimensions(envelope.cardType, envelope.cardFormat, undefined, !activeIsSpread);
      canvas.resize(newDims.width, newDims.height);

      // Load the active page
      const pageJSON = envelope.pagesData[envelope.activePageId];
      if (pageJSON) {
        canvas.loadJSON(pageJSON);
      }

      const hasPages = tmpl?.elements.some(el => el.page && el.page !== "front") ?? false;
      setHasMultiplePages(hasPages);
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
    thumbnails,
    updateActiveThumbnail,
    coverMode,
    applyCoverMode,
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
          // Bring overlays (fold line, grid) back to front after image loads
          canvas.bringOverlaysToFront();
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
