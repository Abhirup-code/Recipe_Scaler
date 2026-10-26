import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RecipePanel } from "@/components/RecipePanel";
import { getRecipe, recipes } from "@/data/recipes";
import { humanDuration } from "@/lib/duration";
import { recipeJsonLd, serializeJsonLd } from "@/lib/schema";
import { asset, SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipe = getRecipe((await params).slug);
  if (!recipe) return {};
  const url = `/recipes/${recipe.slug}/`;
  return {
    title: recipe.name,
    description: recipe.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: recipe.name,
      description: recipe.description,
      url,
      images: [{ url: `${SITE_URL}${recipe.image}`, width: 1200, height: 800, alt: recipe.imageAlt }],
    },
  };
}

export default async function RecipePage({ params }: Props) {
  const recipe = getRecipe((await params).slug);
  if (!recipe) notFound();

  return (
    <article className="recipe">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(recipeJsonLd(recipe, SITE_URL)) }}
      />
      <header>
        <p className="eyebrow">
          {recipe.cuisine} · {recipe.category}
        </p>
        <h1>{recipe.name}</h1>
        <p className="lede">{recipe.description}</p>
        <dl className="facts">
          <div>
            <dt>Prep</dt>
            <dd>{humanDuration(recipe.prepMinutes)}</dd>
          </div>
          <div>
            <dt>Cook</dt>
            <dd>{humanDuration(recipe.cookMinutes)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{humanDuration(recipe.prepMinutes + recipe.cookMinutes)}</dd>
          </div>
        </dl>
      </header>
      <Image
        className="hero-image"
        src={asset(recipe.image)}
        alt={recipe.imageAlt}
        width={1200}
        height={800}
        sizes="(min-width: 960px) 900px, 100vw"
        priority
      />
      <RecipePanel recipe={recipe} />
      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading">Steps</h2>
        <ol className="steps">
          {recipe.steps.map((s, i) => (
            <li key={i} id={`step-${i + 1}`}>
              {s.text}
              {s.minutes !== undefined && <span className="muted"> ({humanDuration(s.minutes)})</span>}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
