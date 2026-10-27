import type { Ingredient, Recipe, Step, Unit } from "./types";

export const MAX_RECIPE_TEXT = 20_000;

const VULGAR: Record<string, number> = {
  "½": 1 / 2, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 1 / 4, "¾": 3 / 4, "⅕": 1 / 5,
  "⅖": 2 / 5, "⅗": 3 / 5, "⅘": 4 / 5, "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 1 / 8,
  "⅜": 3 / 8, "⅝": 5 / 8, "⅞": 7 / 8,
};
const VULGAR_CHARS = Object.keys(VULGAR).join("");

const UNIT_WORDS: ReadonlyArray<readonly [Unit, readonly string[]]> = [
  ["tbsp", ["tablespoons", "tablespoon", "tbsps", "tbsp", "tbs", "tbl", "T"]],
  ["tsp", ["teaspoons", "teaspoon", "tsps", "tsp", "t"]],
  ["cup", ["cups", "cup", "c"]],
  ["ml", ["millilitres", "milliliters", "millilitre", "milliliter", "ml"]],
  ["l", ["litres", "liters", "litre", "liter", "l"]],
  ["kg", ["kilograms", "kilogram", "kilos", "kilo", "kgs", "kg"]],
  ["g", ["grams", "gram", "gr", "g"]],
  ["oz", ["ounces", "ounce", "oz"]],
  ["lb", ["pounds", "pound", "lbs", "lb"]],
  ["clove", ["cloves", "clove"]],
  ["can", ["cans", "can", "tins", "tin"]],
  ["pinch", ["pinches", "pinch"]],
  ["bunch", ["bunches", "bunch"]],
  ["stalk", ["stalks", "stalk", "sticks", "stick"]],
];

