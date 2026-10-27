"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { humanDuration } from "@/lib/duration";
import { myRecipesStore, recipeHref, removeMyRecipe, validMyRecipes } from "@/lib/myRecipes";
import type { Recipe } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { BackupControls } from "./BackupControls";
import { RecipePanel } from "./RecipePanel";

function DeleteButton({ recipe, onDeleted }: { recipe: Recipe; onDeleted?: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      className={armed ? "button danger" : "button"}
      onClick={() => {
        if (!armed) return setArmed(true);
        removeMyRecipe(recipe.slug);
        onDeleted?.();
      }}
      onBlur={() => setArmed(false)}
      aria-label={armed ? `Tap again to delete ${recipe.name}` : `Delete ${recipe.name}`}
    >
      {armed ? "Tap again to delete" : "Delete"}
    </button>
  );
}

function MyRecipeView({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  return (
    <article className="recipe">
      <header>
        <p className="eyebrow">
          <Link href="/my-recipes/">Your recipes</Link> · Imported {recipe.datePublished}
        </p>
        <h1>{recipe.name}</h1>
        {recipe.cookMinutes > 0 && <p className="lede">Timed steps add up to {humanDuration(recipe.cookMinutes)}.</p>}
        <div className="actions no-print">
          <Link className="button" href={`/import/?edit=${recipe.slug.slice(3)}`}>
            Edit
          </Link>
          <DeleteButton recipe={recipe} onDeleted={() => router.push("/my-recipes/")} />
        </div>
      </header>
      <RecipePanel recipe={recipe} shareable={false} />
      {recipe.steps.length > 0 && (
        <section aria-labelledby="steps-heading">
          <h2 id="steps-heading">Steps</h2>
          <ol className="steps">
            {recipe.steps.map((s, i) => (
              <li key={i}>
                {s.text}
                {s.minutes !== undefined && <span className="muted"> ({humanDuration(s.minutes)})</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

/** Your imported recipes, or one of them when the link has ?id=. */
export function MyRecipes() {
  const id = useSearchParams().get("id");
  const mine = validMyRecipes(useStore(myRecipesStore));

  if (id) {
    const recipe = mine.find((r) => r.slug === `my-${id}`);
    if (recipe) return <MyRecipeView key={recipe.slug} recipe={recipe} />;
    return (
      <>
        <h1>Recipe not found</h1>
        <p className="empty">
          Imported recipes are saved on the device you imported them on. See <Link href="/my-recipes/">your
          recipes</Link> or <Link href="/import/">import one</Link>.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Your recipes</h1>
      <p className="lede">Recipes you imported. Scale them, cook them hands-free, and add them to your shopping list.</p>
      <p>
        <Link href="/import/" className="button primary">
          Import a recipe
        </Link>
      </p>
      {mine.length === 0 ? (
        <p className="empty">Nothing here yet. Paste a recipe from anywhere to get started.</p>
      ) : (
        <ul className="my-recipes">
          {mine.map((r) => (
            <li key={r.slug} className="match">
              <div>
                <Link href={recipeHref(r)} className="match-name">
                  {r.name}
                </Link>
                <p className="match-status muted">
                  {r.servings} servings · {r.ingredients.length} ingredients · {r.steps.length} steps
                </p>
              </div>
              <DeleteButton recipe={r} />
            </li>
          ))}
        </ul>
      )}
      <BackupControls recipes={mine} />
    </>
  );
}
