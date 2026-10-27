import { recipes } from "@/data/recipes";
import { cookedLabel, localDay, MAX_HISTORY, recentlyCooked, recordCooked, validCooked } from "@/lib/cooked";

const day = (d: string) => new Date(`${d}T15:00:00`);

describe("cooked history", () => {
  it("records a cook, counting repeats and moving the latest to the front", () => {
    let h = recordCooked([], "chana-masala", day("2026-10-20"));
    h = recordCooked(h, "classic-guacamole", day("2026-10-21"));
    h = recordCooked(h, "chana-masala", day("2026-10-27"));
    expect(h).toEqual([
      { slug: "chana-masala", count: 2, last: "2026-10-27" },
      { slug: "classic-guacamole", count: 1, last: "2026-10-21" },
    ]);
  });

  it("keeps the history short", () => {
    let h = recordCooked([], "a", day("2026-10-01"));
    for (let i = 0; i < MAX_HISTORY + 10; i++) h = recordCooked(h, `r${i}`, day("2026-10-02"));
    expect(h).toHaveLength(MAX_HISTORY);
  });

  it("uses the local calendar day", () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("shows the latest cooked recipes that still exist, up to the limit", () => {
    const h = [
      { slug: "my-deleted", count: 1, last: "2026-10-27" },
      ...["chana-masala", "classic-guacamole", "greek-village-salad", "berry-overnight-oats", "simple-shakshuka"].map(
        (slug) => ({ slug, count: 1, last: "2026-10-26" }),
      ),
    ];
    expect(recentlyCooked(h, recipes).map((c) => c.recipe.slug)).toEqual([
      "chana-masala",
      "classic-guacamole",
      "greek-village-salad",
      "berry-overnight-oats",
    ]);
  });

  it.each([
    ["2026-10-27", 1, "Cooked today"],
    ["2026-10-26", 1, "Cooked yesterday"],
    ["2026-10-20", 3, "Cooked Oct 20 · 3 times"],
    ["2025-12-31", 2, "Cooked Dec 31 · 2 times"],
  ])("labels %s cooked %s time(s) as %j", (last, count, label) => {
    expect(cookedLabel(last, count, "2026-10-27")).toBe(label);
  });

  it("ignores damaged or tampered history", () => {
    expect(
      validCooked([
        { slug: "chana-masala", count: 2, last: "2026-10-27" },
        { slug: "<script>", count: 1, last: "2026-10-27" },
        { slug: "x", count: 0, last: "2026-10-27" },
        { slug: "x", count: 1, last: "yesterday" },
        null,
      ]),
    ).toEqual([{ slug: "chana-masala", count: 2, last: "2026-10-27" }]);
    expect(validCooked("nope")).toEqual([]);
  });
});
