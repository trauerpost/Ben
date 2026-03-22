"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import EditorToolbar from "@/components/editor/EditorToolbar";
import EditorSidebar from "@/components/editor/EditorSidebar";
import { createClient } from "@/lib/supabase/client";
import type { CardCanvasHandle } from "@/components/editor/CardCanvas";
import type { Asset } from "@/lib/supabase/types";

const CardCanvas = dynamic(() => import("@/components/editor/CardCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-brand-light-gray rounded-xl p-4 h-[500px]">
      <p className="text-brand-gray">Loading editor...</p>
    </div>
  ),
});

const AUTOSAVE_KEY = "trauerpost_draft";

export default function BuilderPage() {
  const canvasRef = useRef<CardCanvasHandle>(null);
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const loadTemplate = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("card_templates")
      .select("template_data")
      .eq("id", id)
      .single();

    if (data?.template_data && canvasRef.current) {
      canvasRef.current.loadJSON(JSON.stringify(data.template_data));
    }
  }, []);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    } else {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved && canvasRef.current) {
        canvasRef.current.loadJSON(saved);
      }
    }
  }, [templateId, loadTemplate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) {
        localStorage.setItem(AUTOSAVE_KEY, canvasRef.current.toJSON());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleAssetSelect(asset: Asset) {
    if (!canvasRef.current) return;
    if (asset.category === "background") {
      canvasRef.current.setBackground(asset.file_url);
    } else {
      canvasRef.current.addImage(asset.file_url);
    }
  }

  function handleImageUpload(url: string) {
    canvasRef.current?.addImage(url);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <EditorToolbar
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onAddText={() => canvasRef.current?.addText("Your text here")}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <CardCanvas ref={canvasRef} />
        </div>

        <EditorSidebar
          onAssetSelect={handleAssetSelect}
          onImageUpload={handleImageUpload}
        />
      </div>
    </div>
  );
}
