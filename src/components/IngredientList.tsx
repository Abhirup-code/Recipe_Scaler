"use client";

import { displayIngredient } from "@/lib/ingredients";
import { hasCuratedSubstitute } from "@/lib/substitutions";
import type { Recipe, UnitSystem } from "@/lib/types";
import { Substitutes } from "./Substitutes";

export function IngredientList({ recipe, factor, system }: { recipe: Recipe; factor: number; system: UnitSystem }) {
  const context = { recipeName: recipe.name, cuisine: recipe.cuisine };
  return (
    <ul className="ingredients">
      {recipe.ingredients.map((ing, i) => {
        const d = displayIngredient(ing, factor, system);
        return (
          <li key={`${i}-${ing.name}`}>
            <span>
              {d.amount && <strong>{d.amount} </strong>}
              {d.unit && `${d.unit} `}
              {d.name}
              {d.note && <span className="muted">, {d.note}</span>}
            </span>
            {hasCuratedSubstitute(ing.name) && <Substitutes ingredient={ing.name} context={context} />}
          </li>
        );
      })}
    </ul>
  );
}
