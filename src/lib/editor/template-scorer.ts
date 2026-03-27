/**
 * Template Scoring Engine
 * Evaluates generated HTML against template spec.
 * 8 components, 100 points total, pass ≥ 90.
 */

import { getTemplateById } from "./card-templates";
import type { CardTemplate, TemplateSlot } from "./card-templates";
import type { WizardState, TextContent } from "./wizard-state";

export interface ScoreComponent {
  name: string;
  maxPoints: number;
  score: number;
  details: string;
}

export interface ScoreCard {
  templateId: string;
  components: ScoreComponent[];
  totalScore: number;
  maxScore: number;
  passed: boolean;
}

// ── Field style expectations ──

const EXPECTED_BOLD_FIELDS = ["name"];
const EXPECTED_ITALIC_FIELDS = ["quote", "locationBirth", "locationDeath", "closingVerse"];

// ── Scoring Functions ──

function scoreLayout(template: CardTemplate, html: string): ScoreComponent {
  let score = 0;
  const details: string[] = [];
  const panel = template.panels[0];
  if (!panel) return { name: "Layout Structure", maxPoints: 20, score: 0, details: "No panel found" };

  // Check renderMode
  if (template.renderMode === "spread") {
    score += 5;
    details.push("renderMode=spread ✓");
  } else {
    details.push("renderMode≠spread ✗ (-5)");
  }

  // Check grid-template-columns in HTML
  const colMatch = html.match(/grid-template-columns:\s*([^;]+)/);
  if (colMatch && colMatch[1].trim() === panel.gridTemplateColumns) {
    score += 8;
    details.push(`columns="${panel.gridTemplateColumns}" ✓`);
  } else {
    details.push(`columns mismatch: expected "${panel.gridTemplateColumns}", got "${colMatch?.[1]?.trim() ?? 'none'}" ✗`);
  }

  // Check grid-template-rows
  const rowMatch = html.match(/grid-template-rows:\s*([^;]+)/);
  if (rowMatch && rowMatch[1].trim() === panel.gridTemplateRows) {
    score += 7;
    details.push(`rows="${panel.gridTemplateRows}" ✓`);
  } else {
    details.push(`rows mismatch ✗`);
  }

  return { name: "Layout Structure", maxPoints: 20, score, details: details.join("; ") };
}

function scorePhoto(template: CardTemplate, state: WizardState, html: string): ScoreComponent {
  const panel = template.panels[0];
  const photoSlots = panel?.slots.filter(s => s.type === "photo") ?? [];

  if (photoSlots.length === 0) {
    // No photo expected
    if (!state.photo.url) {
      return { name: "Photo Placement", maxPoints: 15, score: 15, details: "No photo expected, none provided ✓" };
    }
    return { name: "Photo Placement", maxPoints: 15, score: 10, details: "No photo slot but photo provided (ignored)" };
  }

  let score = 0;
  const details: string[] = [];

  if (!state.photo.url) {
    return { name: "Photo Placement", maxPoints: 15, score: 0, details: "Photo expected but none provided ✗" };
  }

  // Check photo appears in HTML as background-image
  if (html.includes("background-size:cover") || html.includes("background-size: cover")) {
    score += 8;
    details.push("Photo rendered with cover ✓");
  } else {
    details.push("Photo not found as background-image ✗");
  }

  // Check grid-area matches
  for (const slot of photoSlots) {
    if (html.includes(`grid-area:${slot.gridArea}`)) {
      score += 7;
      details.push(`Photo at ${slot.gridArea} ✓`);
    } else {
      details.push(`Photo gridArea ${slot.gridArea} not found ✗`);
    }
  }

  return { name: "Photo Placement", maxPoints: 15, score: Math.min(score, 15), details: details.join("; ") };
}

function scoreTextPositioning(template: CardTemplate, state: WizardState, html: string): ScoreComponent {
  const panel = template.panels[0];
  const textSlots = panel?.slots.filter(s => s.type === "text") ?? [];

  let score = 0;
  let maxChecks = 0;
  const details: string[] = [];

  for (const slot of textSlots) {
    const fields = slot.textFields ?? [];
    for (const field of fields) {
      const value = getFieldValue(state.textContent, field);
      if (!value) continue;
      maxChecks++;

      // Check the field value appears in HTML
      const escaped = value.split("\n")[0]; // check first line
      if (html.includes(escaped)) {
        score++;
        details.push(`${field} present ✓`);
      } else {
        details.push(`${field} "${escaped.slice(0, 20)}..." missing ✗`);
      }
    }
  }

  const points = maxChecks > 0 ? Math.round((score / maxChecks) * 15) : 15;
  return { name: "Text Positioning", maxPoints: 15, score: points, details: details.join("; ") };
}

function scoreFontHierarchy(state: WizardState): ScoreComponent {
  const tc = state.textContent;
  let score = 0;
  const details: string[] = [];

  // Name should be largest
  const sizes = [tc.headingFontSize, tc.datesFontSize, tc.quoteFontSize, tc.locationFontSize];
  const nameIsLargest = sizes.every(s => tc.nameFontSize >= s);
  if (nameIsLargest) {
    score += 10;
    details.push(`Name (${tc.nameFontSize}px) is largest ✓`);
  } else {
    details.push(`Name (${tc.nameFontSize}px) is NOT largest ✗`);
  }

  // Dates should be >= quote
  if (tc.datesFontSize >= tc.quoteFontSize) {
    score += 5;
    details.push("Dates ≥ quote ✓");
  } else {
    details.push("Dates < quote ✗");
  }

  return { name: "Font Hierarchy", maxPoints: 15, score, details: details.join("; ") };
}

