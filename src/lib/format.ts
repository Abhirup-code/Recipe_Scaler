import type { Unit, UnitSystem } from "./types";

const FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

/** US-style amounts: whole numbers and kitchen fractions, e.g. 1.5 -> "1½", 0.333 -> "⅓". */
export function formatFraction(value: number): string {
  if (value <= 0) return "0";
  let whole = Math.floor(value);
  const rest = value - whole;
  let best = { diff: rest, glyph: "" };
  for (const [frac, glyph] of FRACTIONS) {
    const diff = Math.abs(rest - frac);
    if (diff < best.diff) best = { diff, glyph };
  }
  if (Math.abs(rest - 1) < best.diff) {
    whole += 1;
    best = { diff: 0, glyph: "" };
  }
  if (whole === 0 && best.glyph === "") return value < 0.0625 ? "a little" : "⅛";
  return `${whole > 0 ? whole : ""}${best.glyph}`;
}

/** Metric amounts: decimals for small numbers, whole numbers above 10, nearest 5 above 100. */
export function formatDecimal(value: number): string {
  if (value >= 100) return String(Math.round(value / 5) * 5);
  if (value >= 10) return String(Math.round(value));
  const rounded = Math.round(value * 10) / 10;
  return rounded === 0 ? "a little" : String(rounded);
}

const LABELS: Record<Unit, [string, string]> = {
  tsp: ["tsp", "tsp"],
  tbsp: ["tbsp", "tbsp"],
  cup: ["cup", "cups"],
  ml: ["ml", "ml"],
  l: ["l", "l"],
  g: ["g", "g"],
  kg: ["kg", "kg"],
  oz: ["oz", "oz"],
  lb: ["lb", "lb"],
  piece: ["", ""],
  clove: ["clove", "cloves"],
  can: ["can", "cans"],
  pinch: ["pinch", "pinches"],
  bunch: ["bunch", "bunches"],
  stalk: ["stalk", "stalks"],
};

export function unitLabel(unit: Unit, qty: number): string {
  const [one, many] = LABELS[unit];
  return qty > 1.0001 ? many : one;
}

/** Fractions read naturally for US cups and spoons and for counted items; decimals for metric. */
export function formatAmount(qty: number, unit: Unit, system: UnitSystem): string {
  const metricUnit = unit === "ml" || unit === "l" || unit === "g" || unit === "kg";
  return system === "metric" && metricUnit ? formatDecimal(qty) : formatFraction(qty);
}
