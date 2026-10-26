"use client";

import Link from "next/link";
import { recipes } from "@/data/recipes";
import { savedStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";
import { RecipeCard } from "./RecipeCard";

export function SavedRecipes() {
  const saved = useStore(savedStore);
  const items = saved.map((slug) => recipes.find((r) => r.slug === slug)).filter((r) => r !== undefined);

  if (items.length === 0) {
    return (
      <p className="empty">
        Nothing saved yet. Tap <strong>♡ Save</strong> on any <Link href="/">recipe</Link> to keep it here. Saved
        recipes also work offline once you have opened them.
      </p>
    );
  }
  return (
    <div className="grid">
      {items.map((r) => (
        <RecipeCard key={r.slug} recipe={r} />
      ))}
    </div>
  );
}
