import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createCanvas, loadImage } from "canvas";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

// ── API key rotation ──
const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.Gemini_key,
  process.env.Gemini_key3,
  process.env.Gemini_key4,
].filter((k): k is string => !!k && k.length > 10);
let geminiKeyIndex = 0;
function getGeminiKey(): string {
  if (GEMINI_KEYS.length === 0) throw new Error("No GEMINI API keys found");
  return GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
}
function rotateGeminiKey(): void {
  geminiKeyIndex++;
  console.log(`  [key-rotation] Switched to key ${(geminiKeyIndex % GEMINI_KEYS.length) + 1}/${GEMINI_KEYS.length}`);
}

export interface CheckResult {
  name: string;
  points: number;
  maxPoints: number;
  passed: boolean;
  detail: string;
}

export interface GeminiIssue {
  rank: number;
  category: string;
  description: string;
  severity: number;
  fix: string;
}

export interface TemplateScore {
  templateId: string;
  page: string;
  total: number;
  geminiScore: number;
  checks: CheckResult[];
  geminiIssues: GeminiIssue[];
  geminiVerdict: string;
}

// ── Reference images ──

const REFERENCE_MAP: Record<string, { path: string; crop: "none" | "left" | "right"; promptType?: "photo" | "text" | "ornament-text" }> = {
  "TI05-back": { path: "e2e/T5NEW.JPG", crop: "right" },
  "TI06-front": { path: "docs/T6.jpeg", crop: "left" },
  "TI06-back": { path: "docs/T6.jpeg", crop: "right" },
  "TI07-front": { path: "docs/7NEWT.png", crop: "left", promptType: "ornament-text" },
  "TI07-back": { path: "docs/7NEWT.png", crop: "right", promptType: "photo" },
  "TI08-front": { path: "docs/T8New.png", crop: "left", promptType: "ornament-text" },
  "TI08-back": { path: "docs/T8New.png", crop: "right", promptType: "photo" },
};

// ── Grid overlay ──

async function addGridAxes(imageBuf: Buffer, crop: "none" | "left" | "right", targetW?: number, targetH?: number): Promise<Buffer> {
  const img = await loadImage(imageBuf);
  let srcX = 0, srcW = img.width, srcH = img.height;

  if (crop === "right") {
    srcX = Math.floor(img.width / 2);
    srcW = img.width - srcX;
  } else if (crop === "left") {
    srcW = Math.floor(img.width / 2);
  }

  // Normalize to target size so both images have equal pixel dimensions
  const drawW = targetW ?? srcW;
  const drawH = targetH ?? srcH;

  const margin = 35;
  const canvas = createCanvas(drawW + margin, drawH + margin);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, srcX, 0, srcW, srcH, margin, margin, drawW, drawH);

  // Red grid axes with % labels
  ctx.strokeStyle = "#ff0000";
  ctx.fillStyle = "#ff0000";
  ctx.lineWidth = 1;
  ctx.font = "10px sans-serif";

  for (let pct = 0; pct <= 100; pct += 10) {
    const x = margin + Math.round(pct / 100 * drawW);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin - 6); ctx.stroke();
    ctx.fillText(`${pct}`, x - 6, margin - 8);
    const y = margin + Math.round(pct / 100 * drawH);
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin - 6, y); ctx.stroke();
    ctx.fillText(`${pct}`, 1, y + 3);
  }

  // Light grid lines
  ctx.strokeStyle = "rgba(255, 0, 0, 0.12)";
  ctx.lineWidth = 0.5;
  for (let pct = 10; pct <= 90; pct += 10) {
    const x = margin + Math.round(pct / 100 * drawW);
    const y = margin + Math.round(pct / 100 * drawH);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin + drawH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin + drawW, y); ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

// ── Gemini 3.1 Pro Vision ──

const GEMINI_MODEL = "gemini-3.1-pro-preview";

// ── Universal measurement prompt ──
// ONE prompt, ONE schema, ONE language for ALL pages.
// Gemini measures → we compare numbers. No subjective scoring.

