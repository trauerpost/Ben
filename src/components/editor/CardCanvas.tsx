"use client";

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import * as fabric from "fabric";

// Standard memorial card dimensions (A6 landscape in pixels at 150 DPI)
const CARD_WIDTH = 624;
const CARD_HEIGHT = 444;

export interface CardCanvasHandle {
  getCanvas: () => fabric.Canvas | null;
  toJSON: () => string;
  loadJSON: (json: string) => void;
  toSVG: () => string;
  addText: (text: string) => void;
  addImage: (url: string) => void;
  setBackground: (url: string) => void;
  undo: () => void;
  redo: () => void;
}

const CardCanvas = forwardRef<CardCanvasHandle>(function CardCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isLoadingRef = useRef(false);

  const saveToHistory = useCallback(() => {
    if (isLoadingRef.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
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
  }, [saveToHistory]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,

    toJSON: () => {
      if (!fabricRef.current) return "{}";
      return JSON.stringify(fabricRef.current.toJSON());
    },

    loadJSON: (json: string) => {
      if (!fabricRef.current) return;
      isLoadingRef.current = true;
      fabricRef.current.loadFromJSON(json).then(() => {
        fabricRef.current?.renderAll();
        isLoadingRef.current = false;
        saveToHistory();
      });
    },

    toSVG: () => {
      if (!fabricRef.current) return "";
      return fabricRef.current.toSVG();
    },

    addText: (text: string) => {
      if (!fabricRef.current) return;
      const textObj = new fabric.Textbox(text, {
        left: CARD_WIDTH / 2 - 100,
        top: CARD_HEIGHT / 2 - 20,
        width: 200,
        fontSize: 18,
        fontFamily: "Inter",
        fill: "#1A1A1A",
        textAlign: "center",
      });
      fabricRef.current.add(textObj);
      fabricRef.current.setActiveObject(textObj);
    },

    addImage: (url: string) => {
      if (!fabricRef.current) return;
      fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then((img) => {
        if (!fabricRef.current) return;
        const scale = Math.min(
          (CARD_WIDTH * 0.5) / (img.width ?? 1),
          (CARD_HEIGHT * 0.5) / (img.height ?? 1)
        );
        img.set({ scaleX: scale, scaleY: scale, left: 50, top: 50 });
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
      });
    },

    setBackground: (url: string) => {
      if (!fabricRef.current) return;
      fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then((img) => {
        if (!fabricRef.current) return;
        const scaleX = CARD_WIDTH / (img.width ?? 1);
        const scaleY = CARD_HEIGHT / (img.height ?? 1);
        img.set({ scaleX, scaleY, selectable: false, evented: false });
        fabricRef.current.backgroundImage = img;
        fabricRef.current.renderAll();
        saveToHistory();
      });
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
  }));

  return (
    <div className="flex items-center justify-center bg-brand-light-gray rounded-xl p-4">
      <div className="shadow-lg rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

export default CardCanvas;
