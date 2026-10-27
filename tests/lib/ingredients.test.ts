import { displayIngredient, ingredientLine, scaleFactor } from "@/lib/ingredients";

describe("scaling ingredients", () => {
  it("computes the scale factor", () => {
    expect(scaleFactor(4, 6)).toBe(1.5);
    expect(() => scaleFactor(0, 2)).toThrow();
  });

  it("scales and formats a US amount", () => {
    const d = displayIngredient({ qty: 1, unit: "cup", name: "milk" }, 1.5, "us");
    expect(ingredientLine(d)).toBe("1½ cups milk");
  });

  it("halves 2 tbsp into 1 tbsp and 1 tsp into ½ tsp", () => {
    expect(ingredientLine(displayIngredient({ qty: 2, unit: "tbsp", name: "sugar" }, 0.5, "us"))).toBe("1 tbsp sugar");
    expect(ingredientLine(displayIngredient({ qty: 1, unit: "tsp", name: "salt" }, 0.5, "us"))).toBe("½ tsp salt");
  });

  it("shows flour in grams in metric", () => {
    const d = displayIngredient({ qty: 2, unit: "cup", name: "flour", gramsPerCup: 125 }, 1, "metric");
    expect(ingredientLine(d)).toBe("250 g flour");
  });

  it("scales counted items without a unit", () => {
    expect(ingredientLine(displayIngredient({ qty: 2, name: "large eggs" }, 1.5, "us"))).toBe("3 large eggs");
  });

  it("keeps notes and marks items without an amount as to taste", () => {
    expect(ingredientLine(displayIngredient({ qty: 4, unit: "clove", name: "garlic", note: "sliced" }, 1, "us"))).toBe(
      "4 cloves garlic (sliced)",
    );
    expect(ingredientLine(displayIngredient({ name: "salt" }, 2, "us"))).toBe("salt (to taste)");
  });
});

describe("scaled whole ingredients", () => {
  it("shows onions, chilies, and garlic in amounts you can actually use", () => {
    const factor = 300 / 190; // 300 g of lentils in a recipe that uses 1 cup (190 g)
    expect(ingredientLine(displayIngredient({ qty: 1, name: "small onion" }, factor, "us"))).toBe("1½ small onion");
    expect(ingredientLine(displayIngredient({ qty: 2, name: "dried red chilies" }, factor, "us"))).toBe("3 dried red chilies");
    expect(ingredientLine(displayIngredient({ qty: 4, unit: "clove", name: "garlic" }, factor, "metric"))).toBe(
      "6 cloves garlic",
    );
  });
});
