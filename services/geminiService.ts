import { GoogleGenAI } from "@google/genai";
import { UserProfile, Gender, FoodItem } from "../types";

const API_KEYS = [
  import.meta.env.VITE_API_KEY_1,
  import.meta.env.VITE_API_KEY_2,
  import.meta.env.VITE_API_KEY_3,
  import.meta.env.VITE_API_KEY_4,
];

let keyIndex = 0;
const getAI = () => new GoogleGenAI({ apiKey: API_KEYS[keyIndex] });

const withRotation = async (fn: (ai: GoogleGenAI) => Promise<any>): Promise<any> => {
  for (let i = 0; i < API_KEYS.length; i++) {
    const currentKey = API_KEYS[(keyIndex + i) % API_KEYS.length];
    if (!currentKey) continue;
    try {
      const ai = new GoogleGenAI({ apiKey: currentKey });
      return await fn(ai);
    } catch (e: any) {
      const msg = e?.message || e?.toString() || '';
      const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit) {
        keyIndex = (keyIndex + 1) % API_KEYS.length;
        continue;
      }
      throw e;
    }
  }
  throw new Error('All API keys exhausted. Please wait a few minutes.');
};

const MODEL_NAME = "gemini-2.0-flash";

const INDIAN_CONTEXT = `Use Indian portion context: 1 katori=~150g, 1 roti/chapati=~32g(90kcal), 1 paratha=~70g(200kcal), 1 idli=~37g, 1 dosa(plain)=~55g, 1 samosa=~85g, 1 cup chai(milk)=~110kcal. Report Calcium/Iron in mg, VitaminA in mcg, VitaminC in mg.`;

export const calculateHealthPlan = async (name: string, age: number, height: number, weight: number, gender: Gender): Promise<Partial<UserProfile>> => {
  try {
    const res = await withRotation(ai => ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Calculate health metrics for: ${name}, Age ${age}, Height ${height}cm, Weight ${weight}kg, Gender ${gender}. Return ONLY a JSON object with fields: bmi, targetCalories, targetProtein, targetCarbs, targetFat, targetFiber, targetCalcium, targetIron, targetVitaminA, targetVitaminC, targetWater. No explanation, just JSON.`,
    }));
    return JSON.parse(res.text?.replace(/```json|```/g, '').trim() || "{}");
  } catch {
    const h = height / 100;
    const bmi = parseFloat((weight / (h * h)).toFixed(1));
    const bmr = gender === 'Male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const targetCalories = Math.round(bmr * 1.55);
    const targetProtein = Math.round(weight * 1.8);
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4);
    return {
      bmi, targetCalories, targetProtein, targetCarbs, targetFat,
      targetFiber: 30, targetCalcium: 1000, targetIron: 18,
      targetVitaminA: 900, targetVitaminC: 90, targetWater: Math.round(weight * 35)
    };
  }
};

export const analyzeFoodText = async (description: string): Promise<any> => {
  const res = await withRotation(ai => ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Analyse this food: "${description}". ${INDIAN_CONTEXT} Return ONLY a JSON object with fields: name, quantity, unit, weight_g, calories, protein, carbs, fat, fiber, micros (object with calcium, iron, vitaminA, vitaminC). No explanation, just JSON.`,
  }));
  const data = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || "{}");
  return { ...data, amount: `${data.quantity} ${data.unit}` };
};

export const analyzeFoodImage = async (imageBase64: string, mimeType: string): Promise<any> => {
  const res = await withRotation(ai => ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [
      { inlineData: { data: imageBase64, mimeType } },
      { text: `Identify this food and estimate nutrition. ${INDIAN_CONTEXT} Return ONLY a JSON object with fields: name, quantity, unit, weight_g, calories, protein, carbs, fat, fiber, micros (object with calcium, iron, vitaminA, vitaminC). No explanation, just JSON.` }
    ]},
  }));
  const data = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || "{}");
  return { ...data, amount: `${data.quantity} ${data.unit}` };
};

export const getWeeklySummary = async (weekLogs: FoodItem[], user: UserProfile): Promise<string> => {
  const days: Record<string, any> = {};
  weekLogs.forEach(i => {
    const d = new Date(i.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    if (!days[d]) days[d] = { cal: 0, prot: 0 };
    days[d].cal += i.calories; days[d].prot += i.protein;
  });
  const summary = Object.entries(days).map(([d, v]) => `${d}: ${Math.round(v.cal)}cal, ${Math.round(v.prot)}g protein`).join('\n');

  const res = await withRotation(ai => ai.models.generateContent({
    model: MODEL_NAME,
    contents: `You are a friendly Indian nutrition coach. Analyse this week for ${user.name} (target: ${user.targetCalories}cal/day, ${user.targetProtein}g protein):\n${summary || "No data logged."}\n\nWrite a warm 3-4 sentence summary: what went well, one tip mentioning Indian foods if relevant, motivating close. Under 80 words.`,
  }));
  return res.text || "Keep logging your meals to get a personalised weekly summary!";
};
