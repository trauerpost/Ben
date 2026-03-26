import { renderCardHTML } from "./card-to-html";
import { getCardDimensions } from "./wizard-state";
import type { WizardState } from "./wizard-state";

export async function generateCardPDF(state: WizardState): Promise<Buffer> {
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const html = await renderCardHTML(state);

  // Try @sparticuz/chromium first (Vercel serverless), fall back to local puppeteer
  let browser;
  try {
    const puppeteerCore = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");
    browser = await puppeteerCore.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  } catch {
    // Local dev: use full puppeteer with bundled Chromium
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.default.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      width: `${dims.widthMm}mm`,
      height: `${dims.heightMm}mm`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
