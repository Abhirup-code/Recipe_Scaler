"use client";

import Link from "next/link";
import { useState } from "react";
import { myRecipesStore, recipeHref, withMyRecipes } from "@/lib/myRecipes";
import { BASICS, pantryKey } from "@/lib/pantry";
import { buildShoppingList, listToText, removeEntry, upsertEntry, type ShoppingItem } from "@/lib/shoppingList";
import { checkedStore, pantryStore, shoppingListStore, unitSystemStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";
import { ServingsStepper } from "./ServingsStepper";
import { UnitToggle } from "./UnitToggle";

export function ShoppingListView() {
  const entries = useStore(shoppingListStore);
  const checked = useStore(checkedStore);
  const system = useStore(unitSystemStore);
  const pantry = useStore(pantryStore);
  const recipes = withMyRecipes(useStore(myRecipesStore));
  const [copied, setCopied] = useState(false);

  if (entries.length === 0) {
    return (
      <p className="empty">
        Your list is empty. Open a <Link href="/">recipe</Link> and choose “Add to shopping list”.
      </p>
    );
  }

  const all = buildShoppingList(entries, recipes, system);
  // Things you said you already have (on the Pantry page) move out of the way, along with
  // the basics the Pantry page assumes. Without a pantry, everything stays on the list.
  const inKitchen = new Set(pantry);
  const have = (i: ShoppingItem) =>
    pantry.length > 0 && (inKitchen.has(pantryKey(i.name)) || BASICS.has(pantryKey(i.name)));
  const items = all.filter((i) => !have(i));
  const alreadyHave = all.filter(have);
  const toggle = (key: string) =>
    checkedStore.set(checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]);

  const checklist = (list: ShoppingItem[]) => (
    <ul className="checklist">
      {list.map((item) => (
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
  );

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
                <Link href={recipeHref(recipe)}>{recipe.name}</Link>
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
        {items.length === 0 ? (
          <p className="muted">You already have everything on this list.</p>
        ) : (
          checklist(items)
        )}
        {alreadyHave.length > 0 && (
          <details className="already-have">
            <summary>Already in your kitchen ({alreadyHave.length})</summary>
            {checklist(alreadyHave)}
            <p className="muted">
              From your <Link href="/pantry/">pantry</Link>. Untick an item there if you run out.
            </p>
          </details>
        )}
      </section>
    </>
  );
}
