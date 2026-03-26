import { getCardDimensions } from "./wizard-state";
import { getTemplateById } from "./card-templates";
import type { WizardState, TextContent } from "./wizard-state";
import type { PanelTemplate, TemplateSlot } from "./card-templates";

/**
 * Fetches an image URL and converts it to a base64 data URI.
 * Falls back to empty string if the fetch fails.
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

// ── Font size map for each TextContent field ──

const FIELD_FONT_SIZE_MAP: Record<string, keyof TextContent> = {
  heading: "headingFontSize",
  name: "nameFontSize",
  dates: "datesFontSize",
  quote: "quoteFontSize",
  dividerSymbol: "datesFontSize", // divider uses dates size
};

function getFieldFontSize(textContent: TextContent, field: string): number {
  const sizeKey = FIELD_FONT_SIZE_MAP[field];
  if (sizeKey) {
    const val = textContent[sizeKey];
    if (typeof val === "number") return val;
  }
  return 14;
}

function getFieldValue(textContent: TextContent, field: string): string {
  const val = textContent[field as keyof TextContent];
  return typeof val === "string" ? val : "";
}

// ── Slot renderers ──

function renderPhotoSlot(base64: string, gridArea: string): string {
  if (!base64) {
    return `<div style="grid-area:${gridArea};display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">Photo</div>`;
  }
  return `<div style="grid-area:${gridArea};background-image:url('${base64}');background-size:cover;background-position:center;"></div>`;
}

function renderTextSlot(
  textContent: TextContent,
  slot: TemplateSlot,
): string {
  const fields = slot.textFields ?? [];
  const { fontFamily, fontColor, textAlign } = textContent;

  const fieldDivs = fields
    .map((field) => {
      const value = getFieldValue(textContent, field);
      if (!value) return "";
      const fontSize = getFieldFontSize(textContent, field);
      const escaped = value.replace(/\n/g, "<br>");
      return `<div style="font-size:${fontSize}px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;">${escaped}</div>`;
    })
    .filter(Boolean)
    .join("\n        ");

  return `<div style="grid-area:${slot.gridArea};padding:6mm;display:flex;flex-direction:column;align-items:${textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center"};justify-content:center;font-family:'${fontFamily}',serif;color:${fontColor};text-align:${textAlign};box-sizing:border-box;overflow:hidden;">
        ${fieldDivs}
      </div>`;
}

function renderDecorationSlot(base64: string, gridArea: string): string {
  if (!base64) {
    return `<div style="grid-area:${gridArea};"></div>`;
  }
  return `<div style="grid-area:${gridArea};display:flex;align-items:center;justify-content:center;padding:4mm;box-sizing:border-box;">
        <img src="${base64}" style="max-width:100%;max-height:100%;object-fit:contain;" />
      </div>`;
}

// ── Panel renderer ──

async function renderPanel(
  panel: PanelTemplate,
  state: WizardState,
  photoBase64: string,
  decoBase64: string,
  bgBase64: string,
  widthMm: number,
  heightMm: number,
): Promise<string> {
  // Panel background
  let bgStyle = "";
  if (panel.defaultBackground === "image") {
    if (state.background.type === "image" && bgBase64) {
      bgStyle = `background-image:url('${bgBase64}');background-size:cover;background-position:center;`;
    } else {
      bgStyle = `background-color:${state.background.color};`;
    }
  } else {
    bgStyle = `background-color:${state.background.color};`;
  }

  // Render slots
  const slotHtmlParts: string[] = [];
  for (const slot of panel.slots) {
    switch (slot.type) {
      case "photo":
        slotHtmlParts.push(renderPhotoSlot(photoBase64, slot.gridArea));
        break;
      case "text":
        slotHtmlParts.push(renderTextSlot(state.textContent, slot));
        break;
      case "decoration":
        slotHtmlParts.push(renderDecorationSlot(decoBase64, slot.gridArea));
        break;
    }
  }

  return `<div style="width:${widthMm}mm;height:${heightMm}mm;display:grid;grid-template-rows:${panel.gridTemplateRows};grid-template-columns:${panel.gridTemplateColumns};${bgStyle}box-sizing:border-box;overflow:hidden;">
      ${slotHtmlParts.join("\n      ")}
    </div>`;
}

const PAGE_BREAK = `<div style="page-break-after:always;"></div>`;

/**
 * Renders the card as a self-contained HTML document for Puppeteer PDF generation.
 */
export async function renderCardHTML(state: WizardState): Promise<string> {
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const templateId = state.templateId;
  if (!templateId) throw new Error("No template selected");

  const template = getTemplateById(templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const isFolded = template.cardFormat === "folded";

  // Pre-fetch all images to base64
  const photoBase64 = state.photo.url ? await imageToBase64(state.photo.url) : "";
  const decoBase64 = state.decoration.assetUrl ? await imageToBase64(state.decoration.assetUrl) : "";
  const bgBase64 = state.background.type === "image" && state.background.imageUrl
    ? await imageToBase64(state.background.imageUrl)
    : "";

  // Panel dimensions
  const panelW = isFolded ? dims.widthMm / 2 : dims.widthMm;
  const panelH = dims.heightMm;

  // Page dimensions for @page rule
  const pageW = isFolded ? dims.widthMm : panelW;
  const pageH = panelH;

  let pages = "";

  if (isFolded) {
    // Folded card: 2 spread pages
    // Page 1: Outside spread — back (left) + front (right)
    const backPanel = template.panels.find((p) => p.panelId === "back");
    const frontPanel = template.panels.find((p) => p.panelId === "front");

    pages += `<div style="width:${dims.widthMm}mm;height:${panelH}mm;display:flex;">`;
    if (backPanel) {
      pages += await renderPanel(backPanel, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    if (frontPanel) {
      pages += await renderPanel(frontPanel, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    pages += `</div>`;

    pages += PAGE_BREAK;

    // Page 2: Inside spread — inside-left + inside-right
    const insideLeft = template.panels.find((p) => p.panelId === "inside-left");
    const insideRight = template.panels.find((p) => p.panelId === "inside-right");

    pages += `<div style="width:${dims.widthMm}mm;height:${panelH}mm;display:flex;">`;
    if (insideLeft) {
      pages += await renderPanel(insideLeft, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    if (insideRight) {
      pages += await renderPanel(insideRight, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
    } else {
      pages += `<div style="width:${panelW}mm;height:${panelH}mm;background:white;"></div>`;
    }
    pages += `</div>`;
  } else {
    // Single card: each panel = its own page
    for (let i = 0; i < template.panels.length; i++) {
      const panel = template.panels[i];
      pages += await renderPanel(panel, state, photoBase64, decoBase64, bgBase64, panelW, panelH);
      if (i < template.panels.length - 1) {
        pages += PAGE_BREAK;
      }
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${renderFontLinks(state.textContent.fontFamily)}
  <style>
    @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
    * { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>${pages}</body>
</html>`;
}