const GEMINI_MEASURE_PROMPT = `TASK: Measure element positions on a memorial card page.

GRID: The image has RED axes labeled 0-100% on both X (horizontal) and Y (vertical).
Each major gridline = 10%. Use these for PRECISE measurement.

RULES:
1. Find every visible element (photo, text block, ornament, line, symbol).
2. For each element, read its bounding box from the grid:
   - x = left edge percentage (integer 0-100)
   - y = top edge percentage (integer 0-100)
   - w = width in percentage points (integer 1-100)
   - h = height in percentage points (integer 1-100)
3. type must be exactly one of: "photo", "text", "ornament", "line", "symbol"
4. label = short description (e.g. "name text", "birth date", "cross ornament")
5. List elements top-to-bottom by y position.
6. IGNORE text content (words differ between builds). Measure the TEXT BLOCK box.
7. IGNORE who is in photos. Measure the PHOTO box.
8. For ornaments, measure the FULL bounding box including all decorative parts.

EXAMPLE (not from this image):
{"elements":[{"label":"heading","type":"text","x":10,"y":5,"w":80,"h":4},{"label":"photo","type":"photo","x":20,"y":15,"w":60,"h":50}]}

OUTPUT: Only valid JSON. No markdown. No explanation. Every element must have all 6 fields: label, type, x, y, w, h.
{"elements":[...]}`;

// All prompt types use the same measurement prompt
const GEMINI_PROMPT_BACK = GEMINI_MEASURE_PROMPT;
const GEMINI_PROMPT_ORNAMENT_TEXT = GEMINI_MEASURE_PROMPT;
const GEMINI_PROMPT_FRONT = GEMINI_MEASURE_PROMPT;

// ── Measure a single image ──

