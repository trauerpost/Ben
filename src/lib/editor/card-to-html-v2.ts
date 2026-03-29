/**
 * Card HTML Renderer v2 — Absolute Positioning from Template Configs
 *
 * Each element is positioned using a 1000×1000 grid mapped to the card's mm dimensions.
 * Font sizes in pt. Auto-shrink supported via Puppeteer page.evaluate().
 */

import { getTemplateConfig } from "./template-configs";
import type { TemplateConfig, TemplateElement } from "./template-configs";
import type { WizardState, TextContent } from "./wizard-state";

// ── Image helpers ──

async function imageToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn(`[card-html] Failed to load image: ${url}`, err);
    return "";
  }
}

// ── Position helper ──

function posStyle(el: TemplateElement, gridW: number, gridH: number): string {
  const left = (el.x / gridW * 100).toFixed(3);
  const top = (el.y / gridH * 100).toFixed(3);
  const width = (el.w / gridW * 100).toFixed(3);
  const height = (el.h / gridH * 100).toFixed(3);
  return `position:absolute;left:${left}%;top:${top}%;width:${width}%;height:${height}%;box-sizing:border-box;`;
}

// ── Element renderers ──

/** Map element field name to the user's font size override from textContent */
function getUserFontSize(tc: TextContent, field: string | undefined): number | null {
  if (!field) return null;
  const map: Record<string, keyof TextContent> = {
    heading: "headingFontSize",
    name: "nameFontSize",
    dates: "datesFontSize",
    birthDate: "datesFontSize",
    deathDate: "datesFontSize",
    quote: "quoteFontSize",
    quoteAuthor: "quoteAuthorFontSize",
    closingVerse: "closingVerseFontSize",
    locationBirth: "locationFontSize",
    locationDeath: "locationFontSize",
  };
  const sizeField = map[field];
  if (!sizeField) return null;
  const val = tc[sizeField];
  return typeof val === "number" ? val : null;
}

function renderTextElement(el: TemplateElement, state: WizardState, pos: string): string {
  const value = el.field ? getFieldValue(state.textContent, el.field) : (el.fixedContent ?? "");
  if (!value) return "";

  const globalFont = state.textContent.fontFamily;
  const font = el.fontFamily ?? globalFont;
  const userSize = getUserFontSize(state.textContent, el.field);
  const size = userSize ?? el.fontSize ?? 9;
  const weight = el.fontWeight ?? "normal";
  const style = el.fontStyle ?? "normal";
  const variant = el.fontVariant ?? "normal";
  const transform = el.textTransform ?? "none";
  const align = el.textAlign ?? "center";
  const spacing = el.letterSpacing ?? "0";
  const color = el.color ?? state.textContent.fontColor ?? "#1A1A1A";
  const escaped = value.replace(/\n/g, "<br>");

  return `<div id="el-${el.id}" style="${pos}display:flex;flex-direction:column;align-items:${align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"};justify-content:center;overflow:hidden;">
    <div style="font-family:'${font}',serif;font-size:${size}pt;font-weight:${weight};font-style:${style};font-variant:${variant};text-transform:${transform};text-align:${align};letter-spacing:${spacing};color:${color};line-height:1.5;white-space:pre-wrap;word-wrap:break-word;width:100%;">${escaped}</div>
  </div>`;
}

function renderImageElement(el: TemplateElement, state: WizardState, images: Record<string, string>, pos: string): string {
  const base64 = images[el.field ?? "photo"] ?? "";
  if (!base64) {
    return `<div style="${pos}background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:10pt;">Foto</div>`;
  }

  let imgStyle = `background-image:url('${base64}');background-size:cover;background-position:center top;background-repeat:no-repeat;`;

  // Apply user crop if available (guard against division by zero when width/height are 0 or 1)
  if (el.useCrop !== false && state.photo.crop) {
    const { x, y, width, height } = state.photo.crop;
    if (width > 0 && width < 1 && height > 0 && height < 1) {
      const sizeX = (1 / width * 100).toFixed(1);
      const sizeY = (1 / height * 100).toFixed(1);
      const posX = (x / (1 - width) * 100).toFixed(1);
      const posY = (y / (1 - height) * 100).toFixed(1);
      imgStyle = `background-image:url('${base64}');background-size:${sizeX}% ${sizeY}%;background-position:${posX}% ${posY}%;background-repeat:no-repeat;`;
    }
  }

  let clipStyle = "";
  if (el.imageClip === "ellipse") clipStyle = "clip-path:ellipse(50% 50% at 50% 50%);border-radius:50%;";
  if (el.imageClip === "rounded") clipStyle = "border-radius:8px;";

  const border = el.imageBorder && el.imageBorder !== "none" ? `border:${el.imageBorder};` : "";

  const photoFilter = state.photo?.filter && state.photo.filter !== "none"
    ? `filter:${state.photo.filter};`
    : "";

  return `<div style="${pos}${imgStyle}${clipStyle}${border}${photoFilter}"></div>`;
}

function renderLineElement(el: TemplateElement, pos: string): string {
  const style = el.lineStyle ?? "1px solid #ccc";
  return `<div style="${pos}border-top:${style};"></div>`;
}

function renderOrnamentElement(el: TemplateElement, images: Record<string, string>, pos: string): string {
  const key = el.fixedAsset ?? "";
  const base64 = images[key] ?? "";
  if (!base64) {
    return `<div style="${pos}"></div>`;
  }
  return `<div style="${pos}display:flex;align-items:center;justify-content:center;">
    <img src="${base64}" style="max-width:100%;max-height:100%;object-fit:${el.imageFit ?? "contain"};" />
  </div>`;
}

