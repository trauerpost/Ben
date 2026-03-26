import type { CardType, CardFormat } from "./wizard-state";

// ── Template Slot Types ──

export type SlotType = "photo" | "text" | "decoration";

export interface TemplateSlot {
  id: string;
  type: SlotType;
  gridArea: string;
  placeholder: string;
  textFields?: string[];
  textAlign?: "left" | "center" | "right";  // per-slot override; renderer uses slot.textAlign ?? textContent.textAlign
  styleOverrides?: Record<string, { weight?: string; style?: string; transform?: string }>;
  includePhoto?: boolean;      // T6: text slot with small photo at bottom
  photoMaxHeight?: string;     // e.g., "30%"
}

export interface PanelTemplate {
  panelId: "front" | "back" | "inside-left" | "inside-right" | "spread";
  gridTemplateRows: string;
  gridTemplateColumns: string;
  defaultBackground: "white" | "image";
  slots: TemplateSlot[];
}

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  cardTypes: CardType[];
  cardFormat: CardFormat;
  renderMode: "spread" | "pages";  // spread = single page, pages = multi-page
  panels: PanelTemplate[];
}

// ── Templates ──

const TEMPLATE_S1: CardTemplate = {
  id: "S1",
  name: "Klassisch",
  description: "Dekoration + Text links, Foto + Spruch rechts",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "80px 1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "front-deco", type: "decoration", gridArea: "1 / 1 / 2 / 2", placeholder: "Dekoration" },
        { id: "front-text", type: "text", gridArea: "2 / 1 / 3 / 2", placeholder: "[Name & Daten]", textFields: ["heading", "name", "dates", "dividerSymbol"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "7fr 3fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "back-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
        { id: "back-quote", type: "text", gridArea: "2 / 1 / 3 / 2", placeholder: "[Spruch]", textFields: ["quote"] },
      ],
    },
  ],
};

const TEMPLATE_S2: CardTemplate = {
  id: "S2",
  name: "Foto Links",
  description: "Großes Foto links, Name & Daten rechts",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr 1fr",
      defaultBackground: "white",
      slots: [
        { id: "front-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
        { id: "front-text", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Name & Daten]", textFields: ["heading", "name", "dates"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "back-quote", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Spruch]", textFields: ["quote"] },
      ],
    },
  ],
};

const TEMPLATE_S3: CardTemplate = {
  id: "S3",
  name: "Foto + Text",
  description: "Kleines Foto links, Text rechts mit Spruch",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "2fr 3fr",
      defaultBackground: "white",
      slots: [
        { id: "front-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
        { id: "front-text", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Name, Daten & Spruch]", textFields: ["name", "dates", "dividerSymbol", "quote"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "back-text", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Spruch]", textFields: ["quote"] },
      ],
    },
  ],
};

const TEMPLATE_S4: CardTemplate = {
  id: "S4",
  name: "Nur Text",
  description: "Kein Foto — nur Text und Spruch",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "auto 1fr auto",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "front-heading", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Überschrift]", textFields: ["heading"] },
        { id: "front-main", type: "text", gridArea: "2 / 1 / 3 / 2", placeholder: "[Name & Spruch]", textFields: ["name", "quote"] },
        { id: "front-dates", type: "text", gridArea: "3 / 1 / 4 / 2", placeholder: "[Daten]", textFields: ["dates"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "back-quote", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Spruch]", textFields: ["quote"] },
      ],
    },
  ],
};

const TEMPLATE_E1: CardTemplate = {
  id: "E1",
  name: "Einfach Klassisch",
  description: "Hintergrundbild vorne, Text hinten",
  cardTypes: ["trauerkarte", "dankkarte"],
  cardFormat: "single",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "image",
      slots: [],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "back-text", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Name, Daten & Spruch]", textFields: ["heading", "name", "dates", "dividerSymbol", "quote"] },
      ],
    },
  ],
};

