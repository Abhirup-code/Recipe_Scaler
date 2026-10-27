import type { Ingredient, Unit, UnitSystem } from "./types";
import { kindOf, ML_PER, toBase } from "./units";

const VOLUME: readonly Unit[] = ["cup", "tbsp", "tsp", "ml", "l"];
const WEIGHT: readonly Unit[] = ["g", "kg", "oz", "lb"];

/** Ingredients with a real amount can drive the scale; "to taste" ones cannot. */
export function canScaleBy(ingredient: Ingredient): boolean {
  return ingredient.qty !== undefined && ingredient.qty > 0;
}

/**
 * Units you can enter what you have in. Volumes and weights convert freely within their kind,
 * and flour, sugar, or butter measured in cups can also be entered by weight.
 */
export function inputUnits(ingredient: Ingredient): Unit[] {
  if (!canScaleBy(ingredient)) return [];
  if (!ingredient.unit) return ["piece"];
  const kind = kindOf(ingredient.unit);
  if (kind === "count") return [ingredient.unit];
  if (kind === "weight") return [...WEIGHT];
  return ingredient.gramsPerCup ? [...VOLUME, ...WEIGHT] : [...VOLUME];
}

/** The unit to suggest first: the recipe's own in US mode, grams or millilitres in metric. */
export function defaultInputUnit(ingredient: Ingredient, system: UnitSystem): Unit {
  const units = inputUnits(ingredient);
  const own = ingredient.unit ?? "piece";
  if (system === "us" || kindOf(own) === "count") return own;
  if (units.includes("g") && (kindOf(own) === "weight" || ingredient.gramsPerCup)) return "g";
  return "ml";
}

/**
 * How much to multiply the whole recipe by so this ingredient uses exactly what you have.
 * Returns null if the amount or unit does not make sense for this ingredient.
 */
export function factorFor(ingredient: Ingredient, have: number, unit: Unit): number | null {
  if (!canScaleBy(ingredient) || !Number.isFinite(have) || have <= 0) return null;
  if (!inputUnits(ingredient).includes(unit)) return null;
  const own = ingredient.unit ?? "piece";
  const need = toBase(ingredient.qty!, own);
  if (kindOf(own) === kindOf(unit)) return toBase(have, unit) / need;
  // Measured by volume in the recipe, entered by weight.
  const needGrams = (need / ML_PER.cup) * ingredient.gramsPerCup!;
  return toBase(have, unit) / needGrams;
}
