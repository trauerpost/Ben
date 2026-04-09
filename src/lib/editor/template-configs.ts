import type { CardType, CardFormat } from "./wizard-state";

// ── Schema ──

export type ElementType = "text" | "image" | "line" | "ornament";

export interface TemplateElement {
  id: string;
  type: ElementType;
  page?: string;        // which page this element belongs to ("front" | "back" etc). Default: "front"
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
  lineHeight?: number;
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
  referenceImage: "",
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
    { id: "cover-photo", page: "outside-spread", type: "image", x: 0, y: 0, w: 1000, h: 1000, fixedAsset: "/TREE.jpg", imageFit: "cover" },
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
  referenceImage: "",
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
    quoteAuthor: "(Albert Schweitzer)",
  },
  elements: [
    { id: "cover-photo", page: "outside-spread", type: "image", x: 0, y: 0, w: 1000, h: 1000, fixedAsset: "/TREE.jpg", imageFit: "cover" },
    // Front page: photo fills entire page
    { id: "photo", page: "front", type: "image", x: 0, y: 0, w: 1000, h: 1000, field: "photo", imageFit: "cover", useCrop: true },
    // Back page: portrait 70×105mm. Grid-calibrated round 2.
    // Fixes: heading up 40, lines wider x=150 w=700, quote down, author down, quote lineHeight up
    { id: "heading", page: "back", type: "text", x: 100, y: 190, w: 800, h: 30, field: "heading", fontSize: 11, fontFamily: "Inter", fontStyle: "italic", textAlign: "center", color: "#000000" },
    { id: "line-top", page: "back", type: "line", x: 150, y: 250, w: 700, h: 1, lineStyle: "0.5px solid #000000" },
    { id: "name", page: "back", type: "text", x: 20, y: 260, w: 960, h: 100, field: "name", fontSize: 24, fontFamily: "Inter", fontWeight: "300", textAlign: "center", color: "#000000" },
    { id: "birthDate", page: "back", type: "text", x: 100, y: 380, w: 800, h: 25, field: "birthDate", fontSize: 12, fontFamily: "Inter", textAlign: "center", color: "#000000" },
    { id: "deathDate", page: "back", type: "text", x: 100, y: 420, w: 800, h: 25, field: "deathDate", fontSize: 12, fontFamily: "Inter", textAlign: "center", color: "#000000" },
    { id: "line-mid", page: "back", type: "line", x: 150, y: 490, w: 700, h: 1, lineStyle: "0.5px solid #000000" },
    { id: "quote", page: "back", type: "text", x: 80, y: 545, w: 840, h: 160, field: "quote", fontSize: 12, fontFamily: "Inter", fontStyle: "italic", textAlign: "center", lineHeight: 1.5, color: "#000000" },
    { id: "author", page: "back", type: "text", x: 100, y: 765, w: 800, h: 25, field: "quoteAuthor", fontSize: 11, fontFamily: "Inter", fontStyle: "italic", textAlign: "center", color: "#000000" },
  ],
};

// ── TI 06: "L-Form" (Thilde) ──

const TI06: TemplateConfig = {
  id: "TI06",
  name: "Portrait & Spruch",
  nameEn: "Portrait & Verse",
  description: "Foto mit Rahmen links, Name in Kapitälchen, Spruch rechts",
  descriptionEn: "Bordered photo left, name in small caps, verse right",
  referenceImage: "",
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
    birthDate: "* 4.6.1942",
    deathDate: "† 6.1.2021",
    quote: "Man sieht die Sonne\nlangsam untergehen\nund erschrickt dennoch,\ndass es plötzlich dunkel ist.",
  },
  elements: [
    { id: "cover-photo", page: "outside-spread", type: "image", x: 0, y: 0, w: 1000, h: 1000, fixedAsset: "/TREE.jpg", imageFit: "cover" },
    // Front page: photo left ~35%, text right, quote bottom — ref T6.jpeg L-form layout
    { id: "photo", page: "front", type: "image", x: 20, y: 20, w: 350, h: 500, field: "photo", imageFit: "cover", imageBorder: "1px solid #ddd", useCrop: true },
    { id: "name", page: "front", type: "text", x: 400, y: 80, w: 550, h: 80, field: "name", fontSize: 28, fontFamily: "Playfair Display SC", fontWeight: "normal", letterSpacing: "6px", textAlign: "left", color: "#000000" },
    { id: "birthDate", page: "front", type: "text", x: 400, y: 160, w: 550, h: 25, field: "birthDate", fontSize: 12, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "deathDate", page: "front", type: "text", x: 400, y: 195, w: 550, h: 25, field: "deathDate", fontSize: 12, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "quote", page: "front", type: "text", x: 20, y: 550, w: 930, h: 400, field: "quote", fontSize: 12, fontFamily: "Inter", fontVariant: "small-caps", letterSpacing: "1px", textAlign: "center", lineHeight: 1.9, color: "#000000" },
  ],
};

