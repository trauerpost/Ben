import { CARD_CONFIGS, getCardDimensions } from "./wizard-state";
import type { WizardState } from "./wizard-state";

/**
 * Fetches an image URL and converts it to a base64 data URI.
 * Falls back to a solid color if the fetch fails.
 */
async function imageToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn(`[card-to-html] Failed to fetch image: ${url}`, err);
    return "";
  }
}

function renderFontLinks(fontFamily: string): string {
  const encoded = encodeURIComponent(fontFamily);
  return `<link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap" rel="stylesheet">`;
}

function panelCSS(widthMm: number, heightMm: number): string {
  return `width: ${widthMm}mm; height: ${heightMm}mm; position: relative; overflow: hidden; box-sizing: border-box;`;
}

function backgroundDiv(base64: string): string {
  if (!base64) {
    return `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#e5e7eb,#d1d5db);"></div>`;
  }
  return `<div style="position:absolute;inset:0;background-image:url('${base64}');background-size:cover;background-position:center;"></div>`;
}

function photoDiv(base64: string, style = ""): string {
  if (!base64) {
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;${style}">Photo</div>`;
  }
  return `<div style="width:100%;height:100%;background-image:url('${base64}');background-size:cover;background-position:center;${style}"></div>`;
}

function textDiv(state: WizardState): string {
  const text = (state.text || "").replace(/\n/g, "<br>");
  return `<div style="width:100%;height:100%;padding:8mm;display:flex;align-items:center;justify-content:center;box-sizing:border-box;">
    <p style="font-family:'${state.fontFamily}',serif;font-size:${state.fontSize}pt;color:${state.fontColor};text-align:${state.textAlign};line-height:1.5;white-space:pre-wrap;word-wrap:break-word;margin:0;width:100%;">${text}</p>
  </div>`;
}

/**
 * Renders the card as a self-contained HTML document for Puppeteer PDF generation.
 */
export async function renderCardHTML(state: WizardState): Promise<string> {
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const config = state.cardType ? CARD_CONFIGS[state.cardType] : null;
  const format = state.cardFormat ?? config?.availableFormats[0] ?? "single";
  const isFolded = format === "folded";
  const isSterbebild = state.cardType === "sterbebild";

  // Fetch images server-side (no CORS)
  const bgBase64 = state.backImageUrl ? await imageToBase64(state.backImageUrl) : "";
  const photoBase64 = state.photoUrl ? await imageToBase64(state.photoUrl) : "";

  // Panel dimensions
  const panelW = isFolded ? dims.widthMm / 2 : dims.widthMm;
  const panelH = dims.heightMm;

  let pages = "";

  if (isSterbebild) {
    // Page 1: Front — background + decorations
    pages += `<div style="${panelCSS(panelW, panelH)}">${backgroundDiv(bgBase64)}</div>`;
    pages += `<div style="page-break-after:always;"></div>`;
    // Page 2: Back — photo (left) + text (right)
    pages += `<div style="${panelCSS(panelW, panelH)}display:flex;">
      <div style="width:50%;height:100%;border-right:0.5px solid #e5e7eb;position:relative;">${photoDiv(photoBase64)}</div>
      <div style="width:50%;height:100%;background:white;">${textDiv(state)}</div>
    </div>`;
  } else if (isFolded) {
    // Page 1: Outside spread — Back cover (left) + Front cover (right)
    pages += `<div style="${panelCSS(dims.widthMm, panelH)}display:flex;">
      <div style="width:50%;height:100%;background:white;"></div>
      <div style="width:50%;height:100%;position:relative;">${backgroundDiv(bgBase64)}</div>
    </div>`;
    pages += `<div style="page-break-after:always;"></div>`;
    // Page 2: Inside spread — Inside left (photo) + Inside right (text)
    pages += `<div style="${panelCSS(dims.widthMm, panelH)}display:flex;">
      <div style="width:50%;height:100%;position:relative;">${photoDiv(photoBase64)}</div>
      <div style="width:50%;height:100%;background:white;">${textDiv(state)}</div>
    </div>`;
  } else {
    // Single card: 2 pages
    // Page 1: Front
    pages += `<div style="${panelCSS(panelW, panelH)}">${backgroundDiv(bgBase64)}</div>`;
    pages += `<div style="page-break-after:always;"></div>`;
    // Page 2: Back — text
    pages += `<div style="${panelCSS(panelW, panelH)}background:white;">${textDiv(state)}</div>`;
  }

  // Page size for PDF
  const pageW = isFolded ? dims.widthMm : panelW;
  const pageH = panelH;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${renderFontLinks(state.fontFamily)}
  <style>
    @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
    * { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>${pages}</body>
</html>`;
}
