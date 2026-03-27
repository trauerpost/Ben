import "dotenv/config";
import { writeFileSync } from "fs";
import { generateCardPDF } from "../src/lib/editor/pdf-generator";
import { DEFAULT_TEXT_CONTENT } from "../src/lib/editor/wizard-state";
import type { WizardState } from "../src/lib/editor/wizard-state";

const state: WizardState = {
  currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T5",
  photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", crop: null },
  background: { type: "color", color: "#FFFFFF", imageUrl: null },
  textContent: {
    ...DEFAULT_TEXT_CONTENT,
    name: "Brigitte Muster",
    nameFontSize: 28,       // was 18 — much bigger for print
    birthDate: "* 16.2.1940",
    deathDate: "† 2.1.2021",
    datesFontSize: 16,      // was 13
    quote: "Dein gutes Herz\nhat aufgehört\nzu schlagen\nund wollte doch\nso gern noch\nbei uns sein.\nGott hilft uns,\ndiesen Schmerz\nzu tragen,\ndenn ohne Dich\nwird manches\nanders sein.",
    quoteFontSize: 14,      // was 11
    fontFamily: "Cormorant Garamond",
    fontColor: "#1A1A1A",
  },
  decoration: { assetUrl: null, assetId: null },
  border: { url: null, id: null },
  corners: { urls: [], ids: [] },
};

async function main() {
  console.log("Generating T5 with fixed proportions...");
  const pdf = await generateCardPDF(state);
  writeFileSync("C:/Users/fires/Desktop/template-T5-fixed.pdf", pdf);
  console.log("Saved: " + pdf.length + " bytes → Desktop/template-T5-fixed.pdf");
  console.log("OPEN THE PDF AND CHECK VISUALLY.");
}
main().catch(e => { console.error("FAILED:", e); process.exit(1); });
