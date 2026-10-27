import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportPage } from "@/components/ImportPage";

export const metadata: Metadata = {
  title: "Import a recipe",
  description: "Paste any recipe to scale it, convert units, and cook it step by step, even hands-free.",
  alternates: { canonical: "/import/" },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <>
          <h1>Import a recipe</h1>
          <p className="muted">Loading…</p>
        </>
      }
    >
      <ImportPage />
    </Suspense>
  );
}
