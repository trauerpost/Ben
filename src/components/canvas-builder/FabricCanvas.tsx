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

export interface FabricCanvasHandle {
  getCanvas: () => fabric.Canvas | null;
  toJSON: () => string;
  loadJSON: (json: string) => Promise<void>;
  toDataURL: () => string;
  addText: (text: string, options?: Partial<Record<string, unknown>>) => void;
  addImage: (url: string) => Promise<void>;
  addRect: (options: Partial<Record<string, unknown>>) => void;
  resize: (width: number, height: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface FabricCanvasProps {
  width: number;
  height: number;
}

/** Build Google Fonts URL for preloading */
function buildFontUrl(): string {
  const families = WIZARD_FONTS.map(
    (f) => `family=${encodeURIComponent(f)}:wght@300;400;700`
  ).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(
  function FabricCanvas({ width, height }, ref) {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const isLoadingRef = useRef(false);
    const [fontsReady, setFontsReady] = useState(false);

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
      saveToHistory();

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
        fabricRef.current.renderAll();
        isLoadingRef.current = false;
        saveToHistory();
      },

      toDataURL: () => {
        if (!fabricRef.current) return "";
        return fabricRef.current.toDataURL();
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
          img.set({ scaleX: scale, scaleY: scale, left: 50, top: 50 });
          fabricRef.current.add(img);
          fabricRef.current.setActiveObject(img);
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

      resize: (newWidth: number, newHeight: number) => {
        if (!fabricRef.current) return;
        fabricRef.current.setDimensions({ width: newWidth, height: newHeight });
        fabricRef.current.renderAll();
      },

      undo: () => {
        if (!fabricRef.current || historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        isLoadingRef.current = true;
        fabricRef.current
          .loadFromJSON(historyRef.current[historyIndexRef.current])
          .then(() => {
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
            fabricRef.current?.renderAll();
            isLoadingRef.current = false;
          });
      },

      canUndo: () => historyIndexRef.current > 0,
      canRedo: () =>
        historyIndexRef.current < historyRef.current.length - 1,
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
