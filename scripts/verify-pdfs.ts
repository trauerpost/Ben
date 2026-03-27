import { readFileSync, statSync } from "fs";
import { join } from "path";

// pdf-parse v1 is CJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

const PDF_DIR = join(__dirname, "..", "public", "test-pdfs");

interface TemplateCheck {
  id: string;
  expectedNames: string[];
}

const TEMPLATES: TemplateCheck[] = [
  { id: "TI04", expectedNames: ["Sieglinde Musterfrau"] },
  { id: "TI05", expectedNames: ["Brigitte Musterfrau"] },
  { id: "TI06", expectedNames: ["Thilde Muster"] },
  { id: "TI07", expectedNames: ["Franziska", "Muster"] },
  { id: "TI08", expectedNames: ["Erna", "Musterfrau"] },
  { id: "TI09", expectedNames: ["Renate Musterfrau"] },
];

// 140mm x 105mm in PDF points (1pt = 0.3528mm)
const EXPECTED_WIDTH = 140 / 0.3528;   // ~396.8
const EXPECTED_HEIGHT = 105 / 0.3528;  // ~297.6
const TOLERANCE = 10;

function parseMediaBox(buffer: Buffer): [number, number, number, number] | null {
  const text = buffer.toString("latin1");
  const match = text.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
}

async function verifyPdf(template: TemplateCheck): Promise<{ pass: boolean; details: string[] }> {
  const details: string[] = [];
  let pass = true;
  const filePath = join(PDF_DIR, `${template.id}.pdf`);

  // Check file exists and size
  try {
    const stat = statSync(filePath);
    const sizeKB = stat.size / 1024;
    if (sizeKB < 10) {
      details.push(`FAIL: File size ${sizeKB.toFixed(1)}KB < 10KB`);
      pass = false;
    } else {
      details.push(`OK: File size ${sizeKB.toFixed(1)}KB`);
    }
  } catch {
    details.push(`FAIL: File not found: ${filePath}`);
    return { pass: false, details };
  }

  const buffer = readFileSync(filePath);

  // Parse PDF with pdf-parse v1
  const data = await pdfParse(buffer);

  // Check page count
  if (data.numpages !== 1) {
    details.push(`FAIL: Page count = ${data.numpages}, expected 1`);
    pass = false;
  } else {
    details.push(`OK: Page count = 1`);
  }

  // Check expected names in text (case-insensitive — some templates render uppercase)
  const textLower = data.text.toLowerCase();
  for (const name of template.expectedNames) {
    if (textLower.includes(name.toLowerCase())) {
      details.push(`OK: Found "${name}" in text`);
    } else {
      details.push(`FAIL: "${name}" not found in text`);
      pass = false;
    }
  }

  // Check MediaBox dimensions
  const mediaBox = parseMediaBox(buffer);
  if (!mediaBox) {
    details.push(`FAIL: Could not find /MediaBox in PDF`);
    pass = false;
  } else {
    const [x0, y0, w, h] = mediaBox;
    const wOk = Math.abs(w - EXPECTED_WIDTH) <= TOLERANCE;
    const hOk = Math.abs(h - EXPECTED_HEIGHT) <= TOLERANCE;
    if (wOk && hOk) {
      details.push(`OK: MediaBox [${x0} ${y0} ${w.toFixed(1)} ${h.toFixed(1)}] matches expected ~[0 0 ${EXPECTED_WIDTH.toFixed(0)} ${EXPECTED_HEIGHT.toFixed(0)}]`);
    } else {
      details.push(`FAIL: MediaBox [${x0} ${y0} ${w.toFixed(1)} ${h.toFixed(1)}] expected ~[0 0 ${EXPECTED_WIDTH.toFixed(0)} ${EXPECTED_HEIGHT.toFixed(0)}] (±${TOLERANCE})`);
      pass = false;
    }
  }

  return { pass, details };
}

async function main(): Promise<void> {
  console.log("=== PDF Verification ===\n");
  let allPass = true;

  for (const template of TEMPLATES) {
    const { pass, details } = await verifyPdf(template);
    const status = pass ? "PASS" : "FAIL";
    console.log(`${template.id}: ${status}`);
    for (const d of details) {
      console.log(`  ${d}`);
    }
    console.log();
    if (!pass) allPass = false;
  }

  console.log(`=== Overall: ${allPass ? "ALL PASS" : "SOME FAILED"} ===`);
  process.exit(allPass ? 0 : 1);
}

main();
