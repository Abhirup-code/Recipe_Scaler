import { backupJson, restoreBackup } from "@/lib/myRecipes";
import type { Recipe } from "@/lib/types";

const recipe = (id: string, name = id): Recipe => ({
  slug: `my-${id}`,
  name,
  description: "Imported by you.",
  cuisine: "Your recipe",
  category: "Imported",
  servings: 2,
  prepMinutes: 0,
  cookMinutes: 0,
  image: "",
  imageAlt: "",
  tags: ["mine"],
  datePublished: "2026-10-27",
  ingredients: [{ qty: 1, unit: "cup", name: "rice" }],
  steps: [{ text: "Cook." }],
});

const NOW = new Date("2026-10-27T12:00:00Z");

describe("backup and restore", () => {
  it("round-trips recipes through a backup file", () => {
    const file = backupJson([recipe("a"), recipe("b")], NOW);
    expect(JSON.parse(file)).toMatchObject({ app: "recipe-scaler", version: 1, exportedAt: "2026-10-27T12:00:00.000Z" });
    const result = restoreBackup(file, []);
    expect(result).toMatchObject({ ok: true, added: 2, alreadyHere: 0, invalid: 0 });
    if (result.ok) expect(result.recipes.map((r) => r.slug)).toEqual(["my-a", "my-b"]);
  });

  it("keeps what you already have and adds only new recipes", () => {
    const mine = [recipe("a", "My edited version")];
    const result = restoreBackup(backupJson([recipe("a", "Old"), recipe("c")], NOW), mine);
    expect(result).toMatchObject({ ok: true, added: 1, alreadyHere: 1 });
    if (result.ok) expect(result.recipes.map((r) => r.name)).toEqual(["My edited version", "c"]);
  });

  it("skips damaged or tampered entries but restores the rest", () => {
    const file = JSON.stringify({
      app: "recipe-scaler",
      version: 1,
      recipes: [recipe("ok"), { ...recipe("bad"), servings: 999 }, { ...recipe("x"), slug: "buttermilk-pancakes" }, "nope"],
    });
    expect(restoreBackup(file, [])).toMatchObject({ ok: true, added: 1, invalid: 3 });
  });

  it("does not add the same recipe twice from one file", () => {
    const file = JSON.stringify({ app: "recipe-scaler", version: 1, recipes: [recipe("a"), recipe("a")] });
    expect(restoreBackup(file, [])).toMatchObject({ ok: true, added: 1, alreadyHere: 1 });
  });

  it.each([
    ["not JSON", "hello", "not valid JSON"],
    ["another app's file", JSON.stringify({ app: "other", version: 1, recipes: [] }), "not a Recipe Scaler backup"],
    ["no recipe list", JSON.stringify({ app: "recipe-scaler", version: 1 }), "not a Recipe Scaler backup"],
    ["a newer format", JSON.stringify({ app: "recipe-scaler", version: 2, recipes: [] }), "newer version"],
    ["a huge file", "x".repeat(2_000_001), "too large"],
  ])("rejects %s with a clear message", (_, text, message) => {
    const result = restoreBackup(text, []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});
