import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function addGrid(imageBuf, crop) {
  const img = await loadImage(imageBuf);
  let srcX = 0, srcW = img.width, srcH = img.height;
  if (crop === "right") { srcX = Math.floor(img.width / 2); srcW = img.width - srcX; }
  else if (crop === "left") { srcW = Math.floor(img.width / 2); }
  const margin = 35;
  const canvas = createCanvas(srcW + margin, srcH + margin);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, srcX, 0, srcW, srcH, margin, margin, srcW, srcH);
  ctx.strokeStyle = "#ff0000"; ctx.fillStyle = "#ff0000"; ctx.lineWidth = 1; ctx.font = "10px sans-serif";
  for (let pct = 0; pct <= 100; pct += 10) {
    const x = margin + Math.round(pct / 100 * srcW);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin - 6); ctx.stroke();
    ctx.fillText(String(pct), x - 6, margin - 8);
    const y = margin + Math.round(pct / 100 * srcH);
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin - 6, y); ctx.stroke();
    ctx.fillText(String(pct), 1, y + 3);
  }
  ctx.strokeStyle = "rgba(255,0,0,0.12)"; ctx.lineWidth = 0.5;
  for (let pct = 10; pct <= 90; pct += 10) {
    const x = margin + Math.round(pct / 100 * srcW);
    const y = margin + Math.round(pct / 100 * srcH);
    ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin + srcH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin + srcW, y); ctx.stroke();
  }
  return canvas.toBuffer("image/png");
}

const PROMPT = `This image has RED PERCENTAGE GRID AXES (0-100% on X and Y).

Measure the EXACT grid position of EVERY visible element. For each element, give:
- x_start: left edge as % (0-100)
- x_end: right edge as %
- y_start: top edge as %
- y_end: bottom edge as %

Elements to measure:
1. Ornament (cross with rose/vine) — bounding box of entire ornament
2. Name text "Franziska Muster" — bounding box
3. Birth date "* 1.12.1954" — bounding box
4. Birth location "in Starnberg" — bounding box
5. Death date "† 23.1.2021" — bounding box  
6. Death location "in Augsburg" — bounding box
7. Divider symbols (three small symbols at bottom) — bounding box

Respond with ONLY valid JSON, no markdown:
{"elements": [{"name": "ornament", "x_start": N, "x_end": N, "y_start": N, "y_end": N}, ...]}`;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const refBuf = fs.readFileSync("docs/T8New.png");
  
  // LEFT crop (front page)
  const leftGrid = await addGrid(refBuf, "left");
  fs.writeFileSync("e2e/screenshots/measure-t8-front.png", leftGrid);
  
  const resp1 = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: PROMPT },
          { inlineData: { mimeType: "image/png", data: leftGrid.toString("base64") } },
        ]}],
        generationConfig: { temperature: 0, maxOutputTokens: 4096 },
      }),
    }
  );
  const d1 = await resp1.json();
  const t1 = d1.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("=== FRONT PAGE (left crop) ===");
  console.log(t1);

  // RIGHT crop (back page)
  const rightGrid = await addGrid(refBuf, "right");
  fs.writeFileSync("e2e/screenshots/measure-t8-back.png", rightGrid);
  
  const PHOTO_PROMPT = `This image has RED PERCENTAGE GRID AXES (0-100% on X and Y).
Measure the EXACT position of the photo:
- x_start, x_end, y_start, y_end as % (0-100)
- Does the photo have rounded corners? (true/false)
- Approximate border-radius as % of photo width

Respond with ONLY valid JSON, no markdown:
{"photo": {"x_start": N, "x_end": N, "y_start": N, "y_end": N, "rounded_corners": bool, "border_radius_pct": N}}`;

  const resp2 = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: PHOTO_PROMPT },
          { inlineData: { mimeType: "image/png", data: rightGrid.toString("base64") } },
        ]}],
        generationConfig: { temperature: 0, maxOutputTokens: 4096 },
      }),
    }
  );
  const d2 = await resp2.json();
  const t2 = d2.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("\n=== BACK PAGE (right crop) ===");
  console.log(t2);
}

main().catch(console.error);
