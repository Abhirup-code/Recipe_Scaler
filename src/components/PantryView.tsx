"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { track } from "@/lib/analytics";
import { myRecipesStore, recipeHref, validMyRecipes } from "@/lib/myRecipes";
import { pantryItems, rankRecipes } from "@/lib/pantry";
import { upsertEntry } from "@/lib/shoppingList";
import { pantryStore, shoppingListStore } from "@/lib/stores";
import type { Recipe } from "@/lib/types";
import { useStore } from "@/lib/useStore";

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** Tick what you have at home; recipes you can make right now rise to the top. */
export function PantryView({ recipes: builtIn }: { recipes: Recipe[] }) {
  const recipes = [...builtIn, ...validMyRecipes(useStore(myRecipesStore))];
  const pantry = useStore(pantryStore);
  const entries = useStore(shoppingListStore);
  const [filter, setFilter] = useState("");
  const deferred = useDeferredValue(filter.trim().toLowerCase());

  const all = pantryItems(recipes);
  const shown = all.filter((item) => item.includes(deferred));
  const have = new Set(pantry);
  const ranked = rankRecipes(recipes, have);
  const ready = ranked.filter((m) => m.missing.length === 0).length;

  const toggle = (item: string) =>
    pantryStore.set(have.has(item) ? pantry.filter((p) => p !== item) : [...pantry, item]);

  return (
    <>
      <section aria-labelledby="pantry-heading" className="panel">
        <div className="panel-head">
          <h2 id="pantry-heading">
            Your kitchen{" "}
            <span className="muted pantry-count">
              ({pantry.length} of {all.length})
            </span>
          </h2>
          {pantry.length > 0 && (
            <button type="button" className="link-button" onClick={() => pantryStore.set([])}>
              Clear all
            </button>
          )}
        </div>
        <p className="muted pantry-hint">Tick what you have. Salt, pepper, and water are assumed.</p>
        <div className="pantry-filter">
          <label htmlFor="pantry-filter">Find an ingredient</label>
          <input
            id="pantry-filter"
            type="search"
            placeholder="e.g. garlic"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {shown.length === 0 ? (
          <p className="empty">Nothing matches “{filter}”.</p>
        ) : (
          <ul className="pantry-grid">
            {shown.map((item) => (
              <li key={item}>
                <label className={have.has(item) ? "chip on" : "chip"}>
                  <input type="checkbox" checked={have.has(item)} onChange={() => toggle(item)} />
                  {item}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="matches-heading" className="panel">
        <h2 id="matches-heading">What you can cook</h2>
        <p className="sr-only" aria-live="polite">
          {pantry.length > 0 && `${ready} ${ready === 1 ? "recipe" : "recipes"} ready to cook`}
        </p>
        {pantry.length === 0 ? (
          <p className="empty">Tick a few ingredients above to see which recipes you can make.</p>
        ) : (
          <ul className="matches">
            {ranked.map(({ recipe, have: got, missing }) => {
              const listed = entries.some((e) => e.slug === recipe.slug);
              return (
                <li key={recipe.slug} className={missing.length === 0 ? "match ready" : "match"}>
                  <div>
                    <Link href={recipeHref(recipe)} className="match-name">
                      {recipe.name}
                    </Link>
                    <p className="match-status">
                      {missing.length === 0 ? (
                        <strong>You have everything ✓</strong>
                      ) : (
                        <>
                          <strong>
                            Missing {missing.length}
                            {got.length > 0 && ` · have ${got.length}`}:
                          </strong>{" "}
                          {list(missing)}
                        </>
                      )}
                    </p>
                  </div>
                  {missing.length > 0 &&
                    (listed ? (
                      <Link className="button" href="/shopping-list/">
                        In your list ✓
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="button"
                        aria-label={`Add to list: ${recipe.name}`}
                        onClick={() => {
                          shoppingListStore.set(upsertEntry(entries, { slug: recipe.slug, servings: recipe.servings }));
                          track("pantry_add_to_list", { recipe: recipe.slug, missing: missing.length });
                        }}
                      >
                        Add to list
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
