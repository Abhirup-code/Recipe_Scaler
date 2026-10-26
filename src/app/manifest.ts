import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Lets the site be installed on a phone's home screen and open like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Recipes",
    description: "Scale recipes, switch units, cook step by step, and build a shopping list. Works offline.",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#fffaf3",
    theme_color: "#b5421b",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${base}/icons/icon-192-maskable.png`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `${base}/icons/icon-512-maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