/** Grams per US cup for common dry or solid ingredients, so cups can show as grams in metric. */
const DENSITY: ReadonlyArray<readonly [RegExp, number]> = [
  [/\bbrown sugar\b/, 220],
  [/\b(powdered|icing|confectioners'?) sugar\b/, 120],
  [/\bsugar\b/, 200],
  [/\bflour\b/, 125],
  [/\bbutter\b/, 227],
  [/\boats\b/, 90],
  [/\brice\b/, 185],
  [/\blentils\b/, 190],
  [/\bcocoa\b/, 85],
  [/\b(cheese|parmesan)\b/, 100],
];

const QTY_RE = new RegExp(
  `^(?:(\\d+)\\s+(\\d+)\\s*/\\s*(\\d+)|(\\d+)\\s*([${VULGAR_CHARS}])|(\\d+)\\s*/\\s*(\\d+)|([${VULGAR_CHARS}])|(\\d+(?:[.,]\\d+)?))`,
);

/** Read a leading amount: "1 1/2", "1½", "3/4", "¾", "2.5", "2,5". Ranges ("2-3") use the first number. */
export function parseQuantity(text: string): { qty: number; rest: string } | null {
  const m = QTY_RE.exec(text);
  if (!m) return null;
  let qty: number;
  if (m[1]) qty = Number(m[1]) + Number(m[2]) / Number(m[3]);
  else if (m[4]) qty = Number(m[4]) + VULGAR[m[5]!]!;
  else if (m[6]) qty = Number(m[6]) / Number(m[7]);
  else if (m[8]) qty = VULGAR[m[8]]!;
  else qty = Number(m[9]!.replace(",", "."));
  if (!Number.isFinite(qty) || qty <= 0) return null;
  let rest = text.slice(m[0].length);
  rest = rest.replace(/^\s*(?:-|–|to)\s*[\d.,/½⅓⅔¼¾⅛⅜⅝⅞ ]+/, ""); // drop the end of a range
  return { qty, rest: rest.trim() };
}

function parseUnit(text: string): { unit: Unit; rest: string } | null {
  for (const [unit, words] of UNIT_WORDS) {
    for (const word of words) {
      // Single letters (t, T, c, g, l) only count as units when written exactly, followed by a space or dot.
      const flags = word.length === 1 ? "" : "i";
      const re = new RegExp(`^${word}\\.?(?=\\s|$)`, flags);
      const m = re.exec(text);
      if (m) return { unit, rest: text.slice(m[0].length).trim().replace(/^of\s+/i, "") };
    }
  }
  return null;
}

function splitNote(text: string): { name: string; note?: string } {
  let name = text.trim();
  let note: string | undefined;
  const paren = /\s*\(([^)]*)\)\s*/.exec(name);
  if (paren) {
    note = paren[1]!.trim() || undefined;
    name = (name.slice(0, paren.index) + " " + name.slice(paren.index + paren[0].length)).trim();
  }
  const comma = name.indexOf(",");
  if (comma > 0) {
    const after = name.slice(comma + 1).trim();
    note = [after, note].filter(Boolean).join(", ") || undefined;
    name = name.slice(0, comma).trim();
  }
  return { name: name.replace(/\s+/g, " "), note };
}

/** One ingredient line: "1 1/2 cups all-purpose flour, sifted" or "Salt, to taste". */
export function parseIngredient(line: string): Ingredient {
  const text = line.trim();
  const amount = parseQuantity(text);
  if (!amount) {
    const { name, note } = splitNote(text);
    return note ? { name, note } : { name };
  }
  const unit = parseUnit(amount.rest);
  const { name, note } = splitNote(unit ? unit.rest : amount.rest);
  const ingredient: Ingredient = { qty: Math.round(amount.qty * 1000) / 1000, name: name || "ingredient" };
  if (unit) ingredient.unit = unit.unit;
  if (note) ingredient.note = note;
  if (unit && unit.unit === "cup") {
    const density = DENSITY.find(([re]) => re.test(name.toLowerCase()));
    if (density) ingredient.gramsPerCup = density[1];
  }
  return ingredient;
}

/** A timer for a step that says how long: "simmer for 10-12 minutes", "bake 1 hour". */
export function stepMinutes(text: string): number | undefined {
  const hours = /(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(?:\d+(?:\.\d+)?)?\s*(?:hours?|hrs?)\b/i.exec(text);
  const minutes = /(\d+)\s*(?:-|–|to)?\s*(?:\d+)?\s*(?:minutes?|mins?)\b/i.exec(text);
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 && total <= 24 * 60 ? total : undefined;
}

const BULLET = /^\s*(?:[-*•·▪◦]|\d+[.)]|step\s*\d+\s*[:.)-]?)\s*/i;
const ING_HEADING = /^\s*#*\s*ingredients?\s*:?\s*$/i;
const STEP_HEADING = /^\s*#*\s*(instructions?|directions?|method|steps?|preparation)\s*:?\s*$/i;
const SERVES = /^\s*(?:serves|servings?|yield|makes)\s*:?\s*(\d+)/i;

export interface ParsedRecipe {
  name: string;
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  /** Plain-language notes about guesses the parser made. */
  warnings: string[];
}

/**
 * Turn pasted recipe text into ingredients and steps. Works best with "Ingredients" and
 * "Instructions" headings; without them, lines that start with an amount are ingredients
 * and the rest are steps.
 */
