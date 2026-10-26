const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Public URL of the site, used for canonical links, the sitemap, and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:3000${basePath}`).replace(/\/$/, "");
export const SITE_NAME = "Recipe Scaler";
/** Prefix for files in /public (images), which Next.js does not prefix automatically in static export. */
export const asset = (path: string) => `${basePath}${path}`;
