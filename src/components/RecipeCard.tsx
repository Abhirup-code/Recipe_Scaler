import Image from "next/image";
import Link from "next/link";
import { humanDuration } from "@/lib/duration";
import { recipeHref } from "@/lib/myRecipes";
import { asset } from "@/lib/site";
import type { Recipe } from "@/lib/types";

export function RecipeCard({
  recipe,
  priority = false,
  meta,
  heading: Heading = "h2",
}: {
  recipe: Recipe;
  priority?: boolean;
  /** Replaces the cuisine and time line, e.g. "Cooked yesterday · 3 times". */
  meta?: string;
  heading?: "h2" | "h3";
}) {
  return (
    <article className="card">
      <Link href={recipeHref(recipe)}>
        {recipe.image ? (
          <Image
            src={asset(recipe.image.replace(/\.webp$/, "-600.webp"))}
            alt={recipe.imageAlt}
            width={600}
            height={400}
            sizes="(min-width: 960px) 300px, (min-width: 640px) 45vw, 100vw"
            priority={priority}
          />
        ) : (
          <div className="card-placeholder" aria-hidden="true">
            Your recipe
          </div>
        )}
        <Heading>{recipe.name}</Heading>
      </Link>
      <p className="muted">{meta ?? `${recipe.cuisine} · ${humanDuration(recipe.prepMinutes + recipe.cookMinutes)}`}</p>
    </article>
  );
}
