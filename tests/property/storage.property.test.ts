import fc from "fast-check";
import { validCooked } from "@/lib/cooked";
import { isMyRecipe, restoreBackup, validMyRecipes } from "@/lib/myRecipes";
import { readSharedView } from "@/lib/share";

const runs = { numRuns: 500 };

describe("untrusted input properties", () => {
  it("restoring any file never throws and never lets a malformed recipe in", () => {
    const backupLike = fc.record({
      app: fc.oneof(fc.constant("recipe-scaler"), fc.string()),
      version: fc.oneof(fc.constant(1), fc.anything()),
      recipes: fc.oneof(fc.array(fc.anything(), { maxLength: 5 }), fc.anything()),
    });
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), backupLike.map((b) => JSON.stringify(b))), (text) => {
        const result = restoreBackup(text, []);
        if (result.ok) for (const r of result.recipes) expect(isMyRecipe(r)).toBe(true);
        else expect(result.error.length).toBeGreaterThan(0);
      }),
      runs,
    );
  });

  it("whatever is in storage, only valid recipes and history come out", () => {
    fc.assert(
      fc.property(fc.anything(), (stored) => {
        for (const r of validMyRecipes(stored)) expect(isMyRecipe(r)).toBe(true);
        for (const e of validCooked(stored)) expect(e.count).toBeGreaterThanOrEqual(1);
      }),
      runs,
    );
  });

  it("any shared link gives servings in range and a known unit system, or nothing", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (servings, units) => {
        const view = readSharedView(`?servings=${encodeURIComponent(servings)}&units=${encodeURIComponent(units)}`);
        if (view.servings !== undefined) {
          expect(view.servings).toBeGreaterThanOrEqual(0.5);
          expect(view.servings).toBeLessThanOrEqual(48);
        }
        if (view.units !== undefined) expect(["us", "metric"]).toContain(view.units);
      }),
      runs,
    );
  });
});
