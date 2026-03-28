import "dotenv/config";
import { writeFileSync } from "fs";
import { generateCardPDF } from "../src/lib/editor/pdf-generator";
import { DEFAULT_TEXT_CONTENT } from "../src/lib/editor/wizard-state";
import type { WizardState } from "../src/lib/editor/wizard-state";

const OUT_DIR = "C:/Users/fires/OneDrive/Git/BENJEMIN/public/test-pdfs";

const TEMPLATES: Record<string, WizardState> = {
  TI04: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI04",
    photo: { url: null, originalUrl: null, sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      heading: "In Gedenken an unsere",
      relationshipLabels: "Mutter, Oma, Schwiegermutter\nund Ehefrau",
      name: "Sieglinde Musterfrau",
      nameFontSize: 20,
      quote: "Ich glaube,\ndaß wenn der Tod\nunsere Augen schließt,\nwir in einem Licht stehn,\nvon welchem\nunser Sonnenlicht\nnur der Schatten ist.",
      quoteAuthor: "(Arthur Schopenhauer)",
      birthDate: "24. Juli 1952 –",
      deathDate: "28. September 2020",
      fontFamily: "Libre Baskerville",
      textAlign: "left",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  TI05: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI05",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      heading: "In liebevoller Erinnerung",
      name: "Brigitte Musterfrau",
      nameFontSize: 18,
      birthDate: "* 31. Juli 1950",
      deathDate: "† 20. Februar 2021",
      quote: "Das schönste Denkmal,\ndas ein Mensch bekommen kann,\nsteht in den Herzen\nder Mitmenschen.",
      quoteAuthor: "(Albert Schweitzer)",
      fontFamily: "Playfair Display",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  TI06: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI06",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Thilde Muster",
      nameFontSize: 16,
      birthDate: "* 4.6.1942",
      deathDate: "† 6.1.2021",
      quote: "Man sieht die Sonne\nlangsam untergehen\nund erschrickt dennoch,\ndass es plötzlich dunkel ist.",
      fontFamily: "EB Garamond",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  TI07: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI07",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Franziska\nMuster",
      nameFontSize: 18,
      birthDate: "* 1.12.1954",
      locationBirth: "in Starnberg",
      deathDate: "† 23.1.2021",
      locationDeath: "in Augsburg",
      dividerSymbol: "★ ★ ★",
      fontFamily: "Playfair Display",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  TI08: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI08",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      name: "Erna\nMusterfrau",
      nameFontSize: 20,
      birthDate: "* 1.12.1934",
      locationBirth: "in Starnberg",
      deathDate: "† 20. 1. 2021",
      locationDeath: "in Augsburg",
      fontFamily: "Cormorant Garamond",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },

  TI09: {
    currentStep: 7, cardType: "sterbebild", cardFormat: "single", templateId: "TI09",
    photo: { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80", sharpenedUrl: null, crop: null, filter: "none", filterId: "original", adjustments: null, backgroundRemoved: false, backgroundBlurred: false },
    background: { type: "color", color: "#FFFFFF", imageUrl: null },
    textContent: {
      ...DEFAULT_TEXT_CONTENT,
      heading: "Zum stillen Gedenken an",
      name: "Renate Musterfrau",
      nameFontSize: 18,
      birthDate: "* 6.5.1933",
      deathDate: "† 3.2.2021",
      dividerSymbol: "— — —",
      closingVerse: "O Herr,\ngib ihr die ewige Ruhe!",
      quote: "Du siehst den Garten\nnicht mehr grünen,\nin dem du einst\nso froh geschafft.\nSiehst deine Blumen\nnicht mehr blühen,\nweil dir der Tod\nnahm deine Kraft.\nWas wir an dir\nverloren haben,\ndas wissen wir\nnur ganz allein.",
      fontFamily: "Playfair Display",
    },
    decoration: { assetUrl: null, assetId: null },
    border: { url: null, id: null }, corners: { urls: [], ids: [] },
  },
};

async function main(): Promise<void> {
  const ids = process.argv[2] === "--all"
    ? Object.keys(TEMPLATES)
    : process.argv.slice(2).filter(id => TEMPLATES[id]);

  if (ids.length === 0) {
    console.log("Usage: npx tsx scripts/generate-v2.ts TI04");
    console.log("       npx tsx scripts/generate-v2.ts --all");
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
  console.log("\nDone.");
}

main();
