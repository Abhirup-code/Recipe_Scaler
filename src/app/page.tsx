import Link from "next/link";
import { RecipeSearch } from "@/components/RecipeSearch";
import { recipes } from "@/data/recipes";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Cook anything, for any number of people</h1>
        <p>
          Scale servings or scale to what you have, switch between US and metric, and follow along step by step in
          cook mode, even hands-free by voice.
        </p>
        <p>
          <Link href="/pantry/" className="button">
            What can I cook with what I have?
          </Link>
        </p>
        <p>
          <Link href="/import/" className="button">
            Import your own recipe
          </Link>
        </p>
      </section>
      <RecipeSearch recipes={recipes} />
    </>
  );
}