function scoreSpacing(html: string): ScoreComponent {
  let score = 0;
  const details: string[] = [];

  // Check padding exists
  if (html.includes("padding:6mm") || html.includes("padding: 6mm")) {
    score += 5;
    details.push("6mm padding ✓");
  } else if (html.includes("padding:")) {
    score += 3;
    details.push("Has padding (not 6mm)");
  } else {
    details.push("No padding ✗");
  }

  // Check margin-bottom on fields
  if (html.includes("margin-bottom:2mm") || html.includes("margin-bottom: 2mm")) {
    score += 5;
    details.push("Field spacing 2mm ✓");
  } else {
    score += 2;
    details.push("No explicit field spacing");
  }

  return { name: "Spacing & Margins", maxPoints: 10, score, details: details.join("; ") };
}

function scoreDecoration(template: CardTemplate, state: WizardState, html: string): ScoreComponent {
  const panel = template.panels[0];
  const decoSlots = panel?.slots.filter(s => s.type === "decoration") ?? [];

  if (decoSlots.length === 0) {
    return { name: "Decoration Placement", maxPoints: 10, score: 10, details: "No decoration expected ✓" };
  }

  if (!state.decoration.assetUrl) {
    return { name: "Decoration Placement", maxPoints: 10, score: 0, details: "Decoration expected but assetUrl is null ✗" };
  }

  let score = 0;
  const details: string[] = [];

  if (html.includes("object-fit:contain") || html.includes("object-fit: contain")) {
    score += 5;
    details.push("Decoration rendered with contain ✓");
  } else {
    details.push("Decoration not found ✗");
  }

  for (const slot of decoSlots) {
    if (html.includes(`grid-area:${slot.gridArea}`)) {
      score += 5;
      details.push(`Decoration at ${slot.gridArea} ✓`);
    }
  }

  return { name: "Decoration Placement", maxPoints: 10, score: Math.min(score, 10), details: details.join("; ") };
}

function scoreTypography(template: CardTemplate, html: string): ScoreComponent {
  let score = 0;
  const details: string[] = [];

  // Check bold on name
  if (html.includes("font-weight:bold")) {
    score += 3;
    details.push("Bold present ✓");
  } else {
    details.push("No bold found ✗");
  }

  // Check italic
  if (html.includes("font-style:italic")) {
    score += 3;
    details.push("Italic present ✓");
  } else {
    // Some templates don't need italic (T1 text-only with left align)
    score += 1;
    details.push("No italic (may be OK for this template)");
  }

  // Check serif font
  if (html.includes("serif")) {
    score += 2;
    details.push("Serif font ✓");
  } else {
    details.push("No serif ✗");
  }

  // Check uppercase if template has styleOverrides with transform
  const panel = template.panels[0];
  const hasUppercase = panel?.slots.some(s =>
    s.styleOverrides && Object.values(s.styleOverrides).some(o => o.transform === "uppercase")
  );
  if (hasUppercase) {
    if (html.includes("text-transform:uppercase")) {
      score += 2;
      details.push("Uppercase applied ✓");
    } else {
      details.push("Uppercase expected but not found ✗");
    }
  } else {
    score += 2;
    details.push("No uppercase needed ✓");
  }

  return { name: "Typography Style", maxPoints: 10, score, details: details.join("; ") };
}

function scoreBackground(html: string): ScoreComponent {
  let score = 0;
  const details: string[] = [];

  if (html.includes("background-color:#FFFFFF") || html.includes("background-color: #FFFFFF") || html.includes("background:white")) {
    score += 5;
    details.push("White background ✓");
  } else if (html.includes("background-color:")) {
    score += 3;
    details.push("Has background color (not white)");
  } else {
    details.push("No background color ✗");
  }

  return { name: "Background", maxPoints: 5, score, details: details.join("; ") };
}

// ── Helper ──

function getFieldValue(tc: TextContent, field: string): string {
  const val = tc[field as keyof TextContent];
  return typeof val === "string" ? val : "";
}

// ── Main Scoring Function ──

export function scoreTemplate(templateId: string, state: WizardState, html: string): ScoreCard {
  const template = getTemplateById(templateId);
  if (!template) {
    return {
      templateId,
      components: [{ name: "ERROR", maxPoints: 100, score: 0, details: `Template ${templateId} not found` }],
      totalScore: 0,
      maxScore: 100,
      passed: false,
    };
  }

  const components: ScoreComponent[] = [
    scoreLayout(template, html),
    scorePhoto(template, state, html),
    scoreTextPositioning(template, state, html),
    scoreFontHierarchy(state),
    scoreSpacing(html),
    scoreDecoration(template, state, html),
    scoreTypography(template, html),
    scoreBackground(html),
  ];

  const totalScore = components.reduce((sum, c) => sum + c.score, 0);
  const maxScore = components.reduce((sum, c) => sum + c.maxPoints, 0);

  return {
    templateId,
    components,
    totalScore,
    maxScore,
    passed: totalScore >= 90,
  };
}

export function formatScoreCard(card: ScoreCard): string {
  const lines: string[] = [];
  lines.push(`=== Score Card: Template ${card.templateId} ===`);
  lines.push("");
  for (const c of card.components) {
    const bar = `${c.score}/${c.maxPoints}`.padStart(6);
    const dots = ".".repeat(Math.max(2, 30 - c.name.length));
    lines.push(`  ${c.name} ${dots} ${bar}  ${c.details}`);
  }
  lines.push("");
  lines.push(`  TOTAL: ${card.totalScore}/${card.maxScore}  ${card.passed ? "PASS ✓" : "FAIL ✗"}`);
  return lines.join("\n");
}
