import { NextRequest, NextResponse } from "next/server";
import { renderSpreadHTML, buildPageState } from "@/lib/editor/card-to-html-v2";
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

    // Trace photo data to debug placeholder bug
    const photoInfo = state.photo?.url
      ? `${state.photo.url.substring(0, 40)}... (${state.photo.url.length} chars)`
      : "NULL";
    console.log("[preview] template:", state.templateId, "| photo.url:", photoInfo);

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
    const hasOuterPages = config.elements.some(el => el.page === "outside-spread");
    // Bifold cards show 2 sections stacked — use smaller width so both fit in modal without scrolling
    const maxDisplayW = hasOuterPages ? 380 : 500;
    const displayScale = Math.min(maxDisplayW / nativeW, 1); // never scale UP
    const displayW = Math.ceil(nativeW * displayScale);
    const displayH = Math.ceil(nativeH * displayScale);
    const hasBackPage = config.elements.some(el => el.page && el.page !== "front" && el.page !== "outside-spread");

    if (hasOuterPages) {
      // 3-page folded card: outside spread + inside left + inside right
      const outsideState = buildPageState(state, config, "outside-spread");
      const frontState = buildPageState(state, config, "front");
      const backState = buildPageState(state, config, "back");

      // Outside spread renders at full width (140mm), inner pages at half (70mm)
      const halfWidthMm = config.spreadWidthMm / 2;
      const outsideHTML = await renderSpreadHTML(outsideState, renderOptions);
      const frontHTML = await renderSpreadHTML(frontState, { ...renderOptions, renderWidthMm: halfWidthMm });
      const backHTML = await renderSpreadHTML(backState, { ...renderOptions, renderWidthMm: halfWidthMm });

      // Inner pages: rendered at 70mm, scale to half display width
      const halfNativeW = Math.ceil(halfWidthMm * pxPerMm);
      const halfDisplayW = Math.ceil(displayW / 2);
      const innerScale = Math.min(halfDisplayW / halfNativeW, 1);
      const innerDisplayH = Math.ceil(nativeH * innerScale);

      const scaledOutsideHTML = injectScale(outsideHTML, displayScale);
      const scaledFrontHTML = injectScale(frontHTML, innerScale);
      const scaledBackHTML = injectScale(backHTML, innerScale);

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
    .inner-spread { display: flex; gap: 2px; }
  </style>
</head>
<body>
  <div>
    <div class="page-label">${body.locale === "en" ? "Outside" : "Außenseite"}</div>
    <div class="page">
      <iframe srcdoc="${escapeAttr(scaledOutsideHTML)}" width="${displayW}" height="${displayH}" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
  </div>
  <div>
    <div class="page-label">${body.locale === "en" ? "Inside" : "Innenseite"}</div>
    <div class="inner-spread">
      <div class="page">
        <iframe srcdoc="${escapeAttr(scaledFrontHTML)}" width="${halfDisplayW}" height="${innerDisplayH}" sandbox="allow-same-origin allow-scripts"></iframe>
      </div>
      <div class="page">
        <iframe srcdoc="${escapeAttr(scaledBackHTML)}" width="${halfDisplayW}" height="${innerDisplayH}" sandbox="allow-same-origin allow-scripts"></iframe>
      </div>
    </div>
  </div>
</body>
</html>`;

      return new NextResponse(combinedHTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

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


function escapeAttr(html: string): string {
  return html.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inject CSS transform: scale() into the HTML <head> for preview sizing */
function injectScale(html: string, scale: number): string {
  const scaleStyle = `<style>body{transform-origin:top left;transform:scale(${scale.toFixed(4)});overflow:hidden;}</style>`;
  return html.replace("</head>", `${scaleStyle}</head>`);
}
