import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Gender, FoodItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-2.0-flash";

// Shared schema for food nutrition
const foodSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING }, quantity: { type: Type.NUMBER }, unit: { type: Type.STRING },
    weight_g: { type: Type.NUMBER }, calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER }, fat: { type: Type.NUMBER }, fiber: { type: Type.NUMBER },
    micros: { type: Type.OBJECT, properties: { calcium: { type: Type.NUMBER }, iron: { type: Type.NUMBER }, vitaminA: { type: Type.NUMBER }, vitaminC: { type: Type.NUMBER } } },
  },
  required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat", "fiber"],
};

const INDIAN_CONTEXT = `Use Indian portion context: 1 katori=~150g, 1 roti/chapati=~32g(90kcal), 1 paratha=~70g(200kcal), 1 idli=~37g, 1 dosa(plain)=~55g, 1 samosa=~85g, 1 cup chai(milk)=~110kcal. Report Calcium/Iron in mg, VitaminA in mcg, VitaminC in mg.`;

export const calculateHealthPlan = async (name: string, age: number, height: number, weight: number, gender: Gender): Promise<Partial<UserProfile>> => {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: `Calculate health metrics for: ${name}, Age ${age}, Height ${height}cm, Weight ${weight}kg, Gender ${gender}. Provide BMI, daily calorie target, macro split (protein/carbs/fat in grams), micronutrient targets (fiber g, calcium mg, iron mg, vitaminA mcg, vitaminC mg), and daily water intake in ml.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { bmi: { type: Type.NUMBER }, targetCalories: { type: Type.NUMBER }, targetProtein: { type: Type.NUMBER }, targetCarbs: { type: Type.NUMBER }, targetFat: { type: Type.NUMBER }, targetFiber: { type: Type.NUMBER }, targetCalcium: { type: Type.NUMBER }, targetIron: { type: Type.NUMBER }, targetVitaminA: { type: Type.NUMBER }, targetVitaminC: { type: Type.NUMBER }, targetWater: { type: Type.NUMBER } },
          required: ["bmi", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "targetFiber", "targetCalcium", "targetIron", "targetVitaminA", "targetVitaminC", "targetWater"],
        },
      },
    });
    return JSON.parse(res.text || "{}");
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
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Analyse this food: "${description}". ${INDIAN_CONTEXT} Return nutrition for TOTAL quantity.`,
    config: { responseMimeType: "application/json", responseSchema: foodSchema },
  });
  const data = JSON.parse(res.text || "{}");
  return { ...data, amount: `${data.quantity} ${data.unit}` };
};

export const analyzeFoodImage = async (imageBase64: string, mimeType: string): Promise<any> => {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: { parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: `Identify this food and estimate nutrition. ${INDIAN_CONTEXT} Return nutrition for TOTAL identified quantity.` }] },
    config: { responseMimeType: "application/json", responseSchema: foodSchema },
  });
  const data = JSON.parse(res.text || "{}");
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

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `You are a friendly Indian nutrition coach. Analyse this week for ${user.name} (target: ${user.targetCalories}cal/day, ${user.targetProtein}g protein):\n${summary || "No data logged."}\n\nWrite a warm 3-4 sentence summary: what went well, one tip mentioning Indian foods if relevant, motivating close. Under 80 words.`,
  });
  return res.text || "Keep logging your meals to get a personalised weekly summary!";
};
