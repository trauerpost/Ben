"use client";

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import * as fabric from "fabric";
import { WIZARD_FONTS } from "@/lib/editor/wizard-state";

const MAX_HISTORY = 50;

// Register custom 'data' property so it survives toJSON/loadFromJSON
if (!fabric.FabricObject.customProperties.includes("data")) {
  fabric.FabricObject.customProperties.push("data");
}

// Fabric.js v7 defaults originX/originY to "center" — force top-left for predictable positioning
fabric.FabricObject.ownDefaults.originX = "left";
fabric.FabricObject.ownDefaults.originY = "top";

export interface FabricCanvasHandle {
  getCanvas: () => fabric.Canvas | null;
  toJSON: () => string;
  loadJSON: (json: string) => Promise<void>;
  toDataURL: () => string;
  addText: (text: string, options?: Partial<Record<string, unknown>>) => void;
  addImage: (url: string) => Promise<void>;
  addRect: (options: Partial<Record<string, unknown>>) => void;
  addLine: (options: Partial<Record<string, unknown>>) => void;
  resize: (width: number, height: number) => void;
  toggleGrid: () => boolean;
  setFoldLine: (show: boolean) => void;
  setSafeZone: (show: boolean) => void;
  setBleed: (show: boolean) => void;
  bringOverlaysToFront: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistory: () => { stack: string[]; index: number };
  setHistory: (stack: string[], index: number) => void;
}

interface FabricCanvasProps {
  width: number;
  height: number;
  showFoldLine?: boolean;
  showSafeZone?: boolean;
  showBleed?: boolean;
}

