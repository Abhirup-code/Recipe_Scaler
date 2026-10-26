import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { RecipePanel } from "@/components/RecipePanel";
import { getRecipe } from "@/data/recipes";
import { assignVariant, cookButtonVariantStore } from "@/lib/experiment";

describe("cook button A/B test", () => {
  it("splits visitors by a random number", () => {
    expect(assignVariant(() => 0.2)).toBe("A");
    expect(assignVariant(() => 0.8)).toBe("B");
  });

  it("assigns a variant once and keeps it", () => {
    render(<RecipePanel recipe={getRecipe("simple-shakshuka")!} />);
    const variant = cookButtonVariantStore.getSnapshot();
    expect(variant === "A" || variant === "B").toBe(true);
  });

  it("shows the label for the stored variant", () => {
    cookButtonVariantStore.set("B");
    render(<RecipePanel recipe={getRecipe("simple-shakshuka")!} />);
    expect(screen.getByRole("button", { name: "Cook step by step" })).toBeInTheDocument();
  });
});

it("keeps a returning visitor's variant through server rendering and hydration", async () => {
  const recipe = getRecipe("simple-shakshuka")!;
  // The server renders the control label because it cannot see localStorage.
  const container = document.createElement("div");
  container.innerHTML = renderToString(<RecipePanel recipe={recipe} />);
  document.body.appendChild(container);
  expect(container).toHaveTextContent("Start cook mode");

  cookButtonVariantStore.set("B");
  const random = vi.spyOn(Math, "random").mockReturnValue(0.1); // would assign "A"
  render(<RecipePanel recipe={recipe} />, { container, hydrate: true });
  await waitFor(() => expect(screen.getByRole("button", { name: "Cook step by step" })).toBeInTheDocument());
  expect(cookButtonVariantStore.getSnapshot()).toBe("B");
  random.mockRestore();
});
