import { createStore } from "./store";
import type { Recipe } from "./types";

/** One recipe you have cooked: how often, and the last day (YYYY-MM-DD, your local time). */
export interface CookedEntry {
  slug: string;
  count: number;
  last: string;
}

export const MAX_HISTORY = 30;

/** What you finished in cook mode, newest first. Stored on this device only (issue #8). */
export const cookedStore = createStore<unknown>("recipe-scaler:cooked", []);

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function isEntry(v: unknown): v is CookedEntry {
  const e = v as CookedEntry;
  return (
    typeof e === "object" &&
    e !== null &&
    typeof e.slug === "string" &&
    /^[a-z0-9-]{1,80}$/.test(e.slug) &&
    Number.isInteger(e.count) &&
    e.count >= 1 &&
    e.count <= 100_000 &&
    typeof e.last === "string" &&
    DAY.test(e.last)
  );
}

export function validCooked(stored: unknown): CookedEntry[] {
  return Array.isArray(stored) ? stored.filter(isEntry) : [];
}

/** Today's date where you are, as YYYY-MM-DD. */
export function localDay(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Count one more time cooking this recipe and move it to the front. */
export function recordCooked(history: CookedEntry[], slug: string, now: Date): CookedEntry[] {
  const previous = history.find((e) => e.slug === slug);
  const entry = { slug, count: (previous?.count ?? 0) + 1, last: localDay(now) };
  return [entry, ...history.filter((e) => e.slug !== slug)].slice(0, MAX_HISTORY);
}

export interface CookedRecipe {
  recipe: Recipe;
  count: number;
  last: string;
}

/** The latest recipes you cooked that still exist (a deleted import simply drops out). */
export function recentlyCooked(history: CookedEntry[], recipes: Recipe[], limit = 4): CookedRecipe[] {
  const bySlug = new Map(recipes.map((r) => [r.slug, r]));
  const out: CookedRecipe[] = [];
  for (const e of history) {
    const recipe = bySlug.get(e.slug);
    if (recipe) out.push({ recipe, count: e.count, last: e.last });
    if (out.length === limit) break;
  }
  return out;
}

/** "Cooked today", "Cooked yesterday", or "Cooked Oct 25", plus how many times. */
export function cookedLabel(last: string, count: number, today: string): string {
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86_400_000);
  const when =
    days <= 0
      ? "today"
      : days === 1
        ? "yesterday"
        : new Date(`${last}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `Cooked ${when}${count > 1 ? ` · ${count} times` : ""}`;
}
