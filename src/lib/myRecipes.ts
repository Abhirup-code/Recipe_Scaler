import { recipes as builtIn } from "@/data/recipes";
import { MAX_SERVINGS } from "./limits";
import { removeEntry } from "./shoppingList";
import { createStore } from "./store";
import { shoppingListStore } from "./stores";
import type { Ingredient, Recipe, Step, Unit } from "./types";

const UNITS: ReadonlySet<string> = new Set<Unit>([
  "tsp", "tbsp", "cup", "ml", "l", "oz", "lb", "g", "kg", "piece", "clove", "can", "pinch", "bunch", "stalk",
]);

/** Recipes you imported. Stored on this device only. */
export const myRecipesStore = createStore<unknown>("recipe-scaler:my-recipes", []);

const isText = (v: unknown, max = 2000): v is string => typeof v === "string" && v.length <= max;
const isAmount = (v: unknown) => v === undefined || (typeof v === "number" && Number.isFinite(v) && v > 0);

function isIngredient(v: unknown): v is Ingredient {
  const i = v as Ingredient;
  return (
    typeof i === "object" &&
    i !== null &&
    isText(i.name, 200) &&
    isAmount(i.qty) &&
    (i.unit === undefined || UNITS.has(i.unit)) &&
    (i.note === undefined || isText(i.note, 300)) &&
    isAmount(i.gramsPerCup)
  );
}

function isStep(v: unknown): v is Step {
  const s = v as Step;
  return typeof s === "object" && s !== null && isText(s.text) && isAmount(s.minutes);
}

/** Storage can be edited by hand or by other code, so only well-formed recipes are used. */
export function isMyRecipe(v: unknown): v is Recipe {
  const r = v as Recipe;
  return (
    typeof r === "object" &&
    r !== null &&
    isText(r.slug, 40) &&
    /^my-[a-z0-9]+$/.test(r.slug) &&
    isText(r.name, 120) &&
    typeof r.servings === "number" &&
    r.servings >= 1 &&
    r.servings <= MAX_SERVINGS &&
    Array.isArray(r.ingredients) &&
    r.ingredients.every(isIngredient) &&
    Array.isArray(r.steps) &&
    r.steps.every(isStep)
  );
}

export function validMyRecipes(stored: unknown): Recipe[] {
  return Array.isArray(stored) ? stored.filter(isMyRecipe) : [];
}

export function newRecipeId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  } catch {
    return Date.now().toString(36);
  }
}

export function addMyRecipe(recipe: Recipe): void {
  myRecipesStore.set([recipe, ...validMyRecipes(myRecipesStore.getSnapshot())]);
}

export function removeMyRecipe(slug: string): void {
  myRecipesStore.set(validMyRecipes(myRecipesStore.getSnapshot()).filter((r) => r.slug !== slug));
  shoppingListStore.set(removeEntry(shoppingListStore.getSnapshot(), slug));
}

export const isMine = (recipe: Pick<Recipe, "slug">) => recipe.slug.startsWith("my-");

/** Where a recipe lives: built-in recipes have their own page; yours open on the My recipes page. */
export function recipeHref(recipe: Pick<Recipe, "slug">): string {
  return isMine(recipe) ? `/my-recipes/?id=${recipe.slug.slice(3)}` : `/recipes/${recipe.slug}/`;
}

export function withMyRecipes(stored: unknown): Recipe[] {
  return [...builtIn, ...validMyRecipes(stored)];
}
