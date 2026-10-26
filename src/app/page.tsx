import { RecipeSearch } from "@/components/RecipeSearch";
import { recipes } from "@/data/recipes";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Cook anything, for any number of people</h1>
        <p>Scale servings, switch between US and metric, and follow along step by step in cook mode.</p>
      </section>
      <RecipeSearch recipes={recipes} />
    </>
  );
}
