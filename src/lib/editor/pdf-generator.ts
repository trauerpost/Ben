import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { renderCardHTML } from "./card-to-html";
import { getCardDimensions } from "./wizard-state";
import type { WizardState } from "./wizard-state";

export async function generateCardPDF(state: WizardState): Promise<Buffer> {
  const dims = getCardDimensions(state);
  if (!dims) throw new Error("Cannot determine card dimensions");

  const html = await renderCardHTML(state);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

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
