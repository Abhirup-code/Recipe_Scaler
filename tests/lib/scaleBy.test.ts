import { canScaleBy, defaultInputUnit, factorFor, inputUnits } from "@/lib/scaleBy";
import type { Ingredient } from "@/lib/types";

const lentils: Ingredient = { qty: 1, unit: "cup", name: "red lentils", gramsPerCup: 190 };
const milk: Ingredient = { qty: 2, unit: "cup", name: "milk" };
const chicken: Ingredient = { qty: 1.5, unit: "lb", name: "chicken thighs" };
const eggs: Ingredient = { qty: 2, name: "large eggs" };
const garlic: Ingredient = { qty: 4, unit: "clove", name: "garlic" };
const salt: Ingredient = { name: "salt" };

describe("scale by what you have", () => {
  it("only offers ingredients with a real amount", () => {
    expect(canScaleBy(lentils)).toBe(true);
    expect(canScaleBy(salt)).toBe(false);
    expect(inputUnits(salt)).toEqual([]);
    expect(factorFor(salt, 1, "g")).toBeNull();
  });

  it("offers units of the same kind, plus weight for dry goods measured in cups", () => {
    expect(inputUnits(milk)).toEqual(["cup", "tbsp", "tsp", "ml", "l"]);
    expect(inputUnits(lentils)).toEqual(["cup", "tbsp", "tsp", "ml", "l", "g", "kg", "oz", "lb"]);
    expect(inputUnits(chicken)).toEqual(["g", "kg", "oz", "lb"]);
    expect(inputUnits(eggs)).toEqual(["piece"]);
    expect(inputUnits(garlic)).toEqual(["clove"]);
  });

  it("suggests the recipe's unit in US mode and grams or millilitres in metric", () => {
    expect(defaultInputUnit(lentils, "us")).toBe("cup");
    expect(defaultInputUnit(lentils, "metric")).toBe("g");
    expect(defaultInputUnit(milk, "metric")).toBe("ml");
    expect(defaultInputUnit(chicken, "metric")).toBe("g");
    expect(defaultInputUnit(eggs, "metric")).toBe("piece");
  });

  it("works out the multiplier in the same unit", () => {
    expect(factorFor(lentils, 2, "cup")).toBeCloseTo(2);
    expect(factorFor(eggs, 3, "piece")).toBeCloseTo(1.5);
    expect(factorFor(garlic, 2, "clove")).toBeCloseTo(0.5);
  });

  it("converts between units of the same kind", () => {
    expect(factorFor(milk, 1, "l")).toBeCloseTo(1000 / (2 * 236.588));
    expect(factorFor(chicken, 1, "kg")).toBeCloseTo(1000 / (1.5 * 453.592));
  });

  it("converts a weight you have into the recipe's cups using the ingredient's density", () => {
    expect(factorFor(lentils, 380, "g")).toBeCloseTo(2);
    expect(factorFor(lentils, 95, "g")).toBeCloseTo(0.5);
  });

  it("rejects amounts and units that make no sense", () => {
    expect(factorFor(lentils, 0, "g")).toBeNull();
    expect(factorFor(lentils, -1, "g")).toBeNull();
    expect(factorFor(lentils, Number.NaN, "g")).toBeNull();
    expect(factorFor(milk, 100, "g")).toBeNull();
    expect(factorFor(eggs, 2, "g")).toBeNull();
  });
});
