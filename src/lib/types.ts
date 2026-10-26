export type VolumeUnit = "tsp" | "tbsp" | "cup" | "ml" | "l";
export type WeightUnit = "oz" | "lb" | "g" | "kg";
export type CountUnit = "piece" | "clove" | "can" | "pinch" | "bunch" | "stalk";
export type Unit = VolumeUnit | WeightUnit | CountUnit;
export type UnitSystem = "us" | "metric";

export interface Ingredient {
  /** Amount for the recipe's base servings. Omit for "to taste" items. */
  qty?: number;
  unit?: Unit;
  name: string;
  note?: string;
  /** Grams in one US cup, so volume can be shown as weight in metric (flour, sugar, butter). */
  gramsPerCup?: number;
}

export interface Step {
  text: string;
  /** Optional timer for this step, in minutes. */
  minutes?: number;
}

export interface Recipe {
  slug: string;
  name: string;
  description: string;
  cuisine: string;
  category: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  image: string;
  imageAlt: string;
  tags: string[];
  datePublished: string;
  ingredients: Ingredient[];
  steps: Step[];
}
