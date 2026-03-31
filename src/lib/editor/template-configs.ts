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

/** Sample data pre-filled when a template is selected — user replaces, never starts blank */
export interface PlaceholderData {
  heading?: string;
  name: string;
  birthDate: string;
  deathDate: string;
  quote?: string;
  quoteAuthor?: string;
  relationshipLabels?: string;
  closingVerse?: string;
  locationBirth?: string;
  locationDeath?: string;
  dividerSymbol?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
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
  placeholderData: PlaceholderData;
  placeholderPhotoSrc?: string;
  elements: TemplateElement[];
}

// ── TI 04: "Nur Text" (Sieglinde) ──

const TI04: TemplateConfig = {
  id: "TI04",
  name: "Klassisch Elegant",
  nameEn: "Classic Elegant",
  description: "Eleganter Zwei-Spalten-Text ohne Foto — zeitlose Typografie",
  descriptionEn: "Elegant two-column text without photo — timeless typography",
  referenceImage: "/docs/references/TI04.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["heading", "relationshipLabels", "name", "quote", "quoteAuthor", "birthDate", "deathDate"],
  requiresPhoto: false,
  thumbnail: { previewName: "Sieglinde Musterfrau", previewDates: "24. Juli 1952 – 28. September 2020" },
  placeholderData: {
    heading: "In liebevoller Erinnerung an",
    name: "Sieglinde Musterfrau",
    relationshipLabels: "Unsere liebe Mutter, Großmutter\nund Schwester",
    birthDate: "* 24. Juli 1952",
    deathDate: "† 28. September 2020",
    quote: "Was man tief in seinem Herzen besitzt,\nkann man nicht durch den Tod verlieren.",
    quoteAuthor: "Johann Wolfgang von Goethe",
  },
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
  name: "Foto & Gedenken",
  nameEn: "Photo & Memorial",
  description: "Großes Portraitfoto links, Gedenktext rechts — klassische Aufteilung",
  descriptionEn: "Large portrait photo left, memorial text right — classic layout",
  referenceImage: "/docs/references/TI05.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["heading", "name", "birthDate", "deathDate", "quote", "quoteAuthor"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-man.jpg",
  thumbnail: { previewName: "Brigitte Musterfrau", previewDates: "* 31. Juli 1950  † 20. Februar 2021", previewQuote: "Das schönste Denkmal..." },
  placeholderData: {
    heading: "In stillem Gedenken",
    name: "Brigitte Musterfrau",
    birthDate: "* 31. Juli 1950",
    deathDate: "† 20. Februar 2021",
    quote: "Das schönste Denkmal,\ndas ein Mensch bekommen kann,\nsteht in den Herzen\nder Mitmenschen.",
    quoteAuthor: "Albert Schweitzer",
  },
  elements: [
    { id: "photo", type: "image", x: 0, y: 0, w: 480, h: 1000, field: "photo", imageFit: "cover", useCrop: true },
    { id: "heading", type: "text", x: 530, y: 155, w: 420, h: 38, field: "heading", fontSize: 9, fontFamily: "Cormorant Garamond", fontStyle: "italic", textAlign: "center" },
    { id: "line-top", type: "line", x: 575, y: 225, w: 330, h: 1, lineStyle: "0.5px solid #999" },
    { id: "name", type: "text", x: 520, y: 260, w: 440, h: 95, field: "name", fontSize: 19, fontFamily: "Cormorant Garamond", fontWeight: "bold", textAlign: "center" },
    { id: "birthDate", type: "text", x: 530, y: 385, w: 420, h: 26, field: "birthDate", fontSize: 9, fontFamily: "Cormorant Garamond", textAlign: "center" },
    { id: "deathDate", type: "text", x: 530, y: 440, w: 420, h: 26, field: "deathDate", fontSize: 9, fontFamily: "Cormorant Garamond", textAlign: "center" },
    { id: "line-mid", type: "line", x: 575, y: 510, w: 330, h: 1, lineStyle: "0.5px solid #999" },
    { id: "quote", type: "text", x: 530, y: 540, w: 420, h: 200, field: "quote", fontSize: 9, fontFamily: "Cormorant Garamond", fontStyle: "italic", textAlign: "center" },
    { id: "author", type: "text", x: 530, y: 770, w: 420, h: 30, field: "quoteAuthor", fontSize: 7.5, fontFamily: "Cormorant Garamond", textAlign: "center" },
  ],
};

// ── TI 06: "L-Form" (Thilde) ──

