import type { Metadata } from "next";
import { ImportRecipe } from "@/components/ImportRecipe";

export const metadata: Metadata = {
  title: "Import a recipe",
  description: "Paste any recipe to scale it, convert units, and cook it step by step, even hands-free.",
  alternates: { canonical: "/import/" },
};

export default function ImportPage() {
  return (
    <>
      <h1>Import a recipe</h1>
      <p className="lede">
        Paste a recipe from anywhere. Then scale it, switch units, check it against your pantry, and cook it hands-free.
      </p>
      <ImportRecipe />
    </>
  );
}
