import type { CardType, TextContent } from "./wizard-state";

export interface TextTemplate {
  label: string;
  textContent: Partial<TextContent>;
}

export const TEXT_TEMPLATES: Record<CardType, TextTemplate[]> = {
  sterbebild: [
    {
      label: "Klassisch",
      textContent: {
        heading: "In liebevoller Erinnerung an",
        name: "[Name]",
        dates: "* [Geburtsdatum]    † [Sterbedatum]",
        dividerSymbol: "✦ ✦ ✦",
        quote: "[Gebet oder Spruch]",
      },
    },
    {
      label: "Schlicht",
      textContent: {
        heading: "",
        name: "[Name]",
        dates: "[Geburtsdatum] – [Sterbedatum]",
        dividerSymbol: "",
        quote: "",
      },
    },
    {
      label: "Mit Spruch",
      textContent: {
        heading: "In stillem Gedenken",
        name: "[Name]",
        dates: "* [Geburtsdatum]    † [Sterbedatum]",
        dividerSymbol: "✦ ✦ ✦",
        quote: "Was man tief in seinem Herzen besitzt,\nkann man nicht durch den Tod verlieren.",
      },
    },
  ],
  trauerkarte: [
    {
      label: "Traueranzeige",
      textContent: {
        heading: "In stiller Trauer nehmen wir Abschied von",
        name: "[Name]",
        dates: "* [Geburtsdatum]    † [Sterbedatum]",
        dividerSymbol: "",
        quote: "Die Trauerfeier findet am [Datum]\num [Uhrzeit] in [Ort] statt.\n\nIn Liebe und Dankbarkeit\n[Familie]",
      },
    },
    {
      label: "Kurz",
      textContent: {
        heading: "",
        name: "[Name]",
        dates: "[Geburtsdatum] – [Sterbedatum]",
        dividerSymbol: "",
        quote: "Trauerfeier: [Datum], [Uhrzeit]\n[Ort]",
      },
    },
  ],
  dankkarte: [
    {
      label: "Dank",
      textContent: {
        heading: "Herzlichen Dank",
        name: "[Name]",
        dates: "",
        dividerSymbol: "",
        quote: "Für die tröstenden Worte, Gebete,\nBlumen und Spenden danken wir\nvon ganzem Herzen.\n\n[Familie]",
      },
    },
    {
      label: "Kurz",
      textContent: {
        heading: "Danke",
        name: "",
        dates: "",
        dividerSymbol: "",
        quote: "für Ihre Anteilnahme\n\n[Familie]",
      },
    },
  ],
};
