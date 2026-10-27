"use client";

import { useState, type ChangeEvent } from "react";
import { track } from "@/lib/analytics";
import { backupJson, MAX_BACKUP_BYTES, myRecipesStore, restoreBackup } from "@/lib/myRecipes";
import type { Recipe } from "@/lib/types";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Download your imported recipes as a file, or bring them back from one (issue #6). */
export function BackupControls({ recipes }: { recipes: Recipe[] }) {
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  function exportBackup() {
    const now = new Date();
    const blob = new Blob([backupJson(recipes, now)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recipe-scaler-backup-${now.toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage({ text: `Downloaded a backup of ${plural(recipes.length, "recipe")}.`, error: false });
    track("backup_recipes", { recipes: recipes.length });
  }

  async function restore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be chosen again
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setMessage({ text: "That file is too large to be a Recipe Scaler backup.", error: true });
      return;
    }
    const result = restoreBackup(await file.text(), recipes);
    if (!result.ok) {
      setMessage({ text: result.error, error: true });
      return;
    }
    myRecipesStore.set(result.recipes);
    const parts = [`Restored ${plural(result.added, "recipe")}.`];
    if (result.alreadyHere) parts.push(`${plural(result.alreadyHere, "recipe")} already here.`);
    if (result.invalid) parts.push(`Skipped ${result.invalid} damaged ${result.invalid === 1 ? "entry" : "entries"}.`);
    setMessage({ text: parts.join(" "), error: false });
    track("restore_recipes", { added: result.added });
  }

  return (
    <section className="backup" aria-labelledby="backup-heading">
      <h2 id="backup-heading">Back up</h2>
      <p className="muted">
        Your recipes live in this browser. Keep a backup file to move them to another device or restore them later.
      </p>
      <div className="actions">
        <button type="button" className="button" onClick={exportBackup} disabled={recipes.length === 0}>
          Download backup
        </button>
        <label className="button file-button">
          Restore from backup
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={restore}
          />
        </label>
      </div>
      <p className={message?.error ? "field-error" : "muted"} role="status">
        {message?.text}
      </p>
    </section>
  );
}
