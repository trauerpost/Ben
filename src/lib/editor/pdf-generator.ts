import { jsPDF } from "jspdf";
import "svg2pdf.js";

// A6 card dimensions in mm
const CARD_WIDTH_MM = 148;
const CARD_HEIGHT_MM = 105;

export async function generatePDF(svgString: string): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
  });

  const parser = new DOMParser();
  const svgElement = parser.parseFromString(svgString, "image/svg+xml")
    .documentElement as unknown as SVGElement;

  await doc.svg(svgElement, {
    x: 0,
    y: 0,
    width: CARD_WIDTH_MM,
    height: CARD_HEIGHT_MM,
  });

  return doc.output("blob");
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