const TEMPLATE_E2: CardTemplate = {
  id: "E2",
  name: "Einfach mit Foto",
  description: "Foto + Text vorne, Spruch hinten",
  cardTypes: ["trauerkarte", "dankkarte"],
  cardFormat: "single",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "2fr 3fr",
      defaultBackground: "white",
      slots: [
        { id: "front-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
        { id: "front-text", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Name & Daten]", textFields: ["heading", "name", "dates"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "back-quote", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Spruch]", textFields: ["quote"] },
      ],
    },
  ],
};

const TEMPLATE_F1: CardTemplate = {
  id: "F1",
  name: "Klassisch Gefaltet",
  description: "Hintergrundbild + Foto + Text + Spruch",
  cardTypes: ["trauerkarte", "dankkarte"],
  cardFormat: "folded",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "image",
      slots: [],
    },
    {
      panelId: "inside-left",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "il-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
      ],
    },
    {
      panelId: "inside-right",
      gridTemplateRows: "80px 1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "ir-deco", type: "decoration", gridArea: "1 / 1 / 2 / 2", placeholder: "Dekoration" },
        { id: "ir-text", type: "text", gridArea: "2 / 1 / 3 / 2", placeholder: "[Name, Daten & Spruch]", textFields: ["heading", "name", "dates", "dividerSymbol", "quote"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [],
    },
  ],
};

const TEMPLATE_F2: CardTemplate = {
  id: "F2",
  name: "Modern Gefaltet",
  description: "Foto + Name links, Text rechts",
  cardTypes: ["trauerkarte", "dankkarte"],
  cardFormat: "folded",
  renderMode: "pages",
  panels: [
    {
      panelId: "front",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "image",
      slots: [],
    },
    {
      panelId: "inside-left",
      gridTemplateRows: "3fr 1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "il-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
        { id: "il-name", type: "text", gridArea: "2 / 1 / 3 / 2", placeholder: "[Name]", textFields: ["name", "dates"] },
      ],
    },
    {
      panelId: "inside-right",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [
        { id: "ir-text", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Spruch]", textFields: ["heading", "quote"] },
      ],
    },
    {
      panelId: "back",
      gridTemplateRows: "1fr",
      gridTemplateColumns: "1fr",
      defaultBackground: "white",
      slots: [],
    },
  ],
};

// ── NEW: Spread Templates T1-T6 (Innenseiten — single page spread 140×105mm) ──

const TEMPLATE_T1: CardTemplate = {
  id: "T1",
  name: "Zwei-Spalten Text",
  description: "Nur Text — linke Spalte Text, rechte Spalte Daten (TI 04)",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "spread",
  panels: [{
    panelId: "spread",
    gridTemplateRows: "1fr",
    gridTemplateColumns: "60% 40%",
    defaultBackground: "white",
    slots: [
      { id: "left-text", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Name & Spruch]",
        textFields: ["heading", "relationshipLabels", "name", "quote", "quoteAuthor"],
        textAlign: "left" },
      { id: "right-dates", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Daten]",
        textFields: ["birthDate", "deathDate"],
        textAlign: "right" },
    ],
  }],
};

const TEMPLATE_T2: CardTemplate = {
  id: "T2",
  name: "Foto Links",
  description: "Großes Foto links, Name & Daten rechts (TI 05)",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "spread",
  panels: [{
    panelId: "spread",
    gridTemplateRows: "1fr",
    gridTemplateColumns: "1fr 1fr",
    defaultBackground: "white",
    slots: [
      { id: "left-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
      { id: "right-text", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Name & Daten]",
        textFields: ["name", "birthDate", "deathDate"] },
    ],
  }],
};

const TEMPLATE_T3: CardTemplate = {
  id: "T3",
  name: "L-Form",
  description: "Foto oben-links, Name oben-rechts, Spruch unten (TI 06)",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "spread",
  panels: [{
    panelId: "spread",
    gridTemplateRows: "3fr 2fr",
    gridTemplateColumns: "2fr 3fr",
    defaultBackground: "white",
    slots: [
      { id: "top-left-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
      { id: "top-right-text", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Name & Daten]",
        textFields: ["name", "birthDate", "deathDate"],
        styleOverrides: { name: { transform: "uppercase", weight: "bold" } } },
      { id: "bottom-quote", type: "text", gridArea: "2 / 1 / 3 / 3", placeholder: "[Spruch]",
        textFields: ["quote"],
        styleOverrides: { quote: { transform: "uppercase", style: "normal" } } },
    ],
  }],
};

