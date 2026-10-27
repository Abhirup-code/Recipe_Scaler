import { recipes } from "@/data/recipes";
import { amountText, parseIngredient, parseQuantity, parseRecipeText, recipeToText, stepMinutes, toRecipe } from "@/lib/parseRecipe";

describe("parseQuantity", () => {
  it.each([
    ["2 cups flour", 2],
    ["1 1/2 cups flour", 1.5],
    ["1½ cups flour", 1.5],
    ["1 ½ cups flour", 1.5],
    ["3/4 cup milk", 0.75],
    ["¾ cup milk", 0.75],
    ["2.5 kg potatoes", 2.5],
    ["2,5 kg potatoes", 2.5],
    ["2-3 cloves garlic", 2],
    ["2 to 3 cloves garlic", 2],
  ])("reads %j as %s", (text, qty) => {
    expect(parseQuantity(text)?.qty).toBeCloseTo(qty);
  });

  it("leaves the rest of the line", () => {
    expect(parseQuantity("2-3 cloves garlic")?.rest).toBe("cloves garlic");
  });

  it.each(["salt", "0 eggs", "a pinch of salt", ""])("finds no amount in %j", (text) => {
    expect(parseQuantity(text)).toBeNull();
  });
});

describe("parseIngredient", () => {
  it.each([
    ["2 cups all-purpose flour, sifted", { qty: 2, unit: "cup", name: "all-purpose flour", note: "sifted", gramsPerCup: 125 }],
    ["1 tbsp olive oil", { qty: 1, unit: "tbsp", name: "olive oil" }],
    ["1 T butter", { qty: 1, unit: "tbsp", name: "butter" }],
    ["1 t salt", { qty: 1, unit: "tsp", name: "salt" }],
    ["2 Tablespoons sugar", { qty: 2, unit: "tbsp", name: "sugar" }],
    ["500 g chicken thighs (boneless)", { qty: 500, unit: "g", name: "chicken thighs", note: "boneless" }],
    ["1 lb. ground beef", { qty: 1, unit: "lb", name: "ground beef" }],
    ["3 cloves of garlic, minced", { qty: 3, unit: "clove", name: "garlic", note: "minced" }],
    ["1 can (14 oz) tomatoes", { qty: 1, unit: "can", name: "tomatoes", note: "14 oz" }],
    ["2 large eggs", { qty: 2, name: "large eggs" }],
    ["1 cup brown sugar", { qty: 1, unit: "cup", name: "brown sugar", gramsPerCup: 220 }],
    ["Salt, to taste", { name: "Salt", note: "to taste" }],
    ["fresh basil", { name: "fresh basil" }],
  ])("reads %j", (line, expected) => {
    expect(parseIngredient(line)).toEqual(expected);
  });

  it("does not mistake a word starting with a unit letter for a unit", () => {
    expect(parseIngredient("2 garlic cloves")).toEqual({ qty: 2, name: "garlic cloves" });
    expect(parseIngredient("4 tomatoes")).toEqual({ qty: 4, name: "tomatoes" });
    expect(parseIngredient("1 cucumber")).toEqual({ qty: 1, name: "cucumber" });
  });
});

describe("stepMinutes", () => {
  it.each([
    ["Simmer for 10 minutes.", 10],
    ["Bake 25-30 minutes until golden.", 25],
    ["Cook 5 to 7 mins.", 5],
    ["Roast for 1 hour.", 60],
    ["Roast for 1 hour 15 minutes.", 75],
    ["Rest 1.5 hours.", 90],
    ["Stir well.", undefined],
    ["Leave for 30 hours.", undefined],
  ])("%j -> %s", (text, minutes) => {
    expect(stepMinutes(text)).toBe(minutes);
  });
});

const WITH_HEADINGS = `
Grandma's Banana Bread
Serves 8

Ingredients
- 3 ripe bananas, mashed
- 1/3 cup melted butter
- ¾ cup sugar
- 1 1/2 cups all-purpose flour
- 1 tsp baking soda
- Pinch of salt

Instructions
1. Heat the oven to 350°F.
2. Mix everything together.
3. Bake for 55-60 minutes.
`;

