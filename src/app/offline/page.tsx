import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <section className="hero">
      <h1>You&apos;re offline</h1>
      <p>
        This page hasn&apos;t been saved on your device yet. Recipes you have already opened still work. Try your{" "}
        <Link href="/saved/">saved recipes</Link> or <Link href="/shopping-list/">shopping list</Link>.
      </p>
    </section>
  );
}
