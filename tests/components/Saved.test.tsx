import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrintButton } from "@/components/PrintButton";
import { SaveButton } from "@/components/SaveButton";
import { SavedRecipes } from "@/components/SavedRecipes";
import { toggleSaved } from "@/lib/saved";
import { savedStore } from "@/lib/stores";

describe("saved recipes", () => {
  it("toggles a recipe and keeps the newest first", () => {
    expect(toggleSaved([], "a")).toEqual(["a"]);
    expect(toggleSaved(["a"], "b")).toEqual(["b", "a"]);
    expect(toggleSaved(["b", "a"], "a")).toEqual(["b"]);
  });

  it("saves and unsaves from the button", async () => {
    const user = userEvent.setup();
    render(<SaveButton slug="simple-shakshuka" name="Simple Shakshuka" />);
    await user.click(screen.getByRole("button", { name: "Save Simple Shakshuka" }));
    expect(savedStore.getSnapshot()).toEqual(["simple-shakshuka"]);
    const saved = screen.getByRole("button", { name: "Remove Simple Shakshuka from saved recipes" });
    expect(saved).toHaveAttribute("aria-pressed", "true");
    await user.click(saved);
    expect(savedStore.getSnapshot()).toEqual([]);
  });

  it("lists saved recipes, skips missing ones, and explains the empty state", () => {
    const { unmount } = render(<SavedRecipes />);
    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument();
    unmount();
    savedStore.set(["kolkata-masoor-dal", "no-longer-exists"]);
    render(<SavedRecipes />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Kolkata-Style Masoor Dal")).toBeInTheDocument();
  });

  it("opens the print dialog", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<PrintButton slug="simple-shakshuka" />);
    await user.click(screen.getByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalled();
  });
});