export function parseRecipeText(input: string): ParsedRecipe {
  const lines = input
    .slice(0, MAX_RECIPE_TEXT)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim());
  const warnings: string[] = [];
  let name = "";
  let servings: number | undefined;
  let section: "intro" | "ingredients" | "steps" = "intro";
  const hasHeadings = lines.some((l) => ING_HEADING.test(l)) && lines.some((l) => STEP_HEADING.test(l));
  const ingredients: Ingredient[] = [];
  const steps: Step[] = [];

  for (const line of lines) {
    if (!line) continue;
    const serves = SERVES.exec(line);
    if (serves && servings === undefined) {
      servings = Number(serves[1]);
      continue;
    }
    if (ING_HEADING.test(line)) {
      section = "ingredients";
      continue;
    }
    if (STEP_HEADING.test(line)) {
      section = "steps";
      continue;
    }
    const text = line.replace(BULLET, "").trim();
    if (!text) continue;

    if (hasHeadings) {
      if (section === "intro") {
        if (!name) name = text;
      } else if (section === "ingredients") ingredients.push(parseIngredient(text));
      else steps.push({ text, minutes: stepMinutes(text) });
      continue;
    }
    // No headings: the first line is the title, amounts are ingredients, everything else is a step.
    if (!name && !parseQuantity(text)) {
      name = text;
    } else if (parseQuantity(text) && steps.length === 0) {
      ingredients.push(parseIngredient(text));
    } else {
      steps.push({ text, minutes: stepMinutes(text) });
    }
  }

  for (const step of steps) if (step.minutes === undefined) delete step.minutes;
  if (!name) {
    name = "My recipe";
    warnings.push("No title found, so it is called “My recipe”. You can rename it.");
  }
  if (servings === undefined || servings < 1 || servings > 48) {
    if (servings !== undefined) warnings.push("The serving count looked wrong, so it is set to 4.");
    else warnings.push("No serving count found, so it is set to 4. Change it if needed.");
    servings = 4;
  }
  if (ingredients.length === 0) warnings.push("No ingredients found. Put them under an “Ingredients” heading.");
  if (steps.length === 0) warnings.push("No steps found. Put them under an “Instructions” heading.");
  const unmeasured = ingredients.filter((i) => i.qty === undefined).length;
  if (unmeasured > 0) {
    warnings.push(
      `${unmeasured} ${unmeasured === 1 ? "ingredient has" : "ingredients have"} no amount, so ${
        unmeasured === 1 ? "it stays" : "they stay"
      } the same when you scale.`,
    );
  }
  return { name: name.slice(0, 120), servings, ingredients: ingredients.slice(0, 100), steps: steps.slice(0, 60), warnings };
}

/** Make a stored recipe from a parse. Imported recipes have no photo and live only on this device. */
export function toRecipe(parsed: ParsedRecipe, id: string, today: string): Recipe {
  const total = parsed.steps.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  return {
    slug: `my-${id}`,
    name: parsed.name,
    description: "Imported by you.",
    cuisine: "Your recipe",
    category: "Imported",
    servings: parsed.servings,
    prepMinutes: 0,
    cookMinutes: total,
    image: "",
    imageAlt: "",
    tags: ["mine"],
    datePublished: today,
    ingredients: parsed.ingredients,
    steps: parsed.steps,
  };
}

const TEXT_FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, "1/8"], [1 / 4, "1/4"], [1 / 3, "1/3"], [3 / 8, "3/8"], [1 / 2, "1/2"],
  [5 / 8, "5/8"], [2 / 3, "2/3"], [3 / 4, "3/4"], [7 / 8, "7/8"],
];

/** An amount as a person would type it: 2, 1 1/2, 3/4, or a decimal when no kitchen fraction fits. */
export function amountText(qty: number): string {
  const whole = Math.floor(qty + 1e-9);
  const rest = qty - whole;
  if (rest < 0.002) return String(whole);
  const match = TEXT_FRACTIONS.find(([v]) => Math.abs(rest - v) < 0.002);
  if (match) return whole ? `${whole} ${match[1]}` : match[1];
  return String(Math.round(qty * 1000) / 1000);
}

/**
 * Write a recipe back out as text the parser reads the same way, so a saved recipe can be
 * reopened in the import screen and corrected (issue #7).
 */
export function recipeToText(recipe: Pick<Recipe, "name" | "servings" | "ingredients" | "steps">): string {
  const ingredient = (i: Ingredient) => {
    const amount = i.qty === undefined ? "" : `${amountText(i.qty)} ${i.unit && i.unit !== "piece" ? `${i.unit} ` : ""}`;
    return `- ${amount}${i.name}${i.note ? `, ${i.note}` : ""}`;
  };
  return [
    recipe.name,
    `Serves ${recipe.servings}`,
    "",
    "Ingredients",
    ...recipe.ingredients.map(ingredient),
    "",
    "Instructions",
    ...recipe.steps.map((s, n) => `${n + 1}. ${s.text}`),
  ].join("\n");
}
