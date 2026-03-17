export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: Gender;
  bmi: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;
  targetCalcium: number;
  targetIron: number;
  targetVitaminA: number;
  targetVitaminC: number;
  targetWater: number; // ml, default 2500
}

export interface Micronutrients {
  calcium?: number;
  iron?: number;
  vitaminA?: number;
  vitaminC?: number;
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
  amount: string;
  quantity: number;
  unit: string;
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

export interface WeightEntry {
  id: string;
  weight: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface SavedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micros?: Micronutrients;
  quantity: number;
  unit: string;
  amount: string;
  savedAt: string;
}

export interface AuthUser {
  email: string;
  passwordHash: string;
  displayName: string;
}
