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
    { id: "heading", type: "text", x: 30, y: 50, w: 520, h: 40, field: "heading", fontSize: 8, fontStyle: "normal", textAlign: "left" },
    { id: "labels", type: "text", x: 30, y: 90, w: 520, h: 40, field: "relationshipLabels", fontSize: 8, textAlign: "left" },
    { id: "name", type: "text", x: 30, y: 150, w: 520, h: 100, field: "name", fontSize: 20, fontWeight: "normal", fontFamily: "Pinyon Script", textAlign: "left" },
    { id: "quote", type: "text", x: 30, y: 270, w: 520, h: 280, field: "quote", fontSize: 9, fontStyle: "italic", textAlign: "left" },
    { id: "author", type: "text", x: 30, y: 560, w: 520, h: 30, field: "quoteAuthor", fontSize: 7, textAlign: "left" },
    { id: "birthDate", type: "text", x: 600, y: 350, w: 370, h: 40, field: "birthDate", fontSize: 9, textAlign: "right" },
    { id: "deathDate", type: "text", x: 600, y: 400, w: 370, h: 40, field: "deathDate", fontSize: 9, textAlign: "right" },
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
    { id: "photo", type: "image", x: 0, y: 0, w: 500, h: 1000, field: "photo", imageFit: "cover", useCrop: true },
    { id: "heading", type: "text", x: 510, y: 150, w: 460, h: 40, field: "heading", fontSize: 8, fontStyle: "italic", textAlign: "center" },
    { id: "line-top", type: "line", x: 510, y: 200, w: 460, h: 1, lineStyle: "1px solid #ccc" },
    { id: "name", type: "text", x: 510, y: 220, w: 460, h: 80, field: "name", fontSize: 18, fontWeight: "bold", textAlign: "center" },
    { id: "birthDate", type: "text", x: 510, y: 310, w: 460, h: 30, field: "birthDate", fontSize: 9, textAlign: "center" },
    { id: "deathDate", type: "text", x: 510, y: 345, w: 460, h: 30, field: "deathDate", fontSize: 9, textAlign: "center" },
    { id: "line-mid", type: "line", x: 510, y: 395, w: 460, h: 1, lineStyle: "1px solid #ccc" },
    { id: "quote", type: "text", x: 510, y: 420, w: 460, h: 150, field: "quote", fontSize: 8, fontStyle: "italic", textAlign: "center" },
    { id: "author", type: "text", x: 510, y: 580, w: 460, h: 30, field: "quoteAuthor", fontSize: 7, textAlign: "center" },
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
    { id: "photo", type: "image", x: 30, y: 30, w: 300, h: 470, field: "photo", imageFit: "cover", imageBorder: "1px solid #ddd", useCrop: true },
    { id: "name", type: "text", x: 380, y: 80, w: 580, h: 100, field: "name", fontSize: 16, fontVariant: "small-caps", fontWeight: "bold", letterSpacing: "2px", textAlign: "left" },
    { id: "birthDate", type: "text", x: 380, y: 200, w: 580, h: 30, field: "birthDate", fontSize: 9, textAlign: "center" },
    { id: "deathDate", type: "text", x: 380, y: 240, w: 580, h: 30, field: "deathDate", fontSize: 9, textAlign: "center" },
    { id: "quote", type: "text", x: 380, y: 520, w: 580, h: 230, field: "quote", fontSize: 8, fontVariant: "small-caps", letterSpacing: "1px", textAlign: "center" },
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
    { id: "ornament", type: "ornament", x: 20, y: 40, w: 130, h: 510, fixedAsset: "/assets/ornaments/cross-with-roses.png", imageFit: "contain" },
    { id: "name", type: "text", x: 170, y: 180, w: 380, h: 170, field: "name", fontSize: 18, textAlign: "center" },
    { id: "birthDate", type: "text", x: 170, y: 370, w: 380, h: 30, field: "birthDate", fontSize: 9, textAlign: "center" },
    { id: "birthPlace", type: "text", x: 170, y: 405, w: 380, h: 25, field: "locationBirth", fontSize: 8, textAlign: "center" },
    { id: "deathDate", type: "text", x: 170, y: 450, w: 380, h: 30, field: "deathDate", fontSize: 9, textAlign: "center" },
    { id: "deathPlace", type: "text", x: 170, y: 485, w: 380, h: 25, field: "locationDeath", fontSize: 8, textAlign: "center" },
    { id: "divider", type: "text", x: 170, y: 550, w: 380, h: 30, field: "dividerSymbol", fontSize: 9, color: "#cc0000", textAlign: "center" },
    { id: "photo", type: "image", x: 580, y: 40, w: 390, h: 660, field: "photo", imageFit: "cover", imageClip: "rounded", imageBorder: "1px solid #ddd", useCrop: true },
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
    { id: "cross", type: "ornament", x: 30, y: 50, w: 50, h: 150, fixedAsset: "/assets/ornaments/cross-simple.svg", imageFit: "contain" },
    { id: "line-top", type: "line", x: 80, y: 120, w: 360, h: 1, lineStyle: "1px solid #999" },
    { id: "name", type: "text", x: 100, y: 240, w: 340, h: 180, field: "name", fontSize: 20, fontWeight: "300", textAlign: "left" },
    { id: "birthDate", type: "text", x: 100, y: 440, w: 340, h: 30, field: "birthDate", fontSize: 9, textAlign: "left" },
    { id: "birthPlace", type: "text", x: 100, y: 475, w: 340, h: 25, field: "locationBirth", fontSize: 8, textAlign: "left" },
    { id: "deathDate", type: "text", x: 100, y: 520, w: 340, h: 30, field: "deathDate", fontSize: 9, textAlign: "left" },
    { id: "deathPlace", type: "text", x: 100, y: 555, w: 340, h: 25, field: "locationDeath", fontSize: 8, textAlign: "left" },
    { id: "line-bottom", type: "line", x: 30, y: 700, w: 410, h: 1, lineStyle: "1px solid #999" },
    { id: "photo", type: "image", x: 500, y: 80, w: 460, h: 680, field: "photo", imageFit: "cover", imageClip: "ellipse", useCrop: true },
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
    { id: "ornament", type: "ornament", x: 350, y: 20, w: 300, h: 130, fixedAsset: "/assets/ornaments/flower-outline.svg", imageFit: "contain" },
    { id: "quote", type: "text", x: 30, y: 200, w: 440, h: 550, field: "quote", fontSize: 8, fontStyle: "italic", textAlign: "left" },
    { id: "heading", type: "text", x: 530, y: 150, w: 430, h: 40, field: "heading", fontSize: 8, textAlign: "center" },
    { id: "name", type: "text", x: 530, y: 210, w: 430, h: 100, field: "name", fontSize: 18, fontWeight: "bold", textAlign: "center" },
    { id: "birthDate", type: "text", x: 530, y: 320, w: 430, h: 30, field: "birthDate", fontSize: 9, textAlign: "center" },
    { id: "deathDate", type: "text", x: 530, y: 355, w: 430, h: 30, field: "deathDate", fontSize: 9, textAlign: "center" },
    { id: "line", type: "line", x: 530, y: 410, w: 430, h: 1, lineStyle: "1px solid #ccc" },
    { id: "verse", type: "text", x: 530, y: 430, w: 430, h: 80, field: "closingVerse", fontSize: 8, fontStyle: "italic", textAlign: "center" },
    { id: "photo", type: "image", x: 650, y: 600, w: 300, h: 250, field: "photo", imageFit: "cover", useCrop: true },
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
