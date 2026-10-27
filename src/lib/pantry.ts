import type { Recipe } from "./types";

// Sizes and freshness do not matter when asking "do I have it?": a small onion is an onion.
const IGNORED_WORDS = new Set(["small", "medium", "large", "fresh", "hot", "unsalted"]);

/** Things almost every kitchen has. Never counted as missing and not listed to tick. */
export const BASICS: ReadonlySet<string> = new Set(["salt", "pepper", "salt and pepper", "water"]);

/** The name a pantry item goes by: "Large Eggs" and "eggs" are the same thing. */
export function pantryKey(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w && !IGNORED_WORDS.has(w))
    .join(" ");
}

/** Every ingredient a recipe needs in a real amount ("to taste" garnishes are optional). */
function required(recipe: Recipe): string[] {
  const keys = recipe.ingredients.filter((i) => i.qty !== undefined).map((i) => pantryKey(i.name));
  return [...new Set(keys)].filter((k) => !BASICS.has(k));
}

/** Everything you could tick, across all recipes, alphabetically. */
export function pantryItems(recipes: Recipe[]): string[] {
  const keys = recipes.flatMap((r) => r.ingredients.map((i) => pantryKey(i.name)));
  return [...new Set(keys)].filter((k) => !BASICS.has(k)).sort((a, b) => a.localeCompare(b));
}

export interface PantryMatch {
  recipe: Recipe;
  have: string[];
  missing: string[];
}

export function matchRecipe(recipe: Recipe, pantry: ReadonlySet<string>): PantryMatch {
  const needs = required(recipe);
  return {
    recipe,
    have: needs.filter((k) => pantry.has(k)),
    missing: needs.filter((k) => !pantry.has(k)),
  };
}

/** Recipes you can make now come first, then the ones you are closest to. */
export function rankRecipes(recipes: Recipe[], pantry: ReadonlySet<string>): PantryMatch[] {
  return recipes
    .map((r) => matchRecipe(r, pantry))
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length ||
        b.have.length - a.have.length ||
        a.recipe.name.localeCompare(b.recipe.name),
    );
}
