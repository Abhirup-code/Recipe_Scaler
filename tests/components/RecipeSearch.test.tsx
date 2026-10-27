import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { matches, RecipeSearch } from "@/components/RecipeSearch";
import { getRecipe, recipes } from "@/data/recipes";

describe("RecipeSearch", () => {
  it("matches name, cuisine, tag, and ingredient, with every word required", () => {
    const dal = getRecipe("kolkata-masoor-dal")!;
    expect(matches(dal, "lentils")).toBe(true);
    expect(matches(dal, "VEGAN bengali")).toBe(true);
    expect(matches(dal, "lentils chicken")).toBe(false);
    expect(matches(dal, "   ")).toBe(true);
  });

  it("filters the cards as you type and handles no results", async () => {
    const user = userEvent.setup();
    render(<RecipeSearch recipes={recipes} />);
    expect(screen.getAllByRole("article")).toHaveLength(recipes.length);
    await user.type(screen.getByRole("searchbox", { name: "Search recipes" }), "eggs");
    const withEggs = recipes.filter((r) => r.ingredients.some((i) => i.name.includes("eggs")));
    expect(withEggs.length).toBeGreaterThan(1);
    expect(screen.getAllByRole("article")).toHaveLength(withEggs.length);
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "durian");
    expect(screen.getByText(/No recipes match/)).toBeInTheDocument();
  });
});
