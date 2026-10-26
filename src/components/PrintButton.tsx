"use client";

import { track } from "@/lib/analytics";

export function PrintButton({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      className="button"
      onClick={() => {
        track("print_recipe", { recipe: slug });
        window.print();
      }}
    >
      Print
    </button>
  );
}
