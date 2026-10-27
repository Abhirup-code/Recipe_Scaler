"use client";

import { cookedLabel, cookedStore, localDay, recentlyCooked, validCooked } from "@/lib/cooked";
import { myRecipesStore, withMyRecipes } from "@/lib/myRecipes";
import { useStore } from "@/lib/useStore";
import { RecipeCard } from "./RecipeCard";

/** The last few recipes you finished in cook mode, so favorites are one tap away (issue #8). */
export function RecentlyCooked() {
  const history = validCooked(useStore(cookedStore));
  const recipes = withMyRecipes(useStore(myRecipesStore));
  const items = recentlyCooked(history, recipes);
  if (items.length === 0) return null;
  const today = localDay(new Date());
  return (
    <section aria-labelledby="recent-heading" className="recently-cooked">
      <h2 id="recent-heading">Cooked recently</h2>
      <div className="grid recent-grid">
        {items.map(({ recipe, count, last }) => (
          <RecipeCard key={recipe.slug} recipe={recipe} heading="h3" meta={cookedLabel(last, count, today)} />
        ))}
      </div>
    </section>
  );
}
