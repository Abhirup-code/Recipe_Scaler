"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { COOK_BUTTON_EXPERIMENT } from "@/lib/experiment";
import { scaleFactor } from "@/lib/ingredients";
import { upsertEntry } from "@/lib/shoppingList";
import { shoppingListStore, unitSystemStore } from "@/lib/stores";
import type { Recipe } from "@/lib/types";
import { useCookButtonVariant } from "@/lib/useCookButtonVariant";
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
  const variant = useCookButtonVariant();

  return (
    <section aria-labelledby="ingredients-heading" className="panel">
      <div className="panel-head">
        <h2 id="ingredients-heading">Ingredients</h2>
        <UnitToggle
          value={system}
          onChange={(v) => {
            unitSystemStore.set(v);
            track("change_units", { units: v });
          }}
        />
      </div>
      <ServingsStepper
        value={servings}
        onChange={(n) => {
          setServings(n);
          track("change_servings", { recipe: recipe.slug, servings: n });
        }}
      />
      <IngredientList recipe={recipe} factor={scaleFactor(recipe.servings, servings)} system={system} />
      <div className="actions">
        <CookMode
          title={recipe.name}
          steps={recipe.steps}
          label={COOK_BUTTON_EXPERIMENT.variants[variant]}
          onStart={() => track("start_cook_mode", { recipe: recipe.slug, variant })}
          onFinish={() => track("finish_cook_mode", { recipe: recipe.slug, variant })}
        />
        {inList ? (
          <Link className="button" href="/shopping-list/">
            In your list ✓ View list
          </Link>
        ) : (
          <button
            type="button"
            className="button"
            onClick={() => {
              shoppingListStore.set(upsertEntry(list, { slug: recipe.slug, servings }));
              track("add_to_list", { recipe: recipe.slug, servings });
            }}
          >
            Add to shopping list
          </button>
        )}
      </div>
    </section>
  );
}
