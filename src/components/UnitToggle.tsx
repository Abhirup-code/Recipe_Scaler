"use client";

import type { UnitSystem } from "@/lib/types";

const OPTIONS: Array<{ value: UnitSystem; label: string }> = [
  { value: "us", label: "US" },
  { value: "metric", label: "Metric" },
];

export function UnitToggle({ value, onChange }: { value: UnitSystem; onChange: (v: UnitSystem) => void }) {
  return (
    <div className="segmented" role="group" aria-label="Units">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
