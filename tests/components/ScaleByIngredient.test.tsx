import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipePanel } from "@/components/RecipePanel";
import { getRecipe } from "@/data/recipes";
import { shoppingListStore, unitSystemStore } from "@/lib/stores";

const dal = getRecipe("kolkata-masoor-dal")!;
const pancakes = getRecipe("buttermilk-pancakes")!;
const line = (text: string) => screen.getAllByRole("listitem").find((li) => li.textContent?.includes(text))!;

async function scaleTo(ingredient: string, amount: string, unit?: string) {
  const user = userEvent.setup();
  await user.click(screen.getByText("Scale to what you have"));
  await user.selectOptions(screen.getByLabelText("Ingredient"), ingredient);
  await user.clear(screen.getByLabelText("You have"));
  await user.type(screen.getByLabelText("You have"), amount);
  if (unit) await user.selectOptions(screen.getByLabelText("Unit"), unit);
  await user.click(screen.getByRole("button", { name: "Scale recipe" }));
  return user;
}

beforeEach(() => {
  unitSystemStore.set("us");
  shoppingListStore.set([]);
});

describe("Scale to what you have", () => {
  it("rescales the whole recipe around the amount you have", async () => {
    render(<RecipePanel recipe={dal} />);
    await scaleTo("red lentils", "2", "cup");
    expect(screen.getByText("8 servings")).toBeInTheDocument();
    expect(line("red lentils")).toHaveTextContent("2 cups red lentils");
    expect(screen.getByText(/Scaled to your 2 cup red lentils/)).toBeInTheDocument();
  });

  it("accepts a weight for an ingredient the recipe measures in cups", async () => {
    render(<RecipePanel recipe={dal} />);
    await scaleTo("red lentils", "285", "g");
    expect(screen.getByText("6 servings")).toBeInTheDocument();
    expect(line("red lentils")).toHaveTextContent("1½ cups red lentils");
  });

  it("shows an approximate serving count when the amount does not divide evenly", async () => {
    render(<RecipePanel recipe={dal} />);
    await scaleTo("red lentils", "300", "g");
    expect(screen.getByText("about 6¼ servings")).toBeInTheDocument();
  });

  it("works with counted ingredients like eggs", async () => {
    render(<RecipePanel recipe={pancakes} />);
    await scaleTo("large eggs", "3");
    expect(screen.getByText("6 servings")).toBeInTheDocument();
    expect(line("all-purpose flour")).toHaveTextContent("3 cups all-purpose flour");
    expect(screen.getByLabelText("Unit")).toBeDisabled();
  });

  it("suggests grams when the site is in metric", async () => {
    unitSystemStore.set("metric");
    render(<RecipePanel recipe={dal} />);
    await userEvent.setup().click(screen.getByText("Scale to what you have"));
    expect(screen.getByLabelText("Unit")).toHaveValue("g");
  });

  it("explains amounts it cannot use", async () => {
    render(<RecipePanel recipe={dal} />);
    await scaleTo("red lentils", "lots");
    expect(screen.getByRole("alert")).toHaveTextContent("number above zero");
    expect(screen.getByLabelText("You have")).toHaveAttribute("aria-invalid", "true");
  });

  it("refuses to scale beyond the servings limit or below half a serving", async () => {
    render(<RecipePanel recipe={dal} />);
    const user = await scaleTo("red lentils", "20", "cup");
    expect(screen.getByRole("alert")).toHaveTextContent("about 80 servings");
    await user.clear(screen.getByLabelText("You have"));
    await user.type(screen.getByLabelText("You have"), "1");
    await user.selectOptions(screen.getByLabelText("Unit"), "tsp");
    await user.click(screen.getByRole("button", { name: "Scale recipe" }));
    expect(screen.getByRole("alert")).toHaveTextContent("less than half a serving");
    expect(screen.getByText("4 servings")).toBeInTheDocument();
  });

  it("goes back to the original servings, and the stepper steps to whole numbers", async () => {
    render(<RecipePanel recipe={dal} />);
    const user = await scaleTo("red lentils", "300", "g");
    await user.click(screen.getByRole("button", { name: "More servings" }));
    expect(screen.getByText("7 servings")).toBeInTheDocument();
    expect(screen.queryByText(/Scaled to your/)).not.toBeInTheDocument();
    await scaleTo("red lentils", "300", "g");
    await user.click(screen.getByRole("button", { name: "Fewer servings" }));
    expect(screen.getByText("6 servings")).toBeInTheDocument();
    await scaleTo("red lentils", "300", "g");
    await user.click(screen.getByRole("button", { name: "Back to 4 servings" }));
    expect(screen.getByText("4 servings")).toBeInTheDocument();
  });

  it("adds the scaled amount to the shopping list", async () => {
    render(<RecipePanel recipe={dal} />);
    const user = await scaleTo("red lentils", "2", "cup");
    await user.click(screen.getByRole("button", { name: "Add to shopping list" }));
    expect(shoppingListStore.getSnapshot()).toEqual([{ slug: "kolkata-masoor-dal", servings: 8 }]);
  });
});
