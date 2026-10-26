import { curatedProvider, hasCuratedSubstitute } from "@/lib/substitutions";

const ctx = { recipeName: "Pancakes", cuisine: "American" };

describe("substitutions", () => {
  it("finds exact matches", async () => {
    const s = await curatedProvider.suggest("buttermilk", ctx);
    expect(s[0]?.use).toMatch(/lemon juice or vinegar/);
  });

  it("matches plural and descriptive names", async () => {
    expect(await curatedProvider.suggest("large eggs", ctx)).not.toHaveLength(0);
    expect(await curatedProvider.suggest("unsalted butter", ctx)).not.toHaveLength(0);
    expect(await curatedProvider.suggest("canned tomatoes", ctx)).not.toHaveLength(0);
  });

  it("does not match a word inside another word", () => {
    expect(hasCuratedSubstitute("eggplant")).toBe(false);
  });

  it("prefers the most specific match", async () => {
    const s = await curatedProvider.suggest("buttermilk", ctx);
    expect(s.some((x) => x.use.includes("ghee"))).toBe(false);
  });

  it("returns nothing for unknown ingredients", async () => {
    expect(await curatedProvider.suggest("dragon fruit", ctx)).toEqual([]);
    expect(hasCuratedSubstitute("dragon fruit")).toBe(false);
  });
});