// ── TI 07: "Drei-Zonen" (Franziska) ──

const TI07: TemplateConfig = {
  id: "TI07",
  name: "Kreuz & Rose",
  nameEn: "Cross & Rose",
  description: "Rosenkreuz-Ornament links, Gedenktext Mitte, Foto rechts",
  descriptionEn: "Rose cross ornament left, memorial text center, photo right",
  referenceImage: "",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath", "dividerSymbol"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-man-2.jpg",
  thumbnail: { previewName: "Franziska Muster", previewDates: "* 1.12.1954  † 23.1.2021" },
  placeholderData: {
    name: "Franziska\nMuster",
    birthDate: "* 1.12.1954",
    deathDate: "† 23.1.2021",
    locationBirth: "in Starnberg",
    locationDeath: "in Augsburg",
    dividerSymbol: "✦  ✦  ✦",
  },
  elements: [
    { id: "cover-photo", page: "outside-spread", type: "image", x: 0, y: 0, w: 1000, h: 1000, fixedAsset: "/TREE.jpg", imageFit: "cover" },
    // Front page (left half of spread): ornament + name + dates
    // Ref grid: ornament x=5-18% y=3-82%, name x=25% y=20%, dates x=28% y=48-62%, divider y=83%
    // Gemini-measured positions from reference grid (×10 for 0-1000):
    // ornament x=26-59% y=18-86%, name x=53-91% y=41-54%, dates x=62% y=59-77%, divider x=68-76% y=86-88%
    // Measured diffs: all text ~6% too left. Shift RIGHT by +60 grid units.
    // Ornament w too narrow (13 vs 33). Widen container.
    // REF: ornament x=15 y=10, name x=46 y=35, birth x=56 y=55, death x=56 y=67, stars x=63 y=84
    { id: "ornament", page: "front", type: "ornament", x: 10, y: 10, w: 500, h: 820, fixedAsset: "/assets/ornaments/cross-rose-vine.png", imageFit: "contain" },
    { id: "name", page: "front", type: "text", x: 420, y: 310, w: 530, h: 160, field: "name", fontSize: 38, fontFamily: "Inter", fontWeight: "300", textAlign: "left", color: "#000000" },
    { id: "birthDate", page: "front", type: "text", x: 510, y: 510, w: 380, h: 35, field: "birthDate", fontSize: 15, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "birthPlace", page: "front", type: "text", x: 510, y: 555, w: 380, h: 30, field: "locationBirth", fontSize: 13, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "deathDate", page: "front", type: "text", x: 510, y: 630, w: 380, h: 35, field: "deathDate", fontSize: 15, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "deathPlace", page: "front", type: "text", x: 510, y: 675, w: 380, h: 30, field: "locationDeath", fontSize: 13, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "divider", page: "front", type: "text", x: 560, y: 830, w: 180, h: 25, field: "dividerSymbol", fontSize: 14, fontWeight: "bold", color: "#000000", textAlign: "center" },
    // Back page (right half of spread): photo with visible padding + rounded corners
    // REF measured: x=27 y=23 w=61 h=60. Current build was too big/top-left.
    { id: "photo", page: "back", type: "image", x: 150, y: 140, w: 700, h: 670, field: "photo", imageFit: "cover", imageClip: "rounded", imageBorder: "1px solid #ddd", useCrop: true },
  ],
};

// ── TI 08: "Oval-Spiegel" (Erna) ──

