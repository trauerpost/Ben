import type { CardType, CardFormat } from "./wizard-state";

// ── Schema ──

export type ElementType = "text" | "image" | "line" | "ornament";

export interface TemplateElement {
  id: string;
  type: ElementType;
  x: number;           // grid 0-1000
  y: number;
  w: number;
  h: number;
  // Content
  field?: string;       // wizard field name
  fixedContent?: string;
  fixedAsset?: string;  // path to ornament file
  // Typography (all sizes in pt)
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fontVariant?: string;
  fontFamily?: string;  // per-element override
  textTransform?: string;
  textAlign?: string;
  letterSpacing?: string;
  color?: string;
  // Text overflow
  autoShrink?: boolean;  // default true
  minFontSize?: number;  // default 6pt
  // Image
  imageFit?: string;
  imageClip?: string;    // "none" | "ellipse" | "rounded"
  imageBorder?: string;
  useCrop?: boolean;     // use state.photo.crop
  // Line
  lineStyle?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  referenceImage: string;
  cardType: CardType;
  cardFormat: CardFormat;
  spreadWidthMm: number;
  spreadHeightMm: number;
  requiredFields: string[];
  requiresPhoto: boolean;
  thumbnail: {
    previewName: string;
    previewDates: string;
    previewQuote?: string;
  };
  elements: TemplateElement[];
}

// ── TI 04: "Nur Text" (Sieglinde) ──

const TI04: TemplateConfig = {
  id: "TI04",
  name: "Nur Text",
  description: "Zwei-Spalten — nur Text, kein Foto",
  referenceImage: "/docs/references/TI04.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["heading", "relationshipLabels", "name", "quote", "quoteAuthor", "birthDate", "deathDate"],
  requiresPhoto: false,
  thumbnail: { previewName: "Sieglinde Musterfrau", previewDates: "24. Juli 1952 – 28. September 2020" },
  elements: [
    { id: "heading", type: "text", x: 70, y: 85, w: 460, h: 45, field: "heading", fontSize: 10, fontStyle: "italic", textAlign: "left", letterSpacing: "0.5px" },
    { id: "labels", type: "text", x: 70, y: 148, w: 460, h: 70, field: "relationshipLabels", fontSize: 8.5, textAlign: "left" },
    { id: "name", type: "text", x: 55, y: 248, w: 490, h: 140, field: "name", fontSize: 28, fontWeight: "normal", fontFamily: "Pinyon Script", textAlign: "left" },
    { id: "quote", type: "text", x: 70, y: 440, w: 460, h: 280, field: "quote", fontSize: 9, fontStyle: "italic", textAlign: "left" },
    { id: "author", type: "text", x: 70, y: 730, w: 460, h: 30, field: "quoteAuthor", fontSize: 7.5, fontStyle: "italic", textAlign: "left" },
    { id: "birthDate", type: "text", x: 590, y: 405, w: 360, h: 40, field: "birthDate", fontSize: 9.5, textAlign: "right" },
    { id: "deathDate", type: "text", x: 590, y: 458, w: 360, h: 40, field: "deathDate", fontSize: 9.5, textAlign: "right" },
  ],
};

// ── TI 05: "Foto 50/50" (Brigitte) ──

const TI05: TemplateConfig = {
  id: "TI05",
  name: "Foto 50/50",
  description: "Großes Foto links, Text rechts mit Linien",
  referenceImage: "/docs/references/TI05.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["heading", "name", "birthDate", "deathDate", "quote", "quoteAuthor"],
  requiresPhoto: true,
  thumbnail: { previewName: "Brigitte Musterfrau", previewDates: "* 31. Juli 1950  † 20. Februar 2021", previewQuote: "Das schönste Denkmal..." },
  elements: [
    { id: "photo", type: "image", x: 0, y: 0, w: 480, h: 1000, field: "photo", imageFit: "cover", useCrop: true },
    { id: "heading", type: "text", x: 530, y: 155, w: 420, h: 38, field: "heading", fontSize: 8, fontStyle: "italic", textAlign: "center" },
    { id: "line-top", type: "line", x: 625, y: 225, w: 230, h: 1, lineStyle: "0.5px solid #999" },
    { id: "name", type: "text", x: 520, y: 260, w: 440, h: 95, field: "name", fontSize: 19, fontWeight: "bold", textAlign: "center" },
    { id: "birthDate", type: "text", x: 530, y: 385, w: 420, h: 26, field: "birthDate", fontSize: 8, textAlign: "center" },
    { id: "deathDate", type: "text", x: 530, y: 415, w: 420, h: 26, field: "deathDate", fontSize: 8, textAlign: "center" },
    { id: "line-mid", type: "line", x: 625, y: 488, w: 230, h: 1, lineStyle: "0.5px solid #999" },
    { id: "quote", type: "text", x: 530, y: 518, w: 420, h: 200, field: "quote", fontSize: 8, fontStyle: "italic", textAlign: "center" },
    { id: "author", type: "text", x: 530, y: 748, w: 420, h: 30, field: "quoteAuthor", fontSize: 7, textAlign: "center" },
  ],
};

