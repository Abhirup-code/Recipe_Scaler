import { recipes } from "@/data/recipes";
import { buildShoppingList, listToText, removeEntry, upsertEntry } from "@/lib/shoppingList";
import type { Recipe } from "@/lib/types";

const base: Omit<Recipe, "slug" | "name" | "ingredients" | "servings"> = {
  description: "",
  cuisine: "",
  category: "",
  prepMinutes: 0,
  cookMinutes: 0,
  image: "",
  imageAlt: "",
  tags: [],
  datePublished: "2026-01-01",
  steps: [],
};
const a: Recipe = {
  ...base,
  slug: "a",
  name: "A",
  servings: 2,
  ingredients: [
    { qty: 1, unit: "cup", name: "Milk" },
    { qty: 2, unit: "clove", name: "garlic" },
    { name: "salt" },
  ],
};
const b: Recipe = {
  ...base,
  slug: "b",
  name: "B",
  servings: 4,
  ingredients: [
    { qty: 4, unit: "tbsp", name: "milk" },
    { qty: 1, unit: "clove", name: "Garlic" },
    { name: "salt" },
  ],
};

describe("shopping list", () => {
  it("adds the same ingredient across recipes, even in different units", () => {
    const items = buildShoppingList([{ slug: "a", servings: 2 }, { slug: "b", servings: 4 }], [a, b], "us");
    const milk = items.find((i) => i.name.toLowerCase() === "milk");
    expect(milk).toMatchObject({ amount: "1¼", unit: "cups", recipes: ["A", "B"] });
    expect(items.find((i) => i.name.toLowerCase() === "garlic")).toMatchObject({ amount: "3", unit: "cloves" });
    expect(items.find((i) => i.name === "salt")).toMatchObject({ amount: "", unit: "" });
  });

  it("scales by the servings chosen for each recipe", () => {
    const items = buildShoppingList([{ slug: "a", servings: 4 }], [a], "us");
    expect(items.find((i) => i.name === "Milk")).toMatchObject({ amount: "2", unit: "cups" });
  });

  it("shows metric amounts and ignores unknown recipes", () => {
    const items = buildShoppingList([{ slug: "a", servings: 2 }, { slug: "gone", servings: 2 }], [a], "metric");
    expect(items.find((i) => i.name === "Milk")).toMatchObject({ amount: "235", unit: "ml" });
  });

  it("shows weights and density-based weights", () => {
    const items = buildShoppingList(
      [
        { slug: "one-pan-chicken-curry", servings: 4 },
        { slug: "buttermilk-pancakes", servings: 4 },
      ],
      recipes,
      "metric",
    );
    expect(items.find((i) => i.name === "chicken thighs")).toMatchObject({ amount: "680", unit: "g" });
    expect(items.find((i) => i.name === "all-purpose flour")).toMatchObject({ amount: "250", unit: "g" });
    const us = buildShoppingList([{ slug: "one-pan-chicken-curry", servings: 4 }], recipes, "us");
    expect(us.find((i) => i.name === "chicken thighs")).toMatchObject({ amount: "1½", unit: "lb" });
  });

  it("adds, updates, and removes recipes", () => {
    let entries = upsertEntry([], { slug: "a", servings: 2 });
    entries = upsertEntry(entries, { slug: "a", servings: 6 });
    expect(entries).toEqual([{ slug: "a", servings: 6 }]);
    expect(removeEntry(entries, "a")).toEqual([]);
  });

  it("exports plain text", () => {
    const items = buildShoppingList([{ slug: "a", servings: 2 }], [a], "us");
    expect(listToText(items)).toContain("- 1 cup Milk");
    expect(listToText(items)).toContain("- salt");
  });
});
