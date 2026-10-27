import { recipes } from "@/data/recipes";
import { BASICS, matchRecipe, pantryItems, pantryKey, rankRecipes } from "@/lib/pantry";
import type { Recipe } from "@/lib/types";

const recipe = (slug: string, names: Array<string | [string]>): Recipe => ({
  slug,
  name: slug,
  description: "",
  cuisine: "",
  category: "",
  servings: 2,
  prepMinutes: 0,
  cookMinutes: 0,
  image: "",
  imageAlt: "",
  tags: [],
  datePublished: "2026-01-01",
  // A name in brackets is "to taste" (no amount), so optional.
  ingredients: names.map((n) => (Array.isArray(n) ? { name: n[0] } : { qty: 1, name: n })),
  steps: [],
});

describe("pantry", () => {
  it("treats sizes and freshness as the same ingredient", () => {
    expect(pantryKey("Large Eggs")).toBe("eggs");
    expect(pantryKey("small onion")).toBe("onion");
    expect(pantryKey("fresh  cilantro")).toBe("cilantro");
    expect(pantryKey("hot water")).toBe("water");
    expect(pantryKey("unsalted butter")).toBe("butter");
    expect(pantryKey("canned tomatoes")).toBe("canned tomatoes");
  });

  it("lists every ingredient once, alphabetically, without the basics", () => {
    const items = pantryItems(recipes);
    expect(items).toEqual([...items].sort((a, b) => a.localeCompare(b)));
    expect(new Set(items).size).toBe(items.length);
    expect(items).toContain("onion");
    expect(items).not.toContain("small onion");
    for (const basic of BASICS) expect(items).not.toContain(basic);
  });

  it("splits a recipe into what you have and what is missing, ignoring basics and garnishes", () => {
    const toast = recipe("toast", ["bread", "large eggs", "salt", "water", ["fresh chives"]]);
    expect(matchRecipe(toast, new Set(["eggs"]))).toMatchObject({ have: ["eggs"], missing: ["bread"] });
    expect(matchRecipe(toast, new Set(["eggs", "bread"])).missing).toEqual([]);
  });

  it("counts an ingredient once even if a recipe lists it twice", () => {
    const r = recipe("r", ["small onion", "large onion", "garlic"]);
    expect(matchRecipe(r, new Set()).missing).toEqual(["onion", "garlic"]);
  });

  it("ranks recipes you can make first, then the closest ones", () => {
    const a = recipe("a", ["eggs", "bread", "milk"]);
    const b = recipe("b", ["eggs"]);
    const c = recipe("c", ["eggs", "flour"]);
    const d = recipe("d", ["rice", "beans"]);
    const ranked = rankRecipes([d, a, c, b], new Set(["eggs", "bread"]));
    expect(ranked.map((m) => m.recipe.slug)).toEqual(["b", "a", "c", "d"]);
  });

  it("breaks ties by how much you have, then by name", () => {
    const x = recipe("x", ["eggs", "flour"]);
    const y = recipe("y", ["rice"]);
    const z = recipe("z", ["eggs", "milk"]);
    expect(rankRecipes([z, y, x], new Set(["eggs"])).map((m) => m.recipe.slug)).toEqual(["x", "z", "y"]);
  });
});