const TI08: TemplateConfig = {
  id: "TI08",
  name: "Ovales Portrait",
  nameEn: "Oval Portrait",
  description: "Schlichtes Kreuz mit Linien, ovales Foto rechts — feierlich",
  descriptionEn: "Simple cross with lines, oval photo right — solemn",
  referenceImage: "",
  cardType: "sterbebild",
  cardFormat: "single",
  spreadWidthMm: 140,
  spreadHeightMm: 105,
  requiredFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath"],
  requiresPhoto: true,
  placeholderPhotoSrc: "/assets/photos/placeholder-man-2.jpg",
  thumbnail: { previewName: "Erna Musterfrau", previewDates: "* 1.12.1934  † 20.1.2021" },
  placeholderData: {
    name: "Erna\nMusterfrau",
    birthDate: "* 1. 12. 1934",
    deathDate: "† 20. 1. 2021",
    locationBirth: "in Starnberg",
    locationDeath: "in Augsburg",
  },
  elements: [
    { id: "cover-photo", page: "outside-spread", type: "image", x: 0, y: 0, w: 1000, h: 1000, fixedAsset: "/TREE.jpg", imageFit: "cover" },
    // REF: cross x=16 y=12 w=23 h=76, name x=37-51 y=37-45, birth x=49 y=57, death x=49 y=68
    // Fixes: cross taller (h=45→76), name right (x+150), name up (y-60), death up (y-50)
    { id: "cross", page: "front", type: "ornament", x: 60, y: 10, w: 250, h: 950, fixedAsset: "/assets/ornaments/cross-simple-thin.png", imageFit: "contain" },
    { id: "name", page: "front", type: "text", x: 330, y: 310, w: 640, h: 200, field: "name", fontSize: 42, fontFamily: "Inter", fontWeight: "300", textAlign: "left", color: "#000000" },
    { id: "birthDate", page: "front", type: "text", x: 450, y: 540, w: 400, h: 35, field: "birthDate", fontSize: 16, fontFamily: "Inter", fontWeight: "bold", textAlign: "left", color: "#000000" },
    { id: "birthPlace", page: "front", type: "text", x: 450, y: 590, w: 370, h: 30, field: "locationBirth", fontSize: 14, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    { id: "deathDate", page: "front", type: "text", x: 450, y: 660, w: 400, h: 35, field: "deathDate", fontSize: 16, fontFamily: "Inter", fontWeight: "bold", textAlign: "left", color: "#000000" },
    { id: "deathPlace", page: "front", type: "text", x: 450, y: 710, w: 370, h: 30, field: "locationDeath", fontSize: 14, fontFamily: "Inter", textAlign: "left", color: "#000000" },
    // REF: photo x=17 y=15 w=74 h=70. BUILD was x=21 y=13 w=65 h=78 → widen, shorten
    { id: "photo", page: "back", type: "image", x: 100, y: 100, w: 800, h: 750, field: "photo", imageFit: "cover", imageClip: "ellipse", useCrop: true },
  ],
};

// ── TI 09: "Floral Symmetrisch" (Renate) ──

const TI09: TemplateConfig = {
  id: "TI09",
  name: "Blumen & Vers",
  nameEn: "Flowers & Verse",
  description: "Blumenornament, Gedicht links, Foto und Gedenken rechts",
  descriptionEn: "Floral ornament, poem left, photo and memorial right",
  referenceImage: "",
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
    { id: "cover-photo", page: "outside-spread", type: "image", x: 0, y: 0, w: 1000, h: 1000, fixedAsset: "/TREE.jpg", imageFit: "cover" },
    { id: "ornament", type: "ornament", x: 350, y: 25, w: 300, h: 75, page: "front", fixedAsset: "/assets/ornaments/floral-divider.svg", imageFit: "contain" },
    { id: "heading", type: "text", x: 100, y: 130, w: 800, h: 40, page: "front", field: "heading", fontSize: 9, fontStyle: "italic", textAlign: "center", letterSpacing: "0.5px" },
    { id: "name", type: "text", x: 100, y: 190, w: 800, h: 100, page: "front", field: "name", fontSize: 19, fontWeight: "bold", textAlign: "center" },
    { id: "birthDate", type: "text", x: 100, y: 335, w: 800, h: 30, page: "front", field: "birthDate", fontSize: 9, textAlign: "center" },
    { id: "deathDate", type: "text", x: 100, y: 372, w: 800, h: 30, page: "front", field: "deathDate", fontSize: 9, textAlign: "center" },
    { id: "quote", type: "text", x: 55, y: 100, w: 890, h: 730, page: "back", field: "quote", fontSize: 8.5, fontStyle: "italic", textAlign: "left" },
    { id: "line", type: "line", x: 200, y: 430, w: 600, h: 1, page: "back", lineStyle: "0.5px solid #bbb" },
    { id: "verse", type: "text", x: 100, y: 450, w: 800, h: 105, page: "back", field: "closingVerse", fontSize: 8.5, fontStyle: "italic", textAlign: "center" },
    { id: "photo", type: "image", x: 250, y: 590, w: 500, h: 360, page: "front", field: "photo", imageFit: "cover", imageClip: "rounded", useCrop: true },
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