interface MeasuredElement {
  label: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

async function geminiCall(
  prompt: string,
  imageBase64: string,
): Promise<string> {
  // Try ALL keys sequentially from index 0
  for (let keyIdx = 0; keyIdx < GEMINI_KEYS.length; keyIdx++) {
    const key = GEMINI_KEYS[keyIdx];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: imageBase64 } },
          ]}],
          generationConfig: { temperature: 0, maxOutputTokens: 4096 },
        }),
      },
    );
    if (response.status === 429) {
      console.log(`  [key-rotation] Key ${keyIdx + 1}/${GEMINI_KEYS.length} got 429, trying next...`);
      geminiKeyIndex = (keyIdx + 1) % GEMINI_KEYS.length;
      continue;
    }
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API ${response.status}: ${err.substring(0, 200)}`);
    }
    geminiKeyIndex = keyIdx; // remember working key
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  throw new Error("All Gemini API keys exhausted (429)");
}

async function measureImage(
  imageBase64: string,
  _apiKey: string,
): Promise<MeasuredElement[]> {
  const text = await geminiCall(GEMINI_MEASURE_PROMPT, imageBase64);
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(jsonStr);
  // Clean up: Gemini sometimes adds spaces in keys (" h" instead of "h")
  const elements = (parsed.elements ?? []).map((e: Record<string, unknown>) => ({
    label: String(e.label ?? ""),
    type: String(e.type ?? ""),
    x: Number(e.x ?? e[" x"] ?? 0),
    y: Number(e.y ?? e[" y"] ?? 0),
    w: Number(e.w ?? e[" w"] ?? 0),
    h: Number(e.h ?? e[" h"] ?? 0),
  }));
  return elements as MeasuredElement[];
}

// ── Compare two measurements → score ──

function computeLayoutScore(
  refElements: MeasuredElement[],
  curElements: MeasuredElement[],
): { score: number; verdict: string; issues: GeminiIssue[] } {
  if (refElements.length === 0) return { score: 0, verdict: "No reference elements", issues: [] };
  if (curElements.length === 0) return { score: 0, verdict: "No build elements detected", issues: [] };

  const issues: GeminiIssue[] = [];
  let totalDiff = 0;
  let matchCount = 0;

  // Match elements by type, then by closest position
  for (const ref of refElements) {
    const candidates = curElements.filter(c => c.type === ref.type);
    if (candidates.length === 0) {
      issues.push({
        rank: issues.length + 1,
        category: "missing",
        description: `Missing ${ref.type} element "${ref.label}" (ref: x=${ref.x} y=${ref.y})`,
        severity: 4,
        fix: `Add ${ref.type} at approximately x=${ref.x}% y=${ref.y}%`,
      });
      totalDiff += 50; // heavy penalty
      matchCount++;
      continue;
    }

    // Find closest by center position
    const refCx = ref.x + ref.w / 2;
    const refCy = ref.y + ref.h / 2;
    let bestMatch = candidates[0];
    let bestDist = Infinity;
    for (const c of candidates) {
      const dist = Math.abs(c.x + c.w / 2 - refCx) + Math.abs(c.y + c.h / 2 - refCy);
      if (dist < bestDist) { bestDist = dist; bestMatch = c; }
    }

    // Compute per-property diffs (default missing values to 0)
    const dx = Math.abs((ref.x ?? 0) - (bestMatch.x ?? 0));
    const dy = Math.abs((ref.y ?? 0) - (bestMatch.y ?? 0));
    const dw = Math.abs((ref.w ?? 0) - (bestMatch.w ?? 0));
    const dh = Math.abs((ref.h ?? 0) - (bestMatch.h ?? 0));
    const elemDiff = (dx + dy + dw / 2 + dh / 2);
    totalDiff += elemDiff;
    matchCount++;

    if (elemDiff > 10) {
      issues.push({
        rank: issues.length + 1,
        category: "position",
        description: `"${ref.label}" off by Δx=${dx} Δy=${dy} Δw=${dw} Δh=${dh} (ref: x=${ref.x} y=${ref.y} w=${ref.w} h=${ref.h} → build: x=${bestMatch.x} y=${bestMatch.y} w=${bestMatch.w} h=${bestMatch.h})`,
        severity: elemDiff > 20 ? 4 : elemDiff > 15 ? 3 : 2,
        fix: `Move to x=${ref.x} y=${ref.y} w=${ref.w} h=${ref.h}`,
      });
    }
  }

  // Average diff per element → score (0 diff = 100, 30+ diff = 0)
  const avgDiff = matchCount > 0 ? totalDiff / matchCount : 50;
  const score = Math.max(0, Math.min(100, Math.round(100 - avgDiff * 3.3)));

  const verdict = score >= 90 ? "Near-identical layout"
    : score >= 80 ? "Very close, minor position diffs"
    : score >= 60 ? "Good structure, some elements off"
    : `Avg element diff: ${avgDiff.toFixed(1)}%`;

  return { score, verdict, issues };
}

// ── Measure + compare with median ──

async function callGeminiWithMedian(
  refGridBase64: string,
  curGridBase64: string,
  apiKey: string,
  _prompt: string,
): Promise<{ score: number; verdict: string; issues: GeminiIssue[]; allScores: number[] }> {
  // Measure reference once (stable, high-contrast photo = accurate)
  let refElements: MeasuredElement[];
  try {
    refElements = await measureImage(refGridBase64, apiKey);
    console.log("  REF measured:", JSON.stringify(refElements));
  } catch (err: any) {
    console.log("  REF measurement FAILED:", err.message);
    throw new Error(`Reference measurement failed: ${err.message}`);
  }

  // Build anchored prompt: same schema, same grid, same language
  const anchoredPrompt = `TASK: Measure element positions on a memorial card page.

GRID: The image has RED axes labeled 0-100% on both X (horizontal) and Y (vertical).
Each major gridline = 10%. Use these for PRECISE measurement.

EXPECTED ELEMENTS (from reference — find each one in THIS image):
${refElements.map(e => `- "${e.label}" (${e.type})`).join("\n")}

RULES:
1. For each expected element, find it in the image by type and visual appearance.
2. Read its bounding box from the RED grid axes:
   - x = left edge % (integer 0-100)
   - y = top edge % (integer 0-100)
   - w = width % (integer 1-100)
   - h = height % (integer 1-100)
