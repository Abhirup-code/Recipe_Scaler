import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PantryView } from "@/components/PantryView";
import { ShoppingListView } from "@/components/ShoppingListView";
import { recipes } from "@/data/recipes";
import { pantryStore, shoppingListStore } from "@/lib/stores";

const SHAKSHUKA = [
  "olive oil",
  "onion",
  "red bell pepper",
  "garlic",
  "smoked paprika",
  "ground cumin",
  "canned tomatoes",
  "eggs",
  "feta cheese",
];

const match = (name: string) => screen.getByRole("link", { name }).closest("li")!;

beforeEach(() => {
  pantryStore.set([]);
  shoppingListStore.set([]);
});

describe("PantryView", () => {
  it("asks you to tick ingredients first", () => {
    render(<PantryView recipes={recipes} />);
    expect(screen.getByText(/Tick a few ingredients/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "salt" })).not.toBeInTheDocument();
  });

  it("remembers what you tick and ranks recipes by what you are missing", async () => {
    const user = userEvent.setup();
    render(<PantryView recipes={recipes} />);
    await user.click(screen.getByRole("checkbox", { name: "eggs" }));
    await user.click(screen.getByRole("checkbox", { name: "garlic" }));
    expect(pantryStore.getSnapshot()).toEqual(["eggs", "garlic"]);
    expect(screen.getByText("(2 of", { exact: false })).toBeInTheDocument();
    expect(within(match("Simple Shakshuka")).getByText(/Missing 7 · have 2:/)).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "eggs" }));
    expect(pantryStore.getSnapshot()).toEqual(["garlic"]);
  });

  it("puts a recipe you can fully make at the top", () => {
    pantryStore.set(SHAKSHUKA);
    render(<PantryView recipes={recipes} />);
    const items = screen.getAllByRole("listitem").filter((li) => li.classList.contains("match"));
    expect(items[0]).toHaveTextContent("Simple Shakshuka");
    expect(items[0]).toHaveTextContent("You have everything ✓");
    expect(items[0]).toHaveClass("ready");
    expect(within(items[0]!).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("1 recipe ready to cook")).toBeInTheDocument();
  });

  it("filters the ingredient list", async () => {
    const user = userEvent.setup();
    render(<PantryView recipes={recipes} />);
    await user.type(screen.getByLabelText("Find an ingredient"), "oil");
    const chips = screen.getAllByRole("checkbox");
    expect(chips.length).toBeGreaterThan(1);
    for (const chip of chips) expect(chip.closest("label")).toHaveTextContent("oil");
    await user.clear(screen.getByLabelText("Find an ingredient"));
    await user.type(screen.getByLabelText("Find an ingredient"), "zzz");
    expect(screen.getByText("Nothing matches “zzz”.")).toBeInTheDocument();
  });

  it("adds a recipe you are missing things for to the shopping list", async () => {
    pantryStore.set(["garlic"]);
    const user = userEvent.setup();
    render(<PantryView recipes={recipes} />);
    await user.click(screen.getByRole("button", { name: "Add to list: Simple Shakshuka" }));
    expect(shoppingListStore.getSnapshot()).toEqual([{ slug: "simple-shakshuka", servings: 2 }]);
    expect(within(match("Simple Shakshuka")).getByRole("link", { name: "In your list ✓" })).toBeInTheDocument();
  });

  it("clears everything", async () => {
    pantryStore.set(["garlic", "eggs"]);
    const user = userEvent.setup();
    render(<PantryView recipes={recipes} />);
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(pantryStore.getSnapshot()).toEqual([]);
  });
});

describe("ShoppingListView with a pantry", () => {
  it("moves what you already have out of the list to buy and out of the copied text", async () => {
    pantryStore.set(["garlic", "eggs"]);
    shoppingListStore.set([{ slug: "simple-shakshuka", servings: 2 }]);
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<ShoppingListView />);
    expect(screen.getByRole("heading", { name: "To buy (7)" })).toBeInTheDocument();
    expect(screen.getByText("Already in your kitchen (3)")).toBeInTheDocument(); // garlic, eggs, salt and pepper
    await user.click(screen.getByRole("button", { name: "Copy list" }));
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied).toContain("feta cheese");
    expect(copied).not.toContain("garlic");
    expect(copied).not.toContain("eggs");
  });

  it("keeps the basics on the list for people who do not use the pantry", () => {
    shoppingListStore.set([{ slug: "simple-shakshuka", servings: 2 }]);
    render(<ShoppingListView />);
    expect(screen.getByRole("checkbox", { name: /salt and pepper/ })).toBeInTheDocument();
    expect(screen.queryByText(/Already in your kitchen/)).not.toBeInTheDocument();
  });

  it("says so when you already have everything", () => {
    pantryStore.set(SHAKSHUKA);
    shoppingListStore.set([{ slug: "simple-shakshuka", servings: 2 }]);
    render(<ShoppingListView />);
    expect(screen.getByText("You already have everything on this list.")).toBeInTheDocument();
  });
});
