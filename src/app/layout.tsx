import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@/components/Analytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: `${SITE_NAME}: recipes that scale to your kitchen`, template: `%s | ${SITE_NAME}` },
  description:
    "Easy-to-follow recipes from around the world. Scale servings, switch between US and metric, cook step by step, and build a shopping list.",
  openGraph: { type: "website", siteName: SITE_NAME },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf3" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1712" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="brand">
            {SITE_NAME}
          </Link>
          <nav aria-label="Main">
            <Link href="/">Recipes</Link>
            <Link href="/saved/">Saved</Link>
            <Link href="/shopping-list/">Shopping list</Link>
          </nav>
        </header>
        <main id="main">{children}</main>
        <Analytics />
        <ServiceWorker />
        <footer className="site-footer">
          <p>
            Built by Abhirup Khan with Next.js, React, and TypeScript.{" "}
            <a href="https://github.com/Abhirup-code">GitHub</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
