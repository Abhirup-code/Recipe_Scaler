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

/** Save changes to a recipe you imported, keeping its place in the list (issue #7). */
export function updateMyRecipe(recipe: Recipe): void {
  myRecipesStore.set(validMyRecipes(myRecipesStore.getSnapshot()).map((r) => (r.slug === recipe.slug ? recipe : r)));
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

// ---- Backup and restore (issue #6) ----

export const BACKUP_APP = "recipe-scaler";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 2_000_000;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  recipes: Recipe[];
}

/** Everything you imported, as a JSON file you can keep or move to another device. */
export function backupJson(recipes: Recipe[], now: Date): string {
  const backup: Backup = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), recipes };
  return JSON.stringify(backup, null, 2);
}

export type RestoreResult =
  | { ok: true; recipes: Recipe[]; added: number; alreadyHere: number; invalid: number }
  | { ok: false; error: string };

/**
 * Merge a backup into the recipes you already have. Recipes already on this device are kept
 * as they are; anything malformed is skipped. Never trusts the file: every recipe is validated.
 */
export function restoreBackup(text: string, existing: Recipe[]): RestoreResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: "That file is too large to be a Recipe Scaler backup." };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not a Recipe Scaler backup (it is not valid JSON)." };
  }
  const backup = data as Partial<Backup>;
  if (typeof backup !== "object" || backup === null || backup.app !== BACKUP_APP || !Array.isArray(backup.recipes)) {
    return { ok: false, error: "That file is not a Recipe Scaler backup." };
  }
  if (typeof backup.version !== "number" || backup.version > BACKUP_VERSION) {
    return { ok: false, error: "That backup was made by a newer version of Recipe Scaler. Refresh the page and try again." };
  }
  const have = new Set(existing.map((r) => r.slug));
  const added: Recipe[] = [];
  let alreadyHere = 0;
  let invalid = 0;
  for (const item of backup.recipes) {
    if (!isMyRecipe(item)) invalid += 1;
    else if (have.has(item.slug)) alreadyHere += 1;
    else {
      have.add(item.slug);
      added.push(item);
    }
  }
  return { ok: true, recipes: [...existing, ...added], added: added.length, alreadyHere, invalid };
}
