import type { MetadataRoute } from "next";
import { recipes } from "@/data/recipes";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/pantry/`, changeFrequency: "monthly", priority: 0.6 },
    ...recipes.map((r) => ({
      url: `${SITE_URL}/recipes/${r.slug}/`,
      lastModified: r.datePublished,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