const TEMPLATE_T4: CardTemplate = {
  id: "T4",
  name: "Drei-Spalten",
  description: "Symbol links, Text Mitte, Foto rechts (TI 07)",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "spread",
  panels: [{
    panelId: "spread",
    gridTemplateRows: "1fr",
    gridTemplateColumns: "15% 55% 30%",
    defaultBackground: "white",
    slots: [
      { id: "left-ornament", type: "decoration", gridArea: "1 / 1 / 2 / 2", placeholder: "Symbol" },
      { id: "center-text", type: "text", gridArea: "1 / 2 / 2 / 3", placeholder: "[Name & Daten]",
        textFields: ["name", "birthDate", "locationBirth", "deathDate", "locationDeath", "dividerSymbol"] },
      { id: "right-photo", type: "photo", gridArea: "1 / 3 / 2 / 4", placeholder: "Foto hier" },
    ],
  }],
};

const TEMPLATE_T5: CardTemplate = {
  id: "T5",
  name: "Portrait-Fokus",
  description: "Foto + Name links, Spruch rechts (TI 08)",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "spread",
  panels: [{
    panelId: "spread",
    gridTemplateRows: "7fr 3fr",
    gridTemplateColumns: "40% 60%",
    defaultBackground: "white",
    slots: [
      { id: "left-photo", type: "photo", gridArea: "1 / 1 / 2 / 2", placeholder: "Foto hier" },
      { id: "left-name", type: "text", gridArea: "2 / 1 / 3 / 2", placeholder: "[Name & Daten]",
        textFields: ["name", "birthDate", "deathDate"] },
      { id: "right-quote", type: "text", gridArea: "1 / 2 / 3 / 3", placeholder: "[Spruch]",
        textFields: ["quote"],
        styleOverrides: { quote: { style: "italic" } } },
    ],
  }],
};

const TEMPLATE_T6: CardTemplate = {
  id: "T6",
  name: "Ornamental Symmetrisch",
  description: "Spruch links, Symbol Mitte, Text + Foto rechts (TI 09)",
  cardTypes: ["sterbebild"],
  cardFormat: "single",
  renderMode: "spread",
  panels: [{
    panelId: "spread",
    gridTemplateRows: "1fr",
    gridTemplateColumns: "42% 16% 42%",
    defaultBackground: "white",
    slots: [
      { id: "left-quote", type: "text", gridArea: "1 / 1 / 2 / 2", placeholder: "[Spruch]",
        textFields: ["quote"],
        styleOverrides: { quote: { style: "italic" } } },
      { id: "center-ornament", type: "decoration", gridArea: "1 / 2 / 2 / 3", placeholder: "Symbol" },
      { id: "right-content", type: "text", gridArea: "1 / 3 / 2 / 4", placeholder: "[Name, Daten & Gebet]",
        textFields: ["heading", "name", "birthDate", "deathDate", "dividerSymbol", "closingVerse"],
        includePhoto: true, photoMaxHeight: "30%" },
    ],
  }],
};

// ── All Templates ──

export const ALL_TEMPLATES: CardTemplate[] = [
  TEMPLATE_S1, TEMPLATE_S2, TEMPLATE_S3, TEMPLATE_S4,
  TEMPLATE_E1, TEMPLATE_E2,
  TEMPLATE_F1, TEMPLATE_F2,
  TEMPLATE_T1, TEMPLATE_T2, TEMPLATE_T3, TEMPLATE_T4, TEMPLATE_T5, TEMPLATE_T6,
];

export function getTemplatesForCard(cardType: CardType, cardFormat: CardFormat | null): CardTemplate[] {
  return ALL_TEMPLATES.filter(
    (t) => t.cardTypes.includes(cardType) && (cardFormat === null || t.cardFormat === cardFormat)
  );
}

export function getTemplateById(id: string): CardTemplate | null {
  return ALL_TEMPLATES.find((t) => t.id === id) ?? null;
}