/** Build Google Fonts URL for preloading */
function buildFontUrl(): string {
  const families = WIZARD_FONTS.map(
    (f) => `family=${encodeURIComponent(f)}:wght@300;400;700`
  ).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(
  function FabricCanvas({ width, height, showFoldLine, showSafeZone, showBleed }, ref) {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const isLoadingRef = useRef(false);
    const [fontsReady, setFontsReady] = useState(false);

    // Track which overlays are active (they don't survive loadJSON)
    const foldLineActiveRef = useRef(false);
    const safeZoneActiveRef = useRef(false);
    const bleedActiveRef = useRef(false);

    // --- Overlay helpers ---

    /** Remove all canvas objects matching a data predicate key */
    const removeOverlaysByKey = useCallback(
      (canvas: fabric.Canvas, key: string) => {
        const existing = canvas
          .getObjects()
          .filter((o) => (o as any).data?.[key]);
        existing.forEach((o) => canvas.remove(o));
      },
      []
    );

    /** Draw fold line + label at horizontal center */
    const drawFoldLine = useCallback(
      (canvas: fabric.Canvas) => {
        removeOverlaysByKey(canvas, "isFoldLine");
        const centerX = canvas.getWidth() / 2;
        const h = canvas.getHeight();
        canvas.add(
          new fabric.Line([centerX, 0, centerX, h], {
            stroke: "rgba(255, 255, 255, 0.7)",
            strokeWidth: 2,
            strokeDashArray: [10, 6],
            selectable: false,
            evented: false,
            excludeFromExport: true,
            data: { isFoldLine: true },
          })
        );
        // Second line for contrast (dark shadow behind white)
        canvas.add(
          new fabric.Line([centerX + 1, 0, centerX + 1, h], {
            stroke: "rgba(0, 0, 0, 0.3)",
            strokeWidth: 1,
            strokeDashArray: [10, 6],
            selectable: false,
            evented: false,
            excludeFromExport: true,
            data: { isFoldLine: true },
          })
        );
        canvas.add(
          new fabric.Text("Falz", {
            left: centerX - 14,
            top: 4,
            fontSize: 10,
            fill: "rgba(255, 255, 255, 0.85)",
            fontFamily: "sans-serif",
            selectable: false,
            evented: false,
            excludeFromExport: true,
            data: { isFoldLine: true },
          })
        );
      },
      [removeOverlaysByKey]
    );

    /** Draw safe-zone shading (5 % from each edge, plus 5 % from fold if fold is on) */
    const drawSafeZone = useCallback(
      (canvas: fabric.Canvas) => {
        removeOverlaysByKey(canvas, "isSafeZone");
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const marginX = Math.round(w * 0.05);
        const marginY = Math.round(h * 0.05);
        const fill = "rgba(0, 0, 0, 0.05)";
        const common: Partial<fabric.RectProps> = {
          selectable: false,
          evented: false,
          excludeFromExport: true,
        };

        // Left
        canvas.add(
          new fabric.Rect({
            left: 0, top: 0, width: marginX, height: h, fill,
            ...common, data: { isSafeZone: true },
          } as fabric.TOptions<fabric.RectProps>)
        );
        // Right
        canvas.add(
          new fabric.Rect({
            left: w - marginX, top: 0, width: marginX, height: h, fill,
            ...common, data: { isSafeZone: true },
          } as fabric.TOptions<fabric.RectProps>)
        );
        // Top
        canvas.add(
          new fabric.Rect({
            left: marginX, top: 0, width: w - 2 * marginX, height: marginY, fill,
            ...common, data: { isSafeZone: true },
          } as fabric.TOptions<fabric.RectProps>)
        );
        // Bottom
        canvas.add(
          new fabric.Rect({
            left: marginX, top: h - marginY, width: w - 2 * marginX, height: marginY, fill,
            ...common, data: { isSafeZone: true },
          } as fabric.TOptions<fabric.RectProps>)
        );

        // Safe zone around fold line (if fold line is present)
        const hasFold = canvas.getObjects().some((o) => (o as any).data?.isFoldLine);
        if (hasFold) {
          const centerX = w / 2;
          const foldMargin = marginX; // same 5 % band
          canvas.add(
            new fabric.Rect({
              left: centerX - foldMargin / 2,
              top: 0,
              width: foldMargin,
              height: h,
              fill,
              ...common,
              data: { isSafeZone: true },
            } as fabric.TOptions<fabric.RectProps>)
          );
        }
      },
      [removeOverlaysByKey]
    );

    /** Draw bleed boundary rectangle (3 % inset from edges) */
    const drawBleed = useCallback(
      (canvas: fabric.Canvas) => {
        removeOverlaysByKey(canvas, "isBleed");
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const insetX = Math.round(w * 0.03);
        const insetY = Math.round(h * 0.03);
        canvas.add(
          new fabric.Rect({
            left: insetX,
            top: insetY,
            width: w - 2 * insetX,
            height: h - 2 * insetY,
            fill: "transparent",
            stroke: "rgba(150, 150, 150, 0.5)",
            strokeWidth: 1,
            strokeDashArray: [3, 3],
            selectable: false,
            evented: false,
            excludeFromExport: true,
            data: { isBleed: true },
          } as fabric.TOptions<fabric.RectProps>)
        );
      },
      [removeOverlaysByKey]
    );

    /** Bring all overlay objects (fold line, safe zone, bleed, grid) to front */
    const bringOverlaysToFront = useCallback(() => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;
      const overlays = canvas.getObjects().filter(o => {
        const d = (o as any).data;
        return d?.isFoldLine || d?.isSafeZone || d?.isBleed || d?.isGrid;
      });
      overlays.forEach(o => canvas.bringObjectToFront(o));
      canvas.renderAll();
    }, []);

    /** Re-draw all active overlays (e.g. after loadJSON wipes them) */
    const redrawActiveOverlays = useCallback((canvas: fabric.Canvas) => {
      if (foldLineActiveRef.current) drawFoldLine(canvas);
      if (safeZoneActiveRef.current) drawSafeZone(canvas);
      if (bleedActiveRef.current) drawBleed(canvas);
    }, [drawFoldLine, drawSafeZone, drawBleed]);

    const saveToHistory = useCallback(() => {
      if (isLoadingRef.current || !fabricRef.current) return;
      const json = JSON.stringify(fabricRef.current.toJSON());
      const idx = historyIndexRef.current;
      // Trim future states (after undo)
      historyRef.current = historyRef.current.slice(0, idx + 1);
      historyRef.current.push(json);
      // Cap at MAX_HISTORY
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current = historyRef.current.slice(-MAX_HISTORY);
      }
      historyIndexRef.current = historyRef.current.length - 1;
    }, []);

    // Load Google Fonts
    useEffect(() => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = buildFontUrl();
      document.head.appendChild(link);
      document.fonts.ready.then(() => setFontsReady(true));
      return () => {
        document.head.removeChild(link);
      };
    }, []);

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasElRef.current) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
        selection: true,
      });

      fabricRef.current = canvas;
      // Expose for testing/debugging
      (canvasElRef.current as unknown as { __fabricCanvas: fabric.Canvas }).__fabricCanvas = canvas;
      saveToHistory();

      // Draw initial overlays from props and track in refs
      if (showFoldLine) { foldLineActiveRef.current = true; drawFoldLine(canvas); }
      if (showSafeZone) { safeZoneActiveRef.current = true; drawSafeZone(canvas); }
      if (showBleed) { bleedActiveRef.current = true; drawBleed(canvas); }

      canvas.on("object:modified", saveToHistory);
      canvas.on("object:added", saveToHistory);
      canvas.on("object:removed", saveToHistory);

      return () => {
        canvas.dispose();
        fabricRef.current = null;
      };
      // Only re-create on mount, not on width/height changes (use resize() for that)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // React to showFoldLine prop changes (e.g. switching between spread and inner pages)
    useEffect(() => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;
      // Remove existing fold line
      const existing = canvas.getObjects().filter((o: any) => o.data?.isFoldLine);
      existing.forEach(o => canvas.remove(o));
      // Draw if active
      if (showFoldLine) {
        foldLineActiveRef.current = true;
        drawFoldLine(canvas);
        bringOverlaysToFront();
      } else {
        foldLineActiveRef.current = false;
      }
      canvas.renderAll();
    }, [showFoldLine, drawFoldLine, bringOverlaysToFront]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricRef.current,

      toJSON: () => {
        if (!fabricRef.current) return "{}";
        return JSON.stringify(fabricRef.current.toJSON());
      },

      loadJSON: async (json: string) => {
        if (!fabricRef.current) return;
        isLoadingRef.current = true;
        await fabricRef.current.loadFromJSON(json);
        // Re-draw active overlays (they were lost during loadJSON since excludeFromExport: true)
        redrawActiveOverlays(fabricRef.current);
        fabricRef.current.renderAll();
        isLoadingRef.current = false;
        saveToHistory();
      },

      toDataURL: () => {
        if (!fabricRef.current) return "";
        // Temporarily hide overlay objects (fold line, grid, safe zone, bleed)
        // so they don't appear in exported images (PDF, thumbnails)
        const canvas = fabricRef.current;
        const overlays = canvas.getObjects().filter((o: any) => {
          const d = o.data;
          return d?.isFoldLine || d?.isSafeZone || d?.isBleed || d?.isGrid;
        });
        overlays.forEach(o => o.set("visible", false));
        canvas.renderAll();
        const dataUrl = canvas.toDataURL();
        overlays.forEach(o => o.set("visible", true));
        canvas.renderAll();
        return dataUrl;
      },

      addText: (text: string, options?: Partial<Record<string, unknown>>) => {
        if (!fabricRef.current) return;
        const textObj = new fabric.Textbox(text, {
          left: width / 2 - 100,
          top: height / 2 - 20,
          width: 200,
          fontSize: 18,
          fontFamily: "Playfair Display",
          fill: "#1A1A1A",
          textAlign: "center",
          editable: true,
          ...options,
        });
        fabricRef.current.add(textObj);
        fabricRef.current.setActiveObject(textObj);
      },

      addImage: async (url: string) => {
        if (!fabricRef.current) return;
        try {
          const img = await fabric.FabricImage.fromURL(url, {
            crossOrigin: "anonymous",
          });
          if (!fabricRef.current) return;
          const scale = Math.min(
            (width * 0.5) / (img.width ?? 1),
            (height * 0.5) / (img.height ?? 1)
          );
          img.set({ scaleX: scale, scaleY: scale, left: 50, top: 50, data: { elementType: "image" } });
          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
          // Ensure overlays (fold line, grid, etc.) stay on top of newly added images
          bringOverlaysToFront();
        } catch (err) {
          console.error("[FabricCanvas] Failed to load image:", err);
        }
      },

      addRect: (options: Partial<Record<string, unknown>>) => {
        if (!fabricRef.current) return;
        const rect = new fabric.Rect({
          left: 50,
          top: 50,
          width: 200,
          height: 150,
          fill: "#f5f5f5",
          stroke: "#cccccc",
          strokeWidth: 1,
          ...options,
        } as fabric.TOptions<fabric.RectProps>);
        fabricRef.current.add(rect);
        fabricRef.current.setActiveObject(rect);
      },

      addLine: (options: Partial<Record<string, unknown>>) => {
        if (!fabricRef.current) return;
        const x1 = (options.x1 as number) ?? 0;
        const y1 = (options.y1 as number) ?? 0;
        const x2 = (options.x2 as number) ?? 0;
        const y2 = (options.y2 as number) ?? 0;
        const line = new fabric.Line([x1, y1, x2, y2], {
          left: (options.left as number) ?? 0,
          top: (options.top as number) ?? 0,
          stroke: (options.stroke as string) ?? "#cccccc",
          strokeWidth: (options.strokeWidth as number) ?? 1,
          selectable: true,
          data: options.data,
        });
        fabricRef.current.add(line);
      },

      resize: (newWidth: number, newHeight: number) => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        canvas.setDimensions({ width: newWidth, height: newHeight });

        // Redraw overlays at new dimensions (if they were present)
        const hadFold = canvas.getObjects().some((o) => (o as any).data?.isFoldLine);
        const hadSafe = canvas.getObjects().some((o) => (o as any).data?.isSafeZone);
        const hadBleed = canvas.getObjects().some((o) => (o as any).data?.isBleed);
        if (hadFold) drawFoldLine(canvas);
        if (hadSafe) drawSafeZone(canvas);
        if (hadBleed) drawBleed(canvas);

        canvas.renderAll();
      },

      toggleGrid: () => {
        if (!fabricRef.current) return false;
        const canvas = fabricRef.current;
        const existing = canvas.getObjects().filter(o => (o as any).data?.isGrid);
        if (existing.length > 0) {
          existing.forEach(o => canvas.remove(o));
          canvas.renderAll();
          return false;
        }
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const gridLines: fabric.FabricObject[] = [];
        for (let i = 1; i <= 9; i++) {
          const x = Math.round(w * i / 10);
          const y = Math.round(h * i / 10);
          gridLines.push(new fabric.Line([x, 0, x, h], {
            stroke: "rgba(0, 150, 255, 0.25)", strokeWidth: 1,
            selectable: false, evented: false, excludeFromExport: true,
            data: { isGrid: true },
          }));
          gridLines.push(new fabric.Line([0, y, w, y], {
            stroke: "rgba(0, 150, 255, 0.25)", strokeWidth: 1,
            selectable: false, evented: false, excludeFromExport: true,
            data: { isGrid: true },
          }));
          // Labels at top and left
          gridLines.push(new fabric.Text(`${i * 10}`, {
            left: x - 6, top: 2, fontSize: 8, fill: "rgba(0, 150, 255, 0.6)",
            selectable: false, evented: false, excludeFromExport: true,
            data: { isGrid: true },
          }));
          gridLines.push(new fabric.Text(`${i * 10}`, {
            left: 2, top: y - 5, fontSize: 8, fill: "rgba(0, 150, 255, 0.6)",
            selectable: false, evented: false, excludeFromExport: true,
            data: { isGrid: true },
          }));
        }
        gridLines.forEach(l => canvas.add(l));
        canvas.renderAll();
        return true;
      },

      setFoldLine: (show: boolean) => {
        foldLineActiveRef.current = show;
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        removeOverlaysByKey(canvas, "isFoldLine");
        if (show) drawFoldLine(canvas);
        bringOverlaysToFront();
      },

      setSafeZone: (show: boolean) => {
        safeZoneActiveRef.current = show;
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        removeOverlaysByKey(canvas, "isSafeZone");
        if (show) drawSafeZone(canvas);
        bringOverlaysToFront();
      },

      setBleed: (show: boolean) => {
        bleedActiveRef.current = show;
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        removeOverlaysByKey(canvas, "isBleed");
        if (show) drawBleed(canvas);
        bringOverlaysToFront();
      },

      bringOverlaysToFront,

      undo: () => {
        if (!fabricRef.current || historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        isLoadingRef.current = true;
        fabricRef.current
          .loadFromJSON(historyRef.current[historyIndexRef.current])
          .then(() => {
            if (fabricRef.current) redrawActiveOverlays(fabricRef.current);
            fabricRef.current?.renderAll();
            isLoadingRef.current = false;
          });
      },

      redo: () => {
        if (
          !fabricRef.current ||
          historyIndexRef.current >= historyRef.current.length - 1
        )
          return;
        historyIndexRef.current++;
        isLoadingRef.current = true;
        fabricRef.current
          .loadFromJSON(historyRef.current[historyIndexRef.current])
          .then(() => {
            if (fabricRef.current) redrawActiveOverlays(fabricRef.current);
            fabricRef.current?.renderAll();
            isLoadingRef.current = false;
          });
      },

      canUndo: () => historyIndexRef.current > 0,
      canRedo: () =>
        historyIndexRef.current < historyRef.current.length - 1,

      getHistory: () => ({
        stack: [...historyRef.current],
        index: historyIndexRef.current,
      }),
      setHistory: (stack: string[], index: number) => {
        historyRef.current = [...stack];
        historyIndexRef.current = index;
      },
    }));

    return (
      <div
        className="flex items-center justify-center"
        style={{ opacity: fontsReady ? 1 : 0.5, transition: "opacity 0.3s" }}
      >
        <div className="shadow-lg rounded-lg overflow-hidden bg-white">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    );
  }
);

export default FabricCanvas;
