"use client";

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 48;

export function ServingsStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (n: number) => onChange(Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, n)));
  return (
    <div className="stepper" role="group" aria-label="Servings">
      <button type="button" onClick={() => set(value - 1)} disabled={value <= MIN_SERVINGS} aria-label="Fewer servings">
        −
      </button>
      <output aria-live="polite">
        {value} {value === 1 ? "serving" : "servings"}
      </output>
      <button type="button" onClick={() => set(value + 1)} disabled={value >= MAX_SERVINGS} aria-label="More servings">
        +
      </button>
    </div>
  );
}
