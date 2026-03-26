import type { CardType } from "./wizard-state";

export interface TextTemplate {
  label: string;
  text: string;
}

export const TEXT_TEMPLATES: Record<CardType, TextTemplate[]> = {
  sterbebild: [
    {
      label: "Klassisch",
      text: "In liebevoller Erinnerung an\n\n[Name]\n\n* [Geburtsdatum]    † [Sterbedatum]\n\n[Gebet oder Spruch]",
    },
    {
      label: "Schlicht",
      text: "[Name]\n[Geburtsdatum] – [Sterbedatum]",
    },
    {
      label: "Mit Spruch",
      text: "In stillem Gedenken\n\n[Name]\n* [Geburtsdatum]    † [Sterbedatum]\n\nWas man tief in seinem Herzen besitzt,\nkann man nicht durch den Tod verlieren.",
    },
  ],
  trauerkarte: [
    {
      label: "Traueranzeige",
      text: "In stiller Trauer nehmen wir Abschied von\n\n[Name]\n\n* [Geburtsdatum]    † [Sterbedatum]\n\nDie Trauerfeier findet am [Datum]\num [Uhrzeit] in [Ort] statt.\n\nIn Liebe und Dankbarkeit\n[Familie]",
    },
    {
      label: "Kurz",
      text: "[Name]\n[Geburtsdatum] – [Sterbedatum]\n\nTrauerfeier: [Datum], [Uhrzeit]\n[Ort]",
    },
  ],
  dankkarte: [
    {
      label: "Dank",
      text: "Herzlichen Dank\n\nfür die liebevolle Anteilnahme\nam Heimgang unseres lieben\n\n[Name]\n\nFür die tröstenden Worte, Gebete,\nBlumen und Spenden danken wir\nvon ganzem Herzen.\n\n[Familie]",
    },
    {
      label: "Kurz",
      text: "Danke\nfür Ihre Anteilnahme\n\n[Familie]",
    },
  ],
};
