import { formatAmount, unitLabel } from "./format";
import type { Recipe, Unit, UnitSystem } from "./types";
import { bestVolumeUnit, bestWeightUnit, G_PER, kindOf, ML_PER, toBase } from "./units";

export interface ListEntry {
  slug: string;
  servings: number;
}

export interface ShoppingItem {
  key: string;
  name: string;
  amount: string;
  unit: string;
  /** Recipes that need this item. */
  recipes: string[];
}

interface Bucket {
  name: string;
  base: number;
  kind: "volume" | "weight" | "count" | "none";
  countUnit?: Unit;
  gramsPerCup?: number;
  recipes: Set<string>;
}

const normalize = (name: string) => name.trim().toLowerCase();

/**
 * Merge the ingredients of several recipes into one list. Amounts of the same ingredient
 * are added together even when recipes use different units (2 tbsp + 1 cup of milk).
 */
export function buildShoppingList(
  entries: ListEntry[],
  recipes: Recipe[],
  system: UnitSystem,
): ShoppingItem[] {
  const bySlug = new Map(recipes.map((r) => [r.slug, r]));
  const buckets = new Map<string, Bucket>();

  for (const entry of entries) {
    const recipe = bySlug.get(entry.slug);
    if (!recipe) continue;
    const factor = entry.servings / recipe.servings;
    for (const ing of recipe.ingredients) {
      const kind = ing.qty === undefined ? "none" : ing.unit ? kindOf(ing.unit) : "count";
      const countUnit = kind === "count" ? (ing.unit ?? "piece") : undefined;
      const key = `${normalize(ing.name)}|${kind}|${countUnit ?? ""}`;
      const bucket = buckets.get(key) ?? {
        name: ing.name,
        base: 0,
        kind,
        countUnit,
        gramsPerCup: ing.gramsPerCup,
        recipes: new Set<string>(),
      };
      if (ing.qty !== undefined) bucket.base += toBase(ing.qty * factor, ing.unit ?? "piece");
      bucket.recipes.add(recipe.name);
      buckets.set(key, bucket);
    }
  }

  return [...buckets.entries()]
    .map(([key, b]) => ({ key, ...present(b, system), name: b.name, recipes: [...b.recipes] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function present(b: Bucket, system: UnitSystem): { amount: string; unit: string } {
  if (b.kind === "none") return { amount: "", unit: "" };
  if (b.kind === "count") {
    const unit = b.countUnit ?? "piece";
    return { amount: formatAmount(b.base, unit, system), unit: unitLabel(unit, b.base) };
  }
  if (b.kind === "volume" && system === "metric" && b.gramsPerCup) {
    const g = (b.base / ML_PER.cup) * b.gramsPerCup;
    const unit = bestWeightUnit(g, system);
    const qty = g / G_PER[unit];
    return { amount: formatAmount(qty, unit, system), unit: unitLabel(unit, qty) };
  }
  if (b.kind === "volume") {
    const unit = bestVolumeUnit(b.base, system);
    const qty = b.base / ML_PER[unit];
    return { amount: formatAmount(qty, unit, system), unit: unitLabel(unit, qty) };
  }
  const unit = bestWeightUnit(b.base, system);
  const qty = b.base / G_PER[unit];
  return { amount: formatAmount(qty, unit, system), unit: unitLabel(unit, qty) };
}

/** Add a recipe to the list, or update its servings if it is already there. */
export function upsertEntry(entries: ListEntry[], entry: ListEntry): ListEntry[] {
  const others = entries.filter((e) => e.slug !== entry.slug);
  return [...others, entry];
}

export function removeEntry(entries: ListEntry[], slug: string): ListEntry[] {
  return entries.filter((e) => e.slug !== slug);
}

/** Plain-text list for copying into a notes app or message. */
export function listToText(items: ShoppingItem[]): string {
  return items.map((i) => `- ${[i.amount, i.unit, i.name].filter(Boolean).join(" ")}`).join("\n");
}
