"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { FabricCanvasHandle } from "./FabricCanvas";
import { useCanvasBuilder } from "./use-canvas-builder";
import CanvasBuilderSidebar from "./CanvasBuilderSidebar";
import ContextualToolbar from "./ContextualToolbar";
import SpreadNavigator from "./SpreadNavigator";
import ZoomControls from "./ZoomControls";
import PreviewModal from "./PreviewModal";
import { exportCanvasToPreview, exportCanvasToPDF } from "@/lib/editor/canvas-export";
import type { CardType, CardFormat } from "@/lib/editor/wizard-state";
import type { Asset } from "@/lib/supabase/types";

// Dynamic import for FabricCanvas (needs browser APIs)
const FabricCanvas = dynamic(() => import("./FabricCanvas"), { ssr: false });

export default function CanvasBuilderPage(): React.ReactElement {
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const builder = useCanvasBuilder(canvasRef);

  const handleTemplateSelect = useCallback(
    async (cardType: CardType, cardFormat: CardFormat, templateId: string) => {
      await builder.loadTemplate(cardType, cardFormat, templateId);
    },
    [builder]
  );

  const handleAddText = useCallback(() => {
    canvasRef.current?.addText("Text hinzufügen");
  }, []);

  const handleAddPhoto = useCallback(async (url: string) => {
    await canvasRef.current?.addImage(url);
  }, []);

  const handleAssetSelect = useCallback(async (asset: Asset) => {
    const url = asset.file_url || asset.thumbnail_url;
    if (url) {
      await canvasRef.current?.addImage(url);
    }
  }, []);

  const handleChangeTemplate = useCallback(() => {
    if (window.confirm("Vorlage wechseln? Alle Änderungen gehen verloren.")) {
      window.location.reload();
    }
  }, []);

  const handleUndo = useCallback(() => canvasRef.current?.undo(), []);
  const handleRedo = useCallback(() => canvasRef.current?.redo(), []);

  const getCanvas = useCallback(
    () => canvasRef.current?.getCanvas() ?? null,
    []
  );

  // Preview/PDF state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePreview = useCallback(async () => {
    if (!builder.cardType || !builder.cardFormat || !builder.templateId) return;
    if (!canvasRef.current) return;

    // Get all pages data (saves current page first) so the front page text
    // is always included even when viewing the back page
    const pagesData = builder.getAllPagesData();

    try {
      const result = await exportCanvasToPreview(
        pagesData,
        builder.cardType,
        builder.cardFormat,
        builder.templateId
      );
      setPreviewHTML(result.previewHTML);
      setShowPreview(true);
    } catch (err) {
      console.error("[CanvasBuilder] Preview failed:", err);
    }
  }, [builder]);

  const handleDownloadPDF = useCallback(async () => {
    if (!builder.cardType || !builder.cardFormat || !builder.templateId) return;
    if (!canvasRef.current) return;

    setIsGeneratingPDF(true);
    // Get all pages data (saves current page first) so the front page text
    // is always included even when viewing the back page
    const pagesData = builder.getAllPagesData();

    try {
      const blob = await exportCanvasToPDF(
        pagesData,
        builder.cardType,
        builder.cardFormat,
        builder.templateId
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karte-${builder.templateId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[CanvasBuilder] PDF generation failed:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [builder]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = getCanvas();
        if (!canvas) return;
        const active = canvas.getActiveObject();
        // Don't delete if editing text
        if (active && !(active as { isEditing?: boolean }).isEditing) {
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, getCanvas]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!builder.isTemplateLoaded) return;
    const interval = setInterval(() => builder.saveDraft(), 30000);
    return () => clearInterval(interval);
  }, [builder]);

  // Unsaved changes warning
  useEffect(() => {
    if (!builder.isTemplateLoaded) return;
    function handleBeforeUnload(e: BeforeUnloadEvent): void {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [builder.isTemplateLoaded]);

  const canvasWidth = builder.dims?.width ?? 827;
  const canvasHeight = builder.dims?.height ?? 620;

  // Mobile check
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center">
        <div className="space-y-4">
          <p className="text-4xl">🖥️</p>
          <h2 className="text-lg font-medium text-brand-dark">
            Bitte verwenden Sie einen Desktop-Browser
          </h2>
          <p className="text-sm text-brand-gray">
            Der Karten-Designer funktioniert am besten auf größeren Bildschirmen
            mit Maus und Tastatur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-brand-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            className="p-2 rounded hover:bg-brand-light-gray transition-colors text-brand-gray hover:text-brand-dark"
            title="Rückgängig (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v2M3 10l4-4m-4 4l4 4" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            className="p-2 rounded hover:bg-brand-light-gray transition-colors text-brand-gray hover:text-brand-dark"
            title="Wiederherstellen (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a4 4 0 00-4 4v2m14-6l-4-4m4 4l-4 4" />
            </svg>
          </button>

          <div className="w-px h-5 bg-brand-border mx-1" />

          {/* Add buttons */}
          {builder.isTemplateLoaded && (
            <>
              <button
                onClick={handleAddText}
                className="px-3 py-1.5 rounded text-xs bg-brand-light-gray hover:bg-brand-border transition-colors text-brand-dark"
              >
                + Textfeld
              </button>
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && file.size <= 10 * 1024 * 1024) {
                      handleAddPhoto(URL.createObjectURL(file));
                    }
                  };
                  input.click();
                }}
                className="px-3 py-1.5 rounded text-xs bg-brand-light-gray hover:bg-brand-border transition-colors text-brand-dark"
              >
                + Fotofeld
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            disabled={!builder.isTemplateLoaded}
            className="px-4 py-1.5 rounded text-xs bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors disabled:opacity-30"
          >
            Vorschau
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!builder.isTemplateLoaded || isGeneratingPDF}
            className="px-4 py-1.5 rounded text-xs bg-brand-dark text-white hover:bg-black transition-colors disabled:opacity-30"
          >
            {isGeneratingPDF ? "..." : "PDF"}
          </button>
        </div>
      </div>

      {/* Main content: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <CanvasBuilderSidebar
          isTemplateLoaded={builder.isTemplateLoaded}
          templateId={builder.templateId}
          onTemplateSelect={handleTemplateSelect}
          onAddText={handleAddText}
          onAddPhoto={handleAddPhoto}
          onAssetSelect={handleAssetSelect}
          onChangeTemplate={handleChangeTemplate}
        />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col bg-brand-light-gray overflow-hidden">
          {/* Canvas with zoom */}
          <div
            ref={canvasContainerRef}
            className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
          >
            <div
              style={{
                transform: `scale(${builder.zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
            >
              <FabricCanvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
              />
            </div>

            {/* Contextual toolbar (floating) */}
            <ContextualToolbar
              canvasContainerRef={canvasContainerRef}
              getCanvas={getCanvas}
              zoom={builder.zoom}
              isCanvasReady={builder.isTemplateLoaded}
            />
          </div>

          {/* Bottom bar: spread navigator + zoom */}
          <div className="flex items-center justify-between border-t border-brand-border bg-white px-4 py-1 shrink-0">
            <SpreadNavigator
              pages={builder.pages}
              activePageId={builder.activePageId}
              onPageSelect={(id) => builder.switchPage(id)}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => canvasRef.current?.toggleGrid()}
                className="px-2 py-1 text-xs border border-brand-border rounded hover:bg-gray-100"
                title="Toggle 10×10 grid"
              >
                Grid
              </button>
              <ZoomControls
                zoom={builder.zoom}
                onZoomChange={builder.setZoom}
                onFit={() => {
                  const container = canvasContainerRef.current;
                  if (container) {
                    builder.handleZoomFit(
                      container.clientWidth - 64,
                      container.clientHeight - 64
                    );
                  }
                }}
                onReset={builder.handleZoomReset}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        previewHTML={previewHTML}
        onDownloadPDF={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      />
    </div>
  );
}