3. IGNORE text content (words differ). Measure the TEXT BLOCK box.
4. IGNORE ornament art style. Measure the ORNAMENT bounding box.
5. IGNORE who is in photos. Measure the PHOTO box.
6. Return elements in the SAME ORDER as listed above.

OUTPUT: Only valid JSON. No markdown. No explanation. Every element must have all 6 fields.
{"elements":[${refElements.map(e => `{"label":"${e.label}","type":"${e.type}","x":N,"y":N,"w":N,"h":N}`).join(",")}]}`;

  // Measure build 3 times with anchored prompt (uses key rotation)
  const results: { score: number; verdict: string; issues: GeminiIssue[] }[] = [];
  for (let i = 0; i < 3; i++) {
    try {
      const text = await geminiCall(anchoredPrompt, curGridBase64);
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      const curElements = (parsed.elements ?? []).map((e: Record<string, unknown>) => ({
        label: String(e.label ?? ""),
        type: String(e.type ?? ""),
        x: Number(e.x ?? e[" x"] ?? 0),
        y: Number(e.y ?? e[" y"] ?? 0),
        w: Number(e.w ?? e[" w"] ?? 0),
        h: Number(e.h ?? e[" h"] ?? 0),
      })) as MeasuredElement[];
      console.log(`  BUILD run ${i + 1}:`, JSON.stringify(curElements));
      results.push(computeLayoutScore(refElements, curElements));
    } catch (err: any) {
      console.log(`  BUILD run ${i + 1} FAILED:`, err.message);
      results.push({ score: 0, verdict: `API error: ${err.message}`, issues: [] });
    }
  }

  const valid = results.filter(r => r.score > 0);
  if (valid.length === 0) throw new Error("All 3 Gemini measurement runs failed");

  const scores = valid.map(r => r.score).sort((a, b) => a - b);
  const medianIdx = Math.floor(scores.length / 2);
  const medianResult = valid.find(r => r.score === scores[medianIdx]) ?? valid[0];

  // Log measurements for debugging
  console.log("  REF elements:", JSON.stringify(refElements));
  console.log("  BUILD elements (median run):", JSON.stringify(
    results[scores.indexOf(scores[medianIdx])] ? "see issues" : "N/A"
  ));

  return {
    score: scores[medianIdx],
    verdict: medianResult.verdict,
    issues: medianResult.issues,
    allScores: scores,
  };
}

// ── Screenshot ──

async function takeCanvasScreenshot(page: Page): Promise<Buffer> {
  const canvas = page.locator("canvas.upper-canvas").first();
  return await canvas.screenshot();
}

// ── Main scorer ──

export async function scoreTemplate(
  page: Page,
  templateId: string,
  pageId: string,
  consoleErrors: string[],
): Promise<TemplateScore> {
  const checks: CheckResult[] = [];

  // Sanity checks (10 pts)
  const noErrors = consoleErrors.length === 0;
  checks.push({
    name: "No console errors",
    points: noErrors ? 5 : 0, maxPoints: 5, passed: noErrors,
    detail: noErrors ? "Clean" : `${consoleErrors.length} error(s)`,
  });

  const canvasText = await page.evaluate(() => {
    const canvases = document.querySelectorAll("canvas.lower-canvas");
    for (const c of canvases) {
      const fc = (c as any).__fabricCanvas;
      if (!fc) continue;
      return fc.getObjects().filter((o: any) => o.type === "textbox").map((o: any) => o.text).join(" ");
    }
    return "";
  });
  const hasForbidden = /\[(heading|name|birthDate|deathDate|quote|quoteAuthor)\]|undefined|null|\[object Object\]/.test(canvasText || "");
  checks.push({
    name: "No forbidden text",
    points: hasForbidden ? 0 : 5, maxPoints: 5, passed: !hasForbidden,
    detail: hasForbidden ? "Found forbidden text" : "Clean",
  });

  // Gemini Vision with grid overlay (90 pts)
  const refConfig = REFERENCE_MAP[`${templateId}-${pageId}`];
  let geminiScore = 0;
  let geminiVerdict = "";
  let geminiIssues: GeminiIssue[] = [];

  if (refConfig) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const refPath = path.join(process.cwd(), refConfig.path);
    const refBuf = fs.readFileSync(refPath);
    const curBuf = await takeCanvasScreenshot(page);

    // Photo pages: normalize to smaller size (avoids "photo looks bigger" bias)
    // Text pages: native resolution (reference is too low-res to upscale)
    const isPhotoPage = (refConfig.promptType ?? (pageId === "front" ? "photo" : "text")) === "photo";
    let refGrid: Buffer, curGrid: Buffer;
    if (isPhotoPage) {
      const refImg = await loadImage(refBuf);
      const curImg = await loadImage(curBuf);
      let refCropW = refImg.width;
      if (refConfig.crop === "left" || refConfig.crop === "right") refCropW = Math.floor(refImg.width / 2);
      const normW = Math.min(refCropW, curImg.width);
      const normH = Math.min(refImg.height, curImg.height);
      refGrid = await addGridAxes(refBuf, refConfig.crop, normW, normH);
      curGrid = await addGridAxes(curBuf, "none", normW, normH);
    } else {
      refGrid = await addGridAxes(refBuf, refConfig.crop);
      curGrid = await addGridAxes(curBuf, "none");
    }

    // Save for debugging
    fs.writeFileSync(path.join(process.cwd(), "e2e/screenshots/scorer-ref-grid.png"), refGrid);
    fs.writeFileSync(path.join(process.cwd(), "e2e/screenshots/scorer-cur-grid.png"), curGrid);

    try {
      const promptType = refConfig.promptType ?? (pageId === "front" ? "photo" : "text");
      const geminiPrompt = promptType === "photo" ? GEMINI_PROMPT_FRONT
        : promptType === "ornament-text" ? GEMINI_PROMPT_ORNAMENT_TEXT
        : GEMINI_PROMPT_BACK;
      const result = await callGeminiWithMedian(
        refGrid.toString("base64"),
        curGrid.toString("base64"),
        apiKey,
        geminiPrompt,
      );
      geminiScore = result.score;
      geminiVerdict = result.verdict;
      geminiIssues = result.issues;

      const geminiPoints = Math.round((result.score / 100) * 90);
      checks.push({
        name: "Gemini visual match",
        points: geminiPoints, maxPoints: 90, passed: result.score >= 90,
        detail: `Gemini ${GEMINI_MODEL} median: ${result.score}/100 (runs: ${result.allScores.join(", ")}) — ${result.verdict}`,
      });
    } catch (err: any) {
      checks.push({
        name: "Gemini visual match",
        points: 0, maxPoints: 90, passed: false,
        detail: `Gemini error: ${err.message?.substring(0, 100)}`,
      });
    }
  } else {
    checks.push({
      name: "Gemini visual match",
      points: 0, maxPoints: 90, passed: false,
      detail: `No reference for ${templateId}/${pageId}`,
    });
  }

  const total = checks.reduce((sum, c) => sum + c.points, 0);
  return { templateId, page: pageId, total, geminiScore, checks, geminiIssues, geminiVerdict };
}

export function formatScoreTable(scores: TemplateScore[]): string {
  return scores.map(s => {
    const lines = [`${s.templateId} ${s.page}: ${s.total}/100 (Gemini: ${s.geminiScore})`];
    lines.push(`  ${s.geminiVerdict}`);
    for (const c of s.checks) lines.push(`  ${c.passed ? "PASS" : "FAIL"} ${c.name}: ${c.points}/${c.maxPoints} — ${c.detail}`);
    if (s.geminiIssues.length > 0) {
      lines.push("  Issues:");
      for (const i of s.geminiIssues) {
        lines.push(`    #${i.rank} [${i.category}] sev=${i.severity}: ${i.description}`);
        if (i.fix) lines.push(`       Fix: ${i.fix}`);
      }
    }
    return lines.join("\n");
  }).join("\n\n");
}