// ── TI 06: "L-Form" (Thilde) ──

const TI06: TemplateConfig = {
  id: "TI06",
  name: "L-Form",
  description: "Foto oben-links, Name Small-Caps rechts, Spruch unten",
  referenceImage: "/docs/references/TI06.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "deathDate", "quote"],
  requiresPhoto: true,
  thumbnail: { previewName: "Thilde Muster", previewDates: "* 4.6.1942  † 6.1.2021", previewQuote: "Man sieht die Sonne..." },
  elements: [
    { id: "photo", type: "image", x: 55, y: 55, w: 365, h: 540, field: "photo", imageFit: "cover", imageBorder: "1px solid #ddd", useCrop: true },
    { id: "name", type: "text", x: 470, y: 100, w: 490, h: 130, field: "name", fontSize: 24, fontVariant: "small-caps", fontWeight: "normal", letterSpacing: "4px", textAlign: "left" },
    { id: "birthDate", type: "text", x: 470, y: 310, w: 470, h: 35, field: "birthDate", fontSize: 9, textAlign: "right" },
    { id: "deathDate", type: "text", x: 470, y: 355, w: 470, h: 35, field: "deathDate", fontSize: 9, textAlign: "right" },
    { id: "quote", type: "text", x: 455, y: 590, w: 510, h: 370, field: "quote", fontSize: 8, fontVariant: "small-caps", letterSpacing: "1px", textAlign: "center" },
  ],
};

// ── TI 07: "Drei-Zonen" (Franziska) ──

const TI07: TemplateConfig = {
  id: "TI07",
  name: "Drei-Zonen",
  description: "Symbol links, Text Mitte, Foto rechts",
  referenceImage: "/docs/references/TI07.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath", "dividerSymbol"],
  requiresPhoto: true,
  thumbnail: { previewName: "Franziska Muster", previewDates: "* 1.12.1954  † 23.1.2021" },
  elements: [
    { id: "ornament", type: "ornament", x: 10, y: 10, w: 130, h: 880, fixedAsset: "/assets/ornaments/cross-rose-vine.svg", imageFit: "contain" },
    { id: "name", type: "text", x: 150, y: 340, w: 400, h: 200, field: "name", fontSize: 24, textAlign: "left" },
    { id: "birthDate", type: "text", x: 160, y: 565, w: 390, h: 28, field: "birthDate", fontSize: 9, textAlign: "left" },
    { id: "birthPlace", type: "text", x: 170, y: 597, w: 380, h: 25, field: "locationBirth", fontSize: 8, textAlign: "left" },
    { id: "deathDate", type: "text", x: 160, y: 660, w: 390, h: 28, field: "deathDate", fontSize: 9, textAlign: "left" },
    { id: "deathPlace", type: "text", x: 170, y: 692, w: 380, h: 25, field: "locationDeath", fontSize: 8, textAlign: "left" },
    { id: "divider", type: "text", x: 155, y: 845, w: 390, h: 30, field: "dividerSymbol", fontSize: 9, color: "#cc0000", textAlign: "center" },
    { id: "photo", type: "image", x: 580, y: 35, w: 390, h: 730, field: "photo", imageFit: "cover", imageClip: "rounded", imageBorder: "1px solid #ddd", useCrop: true },
  ],
};

// ── TI 08: "Oval-Spiegel" (Erna) ──

