import type { Metadata } from "next";
import { PantryView } from "@/components/PantryView";
import { recipes } from "@/data/recipes";

export const metadata: Metadata = {
  title: "What can I cook?",
  description: "Tick the ingredients you have at home and see which recipes you can make right now.",
  alternates: { canonical: "/pantry/" },
};

export default function PantryPage() {
  return (
    <>
      <h1>What can I cook?</h1>
      <p className="lede">Tell us what is in your kitchen. Recipes you can make right now come first.</p>
      <PantryView recipes={recipes} />
    </>
  );
}
