import type { Metadata } from "next";
import { SavedRecipes } from "@/components/SavedRecipes";

export const metadata: Metadata = {
  title: "Saved recipes",
  description: "Recipes you saved on this device.",
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return (
    <>
      <h1>Saved recipes</h1>
      <SavedRecipes />
    </>
  );
}