const TI08: TemplateConfig = {
  id: "TI08",
  name: "Oval-Spiegel",
  description: "Kreuz + Linien links, ovales Foto rechts",
  referenceImage: "/docs/references/TI08.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath"],
  requiresPhoto: true,
  thumbnail: { previewName: "Erna Musterfrau", previewDates: "* 1.12.1934  † 20.1.2021" },
  elements: [
    { id: "cross", type: "ornament", x: 25, y: 35, w: 28, h: 70, fixedAsset: "/assets/ornaments/cross-simple.svg", imageFit: "contain" },
    { id: "line-top", type: "line", x: 58, y: 70, w: 370, h: 1, lineStyle: "1px solid #1A1A1A" },
    { id: "name", type: "text", x: 55, y: 220, w: 400, h: 200, field: "name", fontSize: 23, fontWeight: "300", textAlign: "left" },
    { id: "birthDate", type: "text", x: 55, y: 465, w: 400, h: 28, field: "birthDate", fontSize: 9, textAlign: "left" },
    { id: "birthPlace", type: "text", x: 55, y: 495, w: 400, h: 25, field: "locationBirth", fontSize: 8, textAlign: "left" },
    { id: "deathDate", type: "text", x: 55, y: 555, w: 400, h: 28, field: "deathDate", fontSize: 9, textAlign: "left" },
    { id: "deathPlace", type: "text", x: 55, y: 585, w: 400, h: 25, field: "locationDeath", fontSize: 8, textAlign: "left" },
    { id: "line-bottom", type: "line", x: 25, y: 700, w: 420, h: 1, lineStyle: "1px solid #1A1A1A" },
    { id: "photo", type: "image", x: 515, y: 30, w: 450, h: 830, field: "photo", imageFit: "cover", imageClip: "ellipse", useCrop: true },
  ],
};

// ── TI 09: "Floral Symmetrisch" (Renate) ──

const TI09: TemplateConfig = {
  id: "TI09",
  name: "Floral Symmetrisch",
  description: "Spruch links, Symbol Mitte, Text + kleines Foto rechts",
  referenceImage: "/docs/references/TI09.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["heading", "name", "birthDate", "deathDate", "closingVerse", "quote"],
  requiresPhoto: true,
  thumbnail: { previewName: "Renate Musterfrau", previewDates: "* 6.5.1933  † 3.2.2021", previewQuote: "Du siehst den Garten..." },
  elements: [
    { id: "ornament", type: "ornament", x: 350, y: 25, w: 300, h: 75, fixedAsset: "/assets/ornaments/floral-divider.svg", imageFit: "contain" },
    { id: "quote", type: "text", x: 55, y: 140, w: 390, h: 730, field: "quote", fontSize: 8.5, fontStyle: "italic", textAlign: "left" },
    { id: "heading", type: "text", x: 510, y: 130, w: 440, h: 40, field: "heading", fontSize: 9, fontStyle: "italic", textAlign: "center", letterSpacing: "0.5px" },
    { id: "name", type: "text", x: 500, y: 190, w: 460, h: 100, field: "name", fontSize: 19, fontWeight: "bold", textAlign: "center" },
    { id: "birthDate", type: "text", x: 510, y: 335, w: 440, h: 30, field: "birthDate", fontSize: 9, textAlign: "center" },
    { id: "deathDate", type: "text", x: 510, y: 372, w: 440, h: 30, field: "deathDate", fontSize: 9, textAlign: "center" },
    { id: "line", type: "line", x: 585, y: 430, w: 290, h: 1, lineStyle: "0.5px solid #bbb" },
    { id: "verse", type: "text", x: 510, y: 450, w: 440, h: 105, field: "closingVerse", fontSize: 8.5, fontStyle: "italic", textAlign: "center" },
    { id: "photo", type: "image", x: 580, y: 590, w: 365, h: 360, field: "photo", imageFit: "cover", imageClip: "rounded", useCrop: true },
  ],
};

// ── All Configs ──

export const ALL_TEMPLATE_CONFIGS: TemplateConfig[] = [TI04, TI05, TI06, TI07, TI08, TI09];

export function getTemplateConfig(id: string): TemplateConfig | null {
  return ALL_TEMPLATE_CONFIGS.find((c) => c.id === id) ?? null;
}

export function getTemplateConfigsForCard(cardType: CardType, cardFormat: CardFormat | null): TemplateConfig[] {
  return ALL_TEMPLATE_CONFIGS.filter(
    (c) => c.cardType === cardType && (cardFormat === null || c.cardFormat === cardFormat)
  );
}
