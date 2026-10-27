"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { track } from "@/lib/analytics";
import { displayIngredient, ingredientLine } from "@/lib/ingredients";
import { MAX_SERVINGS } from "@/lib/limits";
import { addMyRecipe, newRecipeId, recipeHref } from "@/lib/myRecipes";
import { MAX_RECIPE_TEXT, parseRecipeText, toRecipe } from "@/lib/parseRecipe";
import { unitSystemStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";

const EXAMPLE = `Easy Banana Bread
Serves 8

Ingredients
- 3 ripe bananas, mashed
- 1/3 cup melted butter
- 3/4 cup sugar
- 1 large egg, beaten
- 1 tsp vanilla extract
- 1 tsp baking soda
- 1 1/2 cups all-purpose flour
- Pinch of salt

Instructions
1. Heat the oven to 350°F (175°C) and butter a loaf pan.
2. Stir the butter into the mashed bananas.
3. Mix in the sugar, egg, vanilla, baking soda, and salt.
4. Fold in the flour until just combined.
5. Bake for 55 minutes, until a skewer comes out clean.
6. Cool in the pan for 10 minutes before slicing.`;

/** Paste any recipe; see how it was read; fix the title or servings; save it to this device. */
export function ImportRecipe() {
  const router = useRouter();
  const system = useStore(unitSystemStore);
  const [text, setText] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [servings, setServings] = useState<string | null>(null);
  const deferred = useDeferredValue(text);
  const parsed = deferred.trim() ? parseRecipeText(deferred) : null;

  const finalName = (name ?? parsed?.name ?? "").trim();
  const servingCount = Number(servings ?? parsed?.servings);
  const servingsOk = Number.isInteger(servingCount) && servingCount >= 1 && servingCount <= MAX_SERVINGS;
  const canSave = parsed !== null && parsed.ingredients.length > 0 && finalName.length > 0 && servingsOk;

  function save() {
    if (!parsed || !canSave) return;
    const recipe = toRecipe(
      { ...parsed, name: finalName.slice(0, 120), servings: servingCount },
      newRecipeId(),
      new Date().toISOString().slice(0, 10),
    );
    addMyRecipe(recipe);
    track("import_recipe", { ingredients: recipe.ingredients.length, steps: recipe.steps.length });
    router.push(recipeHref(recipe));
  }

  return (
    <div className="import">
      <section className="panel" aria-labelledby="paste-heading">
        <div className="panel-head">
          <h2 id="paste-heading">Paste a recipe</h2>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setText(EXAMPLE);
              setName(null);
              setServings(null);
            }}
          >
            Try an example
          </button>
        </div>
        <label htmlFor="recipe-text" className="sr-only">
          Recipe text
        </label>
        <textarea
          id="recipe-text"
          className="import-text"
          rows={12}
          maxLength={MAX_RECIPE_TEXT}
          placeholder={"Paste from a website, a note, or a message.\n\nIngredients\n2 cups flour\n...\n\nInstructions\n1. Mix...\n"}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setName(null);
            setServings(null);
          }}
        />
        <p className="muted">
          Works best with “Ingredients” and “Instructions” headings. Everything stays on this device.
        </p>
      </section>

      {parsed && (
        <section className="panel" aria-labelledby="preview-heading">
          <h2 id="preview-heading">Check it looks right</h2>
          <div className="import-fields">
            <div className="field">
              <label htmlFor="import-name">Title</label>
              <input
                id="import-name"
                value={name ?? parsed.name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="import-servings">Servings</label>
              <input
                id="import-servings"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_SERVINGS}
                value={servings ?? String(parsed.servings)}
                onChange={(e) => setServings(e.target.value)}
                aria-invalid={servingsOk ? undefined : true}
                aria-describedby={servingsOk ? undefined : "import-servings-error"}
              />
            </div>
          </div>
          {!servingsOk && (
            <p id="import-servings-error" className="field-error">
              Servings must be a whole number from 1 to {MAX_SERVINGS}.
            </p>
          )}
          {parsed.warnings.length > 0 && (
            <ul className="import-warnings" aria-label="Notes about the import">
              {parsed.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <h3>Ingredients ({parsed.ingredients.length})</h3>
          <ul className="ingredients">
            {parsed.ingredients.map((ing, i) => (
              <li key={i}>
                <span>{ingredientLine(displayIngredient(ing, 1, system))}</span>
              </li>
            ))}
          </ul>
          <h3>Steps ({parsed.steps.length})</h3>
          <ol className="steps">
            {parsed.steps.map((s, i) => (
              <li key={i}>
                {s.text}
                {s.minutes !== undefined && <span className="muted"> (timer: {s.minutes} min)</span>}
              </li>
            ))}
          </ol>
          <button type="button" className="button primary" onClick={save} disabled={!canSave}>
            Save recipe
          </button>
        </section>
      )}
    </div>
  );
}
