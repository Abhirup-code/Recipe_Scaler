"use client";

import Link from "next/link";
import { useState } from "react";
import { scaleFactor } from "@/lib/ingredients";
import { upsertEntry } from "@/lib/shoppingList";
import { shoppingListStore, unitSystemStore } from "@/lib/stores";
import type { Recipe } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { CookMode } from "./CookMode";
import { IngredientList } from "./IngredientList";
import { ServingsStepper } from "./ServingsStepper";
import { UnitToggle } from "./UnitToggle";

/** The interactive part of a recipe page: servings, units, ingredients, shopping list, cook mode. */
export function RecipePanel({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.servings);
  const system = useStore(unitSystemStore);
  const list = useStore(shoppingListStore);
  const inList = list.some((e) => e.slug === recipe.slug && e.servings === servings);

  return (
    <section aria-labelledby="ingredients-heading" className="panel">
      <div className="panel-head">
        <h2 id="ingredients-heading">Ingredients</h2>
        <UnitToggle value={system} onChange={(v) => unitSystemStore.set(v)} />
      </div>
      <ServingsStepper value={servings} onChange={setServings} />
      <IngredientList recipe={recipe} factor={scaleFactor(recipe.servings, servings)} system={system} />
      <div className="actions">
        <CookMode title={recipe.name} steps={recipe.steps} />
        {inList ? (
          <Link className="button" href="/shopping-list/">
            In your list ✓ View list
          </Link>
        ) : (
          <button
            type="button"
            className="button"
            onClick={() => shoppingListStore.set(upsertEntry(list, { slug: recipe.slug, servings }))}
          >
            Add to shopping list
          </button>
        )}
      </div>
    </section>
  );
}
