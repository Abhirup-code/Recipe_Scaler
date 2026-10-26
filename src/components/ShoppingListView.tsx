"use client";

import Link from "next/link";
import { useState } from "react";
import { recipes } from "@/data/recipes";
import { buildShoppingList, listToText, removeEntry, upsertEntry } from "@/lib/shoppingList";
import { checkedStore, shoppingListStore, unitSystemStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";
import { ServingsStepper } from "./ServingsStepper";
import { UnitToggle } from "./UnitToggle";

export function ShoppingListView() {
  const entries = useStore(shoppingListStore);
  const checked = useStore(checkedStore);
  const system = useStore(unitSystemStore);
  const [copied, setCopied] = useState(false);

  if (entries.length === 0) {
    return (
      <p className="empty">
        Your list is empty. Open a <Link href="/">recipe</Link> and choose “Add to shopping list”.
      </p>
    );
  }

  const items = buildShoppingList(entries, recipes, system);
  const toggle = (key: string) =>
    checkedStore.set(checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(listToText(items));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <section aria-labelledby="list-recipes" className="panel">
        <div className="panel-head">
          <h2 id="list-recipes">Recipes</h2>
          <UnitToggle value={system} onChange={(v) => unitSystemStore.set(v)} />
        </div>
        <ul className="list-recipes">
          {entries.map((e) => {
            const recipe = recipes.find((r) => r.slug === e.slug);
            if (!recipe) return null;
            return (
              <li key={e.slug}>
                <Link href={`/recipes/${e.slug}/`}>{recipe.name}</Link>
                <ServingsStepper
                  value={e.servings}
                  onChange={(n) => shoppingListStore.set(upsertEntry(entries, { slug: e.slug, servings: n }))}
                />
                <button
                  type="button"
                  className="link-button"
                  onClick={() => shoppingListStore.set(removeEntry(entries, e.slug))}
                  aria-label={`Remove ${recipe.name}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="list-items" className="panel">
        <div className="panel-head">
          <h2 id="list-items">To buy ({items.length - items.filter((i) => checked.includes(i.key)).length})</h2>
          <div className="actions">
            <button type="button" className="button" onClick={copy}>
              {copied ? "Copied ✓" : "Copy list"}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                shoppingListStore.set([]);
                checkedStore.set([]);
              }}
            >
              Clear
            </button>
          </div>
        </div>
        <ul className="checklist">
          {items.map((item) => (
            <li key={item.key}>
              <label className={checked.includes(item.key) ? "done" : undefined}>
                <input type="checkbox" checked={checked.includes(item.key)} onChange={() => toggle(item.key)} />
                <span>
                  {item.amount && <strong>{item.amount} </strong>}
                  {item.unit && `${item.unit} `}
                  {item.name}
                  <span className="muted"> · {item.recipes.join(", ")}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
