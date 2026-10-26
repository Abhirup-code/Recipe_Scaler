import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipePanel } from "@/components/RecipePanel";
import { getRecipe } from "@/data/recipes";
import { shoppingListStore } from "@/lib/stores";

const pancakes = getRecipe("buttermilk-pancakes")!;
const flourLine = () => screen.getAllByRole("listitem")[0]!;

describe("RecipePanel", () => {
  it("scales ingredients when servings change", async () => {
    const user = userEvent.setup();
    render(<RecipePanel recipe={pancakes} />);
    expect(flourLine()).toHaveTextContent("2 cups all-purpose flour");
    await user.click(screen.getByRole("button", { name: "More servings" }));
    await user.click(screen.getByRole("button", { name: "More servings" }));
    expect(screen.getByText("6 servings")).toBeInTheDocument();
    expect(flourLine()).toHaveTextContent("3 cups all-purpose flour");
  });

  it("does not go below 1 serving", async () => {
    const user = userEvent.setup();
    render(<RecipePanel recipe={pancakes} />);
    const fewer = screen.getByRole("button", { name: "Fewer servings" });
    for (let i = 0; i < 5; i++) await user.click(fewer);
    expect(screen.getByText("1 serving")).toBeInTheDocument();
    expect(fewer).toBeDisabled();
  });

  it("switches to metric and remembers the choice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<RecipePanel recipe={pancakes} />);
    await user.click(screen.getByRole("button", { name: "Metric" }));
    expect(flourLine()).toHaveTextContent("250 g all-purpose flour");
    expect(screen.getByRole("button", { name: "Metric" })).toHaveAttribute("aria-pressed", "true");
    unmount();
    render(<RecipePanel recipe={pancakes} />);
    expect(flourLine()).toHaveTextContent("250 g");
  });

  it("shows substitutes for an ingredient", async () => {
    const user = userEvent.setup();
    render(<RecipePanel recipe={pancakes} />);
    const item = screen.getAllByRole("listitem").find((li) => li.textContent?.includes("cups buttermilk"))!;
    const button = within(item).getByRole("button", { name: "Out of it?" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(await within(item).findByText(/1 tbsp lemon juice or vinegar/)).toBeInTheDocument();
    await user.click(button);
    expect(within(item).queryByText(/lemon juice/)).not.toBeInTheDocument();
  });

  it("adds the recipe to the shopping list at the chosen servings", async () => {
    const user = userEvent.setup();
    render(<RecipePanel recipe={pancakes} />);
    await user.click(screen.getByRole("button", { name: "More servings" }));
    await user.click(screen.getByRole("button", { name: "Add to shopping list" }));
    expect(shoppingListStore.getSnapshot()).toEqual([{ slug: "buttermilk-pancakes", servings: 5 }]);
    expect(screen.getByRole("link", { name: /View list/ })).toHaveAttribute("href", "/shopping-list/");
  });
});
