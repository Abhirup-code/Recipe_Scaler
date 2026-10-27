"use client";

import { useId, useState, type FormEvent } from "react";
import { canScaleBy, defaultInputUnit, factorFor, inputUnits } from "@/lib/scaleBy";
import type { Recipe, Unit, UnitSystem } from "@/lib/types";
import { MAX_SERVINGS } from "./ServingsStepper";

const MIN_SERVINGS = 0.5;

/**
 * "I only have 300 g of lentils": pick an ingredient, enter how much you have,
 * and the whole recipe rescales around it.
 */
export function ScaleByIngredient({
  recipe,
  system,
  onScale,
}: {
  recipe: Recipe;
  system: UnitSystem;
  onScale: (servings: number, description: string, ingredient: string) => void;
}) {
  const options = recipe.ingredients.map((ing, i) => ({ ing, i })).filter(({ ing }) => canScaleBy(ing));
  const [choice, setChoice] = useState(options[0]?.i ?? -1);
  const ingredient = recipe.ingredients[choice];
  const [unit, setUnit] = useState<Unit | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  if (!ingredient) return null;
  const units = inputUnits(ingredient);
  const activeUnit = unit && units.includes(unit) ? unit : defaultInputUnit(ingredient, system);

  function submit(e: FormEvent) {
    e.preventDefault();
    const have = Number(amount.replace(",", "."));
    const factor = factorFor(ingredient!, have, activeUnit);
    if (factor === null) {
      setError("Enter how much you have, as a number above zero.");
      return;
    }
    const servings = Math.round(recipe.servings * factor * 100) / 100; // 5.9999999 is 6
    if (servings > MAX_SERVINGS) {
      setError(`That is enough for about ${Math.round(servings)} servings. This recipe scales up to ${MAX_SERVINGS}.`);
      return;
    }
    if (servings < MIN_SERVINGS) {
      setError("That is less than half a serving. Try a larger amount.");
      return;
    }
    setError(null);
    const what = activeUnit === "piece" ? ingredient!.name : `${activeUnit} ${ingredient!.name}`;
    onScale(servings, `${have} ${what}`, ingredient!.name);
  }

  return (
    <details className="scale-by">
      <summary>Scale to what you have</summary>
      <form onSubmit={submit} noValidate>
        <p className="muted">Only have so much of one ingredient? Enter it and everything else adjusts to match.</p>
        <div className="scale-by-fields">
          <div className="field">
            <label htmlFor={`${id}-ing`}>Ingredient</label>
            <select
              id={`${id}-ing`}
              value={choice}
              onChange={(e) => {
                setChoice(Number(e.target.value));
                setUnit(null);
                setError(null);
              }}
            >
              {options.map(({ ing, i }) => (
                <option key={i} value={i}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${id}-amt`}>You have</label>
            <input
              id={`${id}-amt`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 300"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-err` : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-unit`}>Unit</label>
            <select
              id={`${id}-unit`}
              value={activeUnit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              disabled={units.length === 1}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u === "piece" ? "whole" : u}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <p id={`${id}-err`} className="field-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button">
          Scale recipe
        </button>
      </form>
    </details>
  );
}
