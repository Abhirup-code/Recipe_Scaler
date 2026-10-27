"use client";

import { formatFraction } from "@/lib/format";

import { MAX_SERVINGS, MIN_SERVINGS } from "@/lib/limits";

export { MAX_SERVINGS, MIN_SERVINGS };

export function ServingsStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (n: number) => onChange(Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, n)));
  // After scaling to an ingredient, servings can be fractional (3½); the buttons step to whole numbers.
  const whole = Number.isInteger(value);
  const label = whole ? String(value) : formatFraction(Math.round(value * 4) / 4 || 0.25);
  return (
    <div className="stepper" role="group" aria-label="Servings">
      <button type="button" onClick={() => set(whole ? value - 1 : Math.floor(value))} disabled={value <= MIN_SERVINGS} aria-label="Fewer servings">
        −
      </button>
      <output aria-live="polite">
        {whole ? label : `about ${label}`} {value === 1 ? "serving" : "servings"}
      </output>
      <button type="button" onClick={() => set(whole ? value + 1 : Math.ceil(value))} disabled={value >= MAX_SERVINGS} aria-label="More servings">
        +
      </button>
    </div>
  );
}
