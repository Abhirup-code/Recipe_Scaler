import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecentlyCooked } from "@/components/RecentlyCooked";
import { RecipePanel } from "@/components/RecipePanel";
import { getRecipe } from "@/data/recipes";
import { cookedStore, localDay, validCooked } from "@/lib/cooked";
import { myRecipesStore } from "@/lib/myRecipes";
import type { Recipe } from "@/lib/types";

const today = localDay(new Date());
const MINE: Recipe = {
  ...getRecipe("chana-masala")!,
  slug: "my-abc123",
  name: "Mum's Dal",
  image: "",
  imageAlt: "",
};

beforeEach(() => {
  cookedStore.set([]);
  myRecipesStore.set([]);
});

describe("Cooked recently (issue #8)", () => {
  it("shows nothing until you have cooked something", () => {
    const { container } = render(<RecentlyCooked />);
    expect(container).toBeEmptyDOMElement();
  });

  it("records a recipe when you finish cook mode", async () => {
    const oats = getRecipe("berry-overnight-oats")!;
    const user = userEvent.setup();
    render(<RecipePanel recipe={oats} />);
    await user.click(screen.getByRole("button", { name: /cook/i }));
    for (let i = 1; i < oats.steps.length; i++) await user.click(screen.getByRole("button", { name: "Next step" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(validCooked(cookedStore.getSnapshot())).toEqual([{ slug: "berry-overnight-oats", count: 1, last: today }]);
  });

  it("does not count leaving cook mode early", async () => {
    const user = userEvent.setup();
    render(<RecipePanel recipe={getRecipe("berry-overnight-oats")!} />);
    await user.click(screen.getByRole("button", { name: /cook/i }));
    await user.click(screen.getByRole("button", { name: "Exit" }));
    expect(cookedStore.getSnapshot()).toEqual([]);
  });

  it("lists the latest four, with when and how often, linking to each recipe", () => {
    cookedStore.set([
      { slug: "chana-masala", count: 3, last: today },
      { slug: "my-abc123", count: 1, last: "2026-01-02" },
      { slug: "classic-guacamole", count: 1, last: "2026-01-01" },
      { slug: "greek-village-salad", count: 1, last: "2026-01-01" },
      { slug: "simple-shakshuka", count: 1, last: "2026-01-01" },
    ]);
    myRecipesStore.set([MINE]);
    render(<RecentlyCooked />);
    const section = screen.getByRole("region", { name: "Cooked recently" });
    const cards = within(section).getAllByRole("article");
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent("Chana Masala");
    expect(cards[0]).toHaveTextContent("Cooked today · 3 times");
    expect(within(cards[0]!).getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(within(cards[1]!).getByRole("link")).toHaveAttribute("href", "/my-recipes/?id=abc123");
    expect(cards[1]).toHaveTextContent("Your recipe");
    expect(cards[1]).toHaveTextContent("Cooked Jan 2");
  });
});
