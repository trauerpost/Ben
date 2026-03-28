/**
 * Client-side PDF generation using html2canvas + jsPDF.
 * Used as a fallback when server-side Puppeteer fails,
 * and for quick local testing.
 *
 * IMPORTANT: Uses dynamic import() — html2canvas and jsPDF
 * require browser APIs (document, canvas) that don't exist
 * during Next.js SSR. Static imports would crash on Vercel.
 */

export async function generateClientPDF(
  previewElement: HTMLElement,
  widthMm: number,
  heightMm: number
): Promise<Blob> {
  // Dynamic imports — only loaded client-side when function is called
  const { default: html2canvas } = await import("html2canvas-pro");
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(previewElement, {
    scale: 3, // ~300 DPI equivalent
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
  });

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
  return pdf.output("blob");
}
