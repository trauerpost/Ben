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

// ── All Templates ──

export const ALL_TEMPLATES: CardTemplate[] = [
  TEMPLATE_S1, TEMPLATE_S2, TEMPLATE_S3, TEMPLATE_S4,
  TEMPLATE_E1, TEMPLATE_E2,
  TEMPLATE_F1, TEMPLATE_F2,
];

export function getTemplatesForCard(cardType: CardType, cardFormat: CardFormat | null): CardTemplate[] {
  return ALL_TEMPLATES.filter(
    (t) => t.cardTypes.includes(cardType) && (cardFormat === null || t.cardFormat === cardFormat)
  );
}

export function getTemplateById(id: string): CardTemplate | null {
  return ALL_TEMPLATES.find((t) => t.id === id) ?? null;
}
