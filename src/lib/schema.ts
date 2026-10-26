import { isoDuration } from "./duration";
import { displayIngredient, ingredientLine } from "./ingredients";
import type { Recipe } from "./types";

export const AUTHOR = "Abhirup Khan";

/** schema.org Recipe data so search engines can show rich results (image, time, rating card). */
export function recipeJsonLd(recipe: Recipe, siteUrl: string) {
  const url = `${siteUrl}/recipes/${recipe.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description,
    image: [`${siteUrl}${recipe.image}`],
    author: { "@type": "Person", name: AUTHOR },
    datePublished: recipe.datePublished,
    url,
    prepTime: isoDuration(recipe.prepMinutes),
    cookTime: isoDuration(recipe.cookMinutes),
    totalTime: isoDuration(recipe.prepMinutes + recipe.cookMinutes),
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine,
    keywords: recipe.tags.join(", "),
    recipeIngredient: recipe.ingredients.map((i) => ingredientLine(displayIngredient(i, 1, "us"))),
    recipeInstructions: recipe.steps.map((s, n) => ({
      "@type": "HowToStep",
      position: n + 1,
      text: s.text,
      url: `${url}#step-${n + 1}`,
    })),
  };
}

/** Serialize for a <script type="application/ld+json"> tag without allowing "</script>" injection. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
