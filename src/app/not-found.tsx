import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero">
      <h1>We couldn&apos;t find that recipe</h1>
      <p>
        It may have moved. <Link href="/">Browse all recipes</Link>.
      </p>
    </section>
  );
}
