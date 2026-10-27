import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportRecipe } from "@/components/ImportRecipe";
import { MyRecipes } from "@/components/MyRecipes";
import { PantryView } from "@/components/PantryView";
import { ShoppingListView } from "@/components/ShoppingListView";
import { recipes } from "@/data/recipes";
import { isMyRecipe, myRecipesStore, recipeHref, validMyRecipes } from "@/lib/myRecipes";
import { pantryStore, shoppingListStore } from "@/lib/stores";
import type { Recipe } from "@/lib/types";

const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(search),
}));

const TOAST: Recipe = {
  slug: "my-toast1",
  name: "Cheese Toast",
  description: "Imported by you.",
  cuisine: "Your recipe",
  category: "Imported",
  servings: 2,
  prepMinutes: 0,
  cookMinutes: 5,
  image: "",
  imageAlt: "",
  tags: ["mine"],
  datePublished: "2026-10-27",
  ingredients: [
    { qty: 4, name: "bread slices" },
    { qty: 1, unit: "cup", name: "grated cheese", gramsPerCup: 100 },
  ],
  steps: [{ text: "Toast for 5 minutes.", minutes: 5 }],
};

beforeEach(() => {
  push.mockReset();
  search = "";
  myRecipesStore.set([]);
  shoppingListStore.set([]);
  pantryStore.set([]);
});

describe("ImportRecipe", () => {
  it("previews an example, lets you fix the title, and saves it", async () => {
    const user = userEvent.setup();
    render(<ImportRecipe />);
    await user.click(screen.getByRole("button", { name: "Try an example" }));
    expect(screen.getByLabelText("Title")).toHaveValue("Easy Banana Bread");
    expect(screen.getByLabelText("Servings")).toHaveValue(8);
    expect(screen.getByRole("heading", { name: "Ingredients (8)" })).toBeInTheDocument();
    expect(screen.getByText("1½ cups all-purpose flour")).toBeInTheDocument();
    const bake = screen.getAllByRole("listitem").find((li) => li.textContent?.startsWith("Bake for 55 minutes"));
    expect(bake).toHaveTextContent("(timer: 55 min)");
    expect(within(screen.getByRole("list", { name: "Notes about the import" })).getByText(/no amount/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Mum's Banana Bread");
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    const saved = validMyRecipes(myRecipesStore.getSnapshot());
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: "Mum's Banana Bread", servings: 8 });
    expect(push).toHaveBeenCalledWith(recipeHref(saved[0]!));
  });

  it("will not save without ingredients, a title, or sensible servings", async () => {
    const user = userEvent.setup();
    render(<ImportRecipe />);
    await user.type(screen.getByLabelText("Recipe text"), "Just some words");
    expect(screen.getByRole("button", { name: "Save recipe" })).toBeDisabled();

    await user.clear(screen.getByLabelText("Recipe text"));
    await user.click(screen.getByRole("button", { name: "Try an example" }));
    await user.clear(screen.getByLabelText("Servings"));
    await user.type(screen.getByLabelText("Servings"), "0");
    expect(screen.getByText(/whole number from 1 to 48/)).toBeInTheDocument();
    expect(screen.getByLabelText("Servings")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Save recipe" })).toBeDisabled();

    await user.clear(screen.getByLabelText("Servings"));
    await user.type(screen.getByLabelText("Servings"), "4");
    await user.clear(screen.getByLabelText("Title"));
    expect(screen.getByRole("button", { name: "Save recipe" })).toBeDisabled();
    expect(myRecipesStore.getSnapshot()).toEqual([]);
  });
});

describe("MyRecipes", () => {
  it("lists your recipes and deletes one after a second tap", async () => {
    myRecipesStore.set([TOAST]);
    shoppingListStore.set([{ slug: "my-toast1", servings: 2 }]);
    const user = userEvent.setup();
    render(<MyRecipes />);
    expect(screen.getByRole("link", { name: "Cheese Toast" })).toHaveAttribute("href", "/my-recipes/?id=toast1");
    expect(screen.getByText("2 servings · 2 ingredients · 1 steps")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete Cheese Toast" }));
    expect(myRecipesStore.getSnapshot()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Tap again to delete Cheese Toast" }));
    expect(myRecipesStore.getSnapshot()).toEqual([]);
    expect(shoppingListStore.getSnapshot()).toEqual([]);
    expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument();
  });

  it("opens one recipe with scaling and cook mode, but no share link", async () => {
    myRecipesStore.set([TOAST]);
    search = "id=toast1";
    const user = userEvent.setup();
    await act(async () => {
      render(<MyRecipes />);
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Cheese Toast");
    await user.click(screen.getByRole("button", { name: "More servings" }));
    expect(screen.getAllByRole("listitem").some((li) => li.textContent === "6 bread slices")).toBe(true);
    expect(screen.getByRole("button", { name: /cook/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add to shopping list" }));
    expect(shoppingListStore.getSnapshot()).toEqual([{ slug: "my-toast1", servings: 3 }]);
    await user.click(screen.getByRole("button", { name: "Delete Cheese Toast" }));
    await user.click(screen.getByRole("button", { name: "Tap again to delete Cheese Toast" }));
    expect(push).toHaveBeenCalledWith("/my-recipes/");
    expect(myRecipesStore.getSnapshot()).toEqual([]);
  });

  it("explains a link to a recipe that is not on this device", () => {
    search = "id=nope";
    render(<MyRecipes />);
    expect(screen.getByRole("heading", { name: "Recipe not found" })).toBeInTheDocument();
  });
});

describe("imported recipes everywhere else", () => {
  it("appear in the shopping list with a working link", () => {
    myRecipesStore.set([TOAST]);
    shoppingListStore.set([{ slug: "my-toast1", servings: 4 }]);
    render(<ShoppingListView />);
    expect(screen.getByRole("link", { name: "Cheese Toast" })).toHaveAttribute("href", "/my-recipes/?id=toast1");
    expect(screen.getByRole("checkbox", { name: /bread slices/ }).closest("label")).toHaveTextContent("8 bread slices");
  });

  it("appear in the pantry", () => {
    myRecipesStore.set([TOAST]);
    pantryStore.set(["bread slices", "grated cheese"]);
    render(<PantryView recipes={recipes} />);
    const first = screen.getAllByRole("listitem").find((li) => li.classList.contains("match"))!;
    expect(first).toHaveTextContent("Cheese Toast");
    expect(first).toHaveTextContent("You have everything ✓");
  });
});

describe("stored recipe validation", () => {
  it.each([
    ["a recipe from somewhere else", { ...TOAST, slug: "buttermilk-pancakes" }],
    ["no ingredients list", { ...TOAST, ingredients: "flour" }],
    ["a negative amount", { ...TOAST, ingredients: [{ qty: -1, name: "x" }] }],
    ["an unknown unit", { ...TOAST, ingredients: [{ qty: 1, unit: "bucket", name: "x" }] }],
    ["too many servings", { ...TOAST, servings: 1000 }],
    ["a step that is not text", { ...TOAST, steps: [{ text: 42 }] }],
    ["nothing at all", null],
  ])("rejects %s", (_, value) => {
    expect(isMyRecipe(value)).toBe(false);
  });

  it("keeps only the good recipes from storage", () => {
    expect(validMyRecipes([TOAST, { junk: true }])).toEqual([TOAST]);
    expect(validMyRecipes("not a list")).toEqual([]);
  });
});
