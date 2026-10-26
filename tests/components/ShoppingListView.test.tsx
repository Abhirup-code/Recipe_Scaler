import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShoppingListView } from "@/components/ShoppingListView";
import { checkedStore, shoppingListStore } from "@/lib/stores";

describe("ShoppingListView", () => {
  it("explains what to do when the list is empty", () => {
    render(<ShoppingListView />);
    expect(screen.getByText(/Your list is empty/)).toBeInTheDocument();
  });

  it("merges ingredients across recipes and checks items off", async () => {
    shoppingListStore.set([
      { slug: "one-pan-chicken-curry", servings: 4 },
      { slug: "kolkata-masoor-dal", servings: 4 },
    ]);
    const user = userEvent.setup();
    render(<ShoppingListView />);
    const garlic = screen.getByRole("checkbox", { name: /cloves garlic/ }).closest("label")!;
    expect(garlic).toHaveTextContent("8 cloves garlic");
    expect(garlic).toHaveTextContent("One-Pan Chicken Curry, Kolkata-Style Masoor Dal");
    await user.click(screen.getByRole("checkbox", { name: /cloves garlic/ }));
    expect(checkedStore.getSnapshot()).toHaveLength(1);
    expect(garlic).toHaveClass("done");
  });

  it("changes servings and removes a recipe", async () => {
    shoppingListStore.set([{ slug: "weeknight-tomato-pasta", servings: 2 }]);
    const user = userEvent.setup();
    render(<ShoppingListView />);
    await user.click(screen.getByRole("button", { name: "More servings" }));
    await user.click(screen.getByRole("button", { name: "More servings" }));
    expect(screen.getByRole("checkbox", { name: /spaghetti/ }).closest("label")).toHaveTextContent("1 lb spaghetti");
    await user.click(screen.getByRole("button", { name: "Remove Weeknight Garlic Tomato Pasta" }));
    expect(screen.getByText(/Your list is empty/)).toBeInTheDocument();
  });

  it("copies the list as text and clears it", async () => {
    shoppingListStore.set([{ slug: "simple-shakshuka", servings: 2 }]);
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<ShoppingListView />);
    await user.click(screen.getByRole("button", { name: "Copy list" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("- 4 large eggs"));
    expect(screen.getByRole("button", { name: "Copied ✓" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText(/Your list is empty/)).toBeInTheDocument();
  });

  it("keeps working if copying is blocked", async () => {
    shoppingListStore.set([{ slug: "simple-shakshuka", servings: 2 }]);
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("blocked"));
    render(<ShoppingListView />);
    await user.click(screen.getByRole("button", { name: "Copy list" }));
    expect(screen.getByRole("button", { name: "Copy list" })).toBeInTheDocument();
  });

  it("skips recipes that no longer exist", () => {
    shoppingListStore.set([
      { slug: "deleted-recipe", servings: 2 },
      { slug: "simple-shakshuka", servings: 2 },
    ]);
    render(<ShoppingListView />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
