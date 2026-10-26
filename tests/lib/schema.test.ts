import { recipes } from "@/data/recipes";
import { recipeJsonLd, serializeJsonLd } from "@/lib/schema";

describe("recipe structured data", () => {
  const recipe = recipes[0]!;
  const data = recipeJsonLd(recipe, "https://example.com/site");

  it("has the fields Google requires and recommends for recipe rich results", () => {
    expect(data["@type"]).toBe("Recipe");
    expect(data.name).toBe(recipe.name);
    expect(data.image[0]).toBe(`https://example.com/site${recipe.image}`);
    expect(data.author.name).toBeTruthy();
    expect(data.totalTime).toBe("PT25M");
    expect(data.recipeYield).toBe("4 servings");
    expect(data.recipeIngredient).toContain("2 cups all-purpose flour");
    expect(data.recipeInstructions[0]).toMatchObject({ "@type": "HowToStep", position: 1 });
  });

  it("cannot break out of the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("every recipe has unique slugs, steps, and ingredients", () => {
    const slugs = new Set(recipes.map((r) => r.slug));
    expect(slugs.size).toBe(recipes.length);
    for (const r of recipes) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
      expect(r.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