describe("parseRecipeText", () => {
  it("reads a recipe with headings", () => {
    const r = parseRecipeText(WITH_HEADINGS);
    expect(r.name).toBe("Grandma's Banana Bread");
    expect(r.servings).toBe(8);
    expect(r.ingredients).toHaveLength(6);
    expect(r.ingredients[0]).toEqual({ qty: 3, name: "ripe bananas", note: "mashed" });
    expect(r.ingredients[1]).toEqual({ qty: 0.333, unit: "cup", name: "melted butter", gramsPerCup: 227 });
    expect(r.ingredients[5]).toEqual({ name: "Pinch of salt" });
    expect(r.steps).toEqual([
      { text: "Heat the oven to 350°F." },
      { text: "Mix everything together." },
      { text: "Bake for 55-60 minutes.", minutes: 55 },
    ]);
    expect(r.warnings).toEqual(["1 ingredient has no amount, so it stays the same when you scale."]);
  });

  it("reads a recipe without headings", () => {
    const r = parseRecipeText("Quick Omelette\n2 eggs\n1 tbsp butter\nWhisk the eggs.\nCook for 2 minutes.");
    expect(r.name).toBe("Quick Omelette");
    expect(r.ingredients.map((i) => i.name)).toEqual(["eggs", "butter"]);
    expect(r.steps.map((s) => s.text)).toEqual(["Whisk the eggs.", "Cook for 2 minutes."]);
  });

  it("understands other heading and serving styles", () => {
    const r = parseRecipeText("## Ingredients:\n1 cup rice\n## Method\nStep 1: Rinse the rice.\nYield: 3 servings");
    expect(r.ingredients).toHaveLength(1);
    expect(r.steps).toEqual([{ text: "Rinse the rice." }]);
    expect(r.servings).toBe(3);
  });

  it("explains what it had to guess", () => {
    const r = parseRecipeText("Ingredients\nInstructions\n");
    expect(r.name).toBe("My recipe");
    expect(r.servings).toBe(4);
    expect(r.warnings).toEqual([
      "No title found, so it is called “My recipe”. You can rename it.",
      "No serving count found, so it is set to 4. Change it if needed.",
      "No ingredients found. Put them under an “Ingredients” heading.",
      "No steps found. Put them under an “Instructions” heading.",
    ]);
  });

  it("rejects a silly serving count", () => {
    const r = parseRecipeText("Soup\nServes 500\nIngredients\n1 cup water\nInstructions\nBoil.");
    expect(r.servings).toBe(4);
    expect(r.warnings).toContain("The serving count looked wrong, so it is set to 4.");
  });

  it("caps very long input", () => {
    const r = parseRecipeText("Big\nIngredients\n" + "1 cup water\n".repeat(5000) + "Instructions\nStir.");
    expect(r.ingredients.length).toBeLessThanOrEqual(100);
  });
});

describe("toRecipe", () => {
  it("makes a recipe that lives on this device", () => {
    const recipe = toRecipe(parseRecipeText(WITH_HEADINGS), "abc", "2026-10-27");
    expect(recipe).toMatchObject({
      slug: "my-abc",
      name: "Grandma's Banana Bread",
      servings: 8,
      cookMinutes: 55,
      image: "",
      datePublished: "2026-10-27",
    });
  });
});

describe("recipeToText", () => {
  it.each([
    [2, "2"],
    [1.5, "1 1/2"],
    [0.75, "3/4"],
    [0.333, "1/3"],
    [2.25, "2 1/4"],
    [1.1, "1.1"],
    [500, "500"],
  ])("writes %s as %j", (qty, text) => {
    expect(amountText(qty)).toBe(text);
  });

  it("writes a recipe the parser reads back the same way", () => {
    const original = parseRecipeText(WITH_HEADINGS);
    const again = parseRecipeText(recipeToText(original));
    expect(again.name).toBe(original.name);
    expect(again.servings).toBe(original.servings);
    expect(again.ingredients).toEqual(original.ingredients);
    expect(again.steps).toEqual(original.steps);
  });

  it.each(recipes.map((r) => [r.name, r] as const))("round-trips the built-in %s", (_, recipe) => {
    const again = parseRecipeText(recipeToText(recipe));
    expect(again.name).toBe(recipe.name);
    expect(again.servings).toBe(recipe.servings);
    expect(again.steps.map((s) => s.text)).toEqual(recipe.steps.map((s) => s.text));
    expect(again.ingredients).toHaveLength(recipe.ingredients.length);
    again.ingredients.forEach((ing, i) => {
      const want = recipe.ingredients[i]!;
      expect(ing.name).toBe(want.name);
      expect(ing.note).toBe(want.note);
      expect(ing.unit ?? "piece").toBe(want.unit ?? "piece");
      if (want.qty === undefined) expect(ing.qty).toBeUndefined();
      else expect(ing.qty).toBeCloseTo(want.qty, 2);
    });
  });
});
