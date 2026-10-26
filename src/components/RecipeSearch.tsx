"use client";

import { useDeferredValue, useState } from "react";
import type { Recipe } from "@/lib/types";
import { RecipeCard } from "./RecipeCard";

/** Search by name, cuisine, tag, or ingredient ("lentils", "vegan", "quick"). */
export function matches(recipe: Recipe, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [recipe.name, recipe.cuisine, recipe.category, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)]
    .join(" ")
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function RecipeSearch({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const results = recipes.filter((r) => matches(r, deferred));

  return (
    <>
      <label className="search">
        <span className="sr-only">Search recipes</span>
        <input
          type="search"
          placeholder="Search: lentils, vegan, quick…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="sr-only" aria-live="polite">
        {results.length} {results.length === 1 ? "recipe" : "recipes"} found
      </p>
      {results.length === 0 ? (
        <p className="empty">No recipes match “{query}”. Try an ingredient like “garlic”.</p>
      ) : (
        <div className="grid">
          {results.map((r, i) => (
            <RecipeCard key={r.slug} recipe={r} priority={i < 2} />
          ))}
        </div>
      )}
    </>
  );
}
