import { formatAmount, unitLabel } from "./format";
import type { Ingredient, UnitSystem } from "./types";
import { convert } from "./units";

export interface DisplayIngredient {
  amount: string;
  unit: string;
  name: string;
  note?: string;
}

export function scaleFactor(baseServings: number, servings: number): number {
  if (baseServings <= 0) throw new Error("baseServings must be positive");
  return servings / baseServings;
}

/** Scale an ingredient to a number of servings and show it in the chosen unit system. */
export function displayIngredient(
  ingredient: Ingredient,
  factor: number,
  system: UnitSystem,
): DisplayIngredient {
  const { qty, unit, name, note, gramsPerCup } = ingredient;
  if (qty === undefined) return { amount: "", unit: "", name, note: note ?? "to taste" };
  if (!unit) return { amount: formatAmount(qty * factor, "piece", system), unit: "", name, note };
  const converted = convert({ qty: qty * factor, unit }, system, gramsPerCup);
  return {
    amount: formatAmount(converted.qty, converted.unit, system),
    unit: unitLabel(converted.unit, converted.qty),
    name,
    note,
  };
}

/** One readable line, e.g. "1½ cups all-purpose flour (sifted)". */
export function ingredientLine(d: DisplayIngredient): string {
  const parts = [d.amount, d.unit, d.name].filter(Boolean).join(" ");
  return d.note ? `${parts} (${d.note})` : parts;
}
