import "dotenv/config";
import { writeFileSync } from "fs";
import { generateCardPDF } from "../src/lib/editor/pdf-generator";
import { DEFAULT_TEXT_CONTENT } from "../src/lib/editor/wizard-state";
import type { WizardState } from "../src/lib/editor/wizard-state";

const PHOTO_WOMAN = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80";
const PHOTO_MAN = "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&q=80";
const ORNAMENT_DAISY = "https://www.svgrepo.com/show/151579/daisy-with-stem.svg";
const ORNAMENT_CROSS = "https://www.svgrepo.com/show/37152/christian-cross.svg";

const OUT_DIR = "C:/Users/fires/OneDrive/Git/BENJEMIN/public/test-pdfs";

const TEMPLATES: Record<string, WizardState> = {
  T1: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T1",
    photo: { url: null, originalUrl: null, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      heading: "In Gedenken an unsere",
      headingFontSize: 12,
      relationshipLabels: "Mutter, Oma, Schwiegermutter\nund Ehefrau",
      name: "Sieglinde Musterfrau",
      nameFontSize: 26,
      quote: "Ich glaube,\ndaß wenn der Tod\nunsere Augen schließt,\nwir in einem Licht stehn,\nvon welchem\nunser Sonnenlicht\nnur der Schatten ist.",
      quoteFontSize: 12,
      quoteAuthor: "(Arthur Schopenhauer)",
      quoteAuthorFontSize: 10,
      birthDate: "24. Juli 1952 –",
      deathDate: "28. September 2020",
      datesFontSize: 14,
      fontFamily: "Libre Baskerville",
      textAlign: "left",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  T2: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T2",
    photo: { url: PHOTO_MAN, originalUrl: PHOTO_MAN, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Hans Mustermann",
      nameFontSize: 26,
      birthDate: "* 5. Januar 1948",
      deathDate: "† 17. Januar 2021",
      datesFontSize: 14,
      fontFamily: "Playfair Display",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  T3: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T3",
    photo: { url: PHOTO_WOMAN, originalUrl: PHOTO_WOMAN, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Thilde Muster",
      nameFontSize: 20,
      birthDate: "* 4.6.1942",
      deathDate: "† 6.1.2021",
      datesFontSize: 14,
      quote: "Man sieht die Sonne\nlangsam untergehen\nund erschrickt dennoch,\ndass es plötzlich dunkel ist.",
      quoteFontSize: 13,
      fontFamily: "EB Garamond",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  T4: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T4",
    photo: { url: PHOTO_MAN, originalUrl: PHOTO_MAN, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Franziska Muster",
      nameFontSize: 24,
      birthDate: "* 1.12.1954",
      locationBirth: "in Starnberg",
      deathDate: "† 23.1.2021",
      locationDeath: "in Augsburg",
      locationFontSize: 11,
      datesFontSize: 14,
      dividerSymbol: "• • •",
      fontFamily: "Playfair Display",
    },
    decoration: { assetUrl: ORNAMENT_DAISY, assetId: "daisy" },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  T5: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T5",
    photo: { url: PHOTO_WOMAN, originalUrl: PHOTO_WOMAN, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Brigitte Muster",
      nameFontSize: 24,
      birthDate: "* 16.2.1940",
      deathDate: "† 2.1.2021",
      datesFontSize: 14,
      quote: "Dein gutes Herz\nhat aufgehört\nzu schlagen\nund wollte doch\nso gern noch\nbei uns sein.\nGott hilft uns,\ndiesen Schmerz\nzu tragen,\ndenn ohne Dich\nwird manches\nanders sein.",
      quoteFontSize: 13,
      fontFamily: "Cormorant Garamond",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  T6: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "T6",
    photo: { url: PHOTO_WOMAN, originalUrl: PHOTO_WOMAN, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      heading: "Zum stillen Gedenken an",
      headingFontSize: 11,
      name: "Renate Musterfrau",
      nameFontSize: 22,
      birthDate: "* 6.5.1933",
      deathDate: "† 3.2.2021",
      datesFontSize: 13,
      dividerSymbol: "— — —",
      closingVerse: "O Herr,\ngib ihr die ewige Ruhe!",
      closingVerseFontSize: 11,
      quote: "Du siehst den Garten\nnicht mehr grünen,\nin dem du einst\nso froh geschafft.\nSiehst deine Blumen\nnicht mehr blühen,\nweil dir der Tod\nnahm deine Kraft.\nWas wir an dir\nverloren haben,\ndas wissen wir\nnur ganz allein.",
      quoteFontSize: 11,
      fontFamily: "Playfair Display",
    },
    decoration: { assetUrl: ORNAMENT_CROSS, assetId: "cross" },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
};

async function main(): Promise<void> {
  const ids = process.argv[2] === "--all"
    ? Object.keys(TEMPLATES)
    : process.argv.slice(2).filter(id => TEMPLATES[id]);

  if (ids.length === 0) {
    console.log("Usage: npx tsx scripts/generate-all-templates.ts --all");
    console.log("       npx tsx scripts/generate-all-templates.ts T1 T4 T5");
    return;
  }

  for (const id of ids) {
    console.log(`\n--- ${id} ---`);
    try {
      const pdf = await generateCardPDF(TEMPLATES[id]);
      const path = `${OUT_DIR}/${id}.pdf`;
      writeFileSync(path, pdf);
      console.log(`${id}: ${pdf.length} bytes → ${path}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`${id} FAILED: ${msg}`);
    }
  }
  console.log("\nDone. PDFs in public/test-pdfs/");
}

main();
