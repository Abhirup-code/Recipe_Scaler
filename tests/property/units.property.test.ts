import fc from "fast-check";
import { formatAmount, roundCount } from "@/lib/format";
import { factorFor } from "@/lib/scaleBy";
import type { Ingredient, Unit } from "@/lib/types";
import { convert, kindOf, toBase } from "@/lib/units";

const runs = { numRuns: 500 };
const volume = fc.constantFrom<Unit>("tsp", "tbsp", "cup", "ml", "l");
const weight = fc.constantFrom<Unit>("g", "kg", "oz", "lb");
const qty = fc.double({ min: 0.001, max: 10_000, noNaN: true });
const system = fc.constantFrom("us", "metric" as const);

describe("unit conversion properties", () => {
  it("converting never changes how much there is", () => {
    fc.assert(
      fc.property(qty, fc.oneof(volume, weight), system, (q, unit, sys) => {
        const out = convert({ qty: q, unit }, sys);
        expect(kindOf(out.unit)).toBe(kindOf(unit));
        expect(toBase(out.qty, out.unit)).toBeCloseTo(toBase(q, unit), 6);
      }),
      runs,
    );
  });

  it("always shows something readable for a real amount", () => {
    fc.assert(
      fc.property(qty, fc.oneof(volume, weight, fc.constantFrom<Unit>("piece", "clove", "can")), system, (q, unit, sys) => {
        const text = formatAmount(q, unit, sys);
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toMatch(/NaN|Infinity|undefined/);
      }),
      runs,
    );
  });

  it("rounds whole items to halves under 2 and whole numbers above, never to zero", () => {
    fc.assert(
      fc.property(fc.double({ min: 0.0001, max: 500, noNaN: true }), (q) => {
        const r = roundCount(q);
        expect(r).toBeGreaterThan(0);
        expect(Math.abs(r - q)).toBeLessThanOrEqual(0.5 + 1e-9);
        if (r >= 2) expect(Number.isInteger(r)).toBe(true);
        else expect(Number.isInteger(r * 2)).toBe(true);
      }),
      runs,
    );
  });

  it("scaling to what you have uses exactly the amount you have", () => {
    fc.assert(
      fc.property(qty, volume, qty, volume, (need, needUnit, have, haveUnit) => {
        const ingredient: Ingredient = { qty: need, unit: needUnit, name: "milk" };
        const factor = factorFor(ingredient, have, haveUnit)!;
        expect(toBase(need * factor, needUnit)).toBeCloseTo(toBase(have, haveUnit), 6);
      }),
      runs,
    );
  });
});
