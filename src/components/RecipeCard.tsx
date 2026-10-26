import Image from "next/image";
import Link from "next/link";
import { humanDuration } from "@/lib/duration";
import { asset } from "@/lib/site";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe, priority = false }: { recipe: Recipe; priority?: boolean }) {
  return (
    <article className="card">
      <Link href={`/recipes/${recipe.slug}/`}>
        <Image
          src={asset(recipe.image.replace(/\.webp$/, "-600.webp"))}
          alt={recipe.imageAlt}
          width={600}
          height={400}
          sizes="(min-width: 960px) 300px, (min-width: 640px) 45vw, 100vw"
          priority={priority}
        />
        <h2>{recipe.name}</h2>
      </Link>
      <p className="muted">
        {recipe.cuisine} · {humanDuration(recipe.prepMinutes + recipe.cookMinutes)}
      </p>
    </article>
  );
}
