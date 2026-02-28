export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  bmi: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  // Micronutrient Targets
  targetFiber: number; // g
  targetCalcium: number; // mg
  targetIron: number; // mg
  targetVitaminA: number; // mcg
  targetVitaminC: number; // mg
}

export interface Micronutrients {
  calcium?: number; // mg
  iron?: number; // mg
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros?: Micronutrients;
  amount: string; // Display string, e.g., "2 pcs"
  quantity: number; // Raw number, e.g. 2
  unit: string; // Unit string, e.g. "pcs", "g", "ml"
  timestamp: Date;
  imageUrl?: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface DailyStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}