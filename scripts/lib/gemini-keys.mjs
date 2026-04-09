/**
 * Gemini API key rotation — cycles through available keys to avoid rate limits.
 * Keys are read from .env: GEMINI_API_KEY, Gemini_Api_keyBilling, GEMINI_API_KEY_3, etc.
 */
import dotenv from "dotenv";
dotenv.config();

const KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.Gemini_Api_keyBilling,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean);

if (KEYS.length === 0) {
  console.error("FATAL: No Gemini API keys found in .env");
  process.exit(1);
}

let currentIndex = 0;
let callCount = 0;

/**
 * Get the next API key (round-robin rotation).
 * Rotates after every call to spread load across keys.
 */
export function getGeminiKey() {
  const key = KEYS[currentIndex % KEYS.length];
  currentIndex++;
  callCount++;
  return key;
}

/**
 * Get a key, and if a 429 is received, try the next key.
 * Returns { key, retryWithNext } helper.
 */
export function getKeyWithFallback() {
  return {
    key: KEYS[currentIndex % KEYS.length],
    nextKey: () => {
      currentIndex++;
      return KEYS[currentIndex % KEYS.length];
    },
    totalKeys: KEYS.length,
  };
}

export function getStats() {
  return { totalKeys: KEYS.length, callCount, currentIndex: currentIndex % KEYS.length };
}

/**
 * Call Gemini API with automatic key rotation on 429 errors.
 * @param {string} model - Gemini model name
 * @param {object} body - Request body (contents, generationConfig, etc.)
 * @param {number} maxAttempts - Max retry attempts (default: 3)
 * @returns {Promise<object>} Parsed JSON response
 */
export async function callGeminiWithRetry(model, body, maxAttempts = 6) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = getGeminiKey();
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (resp.ok) {
      return await resp.json();
    }
    if (resp.status === 429 || resp.status === 400 || resp.status === 403) {
      console.log(`  [${resp.status}] Key failed (attempt ${attempt + 1}/${maxAttempts}), trying next key...`);
      continue;
    }
    const err = await resp.text();
    throw new Error(`Gemini API error: ${resp.status}: ${err.substring(0, 300)}`);
  }
  throw new Error("All Gemini API keys exhausted (429 on all attempts)");
}

console.log(`[gemini-keys] ${KEYS.length} API key(s) loaded for rotation`);
