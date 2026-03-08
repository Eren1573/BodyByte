import { GoogleGenAI } from '@google/genai';
import { FoodItem, UserProfile } from '../types';

// ── 1. Collect all keys ───────────────────────────────────────
const API_KEYS: string[] = [
  import.meta.env.VITE_API_KEY_1,
  import.meta.env.VITE_API_KEY_2,
  import.meta.env.VITE_API_KEY_3,
  import.meta.env.VITE_API_KEY_4,
  import.meta.env.VITE_API_KEY_5,
].filter((k): k is string => typeof k === 'string' && k.trim().length > 0);

if (API_KEYS.length === 0) {
  throw new Error('[geminiService] No API keys found. Add VITE_API_KEY_1 to .env.local');
}

// ── 2. Helpers ────────────────────────────────────────────────
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    return /429|quota|rate.?limit|overload|503|500/i.test(err.message);
  }
  return false;
}

function stripJson(text: string): string {
  return text.replace(/```json|```/g, '').trim();
}

// ── 3. Core fallback call (text only) ────────────────────────
async function callGemini(
  prompt: string,
  model = 'gemini-2.0-flash'
): Promise<string> {
  const keys = shuffled(API_KEYS);
  let lastError: unknown;

  for (let i = 0; i < keys.length; i++) {
    try {
      const client = new GoogleGenAI({ apiKey: keys[i] });
      const response = await client.models.generateContent({ model, contents: prompt });
      return response.text ?? '';
    } catch (err) {
      lastError = err;
      const label = `Key ${i + 1}/${keys.length}`;
      if (isRetryable(err)) {
        console.warn(`[geminiService] ${label} rate-limited, trying next…`);
      } else {
        console.warn(`[geminiService] ${label} failed: ${(err as Error)?.message}, trying next…`);
      }
    }
  }

  throw new Error(
    `[geminiService] All ${keys.length} key(s) exhausted. Last: ${(lastError as Error)?.message}`
  );
}

// ── 4. Multi-modal fallback call (image + text) ───────────────
async function callGeminiWithImage(
  prompt: string,
  base64Image: string,
  mimeType: string,
  model = 'gemini-2.0-flash'
): Promise<string> {
  const keys = shuffled(API_KEYS);
  let lastError: unknown;

  for (let i = 0; i < keys.length; i++) {
    try {
      const client = new GoogleGenAI({ apiKey: keys[i] });
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Image } },
              { text: prompt },
            ],
          },
        ],
      });
      return response.text ?? '';
    } catch (err) {
      lastError = err;
      console.warn(
        `[geminiService] Image key ${i + 1}/${keys.length} failed: ${(err as Error)?.message}, trying next…`
      );
    }
  }

  throw new Error(
    `[geminiService] All ${keys.length} key(s) exhausted for image. Last: ${(lastError as Error)?.message}`
  );
}

// ── 5. Public API (same signatures as before) ─────────────────

/**
 * Analyse a text food description and return structured nutrition data.
 * Used by: FoodLogger.tsx
 */
export async function analyzeFoodText(description: string): Promise<any> {
  const prompt = `
You are a nutrition expert specialising in Indian and global cuisine.
Analyse this food description and return ONLY a JSON object (no markdown, no explanation):

"${description}"

Return this exact shape:
{
  "name": "display name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "quantity": number,
  "unit": "pcs|g|ml|katori|bowl|plate|cup|roti|paratha|slice|tbsp|tsp",
  "weight_g": number,
  "micros": { "calcium": number, "iron": number, "vitaminA": number, "vitaminC": number }
}

All numbers are per the quantity/unit specified. Be accurate for Indian foods.`;

  const text = await callGemini(prompt);
  return JSON.parse(stripJson(text));
}

/**
 * Analyse a food image (base64) and return structured nutrition data.
 * Used by: FoodLogger.tsx
 */
export async function analyzeFoodImage(base64Image: string, mimeType: string): Promise<any> {
  const prompt = `
You are a nutrition expert specialising in Indian and global cuisine.
Identify the food in this image and return ONLY a JSON object (no markdown, no explanation):

{
  "name": "display name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "quantity": number,
  "unit": "pcs|g|ml|katori|bowl|plate|cup|roti|paratha|slice|tbsp|tsp",
  "weight_g": number,
  "micros": { "calcium": number, "iron": number, "vitaminA": number, "vitaminC": number }
}

Estimate a realistic portion size. Be accurate for Indian foods.`;

  const text = await callGeminiWithImage(prompt, base64Image, mimeType);
  return JSON.parse(stripJson(text));
}

/**
 * Calculate a personalised health & nutrition plan for a user.
 * Used by: Onboarding.tsx, Profile.tsx
 */
export async function calculateHealthPlan(
  name: string,
  age: number,
  height: number,
  weight: number,
  gender: string
): Promise<any> {
  const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));

  const prompt = `
You are a certified nutritionist.
Calculate a personalised daily nutrition plan for:
  Name: ${name}, Age: ${age}, Gender: ${gender}, Height: ${height}cm, Weight: ${weight}kg, BMI: ${bmi}

Return ONLY a JSON object (no markdown, no explanation):
{
  "bmi": number,
  "targetCalories": number,
  "targetProtein": number,
  "targetCarbs": number,
  "targetFat": number,
  "targetFiber": number,
  "targetCalcium": number,
  "targetIron": number,
  "targetVitaminA": number,
  "targetVitaminC": number,
  "targetWater": number
}

targetWater is in ml. All other values in grams except calcium/iron/vitaminA/vitaminC (mg).
Use WHO / ICMR guidelines. Tailor for an Indian diet context.`;

  const text = await callGemini(prompt);
  return JSON.parse(stripJson(text));
}

/**
 * Generate an AI weekly nutrition summary for the Stats page.
 * Used by: Stats.tsx
 */
export async function getWeeklySummary(logs: FoodItem[], user: UserProfile): Promise<string> {
  const days: Record<string, { cal: number; protein: number; carbs: number; fat: number }> = {};

  logs.forEach(l => {
    const d = new Date(l.timestamp).toISOString().split('T')[0];
    if (!days[d]) days[d] = { cal: 0, protein: 0, carbs: 0, fat: 0 };
    days[d].cal     += l.calories;
    days[d].protein += l.protein;
    days[d].carbs   += l.carbs;
    days[d].fat     += l.fat;
  });

  const daySummary = Object.entries(days)
    .map(([date, v]) =>
      `${date}: ${Math.round(v.cal)} cal, ${v.protein.toFixed(1)}g protein, ` +
      `${v.carbs.toFixed(1)}g carbs, ${v.fat.toFixed(1)}g fat`
    )
    .join('\n');

  const prompt = `
You are a friendly nutrition coach.
Here is ${user.name}'s food log for the past week:

${daySummary || 'No logs recorded this week.'}

Their daily targets: ${user.targetCalories} cal, ${user.targetProtein}g protein, ${user.targetCarbs}g carbs, ${user.targetFat}g fat.

Write a concise, encouraging 3–4 sentence personalised summary:
- Highlight what they did well
- Point out one area to improve
- Give one practical tip tailored to an Indian diet
Keep it warm, motivating, and specific. No bullet points — plain text only.`;

  return callGemini(prompt);
}
