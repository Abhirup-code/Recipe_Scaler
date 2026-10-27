import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportPage } from "@/components/ImportPage";
import { MyRecipes } from "@/components/MyRecipes";
import { myRecipesStore, validMyRecipes } from "@/lib/myRecipes";
import { shoppingListStore } from "@/lib/stores";
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
  datePublished: "2026-10-01",
  ingredients: [
    { qty: 4, name: "bread slices" },
    { name: "grated cheese" }, // read without an amount by mistake
  ],
  steps: [{ text: "Toast for 5 minutes.", minutes: 5 }],
};
const SOUP = { ...TOAST, slug: "my-soup1", name: "Soup" };

beforeEach(() => {
  push.mockReset();
  search = "";
  myRecipesStore.set([SOUP, TOAST]);
});

const render_ = async (ui: React.ReactElement) => {
  await act(async () => {
    render(ui);
  });
};

describe("Editing an imported recipe (issue #7)", () => {
  it("has an Edit button on the recipe", async () => {
    search = "id=toast1";
    await render_(<MyRecipes />);
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/import/?edit=toast1");
  });

  it("opens the saved recipe as text, ready to fix", async () => {
    search = "edit=toast1";
    await render_(<ImportPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Edit Cheese Toast");
    const text = (screen.getByLabelText("Recipe text") as HTMLTextAreaElement).value;
    expect(text).toContain("- 4 bread slices");
    expect(text).toContain("- grated cheese");
    expect(text).toContain("1. Toast for 5 minutes.");
    expect(screen.queryByRole("button", { name: "Try an example" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/my-recipes/?id=toast1");
  });

  it("saves the fix in place, keeping the id, date, and list position", async () => {
    shoppingListStore.set([{ slug: "my-toast1", servings: 2 }]);
    search = "edit=toast1";
    const user = userEvent.setup();
    await render_(<ImportPage />);
    const box = screen.getByLabelText("Recipe text");
    const fixed = (box as HTMLTextAreaElement).value.replace("- grated cheese", "- 1 cup grated cheese");
    await user.clear(box);
    await user.click(box);
    await user.paste(fixed);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    const saved = validMyRecipes(myRecipesStore.getSnapshot());
    expect(saved.map((r) => r.slug)).toEqual(["my-soup1", "my-toast1"]);
    const toast = saved[1]!;
    expect(toast.datePublished).toBe("2026-10-01");
    expect(toast.ingredients[1]).toEqual({ qty: 1, unit: "cup", name: "grated cheese", gramsPerCup: 100 });
    expect(push).toHaveBeenCalledWith("/my-recipes/?id=toast1");
    expect(shoppingListStore.getSnapshot()).toEqual([{ slug: "my-toast1", servings: 2 }]);
  });

  it("explains a link to a recipe that is not on this device", async () => {
    search = "edit=nope";
    await render_(<ImportPage />);
    expect(screen.getByRole("heading", { name: "Recipe not found" })).toBeInTheDocument();
  });

  it("still imports new recipes when not editing", async () => {
    await render_(<ImportPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Import a recipe");
    expect(screen.getByRole("button", { name: "Try an example" })).toBeInTheDocument();
  });
});
