"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { cookedStore, recordCooked, validCooked } from "@/lib/cooked";
import { COOK_BUTTON_EXPERIMENT } from "@/lib/experiment";
import { scaleFactor } from "@/lib/ingredients";
import { readSharedView } from "@/lib/share";
import { upsertEntry } from "@/lib/shoppingList";
import { shoppingListStore, unitSystemStore } from "@/lib/stores";
import type { Recipe, UnitSystem } from "@/lib/types";
import { useCookButtonVariant } from "@/lib/useCookButtonVariant";
import { useStore } from "@/lib/useStore";
import { CookMode } from "./CookMode";
import { IngredientList } from "./IngredientList";
import { ScaleByIngredient } from "./ScaleByIngredient";
import { ServingsStepper } from "./ServingsStepper";
import { ShareRecipe } from "./ShareRecipe";
import { UnitToggle } from "./UnitToggle";

/** The interactive part of a recipe page: servings, units, ingredients, shopping list, cook mode. */
export function RecipePanel({ recipe, shareable = true }: { recipe: Recipe; shareable?: boolean }) {
  const [servings, setServings] = useState(recipe.servings);
  const [scaledTo, setScaledTo] = useState<string | null>(null);
  const savedSystem = useStore(unitSystemStore);
  // Units from a shared link apply to this page only, so they never overwrite your own choice.
  const [linkSystem, setLinkSystem] = useState<UnitSystem | null>(null);
  const system = linkSystem ?? savedSystem;
  const list = useStore(shoppingListStore);
  const inList = list.some((e) => e.slug === recipe.slug && e.servings === servings);
  const variant = useCookButtonVariant();

  // Open a shared link at the servings and units it was shared with. Pages are pre-rendered,
  // so the link can only be read in the browser, after the first render.
  useEffect(() => {
    const shared = readSharedView(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- applying URL state once on load */
    if (shared.servings !== undefined) setServings(shared.servings);
    if (shared.units) setLinkSystem(shared.units);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <section aria-labelledby="ingredients-heading" className="panel">
      <div className="panel-head">
        <h2 id="ingredients-heading">Ingredients</h2>
        <UnitToggle
          value={system}
          onChange={(v) => {
            setLinkSystem(null);
            unitSystemStore.set(v);
            track("change_units", { units: v });
          }}
        />
      </div>
      <ServingsStepper
        value={servings}
        onChange={(n) => {
          setServings(n);
          setScaledTo(null);
          track("change_servings", { recipe: recipe.slug, servings: n });
        }}
      />
      <ScaleByIngredient
        recipe={recipe}
        system={system}
        onScale={(n, description, ingredient) => {
          setServings(n);
          setScaledTo(description);
          track("scale_by_ingredient", { recipe: recipe.slug, ingredient });
        }}
      />
      {scaledTo && (
        <p className="scaled-note">
          Scaled to your {scaledTo}.{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setServings(recipe.servings);
              setScaledTo(null);
            }}
          >
            Back to {recipe.servings} servings
          </button>
        </p>
      )}
      <IngredientList recipe={recipe} factor={scaleFactor(recipe.servings, servings)} system={system} />
      <div className="actions">
        <CookMode
          title={recipe.name}
          steps={recipe.steps}
          label={COOK_BUTTON_EXPERIMENT.variants[variant]}
          onStart={() => track("start_cook_mode", { recipe: recipe.slug, variant })}
          onFinish={() => {
            track("finish_cook_mode", { recipe: recipe.slug, variant });
            cookedStore.set(recordCooked(validCooked(cookedStore.getSnapshot()), recipe.slug, new Date()));
          }}
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
      {/* Its own row, so opening the QR code never stretches the buttons above.
          Imported recipes live on this device only, so a link would not open anywhere else. */}
      {shareable && <ShareRecipe name={recipe.name} servings={servings} system={system} />}
    </section>
  );
}
