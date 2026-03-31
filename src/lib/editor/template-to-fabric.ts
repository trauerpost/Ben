import type { TemplateConfig, TemplateElement } from "./template-configs";
import type { CanvasDimensions } from "./canvas-dimensions";
import type { TextContent } from "./wizard-state";

export interface FabricElementConfig {
  id: string;
  fabricType: "textbox" | "image" | "line" | "rect";
  options: Record<string, unknown>;
  field?: string;
  meta?: {
    imageClip?: string;
    imageBorder?: string;
    useCrop?: boolean;
    fixedAsset?: string;
    placeholderSrc?: string;
  };
}

/**
 * Convert a TemplateConfig's elements (0-1000 grid) into Fabric.js object configs
 * at pixel coordinates for a given canvas size.
 */
export function templateToFabricConfigs(
  template: TemplateConfig,
  dims: CanvasDimensions,
  textContent?: Partial<TextContent>
): FabricElementConfig[] {
  const results: FabricElementConfig[] = [];

  for (const el of template.elements) {
    const config = convertElement(el, dims, textContent, template);
    if (config) {
      results.push(config);
    }
  }

  return results;
}

function gridToPixel(gridValue: number, canvasSize: number): number {
  return (gridValue / 1000) * canvasSize;
}

function convertElement(
  el: TemplateElement,
  dims: CanvasDimensions,
  textContent: Partial<TextContent> | undefined,
  template: TemplateConfig
): FabricElementConfig | null {
  const left = gridToPixel(el.x, dims.width);
  const top = gridToPixel(el.y, dims.height);
  const width = gridToPixel(el.w, dims.width);
  const height = gridToPixel(el.h, dims.height);

  const baseData = {
    field: el.field,
    templateElementId: el.id,
    elementType: el.type,
  };

  switch (el.type) {
    case "text":
      return convertTextElement(el, left, top, width, height, baseData, textContent, template);
    case "image":
      return convertImagePlaceholder(el, left, top, width, height, baseData, template);
    case "line":
      return convertLineElement(el, left, top, width, height, baseData);
    case "ornament":
      return convertOrnamentElement(el, left, top, width, height, baseData);
    default:
      console.warn(`[template-to-fabric] Unknown element type: "${(el as TemplateElement).type}", skipping`);
      return null;
  }
}

function convertTextElement(
  el: TemplateElement,
  left: number,
  top: number,
  width: number,
  height: number,
  baseData: Record<string, unknown>,
  textContent: Partial<TextContent> | undefined,
  template: TemplateConfig
): FabricElementConfig {
  const text = el.field && textContent
    ? (textContent[el.field as keyof TextContent] as string) ?? el.fixedContent ?? ""
    : el.fixedContent ?? "";

  const globalFont = textContent?.fontFamily;
  const fontFamily = el.fontFamily ?? globalFont ?? "Playfair Display";
  const globalColor = textContent?.fontColor;

  return {
    id: el.id,
    fabricType: "textbox",
    field: el.field,
    options: {
      left,
      top,
      width,
      height,
      text: text || `[${el.field ?? el.id}]`,
      fontSize: el.fontSize ?? 12,
      fontFamily,
      fontWeight: el.fontWeight ?? "normal",
      fontStyle: el.fontStyle ?? "normal",
      textAlign: el.textAlign ?? "center",
      fill: el.color ?? globalColor ?? "#1A1A1A",
      lineHeight: 1.5,
      editable: true,
      splitByGrapheme: true,
      data: baseData,
    },
  };
}

function convertImagePlaceholder(
  el: TemplateElement,
  left: number,
  top: number,
  width: number,
  height: number,
  baseData: Record<string, unknown>,
  template: TemplateConfig
): FabricElementConfig {
  const placeholderSrc = template.placeholderPhotoSrc;

  if (placeholderSrc) {
    return {
      id: el.id,
      fabricType: "image",
      field: el.field,
      meta: {
        imageClip: el.imageClip,
        imageBorder: el.imageBorder,
        useCrop: el.useCrop,
        placeholderSrc,
      },
      options: {
        left,
        top,
        width,
        height,
        data: { ...baseData, isImagePlaceholder: true },
      },
    };
  }

  // Fallback: gray rect for templates without a placeholder photo
  return {
    id: el.id,
    fabricType: "rect",
    field: el.field,
    meta: {
      imageClip: el.imageClip,
      imageBorder: el.imageBorder,
      useCrop: el.useCrop,
    },
    options: {
      left,
      top,
      width,
      height,
      fill: "#f5f5f5",
      stroke: "#cccccc",
      strokeWidth: 1,
      strokeDashArray: [6, 4],
      rx: el.imageClip === "rounded" ? 8 : 0,
      ry: el.imageClip === "rounded" ? 8 : 0,
      data: { ...baseData, isImagePlaceholder: true },
    },
  };
}

function convertLineElement(
  el: TemplateElement,
  left: number,
  top: number,
  width: number,
  _height: number,
  baseData: Record<string, unknown>
): FabricElementConfig {
  const strokeStyle = el.lineStyle ?? "1px solid #ccc";
  const parts = strokeStyle.split(" ");
  const strokeWidth = parseFloat(parts[0]) || 1;
  const stroke = parts[2] || "#cccccc";

  return {
    id: el.id,
    fabricType: "line",
    options: {
      x1: 0,
      y1: 0,
      x2: width,
      y2: 0,
      left,
      top,
      stroke,
      strokeWidth,
      selectable: true,
      data: baseData,
    },
  };
}

function convertOrnamentElement(
  el: TemplateElement,
  left: number,
  top: number,
  width: number,
  height: number,
  baseData: Record<string, unknown>
): FabricElementConfig {
  return {
    id: el.id,
    fabricType: "image",
    meta: {
      fixedAsset: el.fixedAsset,
    },
    options: {
      left,
      top,
      width,
      height,
      data: { ...baseData, fixedAsset: el.fixedAsset },
    },
  };
}
