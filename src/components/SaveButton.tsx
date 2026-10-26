"use client";

import { track } from "@/lib/analytics";
import { toggleSaved } from "@/lib/saved";
import { savedStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";

export function SaveButton({ slug, name }: { slug: string; name: string }) {
  const saved = useStore(savedStore);
  const isSaved = saved.includes(slug);
  return (
    <button
      type="button"
      className="button save-button"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${name} from saved recipes` : `Save ${name}`}
      onClick={() => {
        savedStore.set(toggleSaved(saved, slug));
        if (!isSaved) track("save_recipe", { recipe: slug });
      }}
    >
      <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span> {isSaved ? "Saved" : "Save"}
    </button>
  );
}
