import { NextRequest, NextResponse } from "next/server";
import { renderSpreadHTML } from "@/lib/editor/card-to-html-v2";
import type { RenderOptions } from "@/lib/editor/card-to-html-v2";
import { getTemplateConfig } from "@/lib/editor/template-configs";
import type { WizardState } from "@/lib/editor/wizard-state";

/**
 * Server-side preview endpoint.
 * renderSpreadHTML uses Buffer/fs (Node.js only) — cannot run in the browser.
 * This endpoint renders both pages as separate HTML sections.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const state = body.state as WizardState | undefined;

    if (!state?.templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    const config = getTemplateConfig(state.templateId);
    if (!config) {
      return NextResponse.json({ error: `Template not found: ${state.templateId}` }, { status: 400 });
    }

    // Extract origin for resolving relative asset URLs server-side
    const origin = request.headers.get("x-forwarded-proto") && request.headers.get("x-forwarded-host")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
      : request.headers.get("origin")
      ?? new URL(request.url).origin;
    const renderOptions: RenderOptions = { baseUrl: origin };

    // Compute dynamic scaling for preview display
    const pxPerMm = 3.7795; // 96 DPI
    const { spreadWidthMm, spreadHeightMm } = config;
    const nativeW = Math.ceil(spreadWidthMm * pxPerMm);
    const nativeH = Math.ceil(spreadHeightMm * pxPerMm);
    const maxDisplayW = 500; // fits well in PreviewModal (max-w-4xl = 896px, minus padding)
    const displayScale = Math.min(maxDisplayW / nativeW, 1); // never scale UP
    const displayW = Math.ceil(nativeW * displayScale);
    const displayH = Math.ceil(nativeH * displayScale);

    // Check if template has multiple pages
    const hasBackPage = config.elements.some(el => el.page && el.page !== "front");

    // Render the full spread (all elements)
    const fullHTML = await renderSpreadHTML(state, renderOptions);

    if (!hasBackPage) {
      // Single-page template — wrap in scaled iframe
      const scaledHTML = injectScale(fullHTML, displayScale);
      const singlePageHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  * { margin: 0; padding: 0; }
  body { display: flex; justify-content: center; padding: 16px; background: white; }
  .page { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .page iframe { border: 0; display: block; }
</style></head><body>
  <div class="page">
    <iframe srcdoc="${escapeAttr(scaledHTML)}" width="${displayW}" height="${displayH}" sandbox="allow-same-origin allow-scripts"></iframe>
  </div>
</body></html>`;
      return new NextResponse(singlePageHTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Multi-page: render front and back separately by filtering elements
    // We create two WizardStates, each with only front or back elements visible
    const frontState = buildPageState(state, config, "front");
    const backState = buildPageState(state, config, "back");

    const frontHTML = await renderSpreadHTML(frontState, renderOptions);
    const backHTML = await renderSpreadHTML(backState, renderOptions);

    // Combine into a two-page spread with dynamic scaling
    const scaledFrontHTML = injectScale(frontHTML, displayScale);
    const scaledBackHTML = injectScale(backHTML, displayScale);
    const combinedHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { margin: 0; padding: 16px; background: white; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .page { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .page iframe { border: 0; display: block; }
    .page-label { text-align: center; font-family: sans-serif; font-size: 11px; color: #888; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div>
    <div class="page-label">Vorderseite</div>
    <div class="page">
      <iframe srcdoc="${escapeAttr(scaledFrontHTML)}" width="${displayW}" height="${displayH}" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
  </div>
  <div>
    <div class="page-label">Rückseite</div>
    <div class="page">
      <iframe srcdoc="${escapeAttr(scaledBackHTML)}" width="${displayW}" height="${displayH}" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(combinedHTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[preview] Error:", error);
    return NextResponse.json({
      error: "Preview generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * Build a WizardState that hides all elements NOT on the given page.
 * Uses elementOverrides to set hidden=true on off-page elements.
 */
function buildPageState(
  state: WizardState,
  config: ReturnType<typeof getTemplateConfig>,
  pageId: string
): WizardState {
  if (!config) return state;
  const overrides = { ...(state.elementOverrides ?? {}) };

  for (const el of config.elements) {
    const elPage = el.page ?? "front";
    if (elPage !== pageId) {
      overrides[el.id] = { ...overrides[el.id], hidden: true };
    }
  }

  return { ...state, elementOverrides: overrides };
}

function escapeAttr(html: string): string {
  return html.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inject CSS transform: scale() into the HTML <head> for preview sizing */
function injectScale(html: string, scale: number): string {
  const scaleStyle = `<style>body{transform-origin:top left;transform:scale(${scale.toFixed(4)});overflow:hidden;}</style>`;
  return html.replace("</head>", `${scaleStyle}</head>`);
}
