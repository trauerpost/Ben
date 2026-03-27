import "dotenv/config";
import { writeFileSync } from "fs";
import { renderCardHTML } from "../src/lib/editor/card-to-html";
import { generateCardPDF } from "../src/lib/editor/pdf-generator";
import { scoreTemplate, formatScoreCard } from "../src/lib/editor/template-scorer";
import { DEFAULT_TEXT_CONTENT } from "../src/lib/editor/wizard-state";
import type { WizardState } from "../src/lib/editor/wizard-state";

// ── Test data per template (matching client reference images) ──

const TEST_DATA: Record<string, WizardState> = {
  T1: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T1",
    photo: { url: null, crop: null },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "In Gedenken an unsere", relationshipLabels: "Mutter, Oma, Schwiegermutter\nund Ehefrau", name: "Sieglinde Musterfrau", nameFontSize: 24, quote: "Ich glaube,\ndaß wenn der Tod\nunsere Augen schließt,\nwir in einem Licht stehn,\nvon welchem\nunser Sonnenlicht\nnur der Schatten ist.", quoteAuthor: "(Arthur Schopenhauer)", birthDate: "24. Juli 1952 –", deathDate: "28. September 2020", fontFamily: "Libre Baskerville", textAlign: "left" },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  T2: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T2",
    photo: { url: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&q=80", crop: null },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Hans Mustermann", nameFontSize: 22, birthDate: "* 5. Januar 1948", deathDate: "† 17. Januar 2021", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  T3: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T3",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", crop: null },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Thilde Muster", nameFontSize: 24, birthDate: "* 4.6.1942", deathDate: "† 6.1.2021", quote: "Man sieht die Sonne\nlangsam untergehen\nund erschrickt dennoch,\ndass es plötzlich dunkel ist.", quoteFontSize: 11, fontFamily: "EB Garamond" },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  T4: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T4",
    photo: { url: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&q=80", crop: null },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Franziska Muster", nameFontSize: 20, birthDate: "* 1.12.1954", locationBirth: "in Starnberg", deathDate: "† 23.1.2021", locationDeath: "in Augsburg", dividerSymbol: "• • •", fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  T5: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T5",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", crop: null },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, name: "Brigitte Muster", nameFontSize: 18, birthDate: "* 16.2.1940", deathDate: "† 2.1.2021", quote: "Dein gutes Herz\nhat aufgehört\nzu schlagen\nund wollte doch\nso gern noch\nbei uns sein.\nGott hilft uns,\ndiesen Schmerz\nzu tragen,\ndenn ohne Dich\nwird manches\nanders sein.", quoteFontSize: 11, fontFamily: "Cormorant Garamond" },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
  T6: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T6",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", crop: null },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: { ...DEFAULT_TEXT_CONTENT, heading: "Zum stillen Gedenken an", headingFontSize: 10, name: "Renate Musterfrau", nameFontSize: 20, birthDate: "* 6.5.1933", deathDate: "† 3.2.2021", dividerSymbol: "— — —", closingVerse: "O Herr,\ngib ihr die ewige Ruhe!", closingVerseFontSize: 10, quote: "Du siehst den Garten\nnicht mehr grünen,\nin dem du einst\nso froh geschafft.\nSiehst deine Blumen\nnicht mehr blühen,\nweil dir der Tod\nnahm deine Kraft.\nWas wir an dir\nverloren haben,\ndas wissen wir\nnur ganz allein.", quoteFontSize: 10, fontFamily: "Playfair Display" },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
};

async function scoreOne(templateId: string): Promise<void> {
  const state = TEST_DATA[templateId];
  if (!state) {
    console.error(`No test data for ${templateId}`);
    return;
  }

  console.log(`\n--- Scoring ${templateId} ---`);

  // Generate HTML
  const html = await renderCardHTML(state);

  // Score
  const card = scoreTemplate(templateId, state, html);
  console.log(formatScoreCard(card));

  // Generate PDF
  const pdf = await generateCardPDF(state);
  writeFileSync(`C:/Users/fires/Desktop/template-${templateId}.pdf`, pdf);
  console.log(`  PDF saved: ${pdf.length} bytes → Desktop/template-${templateId}.pdf`);

  return;
}

async function main(): Promise<void> {
  const arg = process.argv[2];

  if (arg === "--all") {
    for (const id of Object.keys(TEST_DATA)) {
      await scoreOne(id);
    }
    console.log("\n=== ALL DONE ===");
  } else if (arg && TEST_DATA[arg]) {
    await scoreOne(arg);
  } else {
    console.log("Usage: npx tsx scripts/score-template.ts T1");
    console.log("       npx tsx scripts/score-template.ts --all");
    console.log("Available:", Object.keys(TEST_DATA).join(", "));
  }
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