const TI06: TemplateConfig = {
  id: "TI06",
  name: "Portrait & Spruch",
  nameEn: "Portrait & Verse",
  description: "Foto mit Rahmen oben-links, Name in Kapitälchen, Spruch unten",
  descriptionEn: "Framed photo top-left, name in small caps, verse below",
  referenceImage: "/docs/references/TI06.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "deathDate", "quote"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-woman.png",
  thumbnail: { previewName: "Thilde Muster", previewDates: "* 4.6.1942  † 6.1.2021", previewQuote: "Man sieht die Sonne..." },
  placeholderData: {
    name: "Thilde Muster",
    birthDate: "* 4. Juni 1942",
    deathDate: "† 6. Januar 2021",
    quote: "Man sieht die Sonne langsam untergehen\nund erschrickt doch,\nwenn es plötzlich dunkel ist.",
  },
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
  name: "Kreuz & Rose",
  nameEn: "Cross & Rose",
  description: "Rosenkreuz-Ornament links, Gedenktext Mitte, Foto rechts",
  descriptionEn: "Rose cross ornament left, memorial text center, photo right",
  referenceImage: "/docs/references/TI07.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath", "dividerSymbol"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-woman.png",
  thumbnail: { previewName: "Franziska Muster", previewDates: "* 1.12.1954  † 23.1.2021" },
  placeholderData: {
    name: "Franziska Muster",
    birthDate: "* 1. Dezember 1954",
    deathDate: "† 23. Januar 2021",
    locationBirth: "in München",
    locationDeath: "in München",
    dividerSymbol: "✦ ✦ ✦",
  },
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
  name: "Ovales Portrait",
  nameEn: "Oval Portrait",
  description: "Schlichtes Kreuz mit Linien, ovales Foto rechts — feierlich",
  descriptionEn: "Simple cross with lines, oval photo right — solemn",
  referenceImage: "/docs/references/TI08.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-woman.png",
  thumbnail: { previewName: "Erna Musterfrau", previewDates: "* 1.12.1934  † 20.1.2021" },
  placeholderData: {
    name: "Erna Musterfrau",
    birthDate: "* 1. Dezember 1934",
    deathDate: "† 20. Januar 2021",
    locationBirth: "in Wien",
    locationDeath: "in Salzburg",
  },
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
  name: "Blumen & Vers",
  nameEn: "Flowers & Verse",
  description: "Blumenornament, Gedicht links, Foto und Gedenken rechts",
  descriptionEn: "Floral ornament, poem left, photo and memorial right",
  referenceImage: "/docs/references/TI09.jpg",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["heading", "name", "birthDate", "deathDate", "closingVerse", "quote"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-woman.png",
  thumbnail: { previewName: "Renate Musterfrau", previewDates: "* 6.5.1933  † 3.2.2021", previewQuote: "Du siehst den Garten..." },
  placeholderData: {
    heading: "In liebevoller Erinnerung",
    name: "Renate Musterfrau",
    birthDate: "* 6. Mai 1933",
    deathDate: "† 3. Februar 2021",
    quote: "Du siehst den Garten nicht mehr grünen,\nin dem du gerne still gesessen.\nDoch wir, die um dich weinen,\nwerden dich nie vergessen.",
    closingVerse: "Ruhe in Frieden",
  },
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

// ── TE: Trauerkarte Single ──

const TE01: TemplateConfig = {
  id: "TE01",
  name: "Klassische Trauerkarte",
  nameEn: "Classic Sympathy Card",
  description: "Schlichte Trauerkarte mit Gedenktext — ohne Foto",
  descriptionEn: "Simple sympathy card with memorial text — no photo",
  referenceImage: "",
  cardType: "trauerkarte",
  cardFormat: "single",
  spreadWidthMm: 185,
  spreadHeightMm: 115,
  requiredFields: ["heading", "name", "birthDate", "deathDate", "quote"],
  requiresPhoto: false,
  thumbnail: { previewName: "Hans Muster", previewDates: "* 15. März 1940 – † 10. Januar 2021" },
  placeholderData: {
    heading: "In stiller Trauer nehmen wir Abschied von",
    name: "Hans Muster",
    birthDate: "* 15. März 1940",
    deathDate: "† 10. Januar 2021",
    quote: "Wer im Gedächtnis seiner Lieben lebt,\nder ist nicht tot, der ist nur fern.\nTot ist nur, wer vergessen wird.",
    quoteAuthor: "Immanuel Kant",
  },
  elements: [
    { id: "heading", type: "text", x: 50, y: 80, w: 900, h: 60, field: "heading", fontSize: 11, fontStyle: "italic", textAlign: "center", letterSpacing: "0.5px" },
    { id: "name", type: "text", x: 50, y: 200, w: 900, h: 140, field: "name", fontSize: 26, fontWeight: "bold", fontFamily: "Cormorant Garamond", textAlign: "center" },
    { id: "birthDate", type: "text", x: 200, y: 380, w: 600, h: 35, field: "birthDate", fontSize: 10, textAlign: "center" },
    { id: "deathDate", type: "text", x: 200, y: 425, w: 600, h: 35, field: "deathDate", fontSize: 10, textAlign: "center" },
    { id: "line", type: "line", x: 350, y: 500, w: 300, h: 1, lineStyle: "0.5px solid #999" },
    { id: "quote", type: "text", x: 100, y: 540, w: 800, h: 280, field: "quote", fontSize: 9.5, fontStyle: "italic", textAlign: "center" },
    { id: "author", type: "text", x: 200, y: 850, w: 600, h: 30, field: "quoteAuthor", fontSize: 8, textAlign: "center" },
  ],
};

const TE02: TemplateConfig = {
  id: "TE02",
  name: "Trauerkarte mit Foto",
  nameEn: "Sympathy Card with Photo",
  description: "Foto links, Gedenktext rechts — persönlich und würdevoll",
  descriptionEn: "Photo left, memorial text right — personal and dignified",
  referenceImage: "",
  cardType: "trauerkarte",
  cardFormat: "single",
  spreadWidthMm: 185,
  spreadHeightMm: 115,
  requiredFields: ["heading", "name", "birthDate", "deathDate", "quote"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-man.jpg",
  thumbnail: { previewName: "Friedrich Muster", previewDates: "* 8. April 1938 – † 5. Februar 2021" },
  placeholderData: {
    heading: "In liebevoller Erinnerung an",
    name: "Friedrich Muster",
    birthDate: "* 8. April 1938",
    deathDate: "† 5. Februar 2021",
    quote: "Der Tod ist nicht das Ende,\nsondern der Anfang vom Leben.",
    quoteAuthor: "",
  },
  elements: [
    { id: "photo", type: "image", x: 0, y: 0, w: 400, h: 1000, field: "photo", imageFit: "cover", useCrop: true },
    { id: "heading", type: "text", x: 440, y: 100, w: 520, h: 50, field: "heading", fontSize: 10, fontStyle: "italic", textAlign: "center" },
    { id: "line-top", type: "line", x: 490, y: 175, w: 420, h: 1, lineStyle: "0.5px solid #999" },
    { id: "name", type: "text", x: 430, y: 210, w: 540, h: 120, field: "name", fontSize: 22, fontWeight: "bold", fontFamily: "Cormorant Garamond", textAlign: "center" },
    { id: "birthDate", type: "text", x: 440, y: 370, w: 520, h: 35, field: "birthDate", fontSize: 9.5, textAlign: "center" },
    { id: "deathDate", type: "text", x: 440, y: 415, w: 520, h: 35, field: "deathDate", fontSize: 9.5, textAlign: "center" },
    { id: "line-bottom", type: "line", x: 490, y: 490, w: 420, h: 1, lineStyle: "0.5px solid #999" },
    { id: "quote", type: "text", x: 440, y: 520, w: 520, h: 280, field: "quote", fontSize: 9.5, fontStyle: "italic", textAlign: "center" },
  ],
};

// ── TD: Dankkarte Single (same layouts as Trauerkarte) ──

const TD01: TemplateConfig = {
  ...TE01,
  id: "TD01",
  name: "Klassische Dankeskarte",
  nameEn: "Classic Thank-you Card",
  description: "Schlichte Dankeskarte für die Anteilnahme",
  descriptionEn: "Simple thank-you card for condolences",
  cardType: "dankkarte",
  placeholderData: {
    heading: "Danksagung",
    name: "Familie Muster",
    birthDate: "",
    deathDate: "",
    quote: "Für die vielen Zeichen der Anteilnahme,\ndie tröstenden Worte und die stille Begleitung\nin unserer schweren Zeit\nbedanken wir uns von Herzen.",
    quoteAuthor: "",
  },
};

const TD02: TemplateConfig = {
  ...TE02,
  id: "TD02",
  name: "Dankeskarte mit Foto",
  nameEn: "Thank-you Card with Photo",
  description: "Dankeskarte mit Foto — persönlich und herzlich",
  descriptionEn: "Thank-you card with photo — personal and heartfelt",
  cardType: "dankkarte",
  placeholderData: {
    heading: "Herzlichen Dank",
    name: "Familie Muster",
    birthDate: "",
    deathDate: "",
    quote: "Für die liebevolle Anteilnahme,\ndie Blumen und Spenden\nsagen wir herzlichen Dank.",
    quoteAuthor: "",
  },
};

// ── All Configs ──

export const ALL_TEMPLATE_CONFIGS: TemplateConfig[] = [TI04, TI05, TI06, TI07, TI08, TI09, TE01, TE02, TD01, TD02];

export function getTemplateConfig(id: string): TemplateConfig | null {
  return ALL_TEMPLATE_CONFIGS.find((c) => c.id === id) ?? null;
}

export function getTemplateConfigsForCard(cardType: CardType, cardFormat: CardFormat | null): TemplateConfig[] {
  return ALL_TEMPLATE_CONFIGS.filter(
    (c) => c.cardType === cardType && (cardFormat === null || c.cardFormat === cardFormat)
  );
}
