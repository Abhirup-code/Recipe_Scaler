import { existsSync } from "node:fs";
import { join } from "node:path";
import { recipes } from "@/data/recipes";
import { MAX_SERVINGS } from "@/lib/limits";
import { isMyRecipe } from "@/lib/myRecipes";

const UNITS = new Set(["tsp", "tbsp", "cup", "ml", "l", "oz", "lb", "g", "kg", "piece", "clove", "can", "pinch", "bunch", "stalk"]);
const publicDir = join(__dirname, "..", "..", "public");

describe.each(recipes.map((r) => [r.name, r] as const))("%s", (_, recipe) => {
  it("has both image sizes and alt text", () => {
    expect(recipe.image).toMatch(/^\/images\/[a-z0-9-]+\.webp$/);
    expect(existsSync(join(publicDir, recipe.image))).toBe(true);
    expect(existsSync(join(publicDir, recipe.image.replace(/\.webp$/, "-600.webp")))).toBe(true);
    expect(recipe.imageAlt.length).toBeGreaterThan(10);
  });

  it("has sensible servings, times, ingredients, and steps", () => {
    expect(recipe.slug).toMatch(/^[a-z0-9-]+$/);
    expect(isMyRecipe(recipe)).toBe(false); // built-in slugs never look like imported ones
    expect(recipe.servings).toBeGreaterThanOrEqual(1);
    expect(recipe.servings).toBeLessThanOrEqual(MAX_SERVINGS);
    expect(recipe.prepMinutes + recipe.cookMinutes).toBeGreaterThan(0);
    expect(recipe.ingredients.length).toBeGreaterThan(2);
    expect(recipe.steps.length).toBeGreaterThan(1);
    for (const ing of recipe.ingredients) {
      if (ing.qty !== undefined) expect(ing.qty).toBeGreaterThan(0);
      if (ing.unit) expect(UNITS.has(ing.unit)).toBe(true);
      if (ing.gramsPerCup) expect(["tsp", "tbsp", "cup", "ml", "l"]).toContain(ing.unit); // density only means something for volumes
    }
    for (const step of recipe.steps) if (step.minutes !== undefined) expect(step.minutes).toBeGreaterThan(0);
    expect(recipe.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
