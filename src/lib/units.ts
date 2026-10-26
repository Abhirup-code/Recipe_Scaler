import type { CountUnit, Unit, UnitSystem, VolumeUnit, WeightUnit } from "./types";

export const ML_PER: Record<VolumeUnit, number> = { tsp: 4.92892, tbsp: 14.7868, cup: 236.588, ml: 1, l: 1000 };
export const G_PER: Record<WeightUnit, number> = { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 };
const COUNT_UNITS: readonly CountUnit[] = ["piece", "clove", "can", "pinch", "bunch", "stalk"];

export type UnitKind = "volume" | "weight" | "count";

export function kindOf(unit: Unit): UnitKind {
  if (unit in ML_PER) return "volume";
  if (unit in G_PER) return "weight";
  return "count";
}

export function isCountUnit(unit: Unit): unit is CountUnit {
  return (COUNT_UNITS as readonly string[]).includes(unit);
}

/** Convert to the base unit of its kind: millilitres, grams, or the count itself. */
export function toBase(qty: number, unit: Unit): number {
  if (unit in ML_PER) return qty * ML_PER[unit as VolumeUnit];
  if (unit in G_PER) return qty * G_PER[unit as WeightUnit];
  return qty;
}

/** Pick the unit a cook would use for this amount in the chosen system. */
export function bestVolumeUnit(ml: number, system: UnitSystem): VolumeUnit {
  if (system === "metric") return ml >= 1000 ? "l" : "ml";
  if (ml < ML_PER.tbsp - 0.01) return "tsp";
  if (ml < ML_PER.cup / 4 - 0.01) return "tbsp";
  return "cup";
}

export function bestWeightUnit(g: number, system: UnitSystem): WeightUnit {
  if (system === "metric") return g >= 1000 ? "kg" : "g";
  return g >= G_PER.lb - 0.01 ? "lb" : "oz";
}

export interface Amount {
  qty: number;
  unit: Unit;
}

/**
 * Express an amount in the chosen unit system, using the most natural unit.
 * In metric, volumes of dry or solid ingredients with a known density are shown as weight.
 */
export function convert(amount: Amount, system: UnitSystem, gramsPerCup?: number): Amount {
  const { qty, unit } = amount;
  const kind = kindOf(unit);
  if (kind === "count") return amount;
  if (kind === "volume") {
    const ml = toBase(qty, unit);
    if (system === "metric" && gramsPerCup) {
      const g = (ml / ML_PER.cup) * gramsPerCup;
      const target = bestWeightUnit(g, system);
      return { qty: g / G_PER[target], unit: target };
    }
    const target = bestVolumeUnit(ml, system);
    return { qty: ml / ML_PER[target], unit: target };
  }
  const g = toBase(qty, unit);
  const target = bestWeightUnit(g, system);
  return { qty: g / G_PER[target], unit: target };
}