// ── Field value helper ──

function getFieldValue(tc: TextContent, field: string): string {
  const val = tc[field as keyof TextContent];
  return typeof val === "string" ? val : "";
}

// ── Font link ──

function renderFontLinks(fonts: string[]): string {
  const unique = [...new Set(fonts)];
  return unique.map(f => {
    const encoded = encodeURIComponent(f);
    return `<link href="https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;700&display=swap" rel="stylesheet">`;
  }).join("\n  ");
}

// ── Main render function ──

export async function renderSpreadHTML(state: WizardState): Promise<string> {
  const config = state.templateId ? getTemplateConfig(state.templateId) : null;
  if (!config) throw new Error(`Template config not found: ${state.templateId}`);

  const { spreadWidthMm, spreadHeightMm } = config;
  const gridW = 1000;
  const gridH = 1000;

  // Collect all fonts used
  const fonts: string[] = [state.textContent.fontFamily];
  for (const el of config.elements) {
    if (el.fontFamily) fonts.push(el.fontFamily);
  }

  // Pre-fetch images
  const images: Record<string, string> = {};
  const photoSrc = state.photo.sharpenedUrl ?? state.photo.url;
  if (photoSrc) {
    images["photo"] = await imageToBase64(photoSrc);
  }
  if (photoSrc && !images["photo"]) {
    console.warn("[card-html] Photo URL provided but conversion failed:", photoSrc);
  }
  // Fetch ornament assets
  for (const el of config.elements) {
    if (el.type === "ornament" && el.fixedAsset) {
      // For local assets, construct full URL
      const assetUrl = el.fixedAsset.startsWith("http")
        ? el.fixedAsset
        : `https://www.svgrepo.com/show/${el.fixedAsset.replace("/assets/ornaments/", "").replace(".svg", "")}.svg`;

      // Try the direct path first (for PNGs from freesvg.org stored locally)
      if (el.fixedAsset.endsWith(".png")) {
        // For local PNG files, read from filesystem
        try {
          const fs = await import("fs");
          const path = await import("path");
          const filePath = path.join(process.cwd(), "public", el.fixedAsset);
          if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath);
            images[el.fixedAsset] = `data:image/png;base64,${buf.toString("base64")}`;
            continue;
          }
        } catch { /* fall through to URL fetch */ }
      }
      if (el.fixedAsset.endsWith(".svg")) {
        try {
          const fs = await import("fs");
          const path = await import("path");
          const filePath = path.join(process.cwd(), "public", el.fixedAsset);
          if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath);
            images[el.fixedAsset] = `data:image/svg+xml;base64,${buf.toString("base64")}`;
            continue;
          }
        } catch { /* fall through */ }
      }
      // Fallback: fetch from URL
      images[el.fixedAsset] = await imageToBase64(assetUrl);
    }
  }
  // Fetch decoration asset if provided
  if (state.decoration.assetUrl) {
    images["decoration"] = await imageToBase64(state.decoration.assetUrl);
  }

  // Render elements
  let elementsHtml = "";
  for (const el of config.elements) {
    const pos = posStyle(el, gridW, gridH);
    switch (el.type) {
      case "text":
        elementsHtml += renderTextElement(el, state, pos);
        break;
      case "image":
        elementsHtml += renderImageElement(el, state, images, pos);
        break;
      case "line":
        elementsHtml += renderLineElement(el, pos);
        break;
      case "ornament":
        elementsHtml += renderOrnamentElement(el, images, pos);
        break;
    }
  }

  // Decoration overlay (symbol in bottom-right corner)
  if (state.decoration.assetUrl && images["decoration"]) {
    elementsHtml += `<div style="position:absolute;bottom:3%;right:3%;width:15%;height:15%;display:flex;align-items:center;justify-content:center;opacity:0.6;">
      <img src="${images["decoration"]}" style="max-width:100%;max-height:100%;object-fit:contain;" />
    </div>`;
  }

  // Border/frame overlay (full card)
  if (state.border?.url) {
    const borderBase64 = await imageToBase64(state.border.url);
    if (borderBase64) {
      elementsHtml += `<div style="position:absolute;inset:0;pointer-events:none;z-index:10;">
        <img src="${borderBase64}" style="width:100%;height:100%;object-fit:contain;" />
      </div>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${renderFontLinks(fonts)}
  <style>
    @page { size: ${spreadWidthMm}mm ${spreadHeightMm}mm; margin: 0; }
    * { margin: 0; padding: 0; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div style="position:relative;width:${spreadWidthMm}mm;height:${spreadHeightMm}mm;background:white;overflow:hidden;">
    ${elementsHtml}
  </div>
</body>
</html>`;
}

/**
 * Auto-shrink text elements that overflow their container.
 * Called after Puppeteer loads the HTML.
 */
export async function autoShrinkText(page: import("puppeteer-core").Page, config: TemplateConfig): Promise<void> {
  const textElements = config.elements.filter(el => el.type === "text" && el.autoShrink !== false);

  for (const el of textElements) {
    const minSize = el.minFontSize ?? 6;
    await page.evaluate(({ id, min }) => {
      const container = document.getElementById(`el-${id}`);
      if (!container) return;
      const textDiv = container.querySelector("div") as HTMLElement;
      if (!textDiv) return;
      let size = parseFloat(textDiv.style.fontSize);
      if (isNaN(size)) return;
      let iterations = 0;
      while (container.scrollHeight > container.clientHeight && size > min && iterations < 50) {
        size -= 0.5;
        textDiv.style.fontSize = size + "pt";
        iterations++;
      }
    }, { id: el.id, min: minSize });
  }
}
