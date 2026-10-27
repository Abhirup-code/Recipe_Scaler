"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { myRecipesStore, validMyRecipes } from "@/lib/myRecipes";
import { useStore } from "@/lib/useStore";
import { ImportRecipe } from "./ImportRecipe";

const noop = () => () => undefined;

/** /import/ imports a new recipe; /import/?edit=<id> reopens one you saved (issue #7). */
export function ImportPage() {
  const editId = useSearchParams().get("edit");
  const mine = validMyRecipes(useStore(myRecipesStore));
  // Saved recipes are only readable in the browser, after hydration.
  const ready = useSyncExternalStore(noop, () => true, () => false);

  if (!editId) {
    return (
      <>
        <h1>Import a recipe</h1>
        <p className="lede">
          Paste a recipe from anywhere. Then scale it, switch units, check it against your pantry, and cook it
          hands-free.
        </p>
        <ImportRecipe />
      </>
    );
  }
  if (!ready) return <p className="muted">Loading your recipe…</p>;
  const recipe = mine.find((r) => r.slug === `my-${editId}`);
  if (!recipe) {
    return (
      <>
        <h1>Recipe not found</h1>
        <p className="empty">
          Imported recipes are saved on the device you imported them on. See <Link href="/my-recipes/">your
          recipes</Link>.
        </p>
      </>
    );
  }
  return (
    <>
      <h1>Edit {recipe.name}</h1>
      <ImportRecipe key={recipe.slug} editing={recipe} />
    </>
  );
}
