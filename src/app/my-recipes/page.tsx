import type { Metadata } from "next";
import { Suspense } from "react";
import { MyRecipes } from "@/components/MyRecipes";

export const metadata: Metadata = {
  title: "Your recipes",
  description: "Recipes you imported, saved on this device.",
  robots: { index: false, follow: true },
};

export default function MyRecipesPage() {
  return (
    <Suspense fallback={<p className="muted">Loading your recipes…</p>}>
      <MyRecipes />
    </Suspense>
  );
}
