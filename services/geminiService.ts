import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Gender, FoodItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for Models
const MODEL_NAME = "gemini-3-flash-preview";

export const calculateHealthPlan = async (
  name: string,
  age: number,
  height: number,
  weight: number,
  gender: Gender
): Promise<Partial<UserProfile>> => {
  const prompt = `
    Calculate health metrics for a user with these stats:
    Name: ${name}
    Age: ${age}
    Height: ${height} cm
    Weight: ${weight} kg
    Gender: ${gender}

    1. Calculate BMI.
    2. Recommend daily calories for moderate weight maintenance/healthy living.
    3. Recommend macro split (Protein, Carbs, Fat) in grams.
    4. Recommend daily micronutrient targets (Fiber, Calcium, Iron, Vitamin A, Vitamin C) based on age/gender guidelines.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bmi: { type: Type.NUMBER, description: "Calculated Body Mass Index" },
            targetCalories: { type: Type.NUMBER, description: "Recommended daily calorie intake" },
            targetProtein: { type: Type.NUMBER, description: "Recommended daily protein in grams" },
            targetCarbs: { type: Type.NUMBER, description: "Recommended daily carbs in grams" },
            targetFat: { type: Type.NUMBER, description: "Recommended daily fat in grams" },
            targetFiber: { type: Type.NUMBER, description: "Recommended daily fiber in grams" },
            targetCalcium: { type: Type.NUMBER, description: "Recommended daily calcium in mg" },
            targetIron: { type: Type.NUMBER, description: "Recommended daily iron in mg" },
            targetVitaminA: { type: Type.NUMBER, description: "Recommended daily Vitamin A in mcg" },
            targetVitaminC: { type: Type.NUMBER, description: "Recommended daily Vitamin C in mg" },
          },
          required: [
            "bmi", "targetCalories", "targetProtein", "targetCarbs", "targetFat",
            "targetFiber", "targetCalcium", "targetIron", "targetVitaminA", "targetVitaminC"
          ],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Error calculating health plan:", error);
    // Fallback simple calculation if AI fails
    const heightM = height / 100;
    const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
    return {
      bmi,
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 200,
      targetFat: 65,
      targetFiber: 30,
      targetCalcium: 1000,
      targetIron: 18,
      targetVitaminA: 900,
      targetVitaminC: 90
    };
  }
};

export const analyzeFoodImage = async (
  imageBase64: string,
  mimeType: string
): Promise<Omit<FoodItem, 'id' | 'timestamp' | 'mealType'> & { weight_g?: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Identify the food. Estimate portion. Return quantity, unit, and ESTIMATED TOTAL WEIGHT in grams (key: weight_g). Provide nutritional info for the TOTAL quantity identified. IMPORTANT: Report Micronutrients in these units: Calcium (mg), Iron (mg), Vitamin C (mg), Vitamin A (mcg). Ensure values are realistic for a single serving. Do NOT output mcg for Calcium/Iron.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the food identified" },
            quantity: { type: Type.NUMBER, description: "Numeric quantity, e.g. 2, 100, 250" },
            unit: { type: Type.STRING, description: "Unit of measurement, e.g. 'pcs', 'g', 'ml', 'bowl'" },
            weight_g: { type: Type.NUMBER, description: "Estimated total weight of the food in grams" },
            calories: { type: Type.NUMBER, description: "Total Calories" },
            protein: { type: Type.NUMBER, description: "Protein in grams" },
            carbs: { type: Type.NUMBER, description: "Carbs in grams" },
            fat: { type: Type.NUMBER, description: "Fat in grams" },
            fiber: { type: Type.NUMBER, description: "Fiber in grams" },
            micros: {
              type: Type.OBJECT,
              properties: {
                calcium: { type: Type.NUMBER, description: "Calcium in mg" },
                iron: { type: Type.NUMBER, description: "Iron in mg" },
                vitaminA: { type: Type.NUMBER, description: "Vitamin A in mcg" },
                vitaminC: { type: Type.NUMBER, description: "Vitamin C in mg" },
              }
            }
          },
          required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat", "fiber"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      amount: `${data.quantity} ${data.unit}`
    };
  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image.");
  }
};

export const analyzeFoodText = async (
  description: string
): Promise<Omit<FoodItem, 'id' | 'timestamp' | 'mealType'> & { weight_g?: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze this food description: "${description}". Estimate portion. Return quantity, unit, and ESTIMATED TOTAL WEIGHT in grams (key: weight_g). Provide nutritional info for the TOTAL quantity. IMPORTANT: Report Micronutrients in these units: Calcium (mg), Iron (mg), Vitamin C (mg), Vitamin A (mcg). Ensure values are realistic. Do NOT output mcg for Calcium/Iron.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the food" },
            quantity: { type: Type.NUMBER, description: "Numeric quantity" },
            unit: { type: Type.STRING, description: "Unit string" },
            weight_g: { type: Type.NUMBER, description: "Estimated total weight of the food in grams" },
            calories: { type: Type.NUMBER, description: "Total Calories" },
            protein: { type: Type.NUMBER, description: "Protein in grams" },
            carbs: { type: Type.NUMBER, description: "Carbs in grams" },
            fat: { type: Type.NUMBER, description: "Fat in grams" },
            fiber: { type: Type.NUMBER, description: "Fiber in grams" },
             micros: {
              type: Type.OBJECT,
              properties: {
                calcium: { type: Type.NUMBER, description: "Calcium in mg" },
                iron: { type: Type.NUMBER, description: "Iron in mg" },
                vitaminA: { type: Type.NUMBER, description: "Vitamin A in mcg" },
                vitaminC: { type: Type.NUMBER, description: "Vitamin C in mg" },
              }
            }
          },
          required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat", "fiber"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      amount: `${data.quantity} ${data.unit}`
    };
  } catch (error) {
    console.error("Error analyzing food text:", error);
    throw new Error("Failed to analyze food text.");
  }
};