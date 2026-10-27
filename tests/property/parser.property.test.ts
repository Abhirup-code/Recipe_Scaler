/**
 * Property-based tests (fuzzing): fast-check generates thousands of random inputs and checks
 * that rules which must always hold really do. A failure prints the smallest input that breaks it.
 */
import fc from "fast-check";
import { amountText, MAX_RECIPE_TEXT, parseIngredient, parseQuantity, parseRecipeText, recipeToText } from "@/lib/parseRecipe";
import type { Ingredient, Unit } from "@/lib/types";

const runs = { numRuns: 400 };

// Lines that look like recipes: amounts, units, words, bullets, headings, and plain noise.
const recipeish = fc.array(
  fc.oneof(
    fc.string({ maxLength: 60 }),
    fc.constantFrom("Ingredients", "Instructions", "## Method", "Serves 4", "Makes 12", "Yield: 0", "Serves 9999", ""),
    fc.tuple(
      fc.constantFrom("", "- ", "* ", "1. ", "• "),
      fc.constantFrom("1", "1 1/2", "½", "2-3", "0", "3/0", "1,5", "999999"),
      fc.constantFrom(" cup", " T", " t", " grams", " lbs", " cloves of", " ", ""),
      fc.string({ maxLength: 20 }),
    ).map((parts) => parts.join("")),
  ),
  { maxLength: 80 },
).map((lines) => lines.join("\n"));

describe("recipe parser properties", () => {
  it("never throws, and always returns a usable recipe, for any text at all", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string({ maxLength: 3000 }), recipeish), (text) => {
        const r = parseRecipeText(text);
        expect(r.name.length).toBeGreaterThan(0);
        expect(r.name.length).toBeLessThanOrEqual(120);
        expect(Number.isInteger(r.servings)).toBe(true);
        expect(r.servings).toBeGreaterThanOrEqual(1);
        expect(r.servings).toBeLessThanOrEqual(48);
        expect(r.ingredients.length).toBeLessThanOrEqual(100);
        expect(r.steps.length).toBeLessThanOrEqual(60);
        for (const i of r.ingredients) {
          if (i.qty !== undefined) expect(Number.isFinite(i.qty) && i.qty > 0).toBe(true);
        }
        for (const s of r.steps) if (s.minutes !== undefined) expect(s.minutes).toBeGreaterThan(0);
      }),
      runs,
    );
  });

  it("only reads the first part of a huge paste", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 5 }), (chunk) => {
        const text = chunk.repeat(Math.ceil((MAX_RECIPE_TEXT + 100) / chunk.length));
        expect(() => parseRecipeText(text)).not.toThrow();
      }),
      { numRuns: 30 },
    );
  });

  it("reads back any kitchen amount it writes", () => {
    const amount = fc
      .tuple(fc.integer({ min: 0, max: 50 }), fc.constantFrom(0, 1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4))
      .map(([whole, part]) => whole + part)
      .filter((q) => q > 0);
    fc.assert(
      fc.property(amount, (q) => {
        expect(parseQuantity(`${amountText(q)} cups flour`)?.qty).toBeCloseTo(q, 2);
      }),
      runs,
    );
  });

  it("never reads a zero, negative, or infinite amount", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 30 }), (line) => {
        const q = parseQuantity(line);
        if (q) expect(Number.isFinite(q.qty) && q.qty > 0).toBe(true);
        const ing = parseIngredient(line);
        if (ing.qty !== undefined) expect(ing.qty).toBeGreaterThan(0);
      }),
      runs,
    );
  });

  it("round-trips any well-formed recipe through text", () => {
    const word = fc.constantFrom("rice", "beans", "olive oil", "red pepper", "cheese", "eggs", "spinach", "lemon zest");
    const unit = fc.constantFrom<Unit | undefined>(undefined, "cup", "tbsp", "tsp", "g", "kg", "ml", "oz", "lb", "clove", "can");
    const qty = fc.oneof(fc.constant(undefined), fc.constantFrom(0.25, 0.5, 1, 1.5, 2, 3, 250));
    const ingredient = fc
      .record({ qty, unit, name: word, note: fc.option(fc.constantFrom("chopped", "drained and rinsed", "to serve"), { nil: undefined }) })
      .map(({ qty, unit, name, note }): Ingredient => {
        const i: Ingredient = { name };
        if (qty !== undefined) {
          i.qty = qty;
          if (unit) i.unit = unit;
        }
        if (note) i.note = note;
        return i;
      });
    const recipe = fc.record({
      name: fc.constantFrom("Weeknight Bowl", "Sunday Stew", "Quick Lunch"),
      servings: fc.integer({ min: 1, max: 48 }),
      ingredients: fc.array(ingredient, { minLength: 1, maxLength: 15 }),
      steps: fc.array(fc.constantFrom("Stir well.", "Simmer for 10 minutes.", "Serve hot."), { minLength: 1, maxLength: 8 }).map(
        (texts) => texts.map((text) => ({ text })),
      ),
    });
    fc.assert(
      fc.property(recipe, (r) => {
        const again = parseRecipeText(recipeToText(r));
        expect(again.name).toBe(r.name);
        expect(again.servings).toBe(r.servings);
        expect(again.steps.map((s) => s.text)).toEqual(r.steps.map((s) => s.text));
        // The parser may add a density (grams per cup) for known ingredients; everything else must match.
        expect(again.ingredients.map((i) => ({ ...i, gramsPerCup: undefined }))).toEqual(r.ingredients);
      }),
      runs,
    );
  });
});
