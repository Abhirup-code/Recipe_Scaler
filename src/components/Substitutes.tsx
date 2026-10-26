"use client";

import { useId, useState } from "react";
import { curatedProvider, type Substitution, type SubstitutionContext, type SubstitutionProvider } from "@/lib/substitutions";

/** "Out of it?" button that shows substitutes for one ingredient. */
export function Substitutes({
  ingredient,
  context,
  provider = curatedProvider,
}: {
  ingredient: string;
  context: SubstitutionContext;
  provider?: SubstitutionProvider;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Substitution[] | null>(null);
  const panelId = useId();

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items === null) setItems(await provider.suggest(ingredient, context));
  }

  return (
    <>
      <button type="button" className="link-button" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        Out of it?
      </button>
      {open && (
        <div id={panelId} className="subs" role="region" aria-label={`Substitutes for ${ingredient}`}>
          {items === null ? (
            <p>Finding substitutes…</p>
          ) : items.length === 0 ? (
            <p>No reliable substitute for this one.</p>
          ) : (
            <ul>
              {items.map((s) => (
                <li key={s.use}>
                  {s.use}
                  {s.note && <span className="muted"> {s.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
