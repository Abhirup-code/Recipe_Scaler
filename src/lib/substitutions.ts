export interface Substitution {
  /** What to use instead, with the amount relative to the original. */
  use: string;
  /** What changes in the dish, if anything. */
  note?: string;
}

export interface SubstitutionContext {
  recipeName: string;
  cuisine: string;
}

/**
 * Anything that can suggest substitutes. The built-in provider reads a curated list.
 * The interface is async so an AI-backed provider (for example an LLM API behind a
 * server route) can replace or extend it without changing the UI.
 */
export interface SubstitutionProvider {
  readonly name: string;
  suggest(ingredient: string, context: SubstitutionContext): Promise<Substitution[]>;
}

const CURATED: Record<string, Substitution[]> = {
  buttermilk: [
    { use: "1 cup milk + 1 tbsp lemon juice or vinegar, rested 5 minutes", note: "Closest match for baking." },
    { use: "¾ cup plain yogurt + ¼ cup milk" },
  ],
  egg: [
    { use: "1 tbsp ground flaxseed + 3 tbsp water per egg, rested 5 minutes", note: "Good for binding in baking; not for scrambles." },
    { use: "¼ cup unsweetened applesauce per egg", note: "Adds moisture and a little sweetness." },
  ],
  butter: [
    { use: "Same amount of ghee", note: "Nuttier; works for cooking and most baking." },
    { use: "¾ the amount of neutral oil", note: "For cooking and quick breads; less flaky in pastry." },
  ],
  "heavy cream": [
    { use: "¾ cup milk + ¼ cup melted butter per cup", note: "Will not whip." },
    { use: "Same amount of full-fat coconut milk", note: "Dairy-free; adds a light coconut flavor." },
  ],
  "sour cream": [{ use: "Same amount of plain Greek yogurt" }],
  yogurt: [{ use: "Same amount of sour cream" }, { use: "Same amount of buttermilk", note: "Thinner; reduce other liquid a little." }],
  "brown sugar": [{ use: "1 cup white sugar + 1 tbsp molasses per cup" }],
  "all-purpose flour": [
    { use: "1:1 gluten-free baking flour blend", note: "Gluten-free; texture is slightly more tender." },
  ],
  "soy sauce": [
    { use: "Same amount of tamari", note: "Gluten-free, slightly richer." },
    { use: "Coconut aminos, about 1½ times the amount", note: "Soy-free and less salty." },
  ],
  "rice vinegar": [{ use: "Apple cider vinegar with a pinch of sugar" }],
  "lemon juice": [{ use: "Same amount of lime juice" }, { use: "Half the amount of white wine vinegar" }],
  scallion: [{ use: "Chives, or a little finely chopped red onion" }],
  garlic: [{ use: "⅛ tsp garlic powder per clove" }],
  ginger: [{ use: "¼ tsp ground ginger per tbsp of fresh" }],
  honey: [{ use: "Same amount of maple syrup" }],
  "parmesan cheese": [{ use: "Pecorino Romano", note: "Saltier; use a little less." }, { use: "Nutritional yeast", note: "Dairy-free." }],
  "fresh basil": [{ use: "⅓ the amount of dried basil" }, { use: "Fresh parsley or spinach", note: "Different flavor, similar freshness." }],
  "red lentils": [{ use: "Yellow split mung beans (moong dal)", note: "Cook a few minutes longer." }],
  "chicken thighs": [{ use: "Chicken breast", note: "Cook a few minutes less so it stays juicy." }, { use: "Extra-firm tofu or chickpeas", note: "Vegetarian." }],
  "baking soda": [{ use: "3 times the amount of baking powder", note: "Remove the acid it was meant to balance, if you can." }],
  milk: [{ use: "Same amount of unsweetened oat or soy milk" }],
  "canned tomatoes": [{ use: "About 2 cups chopped fresh tomatoes per 14 oz can, cooked a little longer" }],
  cumin: [{ use: "Half the amount of chili powder", note: "Different, but similarly warm and earthy." }],
};

// Match whole words in plural and descriptive forms: "large eggs" -> egg,
// "unsalted butter" -> butter, but not "eggplant" -> egg.
function lookup(ingredient: string): Substitution[] {
  const name = ingredient.trim().toLowerCase();
  const exact = CURATED[name];
  if (exact) return exact;
  const singular = name.replace(/(?<=\w{3})(es|s)\b/g, "");
  const keys = Object.keys(CURATED).sort((a, b) => b.length - a.length);
  const hit = keys.find((k) => {
    const word = new RegExp(`\\b${k}\\b`);
    return word.test(name) || word.test(singular);
  });
  return hit ? (CURATED[hit] ?? []) : [];
}

export const curatedProvider: SubstitutionProvider = {
  name: "curated",
  async suggest(ingredient) {
    return lookup(ingredient);
  },
};

export function hasCuratedSubstitute(ingredient: string): boolean {
  return lookup(ingredient).length > 0;
}
